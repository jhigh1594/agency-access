'use client';

/**
 * Billing Settings Card
 *
 * Displays subscription information, tier limits, usage statistics,
 * and provides access to the customer portal for self-service management.
 */

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  TrendingUp,
  Loader2,
  ExternalLink,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  SUBSCRIPTION_TIER_NAMES,
  SUBSCRIPTION_TIER_DESCRIPTIONS,
  type SubscriptionTier,
  type TierLimits,
} from '@agency-platform/shared';

interface SubscriptionData {
  id: string;
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

interface TierDetailsData {
  tier: SubscriptionTier;
  status: string;
  limits: TierLimits;
  features: string[];
}

export function BillingSettingsCard() {
  const { orgId, getToken } = useAuth();
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  // Fetch subscription details
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['subscription', orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('No organization ID');

      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const result = await response.json();
      return result.data as SubscriptionData | null;
    },
    enabled: !!orgId,
  });

  // Fetch tier details with usage
  const { data: tierDetails, isLoading: isLoadingTierDetails } = useQuery({
    queryKey: ['tier-details', orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('No organization ID');

      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/${orgId}/tier`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch tier details');
      }

      const result = await response.json();
      return result.data as TierDetailsData;
    },
    enabled: !!orgId,
  });

  const handleOpenPortal = async () => {
    if (!orgId) return;

    setIsOpeningPortal(true);
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/portal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            agencyId: orgId,
            returnUrl: window.location.href,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to open portal');
      }

      const result = await response.json();
      // Redirect to Creem portal
      window.location.href = result.data.portalUrl;
    } catch (error) {
      console.error('Failed to open portal:', error);
      setIsOpeningPortal(false);
    }
  };

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (!orgId) return;

    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            agencyId: orgId,
            tier,
            successUrl: `${window.location.origin}/settings?checkout=success`,
            cancelUrl: `${window.location.origin}/settings?checkout=cancel`,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const result = await response.json();
      // Redirect to Creem checkout
      window.location.href = result.data.checkoutUrl;
    } catch (error) {
      console.error('Failed to create checkout:', error);
    }
  };

  // Loading state
  if (isLoadingSubscription || isLoadingTierDetails) {
    return (
      <section className="bg-card rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <CreditCard className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Billing & Subscription</h2>
            <p className="text-sm text-slate-600">Manage your subscription and billing</p>
          </div>
        </div>
        <div className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto" />
        </div>
      </section>
    );
  }

  const currentTier = subscription?.tier || null;
  const isFree = !currentTier;
  const tierName = isFree ? 'Free' : SUBSCRIPTION_TIER_NAMES[currentTier];
  const tierInfo = isFree
    ? { description: 'Solo freelancers testing OAuth automation', price: { monthly: 0, yearly: 0 } }
    : SUBSCRIPTION_TIER_DESCRIPTIONS[currentTier];
  const limits = tierDetails?.limits;

  const getStatusBadge = () => {
    if (!subscription) return null;

    switch (subscription.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            <Check className="h-3 w-3" />
            Active
          </span>
        );
      case 'past_due':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            <AlertCircle className="h-3 w-3" />
            Past Due
          </span>
        );
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-slate-100 text-slate-800 rounded-full">
            <X className="h-3 w-3" />
            Canceled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-slate-100 text-slate-800 rounded-full">
            {subscription.status}
          </span>
        );
    }
  };

  const renderProgressBar = (used: number, limit: number | 'unlimited', label: string) => {
    const isUnlimited = limit === 'unlimited';
    const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
    const isNearLimit = !isUnlimited && percentage >= 80;
    const isAtLimit = !isUnlimited && used >= limit;

    return (
      <div key={label} className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-700 capitalize">{label}</span>
          <span className={`font-medium ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-slate-900'}`}>
            {isUnlimited ? 'Unlimited' : `${used} / ${limit}`}
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit
                ? 'bg-red-500'
                : isNearLimit
                ? 'bg-yellow-500'
                : 'bg-indigo-500'
            }`}
            style={{ width: isUnlimited ? '0%' : `${percentage}%` }}
          />
        </div>
        {!isUnlimited && isNearLimit && (
          <p className={`text-xs ${isAtLimit ? 'text-red-600' : 'text-yellow-600'}`}>
            {isAtLimit
              ? 'Limit reached. Upgrade to continue.'
              : `${limit - used} remaining. Consider upgrading soon.`}
          </p>
        )}
      </div>
    );
  };

  return (
    <section className="bg-card rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <CreditCard className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-900">Billing & Subscription</h2>
          <p className="text-sm text-slate-600">Manage your subscription and billing</p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Current Plan */}
      <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
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

      {/* Usage Statistics */}
      {limits && (
        <div className="mb-6 space-y-4">
          <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Usage This Month
          </h4>
          {renderProgressBar(
            limits.accessRequests.used,
            limits.accessRequests.limit,
            'access requests'
          )}
          {renderProgressBar(limits.clients.used, limits.clients.limit, 'clients')}
          {renderProgressBar(limits.members.used, limits.members.limit, 'team members')}
          {renderProgressBar(
            limits.templates.used,
            limits.templates.limit,
            'templates'
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleOpenPortal}
          disabled={isOpeningPortal || !subscription}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {isOpeningPortal ? (
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

        {currentTier !== 'ENTERPRISE' && (
          <button
            onClick={() =>
              handleUpgrade(isFree ? 'STARTER' : currentTier === 'STARTER' ? 'PRO' : 'ENTERPRISE')
            }
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <TrendingUp className="h-4 w-4" />
            Upgrade to {isFree ? 'Growth' : currentTier === 'STARTER' ? 'Pro' : 'Enterprise'}
          </button>
        )}
      </div>

      {/* Billing Period */}
      {subscription?.currentPeriodEnd && (
        <p className="mt-4 text-xs text-slate-500 text-center">
          Next billing date:{' '}
          {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      )}
    </section>
  );
}
