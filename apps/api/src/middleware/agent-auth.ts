import type { FastifyReply, FastifyRequest } from 'fastify';
import { verifyAgentAccessToken } from '@/lib/agent-auth-metadata.js';
import type { AgentPrincipal } from '@/lib/agent-principal.js';
import { extractClientIp, extractUserAgent } from '@/lib/ip.js';
import { agentGrantService } from '@/services/agent-grant.service.js';
import { agentRolloutService } from '@/services/agent-rollout.service.js';
import { agentTelemetryService } from '@/services/agent-telemetry.service.js';
import { env } from '@/lib/env.js';

declare module 'fastify' {
  interface FastifyRequest {
    agentPrincipal?: AgentPrincipal;
  }
}

function sendAuthError(
  reply: FastifyReply,
  statusCode: 401 | 403,
  code: string,
  message: string,
  details?: Record<string, unknown>
) {
  return reply.code(statusCode).send({
    data: null,
    error: { code, message, ...(details ? { details } : {}) },
  });
}

export function authenticateAgent() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ') || authorization.length <= 7) {
      agentTelemetryService.recordAuthorizationFailure({ reason: 'missing_token' });
      return sendAuthError(reply, 401, 'UNAUTHORIZED', 'Missing or invalid Authorization header');
    }

    try {
      const verified = await verifyAgentAccessToken(authorization.slice(7));
      const grant = await agentGrantService.resolveActiveGrant({
        ownerSubject: verified.ownerSubject,
        oauthClientId: verified.oauthClientId,
        clerkPrincipalId: verified.clerkPrincipalId,
      });

      if (!grant) {
        agentTelemetryService.recordAuthorizationFailure({
          reason: 'grant_required',
          oauthClientId: verified.oauthClientId,
        });
        return sendAuthError(
          reply,
          403,
          'AGENT_GRANT_REQUIRED',
          'The agency owner must approve this agent in AuthHub',
          {
            setupUrl: `${env.FRONTEND_URL.replace(/\/$/, '')}/settings?tab=agents&connect=${encodeURIComponent(verified.oauthClientId)}`,
            oauthClientId: verified.oauthClientId,
          }
        );
      }
      if (!agentRolloutService.isAgencyAllowed(grant.agencyId)) {
        agentTelemetryService.recordAuthorizationFailure({
          reason: 'agency_not_allowed',
          agencyId: grant.agencyId,
          grantId: grant.id,
          oauthClientId: verified.oauthClientId,
        });
        return sendAuthError(reply, 403, 'AGENT_ACCESS_NOT_ENABLED', 'Agent access is not enabled for this agency');
      }

      request.agentPrincipal = {
        kind: 'agent',
        ownerSubject: verified.ownerSubject,
        agencyId: grant.agencyId,
        oauthClientId: verified.oauthClientId,
        grantId: grant.id,
        displayName: grant.displayName,
        permissions: grant.permissions,
        requestMetadata: {
          ipAddress: extractClientIp(request),
          userAgent: extractUserAgent(request),
          correlationId: request.id,
        },
      };

      void agentGrantService.touchGrant(grant.id).catch((error) => {
        request.log.warn({ error, grantId: grant.id }, 'failed to update agent grant last-used time');
      });
    } catch {
      agentTelemetryService.recordAuthorizationFailure({ reason: 'invalid_token' });
      return sendAuthError(reply, 401, 'UNAUTHORIZED', 'Invalid or expired agent access token');
    }
  };
}
