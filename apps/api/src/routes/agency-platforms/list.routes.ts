import { FastifyInstance } from 'fastify';
import { prisma } from '@/lib/prisma';
import { agencyPlatformService } from '@/services/agency-platform.service';
import { PLATFORM_NAMES, getPlatformCategory, SUPPORTED_PLATFORMS } from './constants.js';
import { createHash } from 'crypto';
import { getCached, CacheKeys, CacheTTL } from '@/lib/cache.js';

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
   *
   * OPTIMIZATION: Skip agency resolution when agencyId is a valid UUID.
   * The caller already resolved the agency, so we can use the ID directly.
   *
   * CACHING: Uses server-side caching (2 min TTL) and ETag for conditional requests.
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

    // If agencyId is a valid UUID (not a Clerk ID), use it directly
    // This skips the duplicate agency resolution call
    let actualAgencyId = agencyId;

    // Only resolve if it's a Clerk ID (starts with user_ or org_)
    if (agencyId.startsWith('user_') || agencyId.startsWith('org_')) {
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

      actualAgencyId = agencyResult.data!.agencyId;
    }

    // Use caching layer for platform connections
    const cacheKey = CacheKeys.agencyConnections(actualAgencyId);
    const cachedResult = await getCached<any[]>({
      key: cacheKey,
      ttl: CacheTTL.MEDIUM, // 5 minutes
      fetch: async () => {
        const result = await agencyPlatformService.getConnections(actualAgencyId);
        return result;
      },
    });

    if (cachedResult.error) {
      return reply.code(500).send(cachedResult);
    }

    const connections = cachedResult.data || [];

    const availablePlatforms = [...SUPPORTED_PLATFORMS].map((platform) => {
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

    // Generate ETag for conditional requests (based on data hash)
    const etag = createHash('md5')
      .update(JSON.stringify(availablePlatforms))
      .digest('hex');

    // Check for conditional request (If-None-Match header)
    const ifNoneMatch = request.headers['if-none-match'];
    if (ifNoneMatch === `"${etag}"` || ifNoneMatch === etag) {
      return reply.code(304).send(); // Not Modified - no body sent
    }

    // Add cache status header for monitoring
    reply.header('X-Cache', cachedResult.cached ? 'HIT' : 'MISS');

    // Add ETag for conditional requests
    reply.header('ETag', `"${etag}"`);

    // Add Cache-Control header for browser-level stale-while-revalidate
    reply.header('Cache-Control', 'private, max-age=120, stale-while-revalidate=300');

    return reply.send({
      data: availablePlatforms,
      error: null,
    });
  });
}
