'use client';

/**
 * Checkout Success Toast
 *
 * Shows a success message when returning from checkout.
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, X } from 'lucide-react';

export function CheckoutSuccessToast() {
  const [visible, setVisible] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      // Clean up URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete('checkout');
      router.replace(`?${params.toString()}`, { scroll: false });
    }, 5000);

    return () => clearTimeout(timer);
  }, [router, searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="flex items-center gap-3 bg-teal/10 border border-teal/20 rounded-lg px-4 py-3 shadow-lg">
        <div className="flex-shrink-0 w-8 h-8 bg-teal/20 rounded-full flex items-center justify-center">
          <Check className="h-5 w-5 text-teal" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Subscription updated</p>
          <p className="text-xs text-muted-foreground">
            Your plan has been successfully upgraded.
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-teal hover:text-teal/80"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
