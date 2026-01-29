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

export function CurrentPlanCard() {
  const { data: subscription, isLoading } = useSubscription();
  const openPortal = useOpenPortal();

  const handleManageSubscription = async () => {
    const result = await openPortal.mutateAsync(window.location.href);
    window.location.href = result.portalUrl;
  };

  if (isLoading) {
    return (
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <CreditCard className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Current Plan</h2>
            <p className="text-sm text-slate-600">Your subscription details</p>
          </div>
        </div>
        <div className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto" />
        </div>
      </section>
    );
  }

  const currentTier = subscription?.tier || 'STARTER';
  const tierName = SUBSCRIPTION_TIER_NAMES[currentTier];
  const tierInfo = SUBSCRIPTION_TIER_DESCRIPTIONS[currentTier];

  const getStatusBadge = () => {
    if (!subscription) return null;

    const badges = {
      active: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          <Check className="h-3 w-3" /> Active
        </span>
      ),
      past_due: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
          <AlertCircle className="h-3 w-3" /> Past Due
        </span>
      ),
      canceled: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-slate-100 text-slate-800 rounded-full">
          <X className="h-3 w-3" /> Canceled
        </span>
      ),
    };

    return (
      badges[subscription.status as keyof typeof badges] || (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-slate-100 text-slate-800 rounded-full">
          {subscription.status}
        </span>
      )
    );
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <CreditCard className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-900">Current Plan</h2>
          <p className="text-sm text-slate-600">Your subscription details</p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{tierName} Plan</h3>
            <p className="text-sm text-slate-600">{tierInfo.description}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">
              ${tierInfo.price.monthly}
            </p>
            <p className="text-sm text-slate-600">/month</p>
          </div>
        </div>

        {subscription?.cancelAtPeriodEnd && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Your subscription will cancel at the end of the current billing period.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={handleManageSubscription}
          disabled={openPortal.isPending || !subscription}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
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
        </button>

        {subscription?.currentPeriodEnd && (
          <p className="text-sm text-slate-500">
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
