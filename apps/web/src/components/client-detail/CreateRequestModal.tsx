'use client';

/**
 * CreateRequestModal Component
 *
 * Modal for creating a new access request for a specific client.
 * Simplified 2-step flow: Platform selection + Access level.
 */

import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Link2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PLATFORM_HIERARCHY, ACCESS_LEVEL_DESCRIPTIONS, type AccessLevel, type Platform } from '@agency-platform/shared';
import { Button, PlatformIcon } from '@/components/ui';
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

export function CreateRequestModal({ client, onClose, onSuccess }: CreateRequestModalProps) {
  const { orgId, getToken } = useAuth();
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
      const token = await getToken();
      if (!token) throw new Error('No auth token');
      const platforms = transformPlatformsForAPI();

      if (platforms.length === 0) {
        throw new Error('Please select at least one platform');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
      const result = await checkQuota.mutateAsync({ metric: 'access_requests' });
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
    <>
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
          className="bg-card rounded-lg shadow-brutalist max-w-2xl w-full my-8 border border-black/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                <Link2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground font-display">Create Access Request</h2>
                <p className="text-sm text-muted-foreground">for {client.name}</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

          {/* Success state */}
          {success && createdRequest ? (
            <div className="p-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-teal/10 rounded-full mb-4">
                  <CheckCircle2 className="h-8 w-8 text-teal" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2 font-display">Access Request Created!</h3>
                <p className="text-muted-foreground">Send this link to {client.name} to request platform access</p>
              </div>

              {/* Invite link */}
              <div className="bg-muted/10 border border-border rounded-lg p-4 mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Client Authorization Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteLink || ''}
                    className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground font-mono"
                  />
                  <Button
                    type="button"
                    onClick={copyLinkToClipboard}
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    Copy Link
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Form */}
              <form onSubmit={handleSubmitWithQuotaCheck} className="max-h-[60vh] overflow-y-auto">
                {/* Client info (read-only) */}
                <div className="px-6 py-4 bg-muted/10 border-b border-border">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <span className="ml-2 font-medium text-foreground">{client.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <span className="ml-2 font-medium text-foreground">{client.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Company:</span>
                      <span className="ml-2 font-medium text-foreground">{client.company}</span>
                    </div>
                  </div>
                </div>

                {/* Step 1: Platform Selection */}
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    1. Select Platforms <span className="text-coral">*</span>
                  </h3>

                  <div className="space-y-3">
                    {Object.entries(PLATFORM_HIERARCHY).map(([groupKey, group]) => {
                      const isExpanded = expandedGroups[groupKey];
                      const products = group.products;

                      return (
                        <div key={groupKey} className="border border-border rounded-lg overflow-hidden">
                          {/* Group header */}
                          <button
                            type="button"
                            onClick={() => toggleGroup(groupKey)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/10 transition-colors min-h-[44px]"
                          >
                            <div className="flex items-center gap-3">
                              <PlatformIcon platform={groupKey as Platform} size="sm" />
                              <span className="font-medium text-foreground">{group.name}</span>
                              <span className="text-xs text-muted-foreground">({products.length} products)</span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>

                          {/* Products (expanded) */}
                          {isExpanded && (
                            <div className="px-4 py-3 bg-muted/10 border-t border-border space-y-2">
                              {products.map((product) => (
                                <label
                                  key={product.id}
                                  className="flex items-center gap-3 cursor-pointer hover:bg-card rounded px-2 py-1 transition-colors min-h-[44px]"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isProductSelected(groupKey, product.id)}
                                    onChange={() => toggleProduct(groupKey, product.id)}
                                    className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
                                  />
                                  <PlatformIcon platform={product.id as Platform} size="sm" />
                                  <span className="text-sm text-foreground">{product.name}</span>
                                  <span className="text-xs text-muted-foreground">({products.length} products)</span>
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
                    <p className="mt-3 text-sm text-muted-foreground">
                      {totalSelected} platform{totalSelected !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                {/* Step 2: Access Level */}
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    2. Select Access Level <span className="text-coral">*</span>
                  </h3>

                  <div className="space-y-3">
                    {(Object.keys(ACCESS_LEVEL_DESCRIPTIONS) as AccessLevel[]).map((level) => {
                      const info = ACCESS_LEVEL_DESCRIPTIONS[level];
                      return (
                        <label
                          key={level}
                          className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                            globalAccessLevel === level
                              ? 'border-primary bg-primary/10 ring-1 ring-primary'
                              : 'border-border hover:border-foreground/20'
                          }`}
                        >
                          <input
                            type="radio"
                            name="accessLevel"
                            value={level}
                            checked={globalAccessLevel === level}
                            onChange={(e) => setGlobalAccessLevel(e.target.value as AccessLevel)}
                            className="mt-0.5 w-4 h-4 text-primary border-border focus:ring-ring"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{info.title}</div>
                            <div className="text-sm text-muted-foreground mt-1">{info.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Error message */}
                {errorMessage && (
                  <div className="mx-6 mb-4 p-3 bg-coral/10 border border-coral/40 rounded-lg">
                    <p className="text-sm text-coral">{errorMessage}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-muted/10">
                  <Button
                    type="button"
                    onClick={onClose}
                    disabled={createMutation.isPending}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || totalSelected === 0}
                    size="sm"
                    isLoading={createMutation.isPending}
                    leftIcon={!createMutation.isPending ? <Link2 className="h-4 w-4" /> : undefined}
                    className="disabled:cursor-not-allowed"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create & Send Link'}
                  </Button>
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
