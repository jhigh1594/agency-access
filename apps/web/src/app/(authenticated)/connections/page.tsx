'use client';

/**
 * Connections Page
 *
 * Shows all supported platforms in a card-based grid layout.
 * Platforms are categorized into "Recommended" and "Other" sections.
 * Users can connect platforms directly from this page via OAuth.
 */

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { PlatformCard } from '@/components/ui/platform-card';
import { Platform, PlatformInfo } from '@agency-platform/shared';

export default function ConnectionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);

  // Fetch user's agency by email
  const { data: agencyData } = useQuery({
    queryKey: ['user-agency', user?.primaryEmailAddress?.emailAddress],
    queryFn: async () => {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return null;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agencies?email=${encodeURIComponent(email)}`
      );
      if (!response.ok) throw new Error('Failed to fetch agency');
      const result = await response.json();
      return result.data?.[0] || null;
    },
    enabled: !!user?.primaryEmailAddress?.emailAddress,
  });

  // IMPORTANT: React Query v5 removed the `onSuccess` callback option.
  // To perform actions after data loads, use useEffect with data as dependency.
  // See: https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5#removed-onsuccess-callback
  useEffect(() => {
    if (agencyData?.id) {
      setAgencyId(agencyData.id);
    }
  }, [agencyData]);

  // Handle OAuth callback redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const platform = searchParams.get('platform');

    if (success === 'true' && platform) {
      setSuccessMessage(`Successfully connected ${platform}!`);
      if (agencyId) {
        queryClient.invalidateQueries({ queryKey: ['available-platforms', agencyId] });
      }

      // Clear URL params
      router.replace('/connections');

      setTimeout(() => setSuccessMessage(null), 5000);
    }

    if (error) {
      setErrorMessage(`Failed to connect platform: ${error}`);
      router.replace('/connections');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  }, [searchParams, queryClient, agencyId, router]);

  // Fetch all platforms with connection status
  const {
    data: platforms = [],
    isLoading,
    error,
  } = useQuery<PlatformInfo[]>({
    queryKey: ['available-platforms', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/available?agencyId=${agencyId}`
      );
      if (!response.ok) throw new Error('Failed to fetch platforms');
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!agencyId,
  });

  // Categorize platforms
  const { recommended, other } = useMemo(() => {
    const recommended = platforms.filter((p) => p.category === 'recommended');
    const other = platforms.filter((p) => p.category === 'other');
    return { recommended, other };
  }, [platforms]);

  // OAuth initiation mutation
  const { mutate: initiateOAuth } = useMutation({
    mutationFn: async (platform: Platform) => {
      if (!agencyId) {
        throw new Error('Agency not found. Please complete onboarding first.');
      }

      setConnectingPlatform(platform);

      const userEmail = user?.primaryEmailAddress?.emailAddress || 'user@agency.com';

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/${platform}/initiate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agencyId,
            userEmail,
            redirectUrl: `${window.location.origin}/connections`,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to initiate OAuth');
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to OAuth provider
      window.location.href = data.data.authUrl;
    },
    onError: () => {
      setErrorMessage('Failed to connect platform. Please try again.');
      setConnectingPlatform(null);
    },
  });

  const handleConnect = (platform: Platform) => {
    setErrorMessage(null);
    initiateOAuth(platform);
  };

  return (
    <div className="flex-1 bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            Connect your accounts
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            To create a link, you'll need to connect your accounts
          </p>
        </div>

        {/* Loading Agency */}
        {!agencyId && !agencyData && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-600">Loading agency...</span>
          </div>
        )}

        {/* Agency Not Found - Redirect to Onboarding */}
        {!agencyId && agencyData === null && user?.primaryEmailAddress?.emailAddress && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">Agency not found</h2>
            <p className="text-yellow-800 mb-4">
              We couldn't find an agency associated with your account. Let's set one up.
            </p>
            <button
              onClick={() => router.push('/onboarding/agency')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Complete Onboarding
            </button>
          </div>
        )}

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Query Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Failed to load platforms</p>
              <p className="text-red-700 text-sm mt-1">{(error as Error).message}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && agencyId && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-600">Loading platforms...</span>
          </div>
        )}

        {/* Empty State - No Platforms */}
        {!isLoading && agencyId && platforms.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No platforms available</h3>
            <p className="text-slate-600">
              No platforms are currently configured. Please contact support.
            </p>
          </div>
        )}

        {/* Recommended Platforms */}
        {!isLoading && recommended.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Recommended</h2>
            <p className="text-sm text-slate-600 mb-4">
              Based on your agency's requirements
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommended.map((platformInfo) => (
                <div key={platformInfo.platform} className="lg:col-span-1">
                  <PlatformCard
                    platform={platformInfo.platform as Platform}
                    connected={platformInfo.connected}
                    connectedEmail={platformInfo.connectedEmail}
                    status={platformInfo.status}
                    isConnecting={connectingPlatform === platformInfo.platform}
                    onConnect={handleConnect}
                    variant="featured"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Platforms */}
        {!isLoading && other.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Other</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {other.map((platformInfo) => (
                <PlatformCard
                  key={platformInfo.platform}
                  platform={platformInfo.platform as Platform}
                  connected={platformInfo.connected}
                  connectedEmail={platformInfo.connectedEmail}
                  status={platformInfo.status}
                  isConnecting={connectingPlatform === platformInfo.platform}
                  onConnect={handleConnect}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
