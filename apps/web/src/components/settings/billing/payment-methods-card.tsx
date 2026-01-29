'use client';

/**
 * Payment Methods Card
 * 
 * Shows saved payment methods or redirects to portal.
 */

import { CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { usePaymentMethods, useOpenPortal } from '@/lib/query/billing';

export function PaymentMethodsCard() {
  const { data: paymentMethods, isLoading } = usePaymentMethods();
  const openPortal = useOpenPortal();

  const handleManagePayments = async () => {
    const result = await openPortal.mutateAsync(window.location.href);
    window.location.href = result.portalUrl;
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <CreditCard className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Payment Methods</h2>
            <p className="text-sm text-slate-600">Manage your payment options</p>
          </div>
        </div>
        <button
          onClick={handleManagePayments}
          disabled={openPortal.isPending}
          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          {openPortal.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <ExternalLink className="h-4 w-4" />
              Manage
            </>
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
        </div>
      ) : paymentMethods && paymentMethods.length > 0 ? (
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-slate-200 rounded flex items-center justify-center text-xs font-medium text-slate-600">
                  {method.brand.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    •••• •••• •••• {method.last4}
                  </p>
                  <p className="text-xs text-slate-500">
                    Expires {method.expMonth}/{method.expYear}
                  </p>
                </div>
              </div>
              {method.isDefault && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                  Default
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
          <CreditCard className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600">No payment methods saved</p>
          <button
            onClick={handleManagePayments}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Add a payment method
          </button>
        </div>
      )}
    </section>
  );
}
