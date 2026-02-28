'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useCreateCheckout, useOpenPortal, useSubscription } from '@/lib/query/billing';
import { Button } from '@/components/ui/button';
import { trackBillingEvent } from '@/lib/analytics/billing';
import { persistBillingIntervalPreference, readBillingIntervalPreference } from './billing-interval';
import { resolveBillingLifecycle } from './billing-lifecycle';

export function BillingHero() {
  const { data: subscription, isLoading } = useSubscription();
  const createCheckout = useCreateCheckout();
  const openPortal = useOpenPortal();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const lifecycle = resolveBillingLifecycle(subscription);
  const defaultInterval = lifecycle === 'PAID' ? 'monthly' : 'yearly';
  const billingInterval = useMemo(() => readBillingIntervalPreference(defaultInterval), [defaultInterval]);

  const startCheckout = async (tier: 'STARTER' | 'AGENCY', surface: string) => {
    setErrorMessage(null);

    persistBillingIntervalPreference(billingInterval);

    trackBillingEvent('billing_primary_cta_clicked', {
      lifecycle,
      currentTier: subscription?.tier ?? null,
      targetTier: tier,
      interval: billingInterval,
      surface,
    });

    trackBillingEvent('billing_checkout_started', {
      lifecycle,
      currentTier: subscription?.tier ?? null,
      targetTier: tier,
      interval: billingInterval,
      surface,
    });

    try {
      const result = await createCheckout.mutateAsync({
        tier,
        billingInterval,
        successUrl: `${window.location.origin}/settings?tab=billing&checkout=success`,
        cancelUrl: `${window.location.origin}/settings?tab=billing&checkout=cancel`,
      });

      window.location.href = result.checkoutUrl;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create checkout session');
    }
  };

  const openBillingPortal = async () => {
    setErrorMessage(null);

    trackBillingEvent('billing_primary_cta_clicked', {
      lifecycle,
      currentTier: subscription?.tier ?? null,
      targetTier: null,
      interval: billingInterval,
      surface: 'billing_hero',
    });

    try {
      const result = await openPortal.mutateAsync(window.location.href);
      window.location.href = result.portalUrl;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to open billing portal');
    }
  };

  const focusManageSubscription = () => {
    trackBillingEvent('billing_primary_cta_clicked', {
      lifecycle,
      currentTier: subscription?.tier ?? null,
      targetTier: null,
      interval: billingInterval,
      surface: 'billing_hero',
    });

    document.getElementById('manage-subscription-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading) {
    return (
      <section className="clean-card p-6">
        <div className="py-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
        </div>
      </section>
    );
  }

  const trialEndDate = subscription?.trialEnd
    ? new Date(subscription.trialEnd).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const heroCopy =
    lifecycle === 'FREE'
      ? {
          title: 'Unlock Growth with a Free Trial',
          description: 'Start your 14-day Growth trial and convert more clients without billing friction.',
          buttonLabel: 'Start Free Trial',
          onClick: () => startCheckout('STARTER', 'billing_hero_free'),
        }
      : lifecycle === 'TRIALING'
        ? {
            title: 'Keep Your Trial Momentum',
            description: trialEndDate
              ? `Your trial ends on ${trialEndDate}. Activate your paid plan to keep all features live.`
              : 'Activate your paid plan now to keep your trial features without interruption.',
            buttonLabel: 'Activate Paid Plan',
            onClick: () => startCheckout(subscription?.tier === 'AGENCY' ? 'AGENCY' : 'STARTER', 'billing_hero_trialing'),
          }
        : subscription?.status === 'past_due'
          ? {
              title: 'Resolve Billing to Avoid Access Issues',
              description: 'Update your payment details in the billing portal to keep your plan active.',
              buttonLabel: 'Manage in Billing Portal',
              onClick: openBillingPortal,
            }
          : {
              title: 'Scale When You’re Ready',
              description: 'Review upgrade options and increase limits as your agency grows.',
              buttonLabel: 'Review Upgrade Options',
              onClick: focusManageSubscription,
            };

  return (
    <section className="clean-card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">{heroCopy.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{heroCopy.description}</p>
        </div>

        <Button
          variant="primary"
          onClick={heroCopy.onClick}
          disabled={createCheckout.isPending || openPortal.isPending}
        >
          {createCheckout.isPending || openPortal.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {heroCopy.buttonLabel}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-lg border border-coral/20 bg-coral/10 p-3 text-sm text-coral">
          <AlertCircle className="mr-1 inline h-4 w-4" />
          {errorMessage}
        </div>
      )}
    </section>
  );
}
