import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { enforceRouteAgency, requirePrincipalAgency } from '@/lib/agency-guard.js';
import { extractClientIp, extractUserAgent } from '@/lib/ip.js';
import { authenticateAgent } from '@/middleware/agent-auth.js';
import { authenticate } from '@/middleware/auth.js';
import {
  AgentOperationNotFoundError,
  AgentOperationStateError,
  agentOperationService,
} from '@/services/agent-operation.service.js';
import { sanitizeOperationForAgent } from '@/lib/mcp-adapter.js';
import { sendError, sendValidationError } from '../lib/response.js';

const DecisionSchema = z.object({ decision: z.enum(['approved', 'declined']) }).strict();

function ownerRouteContext(request: FastifyRequest, reply: FastifyReply) {
  const routeAgencyId = enforceRouteAgency(request, reply);
  if (!routeAgencyId) return null;
  const subject = ((request as any).user as { sub?: string } | undefined)?.sub;
  if (!subject) {
    void sendError(reply, 'UNAUTHORIZED', 'Authenticated owner identity is required', 401);
    return null;
  }
  return { agencyId: routeAgencyId, ownerSubject: subject };
}

function requestMetadata(request: FastifyRequest) {
  return {
    ipAddress: extractClientIp(request),
    userAgent: extractUserAgent(request),
    correlationId: request.id,
  };
}

export async function agentOperationRoutes(fastify: FastifyInstance) {
  fastify.get('/agent/operations/:operationId', { onRequest: [authenticateAgent()] }, async (request, reply) => {
    const { operationId } = request.params as { operationId: string };
    const operation = await agentOperationService.getForAgent(request.agentPrincipal!, operationId);
    if (!operation) return sendError(reply, 'NOT_FOUND', 'Agent operation not found', 404);
    return reply.send({ data: sanitizeOperationForAgent(operation) });
  });

  const ownerHooks = [authenticate(), requirePrincipalAgency];

  fastify.get('/agencies/:id/agent-operations/:operationId', { onRequest: ownerHooks }, async (request, reply) => {
    const owner = ownerRouteContext(request, reply);
    if (!owner) return;
    const { operationId } = request.params as { operationId: string };
    const operation = await agentOperationService.getForOwner(owner.agencyId, owner.ownerSubject, operationId);
    if (!operation) return sendError(reply, 'NOT_FOUND', 'Agent operation not found', 404);
    return reply.send({ data: sanitizeOperationForAgent(operation) });
  });

  fastify.post('/agencies/:id/agent-operations/:operationId/decision', { onRequest: ownerHooks }, async (request, reply) => {
    const owner = ownerRouteContext(request, reply);
    if (!owner) return;
    const parsed = DecisionSchema.safeParse(request.body);
    if (!parsed.success) return sendValidationError(reply, 'Decision must be approved or declined');
    const { operationId } = request.params as { operationId: string };
    try {
      const operation = await agentOperationService.decide({
        ...owner,
        operationId,
        decision: parsed.data.decision,
        requestMetadata: requestMetadata(request),
      });
      return reply.send({ data: sanitizeOperationForAgent(operation) });
    } catch (error) {
      if (error instanceof AgentOperationNotFoundError) return sendError(reply, 'NOT_FOUND', 'Agent operation not found', 404);
      if (error instanceof AgentOperationStateError) return sendError(reply, error.code, error.message, 409);
      throw error;
    }
  });
}
