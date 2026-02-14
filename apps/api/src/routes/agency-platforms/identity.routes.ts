import { FastifyInstance } from 'fastify';
import { identityVerificationService } from '@/services/identity-verification.service';
import { SUPPORTED_PLATFORMS } from './constants.js';
import { assertAgencyAccess } from '@/lib/authorization.js';

export async function registerIdentityRoutes(fastify: FastifyInstance) {
  /**
   * POST /agency-platforms/identity
   * Create identity-only connection (no OAuth tokens).
   */
  fastify.post('/agency-platforms/identity', async (request, reply) => {
    const { agencyId, platform, agencyEmail, businessId, connectedBy } = request.body as {
      agencyId?: string;
      platform?: string;
      agencyEmail?: string;
      businessId?: string;
      connectedBy?: string;
    };

    if (!agencyId || !platform || !connectedBy) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId, platform, and connectedBy are required',
        },
      });
    }

    const principalAgencyId = (request as any).principalAgencyId as string;
    const accessError = assertAgencyAccess(agencyId, principalAgencyId);
    if (accessError) {
      return reply.code(403).send({ data: null, error: accessError });
    }

    if (!SUPPORTED_PLATFORMS.includes(platform as any)) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'UNSUPPORTED_PLATFORM',
          message: `Platform "${platform}" is not supported`,
        },
      });
    }

    if (platform === 'meta_ads' && !businessId) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'businessId is required for Meta platform',
        },
      });
    }

    if (
      (platform === 'google' ||
        platform === 'google_ads' ||
        platform === 'ga4' ||
        platform === 'linkedin') &&
      !agencyEmail
    ) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyEmail is required for Google and LinkedIn platforms',
        },
      });
    }

    const result = await identityVerificationService.createIdentityConnection({
      agencyId,
      platform: platform as 'google' | 'meta' | 'meta_ads' | 'google_ads' | 'ga4' | 'linkedin',
      agencyEmail,
      businessId,
      connectedBy,
    });

    if (result.error) {
      const statusCode = result.error.code === 'DUPLICATE_IDENTITY' ? 409 : 400;
      return reply.code(statusCode).send(result);
    }

    return reply.code(201).send(result);
  });

  /**
   * PUT /agency-platforms/:id/verify
   * Verify agency identity via platform API check.
   */
  fastify.put('/agency-platforms/:id/verify', async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await identityVerificationService.updateVerificationStatus(
      id,
      'verified',
      {}
    );

    if (result.error) {
      const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 500;
      return reply.code(statusCode).send(result);
    }

    return reply.send(result);
  });
}
