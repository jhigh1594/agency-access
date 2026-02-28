'use client';

/**
 * Billing Tab
 *
 * Orchestrates all billing-related cards:
 * - Current plan with status
 * - Manage subscription (upgrade/downgrade/cancel)
 * - Usage limits with progress bars
 * - Plan comparison for upgrades
 * - Payment methods
 * - Invoices history
 * - Billing details form
 */

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useSubscription } from '@/lib/query/billing';
import { trackBillingEvent } from '@/lib/analytics/billing';
import { BillingHero } from './billing-hero';
import { resolveBillingLifecycle } from './billing-lifecycle';
import { CurrentPlanCard } from './current-plan-card';
import { ManageSubscriptionCard } from './manage-subscription-card';
import { UsageLimitsCard } from './usage-limits-card';
import { PlanComparison } from './plan-comparison';
import { PaymentMethodsCard } from './payment-methods-card';
import { InvoicesCard } from './invoices-card';
import { BillingDetailsCard } from './billing-details-card';
import { CheckoutSuccessToast } from './checkout-success-toast';

export function BillingTab() {
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get('checkout');
  const { data: subscription } = useSubscription();
  const lifecycle = resolveBillingLifecycle(subscription);
  const isBillingV2Enabled = process.env.NEXT_PUBLIC_BILLING_V2_ENABLED !== 'false';

  useEffect(() => {
    trackBillingEvent('billing_page_viewed', {
      lifecycle,
      currentTier: subscription?.tier ?? null,
      status: subscription?.status ?? 'none',
      surface: 'billing_tab',
    });
  }, [lifecycle, subscription?.tier, subscription?.status]);

  useEffect(() => {
    if (checkoutStatus === 'success') {
      trackBillingEvent('billing_checkout_success', {
        lifecycle,
        currentTier: subscription?.tier ?? null,
        status: subscription?.status ?? 'none',
        surface: 'billing_tab',
      });
    }

    if (checkoutStatus === 'cancel') {
      trackBillingEvent('billing_checkout_canceled', {
        lifecycle,
        currentTier: subscription?.tier ?? null,
        status: subscription?.status ?? 'none',
        surface: 'billing_tab',
      });
    }
  }, [checkoutStatus, lifecycle, subscription?.tier, subscription?.status]);

  if (!isBillingV2Enabled) {
    return (
      <>
        {checkoutStatus === 'success' && <CheckoutSuccessToast />}

        <div className="space-y-6">
          <CurrentPlanCard />
          <ManageSubscriptionCard />
          <UsageLimitsCard />
          <PlanComparison />
          <PaymentMethodsCard />
          <InvoicesCard />
          <BillingDetailsCard />
        </div>
      </>
    );
  }

  const showFreeOrTrialLayout = lifecycle === 'FREE' || lifecycle === 'TRIALING';

  return (
    <>
      {checkoutStatus === 'success' && <CheckoutSuccessToast />}

      <div className="space-y-6">
        <BillingHero />
        {showFreeOrTrialLayout ? (
          <>
            <PlanComparison />
            <UsageLimitsCard />
          </>
        ) : (
          <>
            <CurrentPlanCard />
            <UsageLimitsCard />
            <ManageSubscriptionCard />
            <PaymentMethodsCard />
            <InvoicesCard />
            <BillingDetailsCard />
          </>
        )}
      </div>
    </>
  );
}
