import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AgentPermissionSchema } from '@agency-platform/shared';
import { enforceRouteAgency, requirePrincipalAgency } from '@/lib/agency-guard.js';
import { extractClientIp, extractUserAgent } from '@/lib/ip.js';
import { authenticate } from '@/middleware/auth.js';
import { agentGrantService } from '@/services/agent-grant.service.js';
import { agentRolloutService } from '@/services/agent-rollout.service.js';
import { sendError } from '../lib/response.js';

const CreateGrantSchema = z.object({
  oauthClientId: z.string().min(1).max(200),
  displayName: z.string().min(1).max(120),
  permissions: AgentPermissionSchema.array().min(1),
});

const UpdateGrantSchema = z
  .object({
    displayName: z.string().min(1).max(120).optional(),
    permissions: AgentPermissionSchema.array().min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one grant field is required',
  });

function ownerSubject(request: FastifyRequest): string | null {
  const user = (request as any).user as { sub?: string } | undefined;
  return user?.sub || null;
}

function requestMetadata(request: FastifyRequest) {
  return {
    ipAddress: extractClientIp(request),
    userAgent: extractUserAgent(request),
    correlationId: request.id,
  };
}

export async function agentGrantRoutes(fastify: FastifyInstance) {
  const ownerHooks = [authenticate(), requirePrincipalAgency];

  fastify.get('/agencies/:id/agent-grants', { onRequest: ownerHooks }, async (request, reply) => {
    const agencyId = enforceRouteAgency(request, reply);
    if (!agencyId) return;
    return reply.send({ data: await agentGrantService.listGrants(agencyId) });
  });

  fastify.post('/agencies/:id/agent-grants', { onRequest: ownerHooks }, async (request, reply) => {
    const agencyId = enforceRouteAgency(request, reply);
    if (!agencyId) return;
    if (!agentRolloutService.isAgencyAllowed(agencyId)) return sendError(reply, 'NOT_FOUND', 'Agent access is not enabled for this agency', 404);
    const subject = ownerSubject(request);
    if (!subject) {
      return sendError(reply, 'UNAUTHORIZED', 'Authenticated owner identity is required', 401);
    }

    const parsed = CreateGrantSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 'VALIDATION_ERROR', 'Invalid agent grant', 400, parsed.error.flatten(),);
    }

    const grant = await agentGrantService.createOrReactivateGrant({
      agencyId,
      ownerSubject: subject,
      ...parsed.data,
      requestMetadata: requestMetadata(request),
    });
    return reply.code(201).send({ data: grant });
  });

  fastify.patch('/agencies/:id/agent-grants/:grantId', { onRequest: ownerHooks }, async (request, reply) => {
    const agencyId = enforceRouteAgency(request, reply);
    if (!agencyId) return;
    const subject = ownerSubject(request);
    if (!subject) return sendError(reply, 'UNAUTHORIZED', 'Authenticated owner identity is required', 401);

    const parsed = UpdateGrantSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 'VALIDATION_ERROR', 'Invalid agent grant update', 400, parsed.error.flatten());
    }

    const { grantId } = request.params as { grantId: string };
    const grant = await agentGrantService.updateGrant({
      agencyId,
      grantId,
      updatedBy: subject,
      ...parsed.data,
      requestMetadata: requestMetadata(request),
    });
    if (!grant) return sendError(reply, 'NOT_FOUND', 'Agent grant not found', 404);
    return reply.send({ data: grant });
  });

  fastify.delete('/agencies/:id/agent-grants/:grantId', { onRequest: ownerHooks }, async (request, reply) => {
    const agencyId = enforceRouteAgency(request, reply);
    if (!agencyId) return;
    const subject = ownerSubject(request);
    if (!subject) return sendError(reply, 'UNAUTHORIZED', 'Authenticated owner identity is required', 401);

    const { grantId } = request.params as { grantId: string };
    const revoked = await agentGrantService.revokeGrant({
      agencyId,
      grantId,
      revokedBy: subject,
      requestMetadata: requestMetadata(request),
    });
    if (!revoked) return sendError(reply, 'NOT_FOUND', 'Active agent grant not found', 404);
    return reply.send({ data: { id: grantId, state: 'revoked' } });
  });
}
