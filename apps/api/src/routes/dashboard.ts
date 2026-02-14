/**
 * Dashboard Routes
 *
 * API endpoints for dashboard-specific data aggregation.
 * Protected by Clerk JWT verification.
 */

import { FastifyInstance } from 'fastify';
import { getDashboardStats } from '../services/connection-aggregation.service.js';
import { accessRequestService } from '../services/access-request.service.js';
import { connectionService } from '../services/connection.service.js';
import { getCached, CacheKeys, CacheTTL } from '../lib/cache.js';
import { createHash } from 'crypto';
import { authenticate } from '@/middleware/auth.js';
import { assertAgencyAccess, resolvePrincipalAgency } from '@/lib/authorization.js';
import { prisma } from '@/lib/prisma.js';

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate());

  /**
   * GET /api/dashboard
   *
   * Unified dashboard endpoint that returns all dashboard data in a single request.
   * Replaces multiple API calls for better performance.
   *
   * Returns:
   * - agency: Agency info (id, name, email)
   * - stats: Dashboard statistics (totalRequests, pendingRequests, activeConnections, totalPlatforms)
   * - requests: Recent access requests (limit 10)
   * - connections: Active client connections with authorizations
   */
  fastify.get('/dashboard', async (request, reply) => {
    const principalResult = await resolvePrincipalAgency(request);
    if (principalResult.error || !principalResult.data) {
      const statusCode = principalResult.error?.code === 'UNAUTHORIZED' ? 401 : 403;
      return reply.code(statusCode).send({
        data: null,
        error: principalResult.error || {
          code: 'FORBIDDEN',
          message: 'Unable to resolve agency for authenticated user',
        },
      });
    }

    const agencyId = principalResult.data.agencyId;
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { id: true, name: true, email: true },
    });
    if (!agency) {
      return reply.code(404).send({
        data: null,
        error: {
          code: 'AGENCY_NOT_FOUND',
          message: 'Agency not found',
        },
      });
    }

    // Use caching layer for dashboard data
    const cacheKey = CacheKeys.dashboard(agencyId);
    const cachedResult = await getCached<{
      agency: { id: string; name: string; email: string };
      stats: { totalRequests: number; pendingRequests: number; activeConnections: number; totalPlatforms: number };
      requests: any[];
      connections: any[];
    }>({
      key: cacheKey,
      ttl: CacheTTL.MEDIUM, // 5 minutes
      fetch: async () => {
        // Parallel fetch ALL dashboard data
        const [statsResult, requestsResult, connectionsResult] = await Promise.all([
          getDashboardStats(agencyId),
          accessRequestService.getAgencyAccessRequests(agencyId, { limit: 10 }),
          connectionService.getAgencyConnectionSummaries(agencyId), // Use lightweight summaries
        ]);

        // Check for errors in any of the parallel requests
        if (statsResult.error) {
          return { data: null, error: statsResult.error };
        }

        if (requestsResult.error) {
          return { data: null, error: requestsResult.error };
        }

        if (connectionsResult.error) {
          return { data: null, error: connectionsResult.error };
        }

        // Return consolidated dashboard data in the expected format
        return {
          data: {
            agency: {
              id: agency.id,
              name: agency.name,
              email: agency.email,
            },
            stats: statsResult.data!,
            requests: requestsResult.data!,
            connections: connectionsResult.data!,
          },
          error: null,
        };
      },
    });

    // Handle errors from fetch function
    if (cachedResult.error || !cachedResult.data) {
      return reply.code(500).send({
        data: null,
        error: cachedResult.error || {
          code: 'DASHBOARD_FETCH_ERROR',
          message: 'Failed to fetch dashboard data',
        },
      });
    }

    // Generate ETag for conditional requests (based on data hash)
    const etag = createHash('md5')
      .update(JSON.stringify(cachedResult.data))
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
    // - 5 minutes max age (browser can cache for 5 min)
    // - 10 minutes stale-while-revalidate (can serve stale while refreshing in background)
    // - private: Never cache by shared caches (CDNs, proxies) - contains user-specific data
    reply.header('Cache-Control', 'private, max-age=300, stale-while-revalidate=600');

    // Return consolidated dashboard data
    return reply.send({
      data: cachedResult.data,
      error: null,
    });
  });

  /**
   * GET /api/dashboard/stats
   * Get aggregated statistics for the agency dashboard
   *
   * @deprecated Use GET /api/dashboard instead (returns stats + more data)
   */
  fastify.get('/dashboard/stats', async (request, reply) => {
    const { agencyId: queryAgencyId } = request.query as { agencyId?: string };
    const principalResult = await resolvePrincipalAgency(request);
    if (principalResult.error || !principalResult.data) {
      const statusCode = principalResult.error?.code === 'UNAUTHORIZED' ? 401 : 403;
      return reply.code(statusCode).send({
        data: null,
        error: principalResult.error || {
          code: 'FORBIDDEN',
          message: 'Unable to resolve agency for authenticated user',
        },
      });
    }
    const principalAgencyId = principalResult.data.agencyId;
    const targetAgencyId = queryAgencyId || principalAgencyId;
    const accessError = assertAgencyAccess(targetAgencyId, principalAgencyId);
    if (accessError) {
      return reply.code(403).send({ data: null, error: accessError });
    }

    const result = await getDashboardStats(targetAgencyId);

    if (result.error) {
      return reply.code(500).send({
        data: null,
        error: result.error,
      });
    }

    return reply.send(result);
  });
}
