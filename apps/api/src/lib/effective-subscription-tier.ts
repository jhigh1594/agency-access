import type { SubscriptionTier } from '@agency-platform/shared';

type SubscriptionSnapshot = {
  tier: string | null;
  status: string | null;
} | null | undefined;

type AgencySubscriptionContext = {
  subscription?: SubscriptionSnapshot;
};

const VALID_TIERS: readonly SubscriptionTier[] = ['STARTER', 'AGENCY', 'PRO', 'ENTERPRISE'];
const ACTIVE_STATUSES = new Set(['active', 'trialing', 'past_due']);

function isValidTier(tier: string | null | undefined): tier is SubscriptionTier {
  return !!tier && VALID_TIERS.includes(tier as SubscriptionTier);
}

export function resolveEffectiveSubscriptionTier(
  agency: AgencySubscriptionContext | null | undefined
): SubscriptionTier | null {
  const subscription = agency?.subscription;
  if (!subscription) return null;

  const status = subscription.status?.toLowerCase();
  if (!status || !ACTIVE_STATUSES.has(status)) {
    return null;
  }

  return isValidTier(subscription.tier) ? subscription.tier : null;
}
