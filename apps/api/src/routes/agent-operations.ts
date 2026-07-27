import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { assertAgencyAccess, resolvePrincipalAgency } from '@/lib/authorization.js';
import { extractClientIp, extractUserAgent } from '@/lib/ip.js';
import { authenticateAgent } from '@/middleware/agent-auth.js';
import { authenticate } from '@/middleware/auth.js';
import {
  AgentOperationNotFoundError,
  AgentOperationStateError,
  agentOperationService,
} from '@/services/agent-operation.service.js';
import { sanitizeOperationForAgent } from '@/lib/mcp-adapter.js';

const DecisionSchema = z.object({ decision: z.enum(['approved', 'declined']) }).strict();

async function requireOwnerAgency(request: FastifyRequest, reply: FastifyReply) {
  const principal = await resolvePrincipalAgency(request);
  if (principal.error || !principal.data) {
    return reply.code(principal.error?.code === 'UNAUTHORIZED' ? 401 : 403).send({
      data: null,
      error: principal.error || { code: 'FORBIDDEN', message: 'Unable to resolve agency' },
    });
  }
  (request as any).principalAgencyId = principal.data.agencyId;
}

function ownerRouteContext(request: FastifyRequest, reply: FastifyReply) {
  const routeAgencyId = (request.params as { id: string }).id;
  const accessError = assertAgencyAccess(routeAgencyId, (request as any).principalAgencyId);
  if (accessError) {
    void reply.code(403).send({ data: null, error: accessError });
    return null;
  }
  const subject = ((request as any).user as { sub?: string } | undefined)?.sub;
  if (!subject) {
    void reply.code(401).send({ data: null, error: { code: 'UNAUTHORIZED', message: 'Authenticated owner identity is required' } });
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
    if (!operation) return reply.code(404).send({ data: null, error: { code: 'NOT_FOUND', message: 'Agent operation not found' } });
    return reply.send({ data: sanitizeOperationForAgent(operation) });
  });

  const ownerHooks = [authenticate(), requireOwnerAgency];

  fastify.get('/agencies/:id/agent-operations/:operationId', { onRequest: ownerHooks }, async (request, reply) => {
    const owner = ownerRouteContext(request, reply);
    if (!owner) return;
    const { operationId } = request.params as { operationId: string };
    const operation = await agentOperationService.getForOwner(owner.agencyId, owner.ownerSubject, operationId);
    if (!operation) return reply.code(404).send({ data: null, error: { code: 'NOT_FOUND', message: 'Agent operation not found' } });
    return reply.send({ data: sanitizeOperationForAgent(operation) });
  });

  fastify.post('/agencies/:id/agent-operations/:operationId/decision', { onRequest: ownerHooks }, async (request, reply) => {
    const owner = ownerRouteContext(request, reply);
    if (!owner) return;
    const parsed = DecisionSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Decision must be approved or declined' } });
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
      if (error instanceof AgentOperationNotFoundError) return reply.code(404).send({ data: null, error: { code: 'NOT_FOUND', message: 'Agent operation not found' } });
      if (error instanceof AgentOperationStateError) return reply.code(409).send({ data: null, error: { code: error.code, message: error.message } });
      throw error;
    }
  });
}
