'use client';

/**
 * Plan Comparison Card
 *
 * Tier comparison grid with upgrade CTAs.
 * Matches the marketing site pricing tiers at https://www.authhub.co/pricing
 */

import { useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { useSubscription, useCreateCheckout } from '@/lib/query/billing';
import { type SubscriptionTier } from '@agency-platform/shared';
import { Button } from '@/components/ui/button';

// Display tiers (excludes PRO which is temporarily commented out)
const DISPLAY_TIERS = ['FREE', 'STARTER', 'AGENCY'] as const;

// Tier display names
const TIER_NAMES: Record<string, string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  AGENCY: 'Agency',
};

// Tier pricing configuration (yearly price, monthly price)
const tierPricing: Record<string, { yearly: number; monthly: number }> = {
  FREE: { yearly: 0, monthly: 0 },
  STARTER: { yearly: 480, monthly: 40 },
  AGENCY: { yearly: 1120, monthly: 93.33 },
  // PRO: { yearly: 2240, monthly: 186.67 }, // Temporarily commented out
};

// Feature inclusion matrix for each tier
const tierFeatures: Record<string, { name: string; included: boolean }[]> = {
  FREE: [
    { name: '1 active client', included: true },
    { name: 'Core platforms (Meta, Google, LinkedIn)', included: true },
    { name: 'Basic branding (logo upload)', included: true },
    { name: 'Email support', included: true },
    { name: 'Team access', included: false },
    { name: 'White-label branding', included: false },
    { name: 'Custom domain/subdomain', included: false },
    { name: 'Webhooks & API', included: false },
    { name: 'Priority support', included: false },
  ],
  STARTER: [
    { name: '36 client onboards/year', included: true },
    { name: '120 platform audits', included: true },
    { name: 'All platform integrations', included: true },
    { name: 'Email support', included: true },
    { name: 'White-label branding', included: false },
    { name: 'Custom domain/subdomain', included: false },
    { name: 'Team access', included: false },
    { name: 'Webhooks & API', included: false },
    { name: 'Priority support', included: false },
  ],
  AGENCY: [
    { name: '120 client onboards/year', included: true },
    { name: '600 platform audits', included: true },
    { name: 'White-label branding', included: true },
    { name: 'Custom domain/subdomain', included: true },
    { name: 'Team access (5 seats)', included: true },
    { name: 'Webhooks & API', included: true },
    { name: 'Priority support', included: true },
    { name: 'Multi-brand accounts', included: false },
    { name: 'Custom integrations', included: false },
    { name: 'SLA guarantee', included: false },
  ],
  // PRO: [
  //   { name: '600 client onboards/year', included: true },
  //   { name: '3,000 platform audits', included: true },
  //   { name: 'White-label branding', included: true },
  //   { name: 'Custom domain/subdomain', included: true },
  //   { name: 'Unlimited team seats', included: true },
  //   { name: 'Webhooks & API', included: true },
  //   { name: 'Multi-brand accounts (3)', included: true },
  //   { name: 'API access', included: true },
  //   { name: 'Custom integrations', included: true },
  //   { name: 'Priority support (dedicated)', included: true },
  //   { name: 'SLA guarantee', included: true },
  // ],
};

export function PlanComparison() {
  const { data: subscription } = useSubscription();
  const createCheckout = useCreateCheckout();
  // Map subscription tier to display tier (backend uses STARTER, we show it as paid)
  const currentTier = subscription?.tier || 'FREE';
  const [isYearly, setIsYearly] = useState(true);

  const handleUpgrade = async (tier: string) => {
    // Map display tier back to subscription tier
    const tierMap: Record<string, SubscriptionTier> = {
      STARTER: 'STARTER',
      AGENCY: 'AGENCY',
    };
    const subscriptionTier = tierMap[tier];
    if (!subscriptionTier) return;

    const result = await createCheckout.mutateAsync({
      tier: subscriptionTier,
      successUrl: `${window.location.origin}/settings?tab=billing&checkout=success`,
      cancelUrl: `${window.location.origin}/settings?tab=billing&checkout=cancel`,
    });
    window.location.href = result.checkoutUrl;
  };

  const tierIndex = DISPLAY_TIERS.indexOf(currentTier as typeof DISPLAY_TIERS[number]);

  return (
    <section className="border-2 border-border rounded-lg shadow-brutalist p-6 bg-white">
      {/* Section Header */}
      <div className="mb-6">
        <div className="inline-block mb-3">
          <div className="bg-coral/10 text-coral border-2 border-coral/30 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider inline-block">
            Compare Plans
          </div>
        </div>
        <h2 className="font-display text-xl font-semibold text-ink mb-1">
          Find the right plan for your agency
        </h2>
        <p className="text-sm text-muted-foreground font-mono">
          Scale your client onboarding without the complexity
        </p>
      </div>

      {/* Monthly/Yearly Toggle */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="relative inline-flex items-center gap-2 bg-white border-2 border-black p-1 shadow-brutalist-sm">
          <button
            onClick={() => setIsYearly(false)}
            className={`relative px-6 py-3 min-h-[44px] font-bold uppercase tracking-wider text-xs transition-all ${
              !isYearly
                ? 'bg-ink text-white shadow-[2px_2px_0px_#000]'
                : 'text-gray-600 hover:text-ink'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`relative px-6 py-3 min-h-[44px] font-bold uppercase tracking-wider text-xs transition-all ${
              isYearly
                ? 'bg-ink text-white shadow-[2px_2px_0px_#000]'
                : 'text-gray-600 hover:text-ink'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              Yearly
              <span className="rounded-full border border-coral/40 bg-coral/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-coral">
                Save 25%
              </span>
            </span>
          </button>
        </div>
        <p className="text-sm text-gray-500 font-mono">
          {isYearly
            ? 'Save 25% with annual billing. Cancel anytime.'
            : 'Billed monthly. Switch to yearly for 25% off.'}
        </p>
      </div>

      {/* Trust signals */}
      <div className="flex items-center gap-4 mb-8 text-xs font-mono text-muted-foreground pb-6 border-b-2 border-border">
        <span className="flex items-center gap-1.5">
          <Check size={14} color="rgb(var(--teal))" />
          Cancel anytime
        </span>
        <span className="flex items-center gap-1.5">
          <Check size={14} color="rgb(var(--teal))" />
          14-day free trial
        </span>
        <span className="flex items-center gap-1.5">
          <Check size={14} color="rgb(var(--teal))" />
          No credit card required
        </span>
      </div>

      {/* Pricing Grid - Hidden on mobile, shown on md+ */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-4">
        {DISPLAY_TIERS.map((tier, index) => {
          const pricing = tierPricing[tier];
          const tierName = TIER_NAMES[tier];
          const features = tierFeatures[tier];
          const isCurrentTier = tier === currentTier;
          const isFree = tier === 'FREE';
          const isRecommended = tier === 'STARTER';
          const canUpgrade = index > tierIndex;

          // Calculate display price based on billing period
          const yearlyDiscountedPrice = Math.round(pricing.yearly * 0.75);
          const monthlyDisplayPrice = Math.round(pricing.monthly);
          const yearlyMonthlyEquivalent = Math.round(yearlyDiscountedPrice / 12);
          const displayPrice = isYearly ? yearlyMonthlyEquivalent : monthlyDisplayPrice;
          const alternatePrice = isFree
            ? 'Free forever'
            : (isYearly ? `$${yearlyDiscountedPrice} billed yearly` : 'billed monthly');

          return (
            <div
              key={tier}
              className={`relative border-2 rounded-lg transition-all ${
                isCurrentTier
                  ? 'border-indigo-500 bg-indigo-50/50 shadow-brutalist-sm'
                  : isRecommended
                  ? 'border-coral bg-white shadow-brutalist hover:shadow-brutalist-lg hover:-translate-x-0.5 hover:-translate-y-0.5'
                  : isFree
                  ? 'border-coral/30 bg-gradient-to-br from-coral/5 to-coral/10'
                  : 'border-slate-300 bg-white hover:shadow-brutalist-sm'
              }`}
            >
              {/* Recommended Badge */}
              {isRecommended && !isCurrentTier && (
                <div className="absolute -top-3 -right-3 bg-coral text-white border-2 border-black px-2 py-1 font-mono text-xs font-bold uppercase tracking-wider shadow-brutalist-sm rotate-3 z-10">
                  Most Popular
                </div>
              )}

              {/* Tier Header */}
              <div className="p-4 border-b-2 border-border">
                <h3 className="font-dela text-lg text-ink mb-1">{tierName}</h3>
                {isFree ? (
                  <div className="flex items-baseline gap-1">
                    <span className="font-dela text-3xl text-ink">Free</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="font-dela text-3xl text-ink">
                        ${displayPrice}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">/mo</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {alternatePrice}
                    </p>
                  </>
                )}
              </div>

              {/* Features List */}
              <div className="p-4">
                <ul className="space-y-2 mb-4">
                  {features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start gap-2 py-1 text-sm"
                    >
                      {feature.included ? (
                        <Check
                          size={14}
                          className="mt-0.5 flex-shrink-0"
                          color="rgb(var(--coral))"
                        />
                      ) : (
                        <X size={14} className="mt-0.5 flex-shrink-0 text-muted-foreground" />
                      )}
                      <span
                        className={
                          feature.included
                            ? 'text-foreground'
                            : 'line-through text-muted-foreground'
                        }
                      >
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {isCurrentTier ? (
                  <div className="text-center py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-lg border border-indigo-300">
                    Current Plan
                  </div>
                ) : isFree ? (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    —
                  </div>
                ) : canUpgrade ? (
                  <Button
                    onClick={() => handleUpgrade(tier)}
                    disabled={createCheckout.isPending}
                    variant={isRecommended ? 'brutalist' : 'secondary'}
                    size="sm"
                    className="w-full"
                    rightIcon={<ArrowRight size={16} />}
                  >
                    Upgrade
                  </Button>
                ) : (
                  <div className="text-center py-2 text-sm text-muted-foreground border border-border rounded-lg">
                    —
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Message */}
      <div className="md:hidden text-center py-8">
        <div className="border-2 border-slate-300 bg-white p-6 shadow-brutalist-sm max-w-md mx-auto">
          <h3 className="font-display text-lg text-ink mb-2">
            View pricing on desktop
          </h3>
          <p className="text-sm text-muted-foreground font-mono mb-4">
            Our pricing tiers are best viewed on a larger screen.
          </p>
          <a
            href="https://cal.com/agency-access-platform/demo"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="brutalist-ghost" size="sm" className="w-full">
              Talk to Sales
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
