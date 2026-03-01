'use client';

/**
 * Plan Comparison Card
 *
 * Tier comparison grid with upgrade CTAs.
 * Matches the marketing site pricing tiers at https://www.authhub.co/pricing
 */

import { useEffect, useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { useSubscription, useCreateCheckout } from '@/lib/query/billing';
import { trackBillingEvent } from '@/lib/analytics/billing';
import {
  type BillingInterval,
  type PricingDisplayTier,
  PRICING_DISPLAY_TIER_ORDER,
  PRICING_DISPLAY_TIER_DETAILS,
  PRICING_DISPLAY_TIER_TO_SUBSCRIPTION_TIER,
  getPricingDisplayTierFromSubscriptionTier,
} from '@agency-platform/shared';
import { Button } from '@/components/ui/button';
import { persistBillingIntervalPreference, readBillingIntervalPreference } from './billing-interval';
import { resolveBillingLifecycle } from './billing-lifecycle';

// Tier pricing configuration (yearly price, monthly price)
const tierPricing: Record<PricingDisplayTier, { yearly: number; monthly: number }> = {
  FREE: {
    yearly: PRICING_DISPLAY_TIER_DETAILS.FREE.yearlyPrice,
    monthly: PRICING_DISPLAY_TIER_DETAILS.FREE.monthlyPrice,
  },
  GROWTH: {
    yearly: PRICING_DISPLAY_TIER_DETAILS.GROWTH.yearlyPrice,
    monthly: PRICING_DISPLAY_TIER_DETAILS.GROWTH.monthlyPrice,
  },
  SCALE: {
    yearly: PRICING_DISPLAY_TIER_DETAILS.SCALE.yearlyPrice,
    monthly: PRICING_DISPLAY_TIER_DETAILS.SCALE.monthlyPrice,
  },
};

// Feature inclusion matrix for each tier - ONE value metric (clients/month)
const tierFeatures: Record<PricingDisplayTier, { name: string; included: boolean; value?: string }[]> = {
  FREE: [
    { name: '1 active client', included: true, value: 'Test the full flow' },
    { name: 'Core platforms (Meta, Google, LinkedIn)', included: true, value: 'The essentials' },
    { name: 'Basic branding (logo upload)', included: true },
    { name: 'Email support', included: true },
    { name: 'Team access', included: false },
    { name: 'White-label branding', included: false },
    { name: 'Custom domain', included: false },
    { name: 'Webhooks & API', included: false },
    { name: 'Priority support', included: false },
  ],
  GROWTH: [
    { name: '5 clients/month', included: true, value: '60 onboards/year' },
    { name: 'All platform integrations', included: true, value: 'Meta, Google, LinkedIn, TikTok, more' },
    { name: 'White-label branding', included: true, value: 'Your brand, not ours' },
    { name: 'Team access (3 seats)', included: true, value: 'Share the work' },
    { name: 'Email support', included: true },
    { name: 'Custom domain', included: false },
    { name: 'Webhooks & API', included: false },
    { name: 'Priority support', included: false },
  ],
  SCALE: [
    { name: '15 clients/month', included: true, value: '180 onboards/year' },
    { name: 'All platform integrations', included: true },
    { name: 'White-label branding', included: true },
    { name: 'Custom domain', included: true, value: 'Your URL, your brand' },
    { name: 'Team access (10 seats)', included: true, value: 'Full team collaboration' },
    { name: 'Webhooks & API', included: true, value: 'Connect your stack' },
    { name: 'Priority support', included: true, value: 'Faster response time' },
    { name: 'Multi-brand accounts', included: true, value: 'Manage multiple brands' },
    { name: 'Custom integrations', included: true, value: 'We build what you need' },
  ],
};

export function PlanComparison() {
  const { data: subscription } = useSubscription();
  const createCheckout = useCreateCheckout();

  const currentTier = getPricingDisplayTierFromSubscriptionTier(subscription?.tier);
  const lifecycle = resolveBillingLifecycle(subscription);
  const [isYearly, setIsYearly] = useState(() => {
    const fallback: BillingInterval = lifecycle === 'PAID' ? 'monthly' : 'yearly';
    return readBillingIntervalPreference(fallback) === 'yearly';
  });

  useEffect(() => {
    const fallback: BillingInterval = lifecycle === 'PAID' ? 'monthly' : 'yearly';
    setIsYearly(readBillingIntervalPreference(fallback) === 'yearly');
  }, [lifecycle]);

  const setBillingInterval = (interval: BillingInterval) => {
    setIsYearly(interval === 'yearly');
    persistBillingIntervalPreference(interval);
    trackBillingEvent('billing_interval_toggled', {
      lifecycle,
      currentTier: subscription?.tier ?? null,
      targetTier: null,
      interval,
      surface: 'plan_comparison',
    });
  };

  const handleUpgrade = async (displayTier: PricingDisplayTier) => {
    const subscriptionTier = PRICING_DISPLAY_TIER_TO_SUBSCRIPTION_TIER[displayTier];
    if (!subscriptionTier) return; // FREE tier has no checkout
    const billingInterval: BillingInterval = isYearly ? 'yearly' : 'monthly';

    trackBillingEvent('billing_primary_cta_clicked', {
      lifecycle,
      currentTier: subscription?.tier ?? null,
      targetTier: subscriptionTier,
      interval: billingInterval,
      surface: 'plan_comparison',
    });
    trackBillingEvent('billing_checkout_started', {
      lifecycle,
      currentTier: subscription?.tier ?? null,
      targetTier: subscriptionTier,
      interval: billingInterval,
      surface: 'plan_comparison',
    });

    const result = await createCheckout.mutateAsync({
      tier: subscriptionTier,
      billingInterval,
      successUrl: `${window.location.origin}/settings?tab=billing&checkout=success`,
      cancelUrl: `${window.location.origin}/settings?tab=billing&checkout=cancel`,
    });
    window.location.href = result.checkoutUrl;
  };

  const tierIndex = PRICING_DISPLAY_TIER_ORDER.indexOf(currentTier);

  return (
    <section className="border-2 border-border rounded-lg shadow-brutalist p-6 bg-card">
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
        <div className="relative inline-flex items-center gap-2 bg-card border-2 border-border-hard dark:border-white p-1 shadow-brutalist-sm">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`relative px-6 py-3 min-h-[44px] font-bold uppercase tracking-wider text-xs transition-all ${
              !isYearly
                ? 'bg-coral text-black shadow-[2px_2px_0px_var(--shadow-hard)]'
                : 'text-gray-600 dark:text-gray-400 hover:text-ink dark:hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('yearly')}
            className={`relative px-6 py-3 min-h-[44px] font-bold uppercase tracking-wider text-xs transition-all ${
              isYearly
                ? 'bg-coral text-black shadow-[2px_2px_0px_var(--shadow-hard)]'
                : 'text-gray-600 dark:text-gray-400 hover:text-ink dark:hover:text-white'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              Yearly
              <span className="rounded-full border border-black/20 bg-white px-2 py-0.5 text-[10px] font-bold tracking-wider text-coral">
                Save 25%
              </span>
            </span>
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
          {isYearly
            ? 'Save 25% with annual billing. Cancel anytime.'
            : 'Billed monthly. Switch to yearly for 25% off.'}
        </p>
      </div>

      {/* Trust signals */}
      <div className="flex flex-wrap items-center gap-4 mb-8 text-xs font-mono text-muted-foreground pb-6 border-b-2 border-border">
        <span className="flex items-center gap-1.5">
          <Check size={14} color="rgb(var(--teal))" />
          Cancel anytime
        </span>
        <span className="flex items-center gap-1.5">
          <Check size={14} color="rgb(var(--teal))" />
          Growth plan has 14-day trial
        </span>
        <span className="flex items-center gap-1.5">
          <Check size={14} color="rgb(var(--teal))" />
          No credit card for trial
        </span>
        <span className="flex items-center gap-1.5 ml-auto text-teal">
          <Check size={14} color="rgb(var(--teal))" />
          Pays for itself in 1 onboard
        </span>
      </div>

      {/* Mobile-Friendly Tier Summary */}
      <div className="md:hidden mb-8">
        <div className="border-2 border-black bg-card p-4 shadow-brutalist-sm">
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <div>
                <span className="font-bold text-ink">Free</span>
                <span className="block text-xs text-gray-500">
                  {PRICING_DISPLAY_TIER_DETAILS.FREE.persona}
                </span>
              </div>
              <span className="text-gray-600">1 client</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200 bg-coral/5 -mx-2 px-2 rounded">
              <div>
                <span className="font-bold text-coral">Growth</span>
                <span className="text-xs text-coral/70 block">Most Popular</span>
              </div>
              <span className="text-gray-600">{isYearly ? '$30/mo' : '$40/mo'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <span className="font-bold text-ink">Scale</span>
                <span className="block text-xs text-gray-500">
                  {PRICING_DISPLAY_TIER_DETAILS.SCALE.persona}
                </span>
              </div>
              <span className="text-gray-600">{isYearly ? '$70/mo' : '$93/mo'}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center font-mono">
            Full plan details available on larger screens
          </p>
        </div>
      </div>

      {/* Pricing Grid - Hidden on mobile, shown on md+ */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 pt-2">
        {PRICING_DISPLAY_TIER_ORDER.map((tier, index) => {
          const pricing = tierPricing[tier];
          const tierName = PRICING_DISPLAY_TIER_DETAILS[tier].name;
          const persona = PRICING_DISPLAY_TIER_DETAILS[tier].persona;
          const description = PRICING_DISPLAY_TIER_DETAILS[tier].description;
          const features = tierFeatures[tier];
          const isCurrentTier = tier === currentTier;
          const isFree = tier === 'FREE';
          const isRecommended = tier === 'GROWTH';
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
                  ? 'border-coral bg-card shadow-brutalist'
                  : isFree
                  ? '!bg-white !border-black dark:!bg-card'
                  : 'border-slate-300 bg-card hover:shadow-brutalist-sm'
              }`}
            >
              {/* Recommended Badge */}
              {isRecommended && !isCurrentTier && (
                <div className="absolute top-3 right-3 bg-coral text-white border-2 border-black px-2 py-1 font-mono text-xs font-bold uppercase tracking-wider shadow-brutalist-sm z-10">
                  Most Popular
                </div>
              )}

              {/* Tier Header */}
              <div className="p-4 border-b-2 border-border">
                {/* Persona Label */}
                <span className={`font-mono text-[10px] font-bold uppercase tracking-widest ${
                  isRecommended ? 'text-coral' : 'text-gray-500'
                }`}>
                  {persona}
                </span>
                <h3 className="font-dela text-lg text-ink mt-1 mb-0.5">{tierName}</h3>
                <p className="text-xs text-muted-foreground font-mono mb-3">
                  {description}
                </p>
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
                <ul className="space-y-1 mb-4">
                  {features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex flex-col gap-0.5 py-0.5"
                    >
                      <div className="flex items-start gap-2 text-sm">
                        {feature.included ? (
                          <Check
                            size={14}
                            className="mt-0.5 flex-shrink-0"
                            color="rgb(var(--coral))"
                          />
                        ) : (
                          <X size={14} className="mt-0.5 flex-shrink-0 text-muted-foreground dark:text-white/50" />
                        )}
                        <span
                          className={
                            feature.included
                              ? 'text-foreground dark:text-white'
                              : 'line-through text-muted-foreground dark:text-white/50'
                          }
                        >
                          {feature.name}
                        </span>
                      </div>
                      {/* Value context */}
                      {feature.included && feature.value && (
                        <span className="text-xs font-mono text-gray-500 ml-6">
                          {feature.value}
                        </span>
                      )}
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
                    Start Free Trial
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
    </section>
  );
}
