'use client';

/**
 * Payment Methods Card
 *
 * Shows saved payment methods or redirects to portal.
 */

import { CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { usePaymentMethods, useOpenPortal } from '@/lib/query/billing';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';

export function PaymentMethodsCard() {
  const { data: paymentMethods, isLoading } = usePaymentMethods();
  const openPortal = useOpenPortal();

  const handleManagePayments = async () => {
    const result = await openPortal.mutateAsync(window.location.href);
    window.location.href = result.portalUrl;
  };

  return (
    <section className="clean-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-coral/10 rounded-lg">
            <CreditCard className="h-5 w-5 text-coral" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Payment Methods</h2>
            <p className="text-sm text-muted-foreground">Manage your payment options</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManagePayments}
          disabled={openPortal.isPending}
        >
          {openPortal.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <ExternalLink className="h-4 w-4" />
              Manage
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
        </div>
      ) : paymentMethods && paymentMethods.length > 0 ? (
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between p-3 bg-card rounded-lg border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-muted rounded flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {method.brand.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">
                    •••• •••• •••• {method.last4}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires {method.expMonth}/{method.expYear}
                  </p>
                </div>
              </div>
              {method.isDefault && (
                <StatusBadge badgeVariant="success">Default</StatusBadge>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
          <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-foreground">No payment methods saved</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManagePayments}
            className="mt-2"
          >
            Add a payment method
          </Button>
        </div>
      )}
    </section>
  );
}
