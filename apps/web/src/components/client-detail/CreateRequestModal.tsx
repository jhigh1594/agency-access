'use client';

/**
 * CreateRequestModal Component
 *
 * Modal for creating a new access request for a specific client.
 * Simplified 2-step flow: Platform selection + Access level.
 */

import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2, Link2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PLATFORM_HIERARCHY, ACCESS_LEVEL_DESCRIPTIONS, type AccessLevel, type Platform } from '@agency-platform/shared';
import { PlatformIcon } from '@/components/ui';
import { useQuotaCheck, QuotaExceededError } from '@/lib/query/quota';
import { UpgradeModal } from '@/components/upgrade-modal';

interface CreateRequestModalProps {
  client: {
    id: string;
    name: string;
    email: string;
    company: string;
  };
  onClose: () => void;
  onSuccess?: (request: { id: string; uniqueToken: string }) => void;
}

interface SelectedPlatform {
  platformGroup: string;
  products: Array<{ product: string; accessLevel: AccessLevel }>;
}

// Simplified platform list (major platforms only for cleaner UX)
const MAJOR_PLATFORMS = ['google', 'meta', 'linkedin'];

export function CreateRequestModal({ client, onClose, onSuccess }: CreateRequestModalProps) {
  const { orgId } = useAuth();
  const queryClient = useQueryClient();
  const checkQuota = useQuotaCheck();

  const [globalAccessLevel, setGlobalAccessLevel] = useState<AccessLevel>('standard');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, string[]>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<{ id: string; uniqueToken: string } | null>(null);
  const [quotaError, setQuotaError] = useState<QuotaExceededError | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Toggle platform group expansion
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  // Toggle all products in a group
  const toggleGroupProducts = (groupKey: string, products: Array<{ id: string }>) => {
    const currentSelection = selectedPlatforms[groupKey] || [];
    const allSelected = products.length > 0 && currentSelection.length === products.length;

    setSelectedPlatforms(prev => ({
      ...prev,
      [groupKey]: allSelected ? [] : products.map(p => p.id),
    }));
  };

  // Toggle single product
  const toggleProduct = (groupKey: string, productId: string) => {
    const currentSelection = selectedPlatforms[groupKey] || [];
    const isSelected = currentSelection.includes(productId);

    setSelectedPlatforms(prev => ({
      ...prev,
      [groupKey]: isSelected
        ? currentSelection.filter(id => id !== productId)
        : [...currentSelection, productId],
    }));
  };

  // Check if product is selected
  const isProductSelected = (groupKey: string, productId: string) => {
    return selectedPlatforms[groupKey]?.includes(productId) || false;
  };

  // Check if all products in a group are selected
  const isGroupFullySelected = (groupKey: string, products: Array<{ id: string }>) => {
    const selection = selectedPlatforms[groupKey] || [];
    return products.length > 0 && selection.length === products.length;
  };

  // Check if some products in a group are selected
  const isGroupPartiallySelected = (groupKey: string, products: Array<{ id: string }>) => {
    const selection = selectedPlatforms[groupKey] || [];
    return selection.length > 0 && selection.length < products.length;
  };

  // Get total selected product count
  const totalSelected = Object.values(selectedPlatforms).reduce((sum, products) => sum + products.length, 0);

  // Transform selected platforms to API format
  const transformPlatformsForAPI = (): SelectedPlatform[] => {
    return Object.entries(selectedPlatforms)
      .filter(([_, products]) => products.length > 0)
      .map(([groupKey, products]) => ({
        platformGroup: groupKey,
        products: products.map(product => ({
          product,
          accessLevel: globalAccessLevel,
        })),
      }));
  };

  // Create access request mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const platforms = transformPlatformsForAPI();

      if (platforms.length === 0) {
        throw new Error('Please select at least one platform');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-agency-id': orgId || '',
        },
        body: JSON.stringify({
          agencyId: orgId,
          clientId: client.id,
          clientName: client.name,
          clientEmail: client.email,
          authModel: 'client_authorization',
          platforms,
          globalAccessLevel,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create access request');
      }

      return response.json();
    },
    onSuccess: (result) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['client-detail', client.id] });
      queryClient.invalidateQueries({ queryKey: ['clients-with-connections'] });
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });

      setCreatedRequest(result.data);
      setSuccess(true);

      // Auto-close after 3 seconds to allow user to copy link
      setTimeout(() => {
        onSuccess?.(result.data);
        onClose();
      }, 3000);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
    },
  });

  const handleQuotaCheck = async () => {
    try {
      const result = await checkQuota({ metric: 'access_requests' });
      if (!result.allowed) {
        setQuotaError(
          new QuotaExceededError({
            code: 'QUOTA_EXCEEDED',
            message: `You've reached your Access Requests limit`,
            metric: 'access_requests',
            limit: result.limit,
            used: result.used,
            remaining: result.remaining,
            currentTier: result.currentTier,
            suggestedTier: result.suggestedTier,
            upgradeUrl: result.upgradeUrl || '',
          })
        );
        setShowUpgradeModal(true);
        return false;
      }
      return true;
    } catch (error) {
      if (error instanceof QuotaExceededError) {
        setQuotaError(error);
        setShowUpgradeModal(true);
        return false;
      }
      // Other errors - allow creation to proceed (will be caught by mutation)
      return true;
    }
  };

  const handleSubmitWithQuotaCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (totalSelected === 0) {
      setErrorMessage('Please select at least one platform');
      return;
    }

    // Check quota first
    const quotaOk = await handleQuotaCheck();
    if (!quotaOk) return;

    createMutation.mutate();
  };

  const copyLinkToClipboard = () => {
    if (createdRequest) {
      const link = `${window.location.origin}/invite/${createdRequest.uniqueToken}`;
      navigator.clipboard.writeText(link);
      // Could show a brief "copied" indicator here
    }
  };

  const inviteLink = createdRequest
    ? `${window.location.origin}/invite/${createdRequest.uniqueToken}`
    : null;

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
        onClick={onClose}
      >
        <m.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-lg shadow-xl max-w-2xl w-full my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-lg">
                <Link2 className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Create Access Request</h2>
                <p className="text-sm text-slate-500">for {client.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Success state */}
          {success && createdRequest ? (
            <div className="p-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Access Request Created!</h3>
                <p className="text-slate-600">Send this link to {client.name} to request platform access</p>
              </div>

              {/* Invite link */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Client Authorization Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteLink || ''}
                    className="flex-1 px-3 py-2 bg-card border border-slate-300 rounded-lg text-sm text-slate-700 font-mono"
                  />
                  <button
                    type="button"
                    onClick={copyLinkToClipboard}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Form */}
              <form onSubmit={handleSubmitWithQuotaCheck} className="max-h-[60vh] overflow-y-auto">
                {/* Client info (read-only) */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Name:</span>
                      <span className="ml-2 font-medium text-slate-900">{client.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Email:</span>
                      <span className="ml-2 font-medium text-slate-900">{client.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Company:</span>
                      <span className="ml-2 font-medium text-slate-900">{client.company}</span>
                    </div>
                  </div>
                </div>

                {/* Step 1: Platform Selection */}
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">
                    1. Select Platforms <span className="text-red-500">*</span>
                  </h3>

                  <div className="space-y-3">
                    {Object.entries(PLATFORM_HIERARCHY).map(([groupKey, group]) => {
                      const isExpanded = expandedGroups[groupKey];
                      const products = group.products;

                      return (
                        <div key={groupKey} className="border border-slate-200 rounded-lg overflow-hidden">
                          {/* Group header */}
                          <button
                            type="button"
                            onClick={() => toggleGroup(groupKey)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <PlatformIcon platform={groupKey as Platform} size="sm" />
                              <span className="font-medium text-slate-900">{group.name}</span>
                              <span className="text-xs text-slate-500">({products.length} products)</span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            )}
                          </button>

                          {/* Products (expanded) */}
                          {isExpanded && (
                            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 space-y-2">
                              {products.map((product) => (
                                <label
                                  key={product.id}
                                  className="flex items-center gap-3 cursor-pointer hover:bg-card rounded px-2 py-1 transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isProductSelected(groupKey, product.id)}
                                    onChange={() => toggleProduct(groupKey, product.id)}
                                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                  />
                                  <PlatformIcon platform={product.product as Platform} size="sm" />
                                  <span className="text-sm text-slate-700">{product.name}</span>
                                  <span className="text-xs text-slate-500">({products.length} products)</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected count */}
                  {totalSelected > 0 && (
                    <p className="mt-3 text-sm text-slate-600">
                      {totalSelected} platform{totalSelected !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                {/* Step 2: Access Level */}
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">
                    2. Select Access Level <span className="text-red-500">*</span>
                  </h3>

                  <div className="space-y-3">
                    {(Object.keys(ACCESS_LEVEL_DESCRIPTIONS) as AccessLevel[]).map((level) => {
                      const info = ACCESS_LEVEL_DESCRIPTIONS[level];
                      return (
                        <label
                          key={level}
                          className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                            globalAccessLevel === level
                              ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="accessLevel"
                            value={level}
                            checked={globalAccessLevel === level}
                            onChange={(e) => setGlobalAccessLevel(e.target.value as AccessLevel)}
                            className="mt-0.5 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{info.title}</div>
                            <div className="text-sm text-slate-600 mt-1">{info.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Error message */}
                {errorMessage && (
                  <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={createMutation.isPending}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || totalSelected === 0}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4" />
                        Create & Send Link
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </m.div>
      </m.div>
    </AnimatePresence>

    {/* Upgrade Modal */}
    {showUpgradeModal && quotaError && (
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          setQuotaError(null);
        }}
        quotaError={quotaError}
        currentTier={quotaError.currentTier}
      />
    )}
    </>
  );
}
