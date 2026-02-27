/**
 * HierarchicalPlatformSelector Component
 *
 * Simplified platform selection - only shows connected platforms.
 * Includes toggle switches for each platform to select/deselect all products.
 *
 * For manual invitation platforms (Kit, Beehiiv, Mailchimp, Klaviyo),
 * shows email configuration UI instead of product selection.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronRight, Check, AlertCircle, Link2, Edit, Mail } from 'lucide-react';
import { PLATFORM_HIERARCHY } from '@agency-platform/shared';
import Link from 'next/link';
import { ManualInvitationModal } from '@/components/manual-invitation-modal';

interface ConnectedPlatform {
  platform: string;
  name: string;
  connected: boolean;
  status?: string;
  connectedEmail?: string;
}

interface HierarchicalPlatformSelectorProps {
  selectedPlatforms: Record<string, string[]>;
  onSelectionChange: (platforms: Record<string, string[]>) => void;
  connectedPlatforms?: ConnectedPlatform[];
  agencyId?: string; // For manual invitation modal
}

// Platforms that use manual invitation flow instead of OAuth
const MANUAL_INVITATION_PLATFORMS = new Set(['kit', 'beehiiv', 'mailchimp', 'klaviyo']);

interface GroupState {
  [key: string]: boolean;
}

export function HierarchicalPlatformSelector({
  selectedPlatforms,
  onSelectionChange,
  connectedPlatforms = [],
  agencyId,
}: HierarchicalPlatformSelectorProps) {
  const [expandedGroups, setExpandedGroups] = useState<GroupState>({});

  // Manual invitation modal state
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState<string>('');

  // Filter to only show connected platforms
  const connectedPlatformIds = useMemo(() => {
    return new Set(
      connectedPlatforms
        .filter(p => p.connected)
        .map(p => p.platform)
    );
  }, [connectedPlatforms]);

  // Filter PLATFORM_HIERARCHY to only include connected platforms
  const availableGroups = useMemo(() => {
    return Object.entries(PLATFORM_HIERARCHY).filter(([groupKey]) => 
      connectedPlatformIds.has(groupKey)
    );
  }, [connectedPlatformIds]);

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }, []);

  const handlePlatformToggle = useCallback(
    (groupKey: string, products: typeof PLATFORM_HIERARCHY[keyof typeof PLATFORM_HIERARCHY]['products']) => {
      const currentSelection = selectedPlatforms[groupKey] || [];
      const allSelected = products.length > 0 && currentSelection.length === products.length;

      const newSelection = allSelected ? [] : products.map(p => p.id);

      onSelectionChange({
        ...selectedPlatforms,
        [groupKey]: newSelection,
      });
    },
    [selectedPlatforms, onSelectionChange]
  );

  const handleProductToggle = useCallback(
    (groupKey: string, productId: string) => {
      const currentSelection = selectedPlatforms[groupKey] || [];
      const isSelected = currentSelection.includes(productId);

      const newSelection = isSelected
        ? currentSelection.filter(id => id !== productId)
        : [...currentSelection, productId];

      onSelectionChange({
        ...selectedPlatforms,
        [groupKey]: newSelection,
      });
    },
    [selectedPlatforms, onSelectionChange]
  );

  const handleSelectAll = useCallback(
    (groupKey: string, products: typeof PLATFORM_HIERARCHY[keyof typeof PLATFORM_HIERARCHY]['products']) => {
      const currentSelection = selectedPlatforms[groupKey] || [];
      const allSelected = products.length > 0 && currentSelection.length === products.length;

      const newSelection = allSelected ? [] : products.map(p => p.id);

      onSelectionChange({
        ...selectedPlatforms,
        [groupKey]: newSelection,
      });
    },
    [selectedPlatforms, onSelectionChange]
  );

  const getGroupSelectionCount = useCallback(
    (groupKey: string) => {
      return (selectedPlatforms[groupKey] || []).length;
    },
    [selectedPlatforms]
  );

  const getPlatformToggleState = useCallback(
    (groupKey: string, productCount: number) => {
      const selection = selectedPlatforms[groupKey] || [];
      if (selection.length === 0) return { checked: false, indeterminate: false };
      if (selection.length === productCount) return { checked: true, indeterminate: false };
      return { checked: false, indeterminate: true };
    },
    [selectedPlatforms]
  );

  const getGroupSelectAllState = useCallback(
    (groupKey: string, productCount: number) => {
      const selection = selectedPlatforms[groupKey] || [];
      if (selection.length === 0) return { checked: false, indeterminate: false };
      if (selection.length === productCount) return { checked: true, indeterminate: false };
      return { checked: false, indeterminate: true };
    },
    [selectedPlatforms]
  );

  const isProductSelected = useCallback(
    (groupKey: string, productId: string) => {
      return (selectedPlatforms[groupKey] || []).includes(productId);
    },
    [selectedPlatforms]
  );

  // Handle email edit for manual invitation platforms
  const handleEditEmail = useCallback((platform: string, currentEmail: string) => {
    setEditingPlatform(platform);
    setEditingEmail(currentEmail);
    setManualModalOpen(true);
  }, []);

  const handleManualModalClose = useCallback(() => {
    setManualModalOpen(false);
    setEditingPlatform(null);
    setEditingEmail('');
  }, []);

  const handleManualSuccess = useCallback(() => {
    setManualModalOpen(false);
    setEditingPlatform(null);
    setEditingEmail('');
  }, []);

  // Get the connected email for a platform
  const getPlatformEmail = useCallback((platform: string) => {
    return connectedPlatforms.find(p => p.platform === platform)?.connectedEmail;
  }, [connectedPlatforms]);

  // Empty state - no connected platforms
  if (availableGroups.length === 0) {
    return (
      <div className="text-center py-8 px-6 bg-muted/20 rounded-lg border border-border">
        <div className="inline-flex p-3 bg-muted/30 rounded-full mb-4">
          <AlertCircle className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-ink mb-2">
          No platforms connected
        </h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
          Connect platforms in your settings before creating access requests.
        </p>
        <Link
          href="/connections"
          className="inline-flex items-center gap-2 px-4 py-2 bg-coral text-white rounded-lg hover:bg-coral/90 transition-colors text-sm font-medium"
        >
          <Link2 className="h-4 w-4" />
          Go to Connections
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {availableGroups.map(([groupKey, group]) => {
        const isExpanded = expandedGroups[groupKey] || false;
        const selectionCount = getGroupSelectionCount(groupKey);
        const { checked: platformChecked, indeterminate: platformIndeterminate } =
          getPlatformToggleState(groupKey, group.products.length);
        const { checked: selectAllChecked, indeterminate: selectAllIndeterminate } =
          getGroupSelectAllState(groupKey, group.products.length);

        return (
          <div key={groupKey} className="border border-border rounded-lg overflow-hidden bg-card">
            {/* Platform Header with Toggle */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={platformChecked}
                  ref={input => {
                    if (input) {
                      input.indeterminate = platformIndeterminate;
                    }
                  }}
                  onChange={(e) => {
                    e.stopPropagation();
                    handlePlatformToggle(groupKey, group.products);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="sr-only peer"
                />
                <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  platformChecked 
                    ? 'bg-teal peer-focus:ring-4 peer-focus:ring-teal/30' 
                    : platformIndeterminate
                    ? 'bg-accent peer-focus:ring-4 peer-focus:ring-ring'
                    : 'bg-muted/40 peer-focus:ring-4 peer-focus:ring-ring'
                }`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full transition-transform duration-200 ${
                    platformChecked ? 'translate-x-5' : platformIndeterminate ? 'translate-x-2.5' : ''
                  }`}>
                    {platformChecked && (
                      <Check className="w-3 h-3 text-teal absolute top-1 left-1" />
                    )}
                  </div>
                </div>
              </label>

              {/* Platform Info */}
              <div 
                className="flex-1 flex items-center justify-between cursor-pointer"
                onClick={() => toggleGroup(groupKey)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="text-left">
                    <h3 className="font-medium text-ink">{group.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectionCount > 0 
                        ? `${selectionCount} of ${group.products.length} products selected`
                        : `${group.products.length} products available`
                      }
                    </p>
                  </div>
                </div>
                {selectionCount > 0 && (
                  <div className="text-sm font-medium text-coral">
                    {selectionCount} selected
                  </div>
                )}
              </div>
            </div>

            {/* Products List (Expanded) - Show email UI for manual invitation platforms */}
            {isExpanded && (() => {
              const isManualPlatform = MANUAL_INVITATION_PLATFORMS.has(groupKey);
              const platformEmail = getPlatformEmail(groupKey);

              if (isManualPlatform) {
                // Email Configuration UI for manual invitation platforms
                return (
                  <div className="border-t border-border p-4 bg-muted/20">
                    <div className="flex items-start gap-3 p-4 bg-card border border-border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-lg bg-coral/10 border border-border flex items-center justify-center">
                          <Mail className="h-5 w-5 text-coral" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-ink mb-1">
                          Invitation Email
                        </h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          Clients will invite this email to their {group.name} account
                        </p>
                        {platformEmail ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 px-3 py-2 bg-muted/20 border border-border rounded-lg">
                              <p className="text-sm font-mono text-foreground truncate" title={platformEmail}>
                                {platformEmail}
                              </p>
                            </div>
                            {agencyId && (
                              <button
                                type="button"
                                onClick={() => handleEditEmail(groupKey, platformEmail)}
                                className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-ink hover:bg-muted/30 rounded-lg transition-colors flex items-center gap-1"
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 bg-accent border border-border rounded-lg">
                            <p className="text-xs text-foreground">
                              No email configured.{' '}
                              <Link
                                href="/connections"
                                className="font-medium underline hover:text-ink"
                              >
                                Connect {group.name}
                              </Link>{' '}
                              to set up the invitation email.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Standard Product Selection UI for other platforms
              return (
                <div className="border-t border-border p-4 bg-muted/20 space-y-3">
                  {/* Select All */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name={`Select all ${group.name} products`}
                      checked={selectAllChecked}
                      ref={input => {
                        if (input) {
                          input.indeterminate = selectAllIndeterminate;
                        }
                      }}
                      onChange={() => handleSelectAll(groupKey, group.products)}
                      className="w-4 h-4 text-coral rounded focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-sm font-medium text-foreground">
                      Select all ({group.products.length})
                    </span>
                  </label>

                  {/* Individual Products */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
                    {group.products.map(product => {
                      const isSelected = isProductSelected(groupKey, product.id);

                      return (
                        <label
                          key={product.id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-coral/10 border border-coral/30' : 'hover:bg-muted/30'
                          }`}
                        >
                          <input
                            type="checkbox"
                            name={product.name}
                            aria-label={product.name}
                            checked={isSelected}
                            onChange={() => handleProductToggle(groupKey, product.id)}
                            className="w-4 h-4 text-coral rounded focus:ring-2 focus:ring-ring"
                          />
                          <span className={`text-sm ${isSelected ? 'text-coral font-medium' : 'text-foreground'}`}>
                            {product.name}
                          </span>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-coral ml-auto" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })}

      {/* Manual Invitation Modal */}
      {editingPlatform && agencyId && (
        <ManualInvitationModal
          isOpen={manualModalOpen}
          onClose={handleManualModalClose}
          platform={editingPlatform}
          agencyId={agencyId}
          onSuccess={handleManualSuccess}
          mode="edit"
          currentValue={editingEmail}
        />
      )}
    </div>
  );
}
