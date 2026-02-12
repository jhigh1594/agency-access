'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { m } from 'framer-motion';

function CheckoutCancelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const agencyId = searchParams.get('agency');

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50 flex items-center justify-center px-4">
      <m.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-card rounded-2xl shadow-xl p-8 text-center"
      >
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
            <XCircle className="h-10 w-10 text-amber-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Cancelled
        </h1>
        <p className="text-gray-600 mb-6">
          Your account has been created, but the payment was cancelled. You can complete
          your subscription later from Settings.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-amber-800">
            <strong>Don't worry!</strong> Your account is ready to use. You can activate your
            subscription anytime from the Settings page.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push('/settings?tab=billing')}
          >
            Complete Subscription
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="w-full"
            onClick={() => router.push('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </div>
      </m.div>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CheckoutCancelContent />
    </Suspense>
  );
}
