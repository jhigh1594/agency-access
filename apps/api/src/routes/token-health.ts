/**
 * Token Health Routes
 *
 * API endpoints for monitoring and managing token health.
 * Protected by Clerk JWT verification.
 */

import { FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import type { Platform } from '@agency-platform/shared';
import { connectionService } from '../services/connection.service.js';
import { authenticate } from '@/middleware/auth.js';
import { resolvePrincipalAgency, type AuthorizationError } from '@/lib/authorization.js';
import { prisma } from '@/lib/prisma.js';

function sendRouteError(reply: FastifyReply, error: AuthorizationError, statusCode: number) {
  return reply.code(statusCode).send({
    data: null,
    error,
  });
}

async function resolveAgencyIdOrReply(request: FastifyRequest, reply: FastifyReply) {
  const principal = await resolvePrincipalAgency(request);
  if (principal.error || !principal.data) {
    return {
      agencyId: null,
      sent: sendRouteError(
        reply,
        principal.error ?? {
          code: 'UNAUTHORIZED',
          message: 'Authenticated user context is required',
        },
        principal.error?.code === 'FORBIDDEN' ? 403 : 401
      ),
    };
  }

  return { agencyId: principal.data.agencyId, sent: null };
}

async function ensureConnectionBelongsToAgency(connectionId: string, agencyId: string) {
  const connection = await prisma.clientConnection.findFirst({
    where: {
      id: connectionId,
      agencyId,
    },
    select: { id: true },
  });

  if (!connection) {
    return {
      code: 'CONNECTION_NOT_FOUND',
      message: 'Connection not found',
    };
  }

  return null;
}

async function findAuthorizationForAgency(authorizationId: string, agencyId: string) {
  const authorization = await prisma.platformAuthorization.findUnique({
    where: { id: authorizationId },
    select: {
      id: true,
      connectionId: true,
      platform: true,
      connection: {
        select: {
          agencyId: true,
        },
      },
    },
  });

  if (!authorization || authorization.connection.agencyId !== agencyId) {
    return {
      data: null,
      error: {
        code: 'AUTHORIZATION_NOT_FOUND',
        message: 'Platform authorization not found',
      },
    };
  }

  return { data: authorization, error: null };
}

export async function tokenHealthRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate());

  // Get token health for all connections
  fastify.get('/token-health', async (request, reply) => {
    const { agencyId, sent } = await resolveAgencyIdOrReply(request, reply);
    if (!agencyId) return sent;

    const result = await connectionService.getAgencyTokenHealth(agencyId);

    if (result.error) {
      return reply.code(500).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send(result);
  });

  // Get connections for an agency
  fastify.get('/connections', async (request, reply) => {
    const { agencyId, sent } = await resolveAgencyIdOrReply(request, reply);
    if (!agencyId) return sent;

    const result = await connectionService.getAgencyConnections(agencyId);

    if (result.error) {
      return reply.code(500).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send(result);
  });

  // Get single connection
  fastify.get('/connections/:id', async (request, reply) => {
    const { agencyId, sent } = await resolveAgencyIdOrReply(request, reply);
    if (!agencyId) return sent;

    const { id } = request.params as { id: string };
    const ownershipError = await ensureConnectionBelongsToAgency(id, agencyId);
    if (ownershipError) {
      return sendRouteError(reply, ownershipError, 404);
    }

    const result = await connectionService.getConnection(id);

    if (result.error) {
      return reply.code(result.error.code === 'NOT_FOUND' ? 404 : 500).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send(result);
  });

  // Revoke connection
  fastify.post('/connections/:id/revoke', async (request, reply) => {
    const { agencyId, sent } = await resolveAgencyIdOrReply(request, reply);
    if (!agencyId) return sent;

    const { id } = request.params as { id: string };
    const ownershipError = await ensureConnectionBelongsToAgency(id, agencyId);
    if (ownershipError) {
      return sendRouteError(reply, ownershipError, 404);
    }

    const result = await connectionService.revokeConnection(id);

    if (result.error) {
      return reply.code(result.error.code === 'NOT_FOUND' ? 404 : 500).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send(result);
  });

  // Refresh platform token
  fastify.post('/token-refresh', async (request, reply) => {
    const { agencyId, sent } = await resolveAgencyIdOrReply(request, reply);
    if (!agencyId) return sent;

    const { connectionId, platform } = request.body as { connectionId: string; platform: Platform };

    if (!connectionId || !platform) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'connectionId and platform are required',
        },
      });
    }

    const ownershipError = await ensureConnectionBelongsToAgency(connectionId, agencyId);
    if (ownershipError) {
      return sendRouteError(reply, ownershipError, 404);
    }

    const result = await connectionService.refreshPlatformAuthorization(connectionId, platform);

    if (result.error) {
      return reply.code(400).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send(result);
  });

  // Revoke platform authorization
  fastify.post('/authorizations/:id/revoke', async (request, reply) => {
    const { agencyId, sent } = await resolveAgencyIdOrReply(request, reply);
    if (!agencyId) return sent;

    const { id } = request.params as { id: string };

    const authResult = await findAuthorizationForAgency(id, agencyId);
    const auth = authResult.data;

    if (authResult.error || !auth) {
      return reply.code(404).send({
        data: null,
        error: authResult.error,
      });
    }

    const result = await connectionService.revokePlatformAuthorization(auth.connectionId, auth.platform as Platform);

    if (result.error) {
      return reply.code(result.error.code === 'NOT_FOUND' ? 404 : 500).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send({ data: { success: true }, error: null });
  });
}
