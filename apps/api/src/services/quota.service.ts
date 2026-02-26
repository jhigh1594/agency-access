/**
 * Quota Service
 *
 * Central service for checking and enforcing tier-based usage limits.
 *
 * Features:
 * - Real-time quota checking against TIER_LIMITS
 * - Usage tracking via Clerk private metadata
 * - Upgrade tier suggestions when limits are hit
 * - Strict enforcement (no overage allowance)
 *
 * Usage:
 * ```ts
 * const quotaService = new QuotaService();
 *
 * // Check if action is allowed
 * const result = await quotaService.checkQuota({
 *   agencyId: 'agency-123',
 *   metric: 'clients',
 *   action: 'create',
 *   requestedAmount: 1,
 * });
 *
 * if (!result.allowed) {
 *   // Show upgrade modal with result.suggestedTier
 * }
 *
 * // Update usage after successful action
 * await quotaService.updateUsage('agency-123', 'clients', 1);
 * ```
 */

import { TIER_LIMITS, type SubscriptionTier, type MetricType, type TierLimits, getTierLimitsConfig } from '@agency-platform/shared';
import { prisma } from '@/lib/prisma';
import { createClerkClient } from '@clerk/backend';

// ============================================================
// TYPES
// ============================================================

export interface QuotaCheckInput {
  agencyId: string;
  metric: MetricType;
  action: 'create' | 'check';
  requestedAmount?: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  metric: MetricType;
  limit: number | 'unlimited';
  used: number;
  remaining: number | 'unlimited';
  currentTier: SubscriptionTier;
  suggestedTier?: SubscriptionTier;
  upgradeUrl?: string;
  resetsAt?: Date;
}

export interface UsageSnapshot {
  currentTier: SubscriptionTier;
  updatedAt: Date;
  clients: { limit: number | 'unlimited'; used: number; remaining: number | 'unlimited' };
  members: { limit: number | 'unlimited'; used: number; remaining: number | 'unlimited' };
  accessRequests: { limit: number | 'unlimited'; used: number; remaining: number | 'unlimited' };
  templates: { limit: number | 'unlimited'; used: number; remaining: number | 'unlimited' };
  clientOnboards?: { limit: number | 'unlimited'; used: number; remaining: number | 'unlimited' };
  platformAudits?: { limit: number | 'unlimited'; used: number; remaining: number | 'unlimited' };
  teamSeats?: { limit: number | 'unlimited'; used: number; remaining: number | 'unlimited' };
}

// ============================================================
// ERROR CLASS
// ============================================================

export class QuotaExceededError extends Error {
  code = 'QUOTA_EXCEEDED' as const;
  metric: MetricType;
  limit: number | 'unlimited';
  used: number;
  remaining: number | 'unlimited';
  currentTier: SubscriptionTier;
  suggestedTier: SubscriptionTier;
  upgradeUrl: string;

  constructor(result: Omit<QuotaCheckResult, 'allowed'>) {
    super(`Quota exceeded for ${result.metric}`);
    this.name = 'QuotaExceededError';
    this.metric = result.metric;
    this.limit = result.limit;
    this.used = result.used;
    this.remaining = result.remaining;
    this.currentTier = result.currentTier;
    this.suggestedTier = result.suggestedTier!;
    this.upgradeUrl = result.upgradeUrl!;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: {
          metric: this.metric,
          limit: this.limit,
          used: this.used,
          remaining: this.remaining,
          upgradeUrl: this.upgradeUrl,
          currentTier: this.currentTier,
          suggestedTier: this.suggestedTier,
        },
      },
    };
  }
}

// ============================================================
// QUOTA SERVICE
// ============================================================

export class QuotaService {
  private clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  /**
   * Check if an action is allowed under current quota
   */
  async checkQuota(input: QuotaCheckInput): Promise<QuotaCheckResult> {
    const { agencyId, metric, action = 'create', requestedAmount = 1 } = input;

    // Get agency's current tier
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { subscriptionTier: true },
    });

    if (!agency) {
      throw new Error('Agency not found');
    }

    const tier = (agency.subscriptionTier as SubscriptionTier) || null;
    const tierConfig = getTierLimitsConfig(tier);

    // Map metric to tier config property
    const metricMap: Record<MetricType, keyof typeof tierConfig> = {
      access_requests: 'accessRequests',
      clients: 'clients',
      members: 'members',
      templates: 'templates',
      client_onboards: 'clientOnboards',
      platform_audits: 'platformAudits',
      team_seats: 'teamSeats',
    };

    const configKey = metricMap[metric];
    const limit = tierConfig[configKey] as number | 'unlimited';

    // Unlimited tiers (-1 in config)
    if (limit === -1 || limit === 'unlimited') {
      return {
        allowed: true,
        metric,
        limit: 'unlimited',
        used: await this.getActualUsage(agencyId, metric),
        remaining: 'unlimited',
        currentTier: tier || ('FREE' as any),
        upgradeUrl: undefined,
      };
    }

    // Get actual usage from database
    const used = await this.getActualUsage(agencyId, metric);
    const remaining = Math.max(0, (limit as number) - used);

    // STRICT ENFORCEMENT: Block at limit, no overage
    const allowed = remaining >= (requestedAmount || 1);

    // Calculate next tier for upgrade suggestion
    const tierOrder: SubscriptionTier[] = ['STARTER', 'AGENCY', 'PRO', 'ENTERPRISE'];
    const suggestedTier = tier
      ? (tierOrder.indexOf(tier) < tierOrder.length - 1
          ? tierOrder[tierOrder.indexOf(tier) + 1]
          : undefined)
      : 'STARTER'; // Free users should upgrade to STARTER

    return {
      allowed,
      metric,
      limit: limit as number,
      used,
      remaining,
      currentTier: tier || ('FREE' as any),
      suggestedTier,
      upgradeUrl: `/checkout?tier=${suggestedTier}`,
    };
  }

  /**
   * Get actual usage count from database
   */
  private async getActualUsage(agencyId: string, metric: MetricType): Promise<number> {
    switch (metric) {
      case 'clients':
        return await prisma.client.count({
          where: { agencyId },
        });

      case 'members':
        return await prisma.agencyMember.count({
          where: { agencyId },
        });

      case 'access_requests':
        return await prisma.accessRequest.count({
          where: {
            agencyId,
            status: { in: ['pending', 'approved', 'active'] },
          },
        });

      case 'templates':
        return await prisma.accessRequestTemplate.count({
          where: { agencyId },
        });

      case 'team_seats':
        return await prisma.agencyMember.count({
          where: { agencyId },
        });

      case 'client_onboards':
      case 'platform_audits':
        // These are cumulative yearly metrics - stored in Clerk metadata
        return await this.getClerkMetadataUsage(agencyId, metric);

      default:
        return 0;
    }
  }

  /**
   * Get usage from Clerk private metadata (for cumulative metrics)
   */
  private async getClerkMetadataUsage(agencyId: string, metric: MetricType): Promise<number> {
    try {
      const agency = await prisma.agency.findUnique({
        where: { id: agencyId },
        select: { clerkUserId: true },
      });

      if (!agency?.clerkUserId) {
        return 0;
      }

      const user = await this.clerkClient.users.getUser(agency.clerkUserId);
      const metadata = user.privateMetadata as Record<string, any>;

      // Return usage from metadata if exists
      const quotaLimits = metadata.quotaLimits as Record<string, any> | undefined;
      const metricData = quotaLimits?.[metric];

      return metricData?.used || 0;
    } catch (error) {
      console.error('Error fetching Clerk metadata:', error);
      return 0;
    }
  }

  /**
   * Update usage after successful action
   * For cumulative metrics (client_onboards, platform_audits), updates Clerk metadata
   */
  async updateUsage(agencyId: string, metric: MetricType, amount: number): Promise<void> {
    // Only update Clerk metadata for cumulative metrics
    if (metric === 'client_onboards' || metric === 'platform_audits') {
      await this.updateClerkMetadataUsage(agencyId, metric, amount);
    }
    // For DB-counted metrics, usage is calculated on-the-fly from queries
  }

  /**
   * Update Clerk metadata for cumulative metrics
   */
  private async updateClerkMetadataUsage(
    agencyId: string,
    metric: MetricType,
    amount: number,
  ): Promise<void> {
    try {
      const agency = await prisma.agency.findUnique({
        where: { id: agencyId },
        select: { clerkUserId: true },
      });

      if (!agency?.clerkUserId) {
        return;
      }

      const user = await this.clerkClient.users.getUser(agency.clerkUserId);
      const metadata = user.privateMetadata as Record<string, any>;
      const quotaLimits = { ...metadata.quotaLimits };

      // Get current usage and increment
      const currentUsed = quotaLimits[metric]?.used || 0;
      const newUsed = Math.max(0, currentUsed + amount);

      // Calculate reset date (yearly)
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

      quotaLimits[metric] = {
        ...quotaLimits[metric],
        used: newUsed,
        resetsAt: yearEnd.toISOString(),
      };

      // Update Clerk metadata
      await this.clerkClient.users.updateUser(agency.clerkUserId, {
        privateMetadata: {
          ...metadata,
          quotaLimits,
        },
      });
    } catch (error) {
      console.error('Error updating Clerk metadata:', error);
    }
  }

  /**
   * Get complete usage snapshot for an agency
   */
  async getUsage(agencyId: string): Promise<UsageSnapshot | null> {
    try {
      const agency = await prisma.agency.findUnique({
        where: { id: agencyId },
        select: { subscriptionTier: true },
      });

      if (!agency) {
        return null;
      }

      const tier = (agency.subscriptionTier as SubscriptionTier) || null;
      const tierConfig = getTierLimitsConfig(tier);

      // Get usage for all metrics
      const metrics: MetricType[] = [
        'access_requests',
        'clients',
        'members',
        'templates',
        'client_onboards',
        'platform_audits',
        'team_seats',
      ];

      const usage: Partial<UsageSnapshot> = {
        currentTier: tier || ('FREE' as any),
        updatedAt: new Date(),
      };

      for (const metric of metrics) {
        const used = await this.getActualUsage(agencyId, metric);
        const metricMap: Record<MetricType, 'accessRequests' | 'clients' | 'members' | 'templates' | 'clientOnboards' | 'platformAudits' | 'teamSeats'> = {
          access_requests: 'accessRequests',
          clients: 'clients',
          members: 'members',
          templates: 'templates',
          client_onboards: 'clientOnboards',
          platform_audits: 'platformAudits',
          team_seats: 'teamSeats',
        };

        const configKey = metricMap[metric];
        const limit = tierConfig[configKey] as number | 'unlimited';

        const remaining = limit === -1 || limit === 'unlimited'
          ? 'unlimited'
          : Math.max(0, (limit as number) - used);

        // Map metric names to camelCase for UsageSnapshot
        const snapshotKey = metricMap[metric];
        (usage as any)[snapshotKey] = {
          limit: limit === -1 ? 'unlimited' : limit,
          used,
          remaining,
        };
      }

      return usage as UsageSnapshot;
    } catch (error) {
      console.error('Error getting usage snapshot:', error);
      return null;
    }
  }
}

// Export singleton instance
export const quotaService = new QuotaService();
