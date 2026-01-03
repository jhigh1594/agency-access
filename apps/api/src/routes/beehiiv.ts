import { FastifyInstance } from 'fastify';
import { beehiivVerificationService } from '../services/beehiiv-verification.service.js';

/**
 * Beehiiv API Routes
 *
 * Routes for verifying Beehiiv team access and managing agency connections.
 * Beehiiv uses API key authentication (team invitation workflow) instead of OAuth.
 */
export async function beehiivRoutes(fastify: FastifyInstance) {
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
    const { agencyId, clientPublicationId, agencyApiKey } = request.body as {
      agencyId?: string;
      clientPublicationId?: string;
      agencyApiKey?: string;
    };

    // Validate required fields
    if (!agencyId || !clientPublicationId || !agencyApiKey) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: agencyId, clientPublicationId, and agencyApiKey are required',
        },
      });
    }

    // Verify agency access and store connection
    const result = await beehiivVerificationService.verifyAgencyAccess(
      agencyId,
      clientPublicationId,
      agencyApiKey
    );

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VERIFICATION_FAILED',
          message: result.error ?? 'Verification failed',
        },
      });
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

    if (!connectionId) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required field: connectionId',
        },
      });
    }

    const isValid = await beehiivVerificationService.verifyConnection(connectionId);

    return {
      data: {
        valid: isValid,
      },
    };
  });
}
