/**
 * PlatformConnectionModal Component
 *
 * Modal for managing agency platform connections inline.
 * Shows connected platforms with status, refresh, and disconnect actions.
 * Provides quick-connect button for onboarding flow.
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Unlink, Plus, Loader2, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

// Platform display names
const PLATFORM_NAMES: Record<string, string> = {
  meta: 'Meta',
  google: 'Google',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  snapchat: 'Snapchat',
  instagram: 'Instagram',
};

interface PlatformConnection {
  platform: string;
  name: string;
  category: string;
  connected: boolean;
  status?: string;
  connectedEmail?: string;
  connectedAt?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

interface PlatformConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionComplete?: () => void;
  agencyId?: string; // Optional: if not provided, falls back to orgId from useAuth()
}

export function PlatformConnectionModal({
  isOpen,
  onClose,
  onConnectionComplete,
  agencyId,
}: PlatformConnectionModalProps) {
  const { orgId: fallbackOrgId, getToken } = useAuth();
  const effectiveAgencyId = agencyId || fallbackOrgId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [disconnectPlatform, setDisconnectPlatform] = useState<string | null>(null);

  // Fetch platform connections - use same endpoint as connections page
  const {
    data: connections = [],
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery<PlatformConnection[]>({
    queryKey: ['available-platforms', effectiveAgencyId],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/available?agencyId=${effectiveAgencyId}`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch platforms');
      const result = await response.json();
      // Filter to only show connected platforms
      return (result.data || []).filter((p: any) => p.connected);
    },
    enabled: isOpen && !!effectiveAgencyId,
  });

  // Refresh token mutation
  const { mutate: refreshPlatform, isPending: isRefreshing } = useMutation({
    mutationFn: async (platform: string) => {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/${platform}/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ agencyId: effectiveAgencyId }),
        }
      );
      if (!response.ok) throw new Error('Failed to refresh token');
      return response.json();
    },
    onSuccess: () => {
      setSuccessMessage('Token refreshed successfully');
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['available-platforms', effectiveAgencyId] });
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: () => {
      setErrorMessage('Failed to refresh token. Please try again.');
      setSuccessMessage(null);
    },
  });

  // Disconnect mutation
  const { mutate: disconnectMutation, isPending: isDisconnecting } = useMutation({
    mutationFn: async (platform: string) => {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/${platform}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ agencyId: effectiveAgencyId }),
        }
      );
      if (!response.ok) throw new Error('Failed to disconnect');
      return response.json();
    },
    onSuccess: () => {
      setSuccessMessage('Platform disconnected successfully');
      setErrorMessage(null);
      setDisconnectPlatform(null);
      queryClient.invalidateQueries({ queryKey: ['available-platforms', effectiveAgencyId] });
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: () => {
      setErrorMessage('Failed to disconnect platform. Please try again.');
      setSuccessMessage(null);
      setDisconnectPlatform(null);
    },
  });

  // Refetch when modal opens
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const handleConnectPlatform = () => {
    onClose();
    router.push('/onboarding/platforms');
  };

  const handleRefresh = (platform: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    refreshPlatform(platform);
  };

  const handleDisconnectClick = (platform: string) => {
    setDisconnectPlatform(platform);
  };

  const handleDisconnectConfirm = () => {
    if (disconnectPlatform) {
      disconnectMutation(disconnectPlatform);
    }
  };

  const handleDisconnectCancel = () => {
    setDisconnectPlatform(null);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-teal/20 text-teal-90 border-2 border-teal';
      case 'expired':
        return 'bg-coral/20 text-coral-90 border-2 border-coral';
      case 'invalid':
        return 'bg-acid/20 text-acid-90 border-2 border-acid';
      default:
        return 'bg-gray-200 text-gray-700 border-2 border-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'expired':
      case 'invalid':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="platform-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        key="platform-modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="relative bg-card rounded-lg shadow-brutalist-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col pointer-events-auto border-2 border-black"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black/10 bg-ink/5">
            <div>
              <h2 className="text-xl font-semibold text-ink">Platform Connections</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage your agency's platform connections for delegated access
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-acid/20 rounded-lg transition-colors border border-transparent hover:border-acid"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Success/Error messages */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-teal/10 border-2 border-teal rounded-lg flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-teal flex-shrink-0" />
                <p className="text-sm text-teal-90">{successMessage}</p>
              </motion.div>
            )}

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-coral/10 border-2 border-coral rounded-lg flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4 text-coral flex-shrink-0" />
                <p className="text-sm text-coral-90">{errorMessage}</p>
              </motion.div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-600">Loading platforms...</span>
              </div>
            )}

            {/* Error state */}
            {fetchError && !isLoading && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-coral mx-auto mb-3" />
                <p className="text-coral mb-4">Failed to load platforms</p>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 bg-coral text-white rounded-lg hover:bg-coral/90 transition-colors border border-black"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !fetchError && connections.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex p-4 bg-paper rounded-full mb-4 border-2 border-black">
                  <Plus className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-lg font-medium text-ink mb-2">No platforms connected</p>
                <p className="text-gray-600 mb-6">
                  Connect platforms to enable delegated access for your clients
                </p>
                <button
                  onClick={handleConnectPlatform}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-coral text-white rounded-lg hover:bg-coral/90 transition-colors border border-black shadow-brutalist"
                >
                  <Plus className="h-4 w-4" />
                  Connect Your First Platform
                </button>
              </div>
            )}

            {/* Platform connections list */}
            {!isLoading && !fetchError && connections.length > 0 && (
              <div className="space-y-3">
                {connections.map((connection) => (
                  <div
                    key={connection.platform}
                    className="p-4 border-2 border-black rounded-lg hover:border-acid transition-colors bg-card"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-ink">
                          {connection.name || PLATFORM_NAMES[connection.platform] || connection.platform}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(
                            connection.status || 'active'
                          )}`}
                        >
                          {getStatusIcon(connection.status || 'active')}
                          {connection.status || 'active'}
                        </span>
                      </div>
                    </div>

                    {/* Connection details */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                      {connection.connectedEmail && (
                        <div>
                          <span className="font-medium">Connected by:</span> {connection.connectedEmail}
                        </div>
                      )}
                      {connection.connectedAt && (
                        <div>
                          <span className="font-medium">Connected:</span>{' '}
                          {new Date(connection.connectedAt).toLocaleDateString()}
                        </div>
                      )}
                      {connection.expiresAt && (
                        <div>
                          <span className="font-medium">Expires:</span>{' '}
                          {new Date(connection.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRefresh(connection.platform)}
                        disabled={isRefreshing}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-teal/10 text-teal rounded-lg hover:bg-teal/20 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm border border-transparent hover:border-teal"
                      >
                        {isRefreshing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Refresh
                      </button>
                      <button
                        onClick={() => handleDisconnectClick(connection.platform)}
                        disabled={isDisconnecting}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-coral/10 text-coral rounded-lg hover:bg-coral/20 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm border border-transparent hover:border-coral"
                      >
                        {isDisconnecting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Unlink className="h-3.5 w-3.5" />
                        )}
                        Disconnect
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new platform button */}
                <button
                  onClick={handleConnectPlatform}
                  className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-black/30 rounded-lg text-gray-700 hover:border-coral hover:text-coral hover:bg-coral/5 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Connect Another Platform
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t-2 border-black/10 bg-paper">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">
                Connected platforms are used for delegated access mode
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-card border-2 border-black rounded-lg hover:bg-acid/20 transition-colors text-sm font-medium"
              >
                Done
              </button>
            </div>
          </div>

          {/* Disconnect confirmation dialog */}
          <AnimatePresence>
            {disconnectPlatform && (
              <div className="absolute inset-0 bg-ink/5/95 backdrop-blur-sm flex items-center justify-center p-6 z-10 rounded-lg border-2 border-black">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card border-2 border-black rounded-lg shadow-brutalist-lg p-6 max-w-sm w-full"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-coral/20 rounded-lg">
                      <Unlink className="h-5 w-5 text-coral" />
                    </div>
                    <h3 className="text-lg font-semibold text-ink">Confirm Disconnect</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-6">
                    Are you sure you want to disconnect{' '}
                    <strong>{PLATFORM_NAMES[disconnectPlatform] || disconnectPlatform}</strong>?
                    This will revoke all access to this platform for delegated access clients.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDisconnectCancel}
                      className="flex-1 px-4 py-2 border-2 border-black rounded-lg hover:bg-acid/20 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDisconnectConfirm}
                      className="flex-1 px-4 py-2 bg-coral text-white rounded-lg hover:bg-coral/90 transition-colors text-sm font-medium border border-black"
                    >
                      Disconnect
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
