'use client';

/**
 * Plan Comparison Card
 * 
 * Tier comparison grid with upgrade CTAs.
 * Shows "Recommended" badge on Pro tier.
 */

import { Check, Sparkles, TrendingUp, Shield, Lock } from 'lucide-react';
import { useSubscription, useCreateCheckout } from '@/lib/query/billing';
import {
  SUBSCRIPTION_TIER_NAMES,
  SUBSCRIPTION_TIER_DESCRIPTIONS,
  type SubscriptionTier,
} from '@agency-platform/shared';

const TIERS: SubscriptionTier[] = ['STARTER', 'AGENCY', 'PRO', 'ENTERPRISE'];

export function PlanComparison() {
  const { data: subscription } = useSubscription();
  const createCheckout = useCreateCheckout();
  const currentTier = subscription?.tier || 'STARTER';

  const handleUpgrade = async (tier: SubscriptionTier) => {
    const result = await createCheckout.mutateAsync({
      tier,
      successUrl: `${window.location.origin}/settings?tab=billing&checkout=success`,
      cancelUrl: `${window.location.origin}/settings?tab=billing&checkout=cancel`,
    });
    window.location.href = result.checkoutUrl;
  };

  const tierIndex = TIERS.indexOf(currentTier);

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Sparkles className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Compare Plans</h2>
          <p className="text-sm text-slate-600">Find the right plan for your agency</p>
        </div>
      </div>

      {/* Trust signals */}
      <div className="flex items-center gap-4 mb-6 text-xs text-slate-600">
        <span className="flex items-center gap-1">
          <Shield className="h-3.5 w-3.5 text-green-600" />
          Cancel anytime
        </span>
        <span className="flex items-center gap-1">
          <Lock className="h-3.5 w-3.5 text-green-600" />
          Secure payments
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIERS.map((tier, index) => {
          const tierInfo = SUBSCRIPTION_TIER_DESCRIPTIONS[tier];
          const tierName = SUBSCRIPTION_TIER_NAMES[tier];
          const isCurrentTier = tier === currentTier;
          const isRecommended = tier === 'PRO';
          const canUpgrade = index > tierIndex;

          return (
            <div
              key={tier}
              className={`relative rounded-lg border-2 p-4 transition-all ${
                isCurrentTier
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : isRecommended
                  ? 'border-purple-300 bg-purple-50/30'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {isRecommended && !isCurrentTier && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-600 text-white rounded-full">
                    <Sparkles className="h-3 w-3" />
                    Recommended
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">{tierName}</h3>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  ${tierInfo.price.monthly}
                  <span className="text-sm font-normal text-slate-600">/mo</span>
                </p>
              </div>

              <ul className="space-y-2 mb-4">
                {tierInfo.features.slice(0, 5).map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrentTier ? (
                <div className="text-center py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-lg">
                  Current Plan
                </div>
              ) : canUpgrade ? (
                <button
                  onClick={() => handleUpgrade(tier)}
                  disabled={createCheckout.isPending}
                  className={`w-full py-2 text-sm font-medium rounded-lg transition-colors ${
                    isRecommended
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  } disabled:bg-slate-400`}
                >
                  <TrendingUp className="h-4 w-4 inline mr-1" />
                  Upgrade
                </button>
              ) : (
                <div className="text-center py-2 text-sm text-slate-400">
                  —
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
