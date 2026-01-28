/**
 * Tier Limits Service
 *
 * Enforces subscription tier limits across the application.
 * Checks resource usage against tier quotas and feature access.
 *
 * Following TDD principles - tests written first.
 */

import { prisma } from '@/lib/prisma';
import { TIER_LIMITS, SubscriptionTier, TierLimitsDetails } from '@agency-platform/shared';

// Resource type mapping for API endpoints
type ResourceType = 'access_requests' | 'clients' | 'members' | 'templates';

// Map resource type to database model and field
const RESOURCE_CONFIG: Record<ResourceType, { model: string; countField: string }> = {
  access_requests: { model: 'accessRequest', countField: 'agencyId' },
  clients: { model: 'client', countField: 'agencyId' },
  members: { model: 'agencyMember', countField: 'agencyId' },
  templates: { model: 'accessRequestTemplate', countField: 'agencyId' },
} as const;

// Map resource type to tier limit key
type TierLimitKey = 'accessRequests' | 'clients' | 'members' | 'templates';

const RESOURCE_TO_TIER_KEY: Record<ResourceType, TierLimitKey> = {
  access_requests: 'accessRequests',
  clients: 'clients',
  members: 'members',
  templates: 'templates',
};

export interface TierLimitCheckResult {
  allowed: boolean;
  limit?: number;
  current?: number;
  error?: string;
}

export interface TierDetailsResult {
  error: { code: string; message: string } | null;
  data: {
    tier: SubscriptionTier;
    limits: TierLimitsDetails;
    features: string[];
  } | null;
}

class TierLimitsService {
  /**
   * Check if an agency can perform an action based on their tier limits
   */
  async checkTierLimit(
    agencyId: string,
    resource: ResourceType
  ): Promise<TierLimitCheckResult> {
    // Get agency to determine tier
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { subscriptionTier: true },
    });

    if (!agency) {
      return {
        allowed: false,
        error: 'AGENCY_NOT_FOUND',
      };
    }

    const tier = agency.subscriptionTier as SubscriptionTier;
    const tierConfig = TIER_LIMITS[tier];

    if (!tierConfig) {
      return {
        allowed: false,
        error: 'INVALID_TIER',
      };
    }

    const limitKey = RESOURCE_TO_TIER_KEY[resource];
    const limit = tierConfig[limitKey];

    // Enterprise has unlimited (-1 means unlimited)
    if (limit === -1) {
      // Still fetch current count for display
      const config = RESOURCE_CONFIG[resource];
      const current = await (prisma as any)[config.model].count({
        where: { [config.countField]: agencyId },
      });

      return {
        allowed: true,
        limit: undefined,
        current,
        error: undefined,
      };
    }

    // Get current usage count
    const config = RESOURCE_CONFIG[resource];
    const current = await (prisma as any)[config.model].count({
      where: { [config.countField]: agencyId },
    });

    const allowed = current < limit;

    return {
      allowed,
      limit,
      current,
      error: allowed ? undefined : 'TIER_LIMIT_EXCEEDED',
    };
  }

  /**
   * Check if an agency has access to a specific feature
   */
  async hasFeatureAccess(agencyId: string, feature: string): Promise<boolean> {
    // Get agency to determine tier
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { subscriptionTier: true },
    });

    if (!agency) {
      return false;
    }

    const tier = agency.subscriptionTier as SubscriptionTier;
    const tierConfig = TIER_LIMITS[tier];

    // Enterprise has all features
    if (tier === 'ENTERPRISE') {
      return true;
    }

    return tierConfig.features.includes(feature);
  }

  /**
   * Get detailed tier information including current usage
   */
  async getTierDetails(agencyId: string): Promise<TierDetailsResult> {
    // Get agency to determine tier
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { subscriptionTier: true },
    });

    if (!agency) {
      return {
        data: null,
        error: {
          code: 'AGENCY_NOT_FOUND',
          message: 'Agency not found',
        },
      };
    }

    const tier = agency.subscriptionTier as SubscriptionTier;
    const tierConfig = TIER_LIMITS[tier];

    // Get current usage for all resources
    const [accessRequestsCount, clientsCount, membersCount, templatesCount] =
      await Promise.all([
        prisma.accessRequest.count({ where: { agencyId } }),
        prisma.client.count({ where: { agencyId } }),
        prisma.agencyMember.count({ where: { agencyId } }),
        prisma.accessRequestTemplate.count({ where: { agencyId } }),
      ]);

    // Build limits object
    const limits: TierLimitsDetails = {
      accessRequests: {
        limit: tierConfig.accessRequests === -1 ? 'unlimited' : tierConfig.accessRequests,
        used: accessRequestsCount,
        remaining:
          tierConfig.accessRequests === -1
            ? -1
            : Math.max(0, tierConfig.accessRequests - accessRequestsCount),
      },
      clients: {
        limit: tierConfig.clients === -1 ? 'unlimited' : tierConfig.clients,
        used: clientsCount,
        remaining:
          tierConfig.clients === -1 ? -1 : Math.max(0, tierConfig.clients - clientsCount),
      },
      members: {
        limit: tierConfig.members === -1 ? 'unlimited' : tierConfig.members,
        used: membersCount,
        remaining:
          tierConfig.members === -1
            ? -1
            : Math.max(0, tierConfig.members - membersCount),
      },
      templates: {
        limit: tierConfig.templates === -1 ? 'unlimited' : tierConfig.templates,
        used: templatesCount,
        remaining:
          tierConfig.templates === -1
            ? -1
            : Math.max(0, tierConfig.templates - templatesCount),
      },
    };

    return {
      error: null,
      data: {
        tier,
        limits,
        features: tierConfig.features,
      },
    };
  }
}

// Singleton export
export const tierLimitsService = new TierLimitsService();
