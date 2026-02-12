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
