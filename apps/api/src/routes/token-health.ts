/**
 * Token Health Routes
 *
 * API endpoints for monitoring and managing token health.
 * Protected by Clerk JWT verification.
 */

import { FastifyInstance } from 'fastify';
import type { Platform } from '@agency-platform/shared';
import { connectionService } from '../services/connection.service';

export async function tokenHealthRoutes(fastify: FastifyInstance) {
  // Get token health for all connections
  fastify.get('/token-health', async (request, reply) => {
    const { agencyId } = (request as any).user; // From Clerk JWT

    if (!agencyId) {
      return reply.code(401).send({
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Agency ID required',
        },
      });
    }

    const result = await connectionService.getTokenHealth(agencyId);

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
    const { agencyId } = (request as any).user; // From Clerk JWT

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
    const { id } = request.params as { id: string };

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
    const { id } = request.params as { id: string };

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
    const { id } = request.params as { id: string };

    // Find authorization to get connectionId and platform
    const prisma = (await import('@/lib/prisma')).prisma;
    const auth = await prisma.platformAuthorization.findUnique({
      where: { id },
    });

    if (!auth) {
      return reply.code(404).send({
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Platform authorization not found',
        },
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
