'use client';

/**
 * OAuth Callback Page
 *
 * Handles OAuth callback success/error states.
 * Shows user-friendly messages and redirects appropriately.
 * For Meta, shows Business Portfolio selector instead of auto-redirect.
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { MetaBusinessPortfolioSelector } from '@/components/meta-business-portfolio-selector';

// Error message mapping
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_STATE: 'Security token is invalid or expired. Please try connecting again.',
  TOKEN_EXCHANGE_FAILED: 'Unable to complete authorization with the platform. Please try again.',
  CALLBACK_FAILED: 'An unexpected error occurred during connection. Please try again.',
  CONNECTOR_NOT_IMPLEMENTED: 'This platform connection is not yet available.',
  PLATFORM_ALREADY_CONNECTED: 'This platform is already connected to your agency.',
};

// Platform display names
const PLATFORM_NAMES: Record<string, string> = {
  meta: 'Meta',
  google: 'Google',
  linkedin: 'LinkedIn',
};

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { orgId } = useAuth();
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState(5);
  const [showPortfolioSelector, setShowPortfolioSelector] = useState(false);

  const success = searchParams.get('success') === 'true';
  const platform = searchParams.get('platform');
  const errorCode = searchParams.get('error');

  const platformName = platform ? PLATFORM_NAMES[platform] || platform : 'Platform';
  const errorMessage = errorCode
    ? ERROR_MESSAGES[errorCode] || 'Something went wrong. Please try again.'
    : null;

  const isLoading = !success && !errorCode;

  // Save Business Portfolio Mutation
  const { mutate: savePortfolio, isPending: isSaving } = useMutation({
    mutationFn: async ({ businessId, businessName }: { businessId: string; businessName: string }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/meta/business`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId: orgId,
          businessId,
          businessName,
        }),
      });
      if (!response.ok) throw new Error('Failed to save portfolio');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-connections', orgId] });
      queryClient.invalidateQueries({ queryKey: ['available-platforms', orgId] });
      router.push('/connections?success=true&platform=meta');
    },
  });

  const handlePortfolioSelect = (businessId: string, businessName: string) => {
    savePortfolio({ businessId, businessName });
  };

  // Auto-redirect on success (except for Meta which needs portfolio selection)
  useEffect(() => {
    if (!success) return;
    
    if (platform === 'meta' && orgId) {
      setShowPortfolioSelector(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/connections');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [success, platform, router, orgId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your connection...</p>
        </div>
      </div>
    );
  }

  if (success) {
    // Show Business Portfolio selector for Meta
    if (showPortfolioSelector && orgId) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
          <div className="max-w-lg w-full">
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Successfully Connected!</h1>
              <p className="text-slate-600">Now select your Meta Business Portfolio</p>
            </div>
            <MetaBusinessPortfolioSelector 
              agencyId={orgId} 
              onSelect={handlePortfolioSelect} 
              isSaving={isSaving}
            />
          </div>
        </div>
      );
    }

    // Standard success message for other platforms
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div
              data-testid="success-icon"
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
            >
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-center mb-2">Successfully Connected!</h1>
          <p className="text-center text-gray-600 mb-8">
            You've successfully connected {platformName} to your agency account.
          </p>

          {/* Auto-redirect notice */}
          <p className="text-sm text-center text-gray-500 mb-6">
            Redirecting to connections in {countdown} seconds...
          </p>

          {/* Action buttons */}
          <div className="space-y-3">
            <Link
              href="/connections"
              className="block w-full bg-blue-600 text-white text-center px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              View Connections
            </Link>
            <Link
              href="/dashboard"
              className="block w-full border border-gray-300 text-center px-6 py-3 rounded-lg hover:bg-gray-50 transition"
            >
              Continue to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div
            data-testid="error-icon"
            className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center"
          >
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-center mb-2 text-red-900">Connection Failed</h1>
        <p className="text-center text-gray-600 mb-2">{errorMessage}</p>

        {/* Error code */}
        {errorCode && (
          <p className="text-center text-sm text-gray-500 mb-8">Error code: {errorCode}</p>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <Link
            href="/onboarding/platforms"
            className="block w-full bg-blue-600 text-white text-center px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </Link>
          <Link
            href="/dashboard"
            className="block w-full border border-gray-300 text-center px-6 py-3 rounded-lg hover:bg-gray-50 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
