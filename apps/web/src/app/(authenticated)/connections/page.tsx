'use client';

/**
 * Connections Page
 *
 * Shows all supported platforms in a card-based grid layout.
 * Platforms are categorized into "Recommended" and "Other" sections.
 * Users can connect platforms directly from this page via OAuth.
 */

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, Loader2, Unlink, X } from 'lucide-react';
import posthog from 'posthog-js';
import { PlatformCard } from '@/components/ui/platform-card';
import { Platform, PlatformInfo } from '@agency-platform/shared';
import { MetaUnifiedSettings } from '@/components/meta-unified-settings';
import { GoogleUnifiedSettings } from '@/components/google-unified-settings';
import { ManualInvitationModal } from '@/components/manual-invitation-modal';
import { motion, AnimatePresence } from 'framer-motion';

function ConnectionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null);
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<Platform | null>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [managingMetaAssets, setManagingMetaAssets] = useState(false);
  const [managingGoogleAssets, setManagingGoogleAssets] = useState(false);

  // Manual invitation modal state
  const [manualInvitationPlatform, setManualInvitationPlatform] = useState<string | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string>('');

  // Fetch user's agency by email (lightweight endpoint, cached)
  // Get the token function from Clerk for authenticated requests
  const { getToken } = useAuth();

  const { data: agencyData } = useQuery({
    queryKey: ['user-agency', user?.primaryEmailAddress?.emailAddress],
    queryFn: async () => {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return null;

      // Get Clerk session token for authenticated request
      const token = await getToken();

      // Use lightweight by-email endpoint (cached, no members included)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agencies/by-email?email=${encodeURIComponent(email)}`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch agency');
      const result = await response.json();
      return result.data || null;
    },
    enabled: !!user?.primaryEmailAddress?.emailAddress,
    staleTime: 30 * 60 * 1000, // 30 minutes - agency data rarely changes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour (garbage collection time)
  });

  // IMPORTANT: React Query v5 removed the `onSuccess` callback option.
  // To perform actions after data loads, use useEffect with data as dependency.
  // See: https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5#removed-onsuccess-callback
  useEffect(() => {
    if (agencyData?.id) {
      setAgencyId(agencyData.id);
    }
  }, [agencyData]);

  const handleManageMetaAssets = () => {
    setManagingMetaAssets(!managingMetaAssets);
  };

  const handleManageGoogleAssets = () => {
    setManagingGoogleAssets(!managingGoogleAssets);
  };

  // Handle OAuth callback redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const platform = searchParams.get('platform');

    if (success === 'true' && platform) {
      // Track platform connected in PostHog
      posthog.capture('platform_connected', {
        agency_id: agencyId,
        platform: platform,
        connection_source: 'oauth_callback',
      });

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

  // Fetch all platforms with connection status (with ETag caching)
  const {
    data: platforms = [],
    isLoading,
    error,
  } = useQuery<PlatformInfo[]>({
    queryKey: ['available-platforms', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      // Get Clerk session token for authenticated request
      const token = await getToken();

      // Get stored ETag from previous request
      const etagKey = `etag-available-platforms-${agencyId}`;
      const storedEtag = localStorage.getItem(etagKey);

      const headers: Record<string, string> = {
        ...(token && { Authorization: `Bearer ${token}` }),
      };
      if (storedEtag) {
        headers['If-None-Match'] = storedEtag;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/available?agencyId=${agencyId}`,
        { headers }
      );

      // Store new ETag for future requests
      const newEtag = response.headers.get('ETag')?.replace(/"/g, '');
      if (newEtag) {
        localStorage.setItem(etagKey, newEtag);
      }

      // 304 Not Modified - return cached data
      if (response.status === 304) {
        const cached = localStorage.getItem(`cached-platforms-${agencyId}`);
        if (cached) {
          return JSON.parse(cached);
        }
        return [];
      }

      if (!response.ok) throw new Error('Failed to fetch platforms');
      const result = await response.json();

      // Cache the response for 304 handling
      localStorage.setItem(`cached-platforms-${agencyId}`, JSON.stringify(result.data || []));

      return result.data || [];
    },
    enabled: !!agencyId,
    staleTime: 2 * 60 * 1000, // 2 minutes - matches server Cache-Control
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
      const token = await getToken();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/${platform}/initiate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            agencyId,
            userEmail,
            redirectUrl: `${window.location.origin}/platforms/callback`,
          }),
        }
      );

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = result?.error?.message ?? 'Failed to initiate OAuth';
        throw new Error(message);
      }
      return result;
    },
    onSuccess: (data) => {
      // Redirect to OAuth provider
      window.location.href = data.data.authUrl;
    },
    onError: (error) => {
      setErrorMessage((error as Error).message);
      setConnectingPlatform(null);
    },
  });

  // Disconnect mutation
  const { mutate: disconnectPlatform } = useMutation({
    mutationFn: async (platform: Platform) => {
      if (!agencyId) {
        throw new Error('Agency not found. Please complete onboarding first.');
      }

      setDisconnectingPlatform(platform);

      const userEmail = user?.primaryEmailAddress?.emailAddress || 'user@agency.com';
      const token = await getToken();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/${platform}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            agencyId,
            revokedBy: userEmail,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to disconnect platform');
      return response.json();
    },
    onSuccess: (_, platform) => {
      // Track platform disconnected in PostHog
      posthog.capture('platform_disconnected', {
        agency_id: agencyId,
        platform: platform,
      });

      setSuccessMessage(`Successfully disconnected ${platform}!`);
      setDisconnectingPlatform(null);
      // Invalidate queries to refresh platform list
      queryClient.invalidateQueries({ queryKey: ['available-platforms', agencyId] });
      setTimeout(() => setSuccessMessage(null), 5000);
    },
    onError: (error) => {
      setErrorMessage(`Failed to disconnect platform: ${(error as Error).message}`);
      setDisconnectingPlatform(null);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  const handleConnect = (platform: Platform) => {
    setErrorMessage(null);

    // Check if this is a manual invitation platform
    const manualPlatforms = ['kit', 'mailchimp', 'beehiiv', 'klaviyo', 'pinterest', 'zapier'];
    if (manualPlatforms.includes(platform)) {
      // Open manual invitation modal in create mode
      setManualInvitationPlatform(platform);
      setIsManualModalOpen(true);
    } else {
      // Use OAuth flow
      initiateOAuth(platform);
    }
  };

  const handleEditEmail = (platform: Platform, currentEmail: string) => {
    setErrorMessage(null);
    setCurrentEmail(currentEmail);
    setIsEditingEmail(true);
    // Open manual invitation modal in edit mode
    setManualInvitationPlatform(platform);
    setIsManualModalOpen(true);
  };

  const handleManualModalClose = () => {
    setIsManualModalOpen(false);
    setManualInvitationPlatform(null);
    setIsEditingEmail(false);
    setCurrentEmail('');
  };

  const handleManualSuccess = () => {
    // Refetch platforms to update the UI
    if (agencyId) {
      queryClient.invalidateQueries({ queryKey: ['available-platforms', agencyId] });
    }
  };

  const handleDisconnect = (platform: Platform) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    disconnectPlatform(platform);
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
                    isDisconnecting={disconnectingPlatform === platformInfo.platform}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    onManageAssets={platformInfo.platform === 'meta' ? handleManageMetaAssets : platformInfo.platform === 'google' ? handleManageGoogleAssets : undefined}
                    onEditEmail={handleEditEmail}
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
                  isDisconnecting={disconnectingPlatform === platformInfo.platform}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  onManageAssets={platformInfo.platform === 'meta' ? handleManageMetaAssets : platformInfo.platform === 'google' ? handleManageGoogleAssets : undefined}
                  onEditEmail={handleEditEmail}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Meta Unified Settings Modal */}
      <AnimatePresence>
        {managingMetaAssets && agencyId && platforms.some(p => p.platform === 'meta' && p.connected) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setManagingMetaAssets(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
                <h2 className="text-xl font-bold text-slate-900">Meta Connection Settings</h2>
                <button
                  onClick={() => setManagingMetaAssets(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <MetaUnifiedSettings 
                  agencyId={agencyId}
                  onDisconnect={() => {
                    setManagingMetaAssets(false);
                    // Optionally trigger disconnect flow
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Google Unified Settings Modal */}
      <AnimatePresence>
        {managingGoogleAssets && agencyId && platforms.some(p => p.platform === 'google' && p.connected) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setManagingGoogleAssets(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
                <h2 className="text-xl font-bold text-slate-900">Google Connection Settings</h2>
                <button
                  onClick={() => setManagingGoogleAssets(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <GoogleUnifiedSettings 
                  agencyId={agencyId}
                  onDisconnect={() => {
                    setManagingGoogleAssets(false);
                    // Optionally trigger disconnect flow
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Invitation Modal */}
      {manualInvitationPlatform && agencyId && (
        <ManualInvitationModal
          isOpen={isManualModalOpen}
          onClose={handleManualModalClose}
          platform={manualInvitationPlatform}
          agencyId={agencyId}
          onSuccess={handleManualSuccess}
          mode={isEditingEmail ? 'edit' : 'create'}
          currentValue={currentEmail}
        />
      )}
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    }>
      <ConnectionsPageContent />
    </Suspense>
  );
}
