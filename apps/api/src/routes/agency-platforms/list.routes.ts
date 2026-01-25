import { FastifyInstance } from 'fastify';
import { prisma } from '@/lib/prisma';
import { agencyPlatformService } from '@/services/agency-platform.service';
import type { Platform } from '@agency-platform/shared';
import { PLATFORM_NAMES, getPlatformCategory } from './constants.js';

export async function registerListRoutes(fastify: FastifyInstance) {
  /**
   * GET /agency-platforms
   * List all agency platform connections with status
   * Supports agencyId (UUID) or clerkUserId for lookup
   */
  fastify.get('/agency-platforms', async (request, reply) => {
    const { agencyId, clerkUserId, status } = request.query as {
      agencyId?: string;
      clerkUserId?: string;
      status?: string;
    };

    let actualAgencyId = agencyId;

    if (clerkUserId && !agencyId) {
      const agency = await prisma.agency.findUnique({
        where: { clerkUserId },
      });

      if (!agency) {
        return reply.code(404).send({
          data: null,
          error: {
            code: 'AGENCY_NOT_FOUND',
            message: 'Agency not found for the provided clerkUserId',
          },
        });
      }

      actualAgencyId = agency.id;
    }

    if (!actualAgencyId) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId or clerkUserId is required',
        },
      });
    }

    const filters = status ? { status } : undefined;
    const result = await agencyPlatformService.getConnections(actualAgencyId, filters);

    if (result.error) {
      return reply.code(500).send(result);
    }

    return reply.send(result);
  });

  /**
   * GET /agency-platforms/available
   * List all platforms with connection status (for UI)
   */
  fastify.get('/agency-platforms/available', async (request, reply) => {
    const { agencyId } = request.query as { agencyId?: string };

    if (!agencyId) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId is required',
        },
      });
    }

    const { agencyResolutionService } = await import('../../services/agency-resolution.service.js');
    const agencyResult = await agencyResolutionService.resolveAgency(agencyId, {
      createIfMissing: false,
    });

    if (agencyResult.error) {
      return reply.code(404).send({
        data: null,
        error: {
          code: agencyResult.error.code,
          message: agencyResult.error.message,
        },
      });
    }

    const actualAgencyId = agencyResult.data!.agencyId;

    const result = await agencyPlatformService.getConnections(actualAgencyId);

    if (result.error) {
      return reply.code(500).send(result);
    }

    const connections = result.data || [];

    const allPlatforms: Platform[] = [
      'google',
      'meta',
      'linkedin',
      'kit',
      'beehiiv',
      'tiktok',
      'mailchimp',
      'pinterest',
      'klaviyo',
      'shopify',
    ];

    const availablePlatforms = allPlatforms.map((platform) => {
      const connection = connections.find((c: any) => c.platform === platform);

      let connectedEmail: string | undefined;
      if (connection?.agencyEmail) {
        connectedEmail = connection.agencyEmail;
      } else if (connection?.metadata) {
        const meta = connection.metadata as Record<string, any>;
        connectedEmail =
          meta.email ||
          meta.userEmail ||
          meta.businessEmail ||
          connection.connectedBy;
      } else if (connection) {
        connectedEmail = connection.connectedBy;
      }

      return {
        platform,
        name: PLATFORM_NAMES[platform],
        category: getPlatformCategory(platform),
        connected: !!connection && connection.status === 'active',
        status: connection?.status,
        connectedEmail,
        connectedAt: connection?.connectedAt,
        expiresAt: connection?.expiresAt,
        metadata: connection?.metadata,
      };
    });

    return reply.send({
      data: availablePlatforms,
      error: null,
    });
  });
}
