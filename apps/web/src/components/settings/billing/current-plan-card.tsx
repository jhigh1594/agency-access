'use client';

/**
 * Current Plan Card
 *
 * Displays current subscription tier, status, and next billing date.
 */

import {
  CreditCard,
  Check,
  X,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useSubscription, useOpenPortal } from '@/lib/query/billing';
import {
  SUBSCRIPTION_TIER_NAMES,
  SUBSCRIPTION_TIER_DESCRIPTIONS,
} from '@agency-platform/shared';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';

export function CurrentPlanCard() {
  const { data: subscription, isLoading } = useSubscription();
  const openPortal = useOpenPortal();

  const handleManageSubscription = async () => {
    const result = await openPortal.mutateAsync(window.location.href);
    window.location.href = result.portalUrl;
  };

  if (isLoading) {
    return (
      <section className="clean-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-teal/10 rounded-lg">
            <CreditCard className="h-5 w-5 text-teal" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Current Plan</h2>
            <p className="text-sm text-muted-foreground">Your subscription details</p>
          </div>
        </div>
        <div className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
        </div>
      </section>
    );
  }

  const currentTier = subscription?.tier || 'STARTER';
  const tierName = SUBSCRIPTION_TIER_NAMES[currentTier];
  const tierInfo = SUBSCRIPTION_TIER_DESCRIPTIONS[currentTier];

  const getStatusBadge = () => {
    if (!subscription) return null;

    const badges: Record<string, React.ReactNode> = {
      active: <StatusBadge status="active" />,
      past_due: <StatusBadge status="past_due" />,
      canceled: <StatusBadge status="cancelled" />,
    };

    return (
      badges[subscription.status] || (
        <StatusBadge badgeVariant="default">{subscription.status}</StatusBadge>
      )
    );
  };

  return (
    <section className="clean-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-teal/10 rounded-lg">
          <CreditCard className="h-5 w-5 text-teal" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-lg font-semibold text-ink">Current Plan</h2>
          <p className="text-sm text-muted-foreground">Your subscription details</p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="p-4 bg-card rounded-lg border border-border">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-ink">{tierName} Plan</h3>
            <p className="text-sm text-muted-foreground">{tierInfo.description}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-ink">
              ${tierInfo.price.monthly}
            </p>
            <p className="text-sm text-muted-foreground">/month</p>
          </div>
        </div>

        {subscription?.cancelAtPeriodEnd && (
          <div className="mt-3 p-2 bg-acid/10 border border-acid/30 rounded">
            <p className="text-sm text-acid">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Your subscription will cancel at the end of the current billing period.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <Button
          variant="ghost"
          onClick={handleManageSubscription}
          disabled={openPortal.isPending || !subscription}
        >
          {openPortal.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Opening...
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4" />
              Manage Subscription
            </>
          )}
        </Button>

        {subscription?.currentPeriodEnd && (
          <p className="text-sm text-muted-foreground">
            Next billing:{' '}
            {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    </section>
  );
}
