'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';

function ClientOAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  const code = searchParams.get('code');
  const state = searchParams.get('state');

  useEffect(() => {
    async function handleCallback() {
      if (!code || !state) {
        setError('Missing OAuth parameters. Restart authorization from the invite link.');
        setIsProcessing(false);
        return;
      }

      try {
        const response = await fetch(`/api/client/oauth-exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        });

        const json = await response.json();
        if (!response.ok || json.error) {
          throw new Error(json.error?.message || 'Failed to complete authorization');
        }

        const { connectionId, token, platform: platformFromState } = json.data;
        if (!token) {
          throw new Error('Access request token missing from OAuth state');
        }

        router.push(`/invite/${token}?connectionId=${connectionId}&platform=${platformFromState}&step=2`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authorization failed');
        setIsProcessing(false);
      }
    }

    handleCallback();
  }, [code, state, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg border-2 border-black bg-card p-8 shadow-brutalist text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-coral bg-coral/10">
            <AlertCircle className="h-7 w-7 text-coral" />
          </div>
          <h1 className="text-2xl font-semibold text-ink font-display">Authorization Failed</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button className="mt-6" onClick={() => router.push('/')}>
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border-2 border-black bg-card p-8 shadow-brutalist text-center">
        <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-coral" />
        <h1 className="text-2xl font-semibold text-ink font-display">Processing Authorization</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isProcessing ? 'Exchanging OAuth code securely...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  );
}

export default function ClientOAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-coral" />
        </div>
      }
    >
      <ClientOAuthCallbackContent />
    </Suspense>
  );
}
