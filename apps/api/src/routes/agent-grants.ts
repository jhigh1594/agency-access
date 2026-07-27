import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AgentPermissionSchema } from '@agency-platform/shared';
import { assertAgencyAccess, resolvePrincipalAgency } from '@/lib/authorization.js';
import { extractClientIp, extractUserAgent } from '@/lib/ip.js';
import { authenticate } from '@/middleware/auth.js';
import { agentGrantService } from '@/services/agent-grant.service.js';
import { agentRolloutService } from '@/services/agent-rollout.service.js';

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

async function requireAgencyOwner(request: FastifyRequest, reply: FastifyReply) {
  const principal = await resolvePrincipalAgency(request);
  if (principal.error || !principal.data) {
    return reply.code(principal.error?.code === 'UNAUTHORIZED' ? 401 : 403).send({
      data: null,
      error: principal.error || { code: 'FORBIDDEN', message: 'Unable to resolve agency' },
    });
  }

  (request as any).principalAgencyId = principal.data.agencyId;
}

function enforceRouteAgency(request: FastifyRequest, reply: FastifyReply): string | null {
  const { id } = request.params as { id: string };
  const accessError = assertAgencyAccess(id, (request as any).principalAgencyId);
  if (accessError) {
    void reply.code(403).send({ data: null, error: accessError });
    return null;
  }
  return id;
}

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
  const ownerHooks = [authenticate(), requireAgencyOwner];

  fastify.get('/agencies/:id/agent-grants', { onRequest: ownerHooks }, async (request, reply) => {
    const agencyId = enforceRouteAgency(request, reply);
    if (!agencyId) return;
    return reply.send({ data: await agentGrantService.listGrants(agencyId) });
  });

  fastify.post('/agencies/:id/agent-grants', { onRequest: ownerHooks }, async (request, reply) => {
    const agencyId = enforceRouteAgency(request, reply);
    if (!agencyId) return;
    if (!agentRolloutService.isAgencyAllowed(agencyId)) return reply.code(404).send({ data: null, error: { code: 'NOT_FOUND', message: 'Agent access is not enabled for this agency' } });
    const subject = ownerSubject(request);
    if (!subject) {
      return reply.code(401).send({
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Authenticated owner identity is required' },
      });
    }

    const parsed = CreateGrantSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid agent grant',
          details: parsed.error.flatten(),
        },
      });
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
    if (!subject) return reply.code(401).send({ data: null, error: { code: 'UNAUTHORIZED', message: 'Authenticated owner identity is required' } });

    const parsed = UpdateGrantSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid agent grant update', details: parsed.error.flatten() } });
    }

    const { grantId } = request.params as { grantId: string };
    const grant = await agentGrantService.updateGrant({
      agencyId,
      grantId,
      updatedBy: subject,
      ...parsed.data,
      requestMetadata: requestMetadata(request),
    });
    if (!grant) return reply.code(404).send({ data: null, error: { code: 'NOT_FOUND', message: 'Agent grant not found' } });
    return reply.send({ data: grant });
  });

  fastify.delete('/agencies/:id/agent-grants/:grantId', { onRequest: ownerHooks }, async (request, reply) => {
    const agencyId = enforceRouteAgency(request, reply);
    if (!agencyId) return;
    const subject = ownerSubject(request);
    if (!subject) return reply.code(401).send({ data: null, error: { code: 'UNAUTHORIZED', message: 'Authenticated owner identity is required' } });

    const { grantId } = request.params as { grantId: string };
    const revoked = await agentGrantService.revokeGrant({
      agencyId,
      grantId,
      revokedBy: subject,
      requestMetadata: requestMetadata(request),
    });
    if (!revoked) return reply.code(404).send({ data: null, error: { code: 'NOT_FOUND', message: 'Active agent grant not found' } });
    return reply.send({ data: { id: grantId, state: 'revoked' } });
  });
}
