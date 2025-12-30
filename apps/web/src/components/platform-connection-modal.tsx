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
  const { orgId: fallbackOrgId } = useAuth();
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/available?agencyId=${effectiveAgencyId}`
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/${platform}/refresh`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/${platform}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'invalid':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col pointer-events-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Platform Connections</h2>
              <p className="text-sm text-slate-600 mt-1">
                Manage your agency's platform connections for delegated access
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Success/Error messages */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800">{successMessage}</p>
              </motion.div>
            )}

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{errorMessage}</p>
              </motion.div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                <span className="ml-2 text-slate-600">Loading platforms...</span>
              </div>
            )}

            {/* Error state */}
            {fetchError && !isLoading && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                <p className="text-red-600 mb-4">Failed to load platforms</p>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !fetchError && connections.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex p-4 bg-slate-100 rounded-full mb-4">
                  <Plus className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-lg font-medium text-slate-900 mb-2">No platforms connected</p>
                <p className="text-slate-600 mb-6">
                  Connect platforms to enable delegated access for your clients
                </p>
                <button
                  onClick={handleConnectPlatform}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
                    className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-900">
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
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
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
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
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
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
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
                  className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Connect Another Platform
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-600">
                Connected platforms are used for delegated access mode
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
              >
                Done
              </button>
            </div>
          </div>

          {/* Disconnect confirmation dialog */}
          <AnimatePresence>
            {disconnectPlatform && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6 z-10 rounded-xl">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-slate-200 rounded-xl shadow-lg p-6 max-w-sm w-full"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Unlink className="h-5 w-5 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Confirm Disconnect</h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-6">
                    Are you sure you want to disconnect{' '}
                    <strong>{PLATFORM_NAMES[disconnectPlatform] || disconnectPlatform}</strong>?
                    This will revoke all access to this platform for delegated access clients.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDisconnectCancel}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDisconnectConfirm}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
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
