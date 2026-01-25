/**
 * Usage Routes
 *
 * API endpoints for fetching usage snapshots and quota information.
 * Protected by Clerk JWT verification.
 */

import { FastifyInstance } from 'fastify';
import { prisma } from '@/lib/prisma';
import { clerkMetadataService } from '@/services/clerk-metadata.service';
import { UsageSnapshot, MetricUsage } from '@agency-platform/shared';

export async function usageRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/usage
   *
   * Returns current usage snapshot for the authenticated user's agency.
   * Includes tier information, quota limits, and current usage for all metrics.
   *
   * Returns:
   * - agencyId: Agency UUID
   * - tier: Current subscription tier (STARTER, AGENCY, PRO)
   * - tierName: Display name of tier
   * - metrics: Object with clientOnboards, platformAudits, teamSeats
   * - currentPeriodStart: Start date of current billing period
   * - currentPeriodEnd: End date of current billing period
   */
  const authenticate = (fastify as any).authenticate ?? (fastify as any).verifyUser;

  fastify.get('/usage', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    const userId = (request as any).user?.sub;
    if (!userId) {
      return reply.code(401).send({ data: null, error: { code: 'UNAUTHORIZED' } });
    }

    try {
      // Fetch tier from Clerk metadata
      const tierResult = await clerkMetadataService.getSubscriptionTier(userId);
      if (tierResult.error || !tierResult.data) {
        return reply.code(404).send({ data: null, error: { code: 'TIER_NOT_FOUND', message: 'Subscription tier not found' } });
      }

      // Fetch agency from database
      const agency = await prisma.agency.findUnique({
        where: { clerkUserId: userId },
      });

      if (!agency) {
        return reply.code(404).send({ data: null, error: { code: 'AGENCY_NOT_FOUND', message: 'Agency not found' } });
      }

      // Fetch usage counters from database
      const counters = await prisma.agencyUsageCounter.findMany({
        where: { agencyId: agency.id },
      });

      // Get quota limits from Clerk metadata
      const limits = tierResult.data.privateMetadata.quotaLimits;

      /**
       * Helper to build MetricUsage object
       */
      const getMetricUsage = (
        metricType: string,
        limit: number,
        resetsAt?: string
      ): MetricUsage => {
        const used = counters.find(c => c.metricType === metricType)?.count || 0;
        const isUnlimited = limit === -1;

        return {
          used,
          limit,
          remaining: isUnlimited ? -1 : Math.max(0, limit - used),
          percentage: isUnlimited ? 0 : (used / limit) * 100,
          resetsAt: resetsAt ? new Date(resetsAt) : undefined,
          isUnlimited,
        };
      };

      // Build usage snapshot
      const snapshot: UsageSnapshot = {
        agencyId: agency.id,
        tier: tierResult.data.tier,
        tierName: tierResult.data.publicMetadata.tierName,
        metrics: {
          clientOnboards: getMetricUsage(
            'client_onboards',
            limits.clientOnboards.limit,
            limits.clientOnboards.resetsAt
          ),
          platformAudits: getMetricUsage(
            'platform_audits',
            limits.platformAudits.limit,
            limits.platformAudits.resetsAt
          ),
          teamSeats: getMetricUsage('team_seats', limits.teamSeats.limit),
        },
        currentPeriodStart: new Date(tierResult.data.privateMetadata.currentPeriodStart),
        currentPeriodEnd: new Date(tierResult.data.privateMetadata.currentPeriodEnd),
      };

      return { data: snapshot, error: null };
    } catch (error: any) {
      return reply.code(500).send({
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch usage data',
          details: error.message,
        },
      });
    }
  });
}
