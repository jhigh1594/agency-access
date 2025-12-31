/**
 * Access Request Success Page
 *
 * Phase 5: Celebration page shown after successful access request creation.
 * Displays authorization link with copy functionality and next actions.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, ArrowLeft, Plus, ExternalLink } from 'lucide-react';
import { getAccessRequest, getAuthorizationUrl } from '@/lib/api/access-requests';
import { getPlatformCount } from '@/lib/transform-platforms';
import type { AccessRequest } from '@/lib/api/access-requests';

interface SuccessPageProps {
  params: Promise<{ id: string }>;
}

export default function SuccessPage({ params }: SuccessPageProps) {
  const router = useRouter();
  const [accessRequest, setAccessRequest] = useState<AccessRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadAccessRequest() {
      const resolvedParams = await params;
      const result = await getAccessRequest(resolvedParams.id);

      if (result.error) {
        setError(result.error.message);
      } else if (result.data) {
        setAccessRequest(result.data);
      }

      setLoading(false);
    }

    loadAccessRequest();
  }, [params]);

  const authorizationUrl = accessRequest ? getAuthorizationUrl(accessRequest) : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(authorizationUrl);
      setCopied(true);
      setShowToast(true);

      // Reset copied state after animation
      setTimeout(() => setCopied(false), 2000);

      // Hide toast after 3 seconds
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const platformCount = accessRequest
    ? getPlatformCount(
        accessRequest.platforms.reduce(
          (acc, group) => ({
            ...acc,
            [group.platformGroup]: group.products.map((p) => p.product),
          }),
          {}
        )
      )
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !accessRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'Could not load access request'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <Check className="h-5 w-5" />
            <span className="font-medium">Link copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
            duration: 0.6,
          }}
          className="mb-8"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
            <Check className="h-14 w-14 text-white" strokeWidth={3} />
          </div>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Access Request Created!</h1>
          <p className="text-lg text-gray-600">
            Send this link to{' '}
            <span className="font-semibold text-gray-900">{accessRequest.clientName}</span> to
            authorize access to{' '}
            <span className="font-semibold text-indigo-600">
              {platformCount} {platformCount === 1 ? 'platform' : 'platforms'}
            </span>
          </p>
        </motion.div>

        {/* Authorization Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Authorization Link
          </h2>

          <div className="bg-gray-50 rounded-lg p-4 mb-4 border-2 border-gray-200 break-all">
            <code className="text-sm text-gray-800 font-mono">{authorizationUrl}</code>
          </div>

          <div className="flex gap-3">
            <motion.button
              onClick={handleCopyLink}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
            >
              {copied ? (
                <>
                  <Check className="h-5 w-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5" />
                  Copy Link
                </>
              )}
            </motion.button>

            <motion.a
              href={authorizationUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <ExternalLink className="h-5 w-5" />
              Preview
            </motion.a>
          </div>
        </motion.div>

        {/* Client Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-white rounded-xl shadow-md p-6 mb-8"
        >
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Request Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Client Name</p>
              <p className="font-medium text-gray-900">{accessRequest.clientName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Client Email</p>
              <p className="font-medium text-gray-900">{accessRequest.clientEmail}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Platforms</p>
              <p className="font-medium text-gray-900">
                {platformCount} {platformCount === 1 ? 'product' : 'products'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <div className="inline-flex items-center gap-1.5">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="font-medium text-gray-900 capitalize">
                  {accessRequest.status}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Next Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <motion.button
            onClick={() => router.push('/dashboard')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 font-medium shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </motion.button>

          <motion.button
            onClick={() => router.push('/access-requests/new')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Create Another Request
          </motion.button>
        </motion.div>

        {/* Helpful Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-500">
            💡 Tip: The link expires in 7 days. Client can authorize platforms in any order.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
