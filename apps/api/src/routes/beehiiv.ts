import { FastifyInstance } from 'fastify';
import { beehiivVerificationService } from '../services/beehiiv-verification.service.js';
import { authenticate } from '@/middleware/auth.js';
import { resolvePrincipalAgency } from '@/lib/authorization.js';
import { prisma } from '@/lib/prisma.js';
import { sendError, sendValidationError } from '../lib/response.js';

/**
 * Beehiiv API Routes
 *
 * Routes for verifying Beehiiv team access and managing agency connections.
 * Beehiiv uses API key authentication (team invitation workflow) instead of OAuth.
 */
export async function beehiivRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate());

  /**
   * POST /api/beehiiv/verify-team-access
   *
   * Verify that an agency has team access to a client's Beehiiv publication.
   *
   * Request body:
   * - agencyId: Agency UUID
   * - clientPublicationId: Beehiiv publication ID (e.g., "pub123")
   * - agencyApiKey: Agency's Beehiiv API key
   *
   * Returns:
   * - data.connectionId: Agency platform connection ID if successful
   *
   * Error codes:
   * - VERIFICATION_FAILED: Agency does not have access to publication
   */
  fastify.post('/api/beehiiv/verify-team-access', async (request, reply) => {
    const { clientPublicationId, agencyApiKey } = request.body as {
      agencyId?: string;
      clientPublicationId?: string;
      agencyApiKey?: string;
    };
    const principal = await resolvePrincipalAgency(request);

    if (principal.error || !principal.data) {
      return reply.code(principal.error?.code === 'FORBIDDEN' ? 403 : 401).send({
        data: null,
        error: principal.error ?? {
          code: 'UNAUTHORIZED',
          message: 'Authenticated user context is required',
        },
      });
    }

    // Validate required fields
    if (!clientPublicationId || !agencyApiKey) {
      return sendValidationError(reply, 'Missing required fields: clientPublicationId and agencyApiKey are required');
    }

    // Verify agency access and store connection
    const result = await beehiivVerificationService.verifyAgencyAccess(
      principal.data.agencyId,
      clientPublicationId,
      agencyApiKey
    );

    if (!result.success) {
      return sendError(reply, 'VERIFICATION_FAILED', result.error ?? 'Verification failed', 400);
    }

    return {
      data: {
        connectionId: result.connectionId,
      },
    };
  });

  /**
   * GET /api/beehiiv/connection/:connectionId/verify
   *
   * Re-verify an existing Beehiiv agency connection.
   * Used for periodic validation of agency connections.
   *
   * Returns:
   * - data.valid: Whether connection is still valid
   */
  fastify.get('/api/beehiiv/connection/:connectionId/verify', async (request, reply) => {
    const { connectionId } = request.params as { connectionId?: string };
    const principal = await resolvePrincipalAgency(request);

    if (principal.error || !principal.data) {
      return reply.code(principal.error?.code === 'FORBIDDEN' ? 403 : 401).send({
        data: null,
        error: principal.error ?? {
          code: 'UNAUTHORIZED',
          message: 'Authenticated user context is required',
        },
      });
    }

    if (!connectionId) {
      return sendValidationError(reply, 'Missing required field: connectionId');
    }

    const connection = await prisma.agencyPlatformConnection.findFirst({
      where: {
        id: connectionId,
        agencyId: principal.data.agencyId,
        platform: 'beehiiv',
      },
      select: { id: true },
    });

    if (!connection) {
      return sendError(reply, 'CONNECTION_NOT_FOUND', 'Connection not found', 404);
    }

    const isValid = await beehiivVerificationService.verifyConnection(connectionId);

    return {
      data: {
        valid: isValid,
      },
    };
  });
}
