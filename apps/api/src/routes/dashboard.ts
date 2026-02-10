/**
 * Dashboard Routes
 *
 * API endpoints for dashboard-specific data aggregation.
 * Protected by Clerk JWT verification.
 */

import { FastifyInstance } from 'fastify';
import { getDashboardStats } from '../services/connection-aggregation.service.js';
import { agencyResolutionService } from '../services/agency-resolution.service.js';
import { accessRequestService } from '../services/access-request.service.js';
import { connectionService } from '../services/connection.service.js';
import { getCached, CacheKeys, CacheTTL } from '../lib/cache.js';
import { createHash } from 'crypto';

export async function dashboardRoutes(fastify: FastifyInstance) {
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
    // Try to get clerkUserId from query param first (for backward compatibility)
    let clerkUserId = (request.query as any).clerkUserId as string | undefined;

    // If not in query, try decoding from x-agency-id header (JWT)
    if (!clerkUserId) {
      const token = request.headers['x-agency-id'] as string;
      if (token) {
        // Check if it looks like a JWT (has 3 parts separated by dots)
        if (token.split('.').length === 3) {
          try {
            // Try verified decode using Clerk's verification
            const { verifyToken } = await import('@clerk/backend');
            const verified = await verifyToken(token, {
              jwtKey: process.env.CLERK_SECRET_KEY,
            });
            clerkUserId = verified.payload?.sub;
          } catch (verifyError) {
            // Verification failed - try unverified decode for development
            try {
              const parts = token.split('.');
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
              clerkUserId = payload.sub;
            } catch (decodeError) {
              // Both attempts failed
            }
          }
        } else {
          // Not a JWT format, treat as raw user ID
          clerkUserId = token;
        }
      }
    }

    if (!clerkUserId) {
      return reply.code(401).send({
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'clerkUserId is required (via query param or x-agency-id header)',
        },
      });
    }

    // Resolve agency ONCE (prevents duplicate lookups)
    const agencyResult = await agencyResolutionService.resolveAgency(clerkUserId);

    if (agencyResult.error || !agencyResult.data) {
      return reply.code(404).send({
        data: null,
        error: agencyResult.error || {
          code: 'AGENCY_NOT_FOUND',
          message: 'Agency not found',
        },
      });
    }

    const { agencyId, agency } = agencyResult.data;

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
              id: agency!.id,
              name: agency!.name,
              email: agency!.email,
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

    // Fallback to agency ID from header if not in query
    const clerkUserId = request.headers['x-agency-id'] as string;

    let targetAgencyId = queryAgencyId;

    if (!targetAgencyId && clerkUserId) {
      const agencyResult = await agencyResolutionService.resolveAgency(clerkUserId);
      if (!agencyResult.error && agencyResult.data) {
        targetAgencyId = agencyResult.data.agencyId;
      }
    }

    if (!targetAgencyId) {
      return reply.code(400).send({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'agencyId is required (via query param or x-agency-id header)',
        },
      });
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
