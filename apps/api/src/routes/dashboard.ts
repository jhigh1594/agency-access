/**
 * Dashboard Routes
 *
 * API endpoints for dashboard-specific data aggregation.
 * Protected by Clerk JWT verification.
 */

import { FastifyInstance } from 'fastify';
import { getDashboardStats } from '../services/connection-aggregation.service.js';
import { agencyResolutionService } from '../services/agency-resolution.service.js';

export async function dashboardRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/dashboard/stats
   * Get aggregated statistics for the agency dashboard
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

