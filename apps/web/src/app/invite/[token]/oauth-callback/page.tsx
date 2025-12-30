'use client';

/**
 * OAuth Callback Handler
 *
 * Handles redirect after client authorizes on platform (Meta, Google, etc.)
 *
 * Flow:
 * 1. Extract code, state, platform from URL params
 * 2. Exchange code for sessionId (backend validates state)
 * 3. Redirect back to invite page with sessionId for asset selection
 *
 * Error Handling:
 * - Invalid state token → Show error + restart flow
 * - Exchange failure → Show error + retry option
 * - Missing params → Show error + return to invite
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  const token = params.token as string;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const platform = searchParams.get('platform');

  useEffect(() => {
    async function handleCallback() {
      // Validate required params
      if (!code || !state || !platform) {
        setError('Missing required OAuth parameters. Please restart the authorization flow.');
        setIsProcessing(false);
        return;
      }

      try {
        setIsProcessing(true);

        // Exchange code for connectionId
        const response = await fetch(`/api/client/${token}/oauth-exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state, platform }),
        });

        const json = await response.json();

        if (json.error) {
          throw new Error(json.error.message || 'Failed to complete authorization');
        }

        const { connectionId } = json.data;

        // Redirect back to invite page with connectionId and step=2 (success)
        router.push(`/invite/${token}?connectionId=${connectionId}&platform=${platform}&step=2`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authorization failed');
        setIsProcessing(false);
      }
    }

    handleCallback();
  }, [code, state, platform, token, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl border-2 border-red-200 p-8"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">
              Authorization Failed
            </h1>
            <p className="text-lg text-red-700 mb-8">
              {error}
            </p>
            <button
              onClick={() => router.push(`/invite/${token}`)}
              className="px-8 py-4 bg-indigo-600 text-white font-bold text-lg rounded-xl hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Return to Authorization
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-8"
      >
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Processing Authorization...
          </h1>
          <p className="text-lg text-slate-600">
            {isProcessing
              ? 'Securely exchanging authorization code'
              : 'Redirecting to asset selection...'}
          </p>
          <div className="mt-8 space-y-2">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
            />
            <p className="text-xs text-slate-500">
              This should only take a moment...
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
