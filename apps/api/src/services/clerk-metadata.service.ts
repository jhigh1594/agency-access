/**
 * Clerk Metadata Service
 *
 * Manages subscription tier and quota metadata in Clerk user profiles.
 * Uses Clerk Backend SDK for secure metadata updates.
 */

import { ClerkClient, createClerkClient } from '@clerk/backend';
import { env } from '@/lib/env';
import {
  SubscriptionTier,
  ClerkPublicMetadata,
  ClerkPrivateMetadata,
  TIER_LIMITS,
  getPricingTierNameFromSubscriptionTier,
} from '@agency-platform/shared';

let clerkClient: ClerkClient | null = null;

function getClerkClient(): ClerkClient {
  if (!clerkClient) {
    clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
  }
  return clerkClient;
}

/**
 * Set subscription tier in Clerk metadata for a user
 * Updates both public (display) and private (enforcement) metadata
 */
export async function setSubscriptionTier(
  clerkUserId: string,
  tier: SubscriptionTier,
  options: {
    subscriptionId?: string;
    subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'trialing';
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    trialEndsAt?: Date;
  } = {}
) {
  try {
    const clerk = getClerkClient();
    const limits = TIER_LIMITS[tier];
    const now = new Date();
    const resetAt = new Date(now.getFullYear() + 1, 0, 1);

    const publicMetadata: ClerkPublicMetadata = {
      subscriptionTier: tier,
      tierName: getPricingTierNameFromSubscriptionTier(tier),
      features: limits.features,
    };

    const privateMetadata: ClerkPrivateMetadata = {
      quotaLimits: {
        clientOnboards: {
          limit: limits.clientOnboards,
          used: 0,
          resetsAt: resetAt.toISOString(),
        },
        platformAudits: {
          limit: limits.platformAudits,
          used: 0,
          resetsAt: resetAt.toISOString(),
        },
        teamSeats: {
          limit: limits.teamSeats,
          used: 1,
        },
      },
      subscriptionStatus: options.subscriptionStatus || 'active',
      subscriptionId: options.subscriptionId,
      currentPeriodStart: options.currentPeriodStart?.toISOString() || now.toISOString(),
      currentPeriodEnd: options.currentPeriodEnd?.toISOString() || resetAt.toISOString(),
      trialEndsAt: options.trialEndsAt?.toISOString(),
    };

    await clerk.users.updateUser(clerkUserId, {
      publicMetadata,
      privateMetadata,
    });

    return { data: { tier, publicMetadata, privateMetadata }, error: null };
  } catch (error: any) {
    return {
      data: null,
      error: {
        code: 'CLERK_UPDATE_FAILED',
        message: 'Failed to update Clerk metadata',
        details: error.message,
      },
    };
  }
}

/**
 * Get subscription tier from Clerk metadata
 * Returns cached result if available (Redis)
 */
export async function getSubscriptionTier(clerkUserId: string) {
  try {
    const clerk = getClerkClient();
    const user = await clerk.users.getUser(clerkUserId);

    const tier = user.publicMetadata.subscriptionTier as SubscriptionTier | undefined;

    if (!tier) {
      return {
        data: null,
        error: {
          code: 'TIER_NOT_SET',
          message: 'Subscription tier not found in Clerk metadata',
        },
      };
    }

    return {
      data: {
        tier,
        publicMetadata: user.publicMetadata as ClerkPublicMetadata,
        privateMetadata: user.privateMetadata as ClerkPrivateMetadata,
      },
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: {
        code: 'CLERK_FETCH_FAILED',
        message: 'Failed to fetch Clerk metadata',
        details: error.message,
      },
    };
  }
}

/**
 * Sync quota usage from database counters to Clerk private metadata
 * Called by background job every 5 minutes
 */
export async function syncQuotaUsage(clerkUserId: string, agencyId: string) {
  try {
    const { prisma } = await import('@/lib/prisma');

    // Get current usage from counters
    const counters = await prisma.agencyUsageCounter.findMany({
      where: {
        agencyId,
        period: 'current_year',
      },
    });

    const usageMap = {
      clientOnboards: counters.find(c => c.metricType === 'client_onboards')?.count || 0,
      platformAudits: counters.find(c => c.metricType === 'platform_audits')?.count || 0,
      teamSeats: counters.find(c => c.metricType === 'team_seats')?.count || 1,
    };

    // Get current tier
    const tierResult = await getSubscriptionTier(clerkUserId);
    if (tierResult.error || !tierResult.data) {
      return { data: null, error: tierResult.error };
    }

    const tier = tierResult.data.tier;
    const limits = TIER_LIMITS[tier];
    const clerk = getClerkClient();

    await clerk.users.updateUser(clerkUserId, {
      privateMetadata: {
        ...tierResult.data.privateMetadata,
        quotaLimits: {
          clientOnboards: {
            limit: limits.clientOnboards,
            used: usageMap.clientOnboards,
            resetsAt: tierResult.data.privateMetadata.quotaLimits.clientOnboards.resetsAt,
          },
          platformAudits: {
            limit: limits.platformAudits,
            used: usageMap.platformAudits,
            resetsAt: tierResult.data.privateMetadata.quotaLimits.platformAudits.resetsAt,
          },
          teamSeats: {
            limit: limits.teamSeats,
            used: usageMap.teamSeats,
          },
        },
      },
    });

    return { data: { synced: true, usage: usageMap }, error: null };
  } catch (error: any) {
    return {
      data: null,
      error: {
        code: 'SYNC_FAILED',
        message: 'Failed to sync quota usage',
        details: error.message,
      },
    };
  }
}

export const clerkMetadataService = {
  setSubscriptionTier,
  getSubscriptionTier,
  syncQuotaUsage,
};
