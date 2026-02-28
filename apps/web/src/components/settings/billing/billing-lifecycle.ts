import type { SubscriptionData } from '@/lib/query/billing';

export type BillingLifecycle = 'FREE' | 'TRIALING' | 'PAID';

export function resolveBillingLifecycle(subscription: SubscriptionData | null | undefined): BillingLifecycle {
  if (!subscription) {
    return 'FREE';
  }

  if (subscription.status === 'trialing') {
    return 'TRIALING';
  }

  if (subscription.status === 'active' || subscription.status === 'past_due' || subscription.status === 'canceled') {
    return 'PAID';
  }

  return 'FREE';
}
