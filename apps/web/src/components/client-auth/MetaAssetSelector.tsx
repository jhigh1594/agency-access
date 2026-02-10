'use client';

/**
 * MetaAssetSelector - Multi-asset selection for Meta platform
 *
 * Displays three collapsible groups:
 * 1. Ad Accounts
 * 2. Pages
 * 3. Instagram Accounts
 *
 * Features:
 * - Loading states with shimmer animation
 * - Empty state handling
 * - Selection count badge
 * - Sticky footer with Continue button
 */

import { useState, useEffect, useRef } from 'react';
import posthog from 'posthog-js';
import { AssetGroup, type Asset } from './AssetGroup';
import { MultiSelectCombobox, type MultiSelectOption } from '@/components/ui/multi-select-combobox';
import { AssetSelectorLoading, AssetSelectorError } from './AssetSelectorStates';

interface MetaAssets {
  adAccounts: Array<{
    id: string;
    name: string;
    status?: string;
    currency?: string;
  }>;
  pages: Array<{
    id: string;
    name: string;
    avatar?: string;
    category?: string;
  }>;
  instagramAccounts: Array<{
    id: string;
    username: string;
    name?: string;
    avatar?: string;
  }>;
}

interface MetaAssetSelectorProps {
  sessionId: string;
  onSelectionChange: (selectedAssets: {
    adAccounts: string[];
    pages: string[];
    instagramAccounts: string[];
    // Extended properties for grant step
    selectedPagesWithNames?: Array<{ id: string; name: string }>;
    selectedAdAccountsWithNames?: Array<{ id: string; name: string }>;
    selectedInstagramWithNames?: Array<{ id: string; name: string }>;
    allPages?: MetaAssets['pages'];
    allAdAccounts?: MetaAssets['adAccounts'];
    allInstagramAccounts?: MetaAssets['instagramAccounts'];
  }) => void;
  onError?: (error: string) => void;
}

export function MetaAssetSelector({
  sessionId,
  onSelectionChange,
  onError,
}: MetaAssetSelectorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [assets, setAssets] = useState<MetaAssets | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedAdAccounts, setSelectedAdAccounts] = useState<Set<string>>(new Set());
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [selectedInstagram, setSelectedInstagram] = useState<Set<string>>(new Set());

  // Track if we've already captured the event (to avoid duplicates)
  const hasTrackedSelection = useRef(false);

  // Fetch assets from backend
  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/api/client-assets/${sessionId}/meta_ads`);
      const json = await response.json();

      if (json.error) {
        throw new Error(json.error.message || 'Failed to load accounts');
      }

      const fetchedAssets = json.data || { adAccounts: [], pages: [], instagramAccounts: [] };
      setAssets(fetchedAssets);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load accounts';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch assets on mount
  useEffect(() => {
    if (sessionId) {
      fetchAssets();
    }
  }, [sessionId]);

  // Notify parent of changes
  useEffect(() => {
    // Include full asset objects for grant step
    const selectedPagesWithNames = Array.from(selectedPages).map((id) => {
      const page = assets?.pages.find((p) => p.id === id);
      return page ? { id: page.id, name: page.name } : { id, name: id };
    });
    
    const selectedAdAccountsWithNames = Array.from(selectedAdAccounts).map((id) => {
      const account = assets?.adAccounts.find((a) => a.id === id);
      return account ? { id: account.id, name: account.name } : { id, name: id };
    });
    
    const selectedInstagramWithNames = Array.from(selectedInstagram).map((id) => {
      const account = assets?.instagramAccounts.find((a) => a.id === id);
      return account ? { id: account.id, name: account.username || account.name || id } : { id, name: id };
    });

    // Track meta_assets_selected when selection changes (debounced)
    const totalSelected = selectedAdAccounts.size + selectedPages.size + selectedInstagram.size;
    if (totalSelected > 0 && !hasTrackedSelection.current) {
      // Debounce the tracking to avoid spamming events
      const timeoutId = setTimeout(() => {
        posthog.capture('meta_assets_selected', {
          session_id: sessionId,
          ad_accounts_selected: selectedAdAccounts.size,
          pages_selected: selectedPages.size,
          instagram_accounts_selected: selectedInstagram.size,
          total_selected: totalSelected,
          available_ad_accounts: assets?.adAccounts?.length || 0,
          available_pages: assets?.pages?.length || 0,
          available_instagram: assets?.instagramAccounts?.length || 0,
        });
        hasTrackedSelection.current = true;
      }, 2000); // Wait 2 seconds after last selection change

      return () => clearTimeout(timeoutId);
    }

    onSelectionChange({
      adAccounts: Array.from(selectedAdAccounts),
      pages: Array.from(selectedPages),
      instagramAccounts: Array.from(selectedInstagram),
      // Include full objects for grant step
      selectedPagesWithNames,
      selectedAdAccountsWithNames,
      selectedInstagramWithNames,
      // Store all assets for lookup
      allPages: assets?.pages || [],
      allAdAccounts: assets?.adAccounts || [],
      allInstagramAccounts: assets?.instagramAccounts || [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAdAccounts, selectedPages, selectedInstagram, assets]);

  // Loading state
  if (isLoading) {
    return (
      <AssetSelectorLoading
        message="Finding your ad accounts, pages, and Instagram accounts..."
      />
    );
  }

  // Error state
  if (error) {
    return (
      <AssetSelectorError
        title="Couldn't load Meta accounts"
        message={error}
        onRetry={fetchAssets}
      />
    );
  }

  // Convert assets to Asset format (for Instagram) and MultiSelectOption format (for Ad Accounts and Pages)
  const adAccountAssets = (assets?.adAccounts || []).map((account) => ({
    id: account.id,
    name: account.name,
    description: account.status || account.currency || '',
  }));

  const pageAssets = (assets?.pages || []).map((page) => ({
    id: page.id,
    name: page.name,
    description: page.category || '',
  }));

  const instagramAssets: Asset[] = (assets?.instagramAccounts || []).map((account) => ({
    id: account.id,
    name: account.username || account.name || account.id,
    metadata: {
      id: account.id,
      avatar: account.avatar,
    },
  }));

  const totalSelected = selectedAdAccounts.size + selectedPages.size + selectedInstagram.size;

  return (
    <div className="space-y-6">
      {/* Selection Summary */}
      <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-indigo-900">
              Selected
            </h3>
            <p className="text-xs text-indigo-700 mt-0.5">
              Accounts you're sharing
            </p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white">
            <span className="text-xl font-bold">{totalSelected}</span>
          </div>
        </div>
      </div>

      {/* Asset Groups */}
      <div className="space-y-6">
        {/* Ad Accounts - Multi-select Combobox */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-white text-lg">💼</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Ad Accounts</h3>
              <p className="text-sm text-slate-600 mt-0.5">
                {selectedAdAccounts.size} of {adAccountAssets.length} selected
              </p>
            </div>
          </div>
          <MultiSelectCombobox
            options={adAccountAssets.map((asset) => ({
              id: asset.id,
              name: asset.name,
              description: asset.description,
            }))}
            selectedIds={selectedAdAccounts}
            onSelectionChange={setSelectedAdAccounts}
            placeholder="Select ad accounts..."
          />
        </div>

        {/* Pages - Multi-select Combobox */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-lg">📄</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Pages</h3>
              <p className="text-sm text-slate-600 mt-0.5">
                {selectedPages.size} of {pageAssets.length} selected
              </p>
            </div>
          </div>
          <MultiSelectCombobox
            options={pageAssets.map((asset) => ({
              id: asset.id,
              name: asset.name,
              description: asset.description,
            }))}
            selectedIds={selectedPages}
            onSelectionChange={setSelectedPages}
            placeholder="Select pages..."
          />
        </div>

        {/* Instagram Accounts - Keep as AssetGroup for now */}
        <AssetGroup
          title="Instagram Accounts"
          assets={instagramAssets}
          selectedIds={selectedInstagram}
          onSelectionChange={setSelectedInstagram}
          icon={
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-lg">📷</span>
            </div>
          }
          defaultExpanded={instagramAssets.length > 0}
        />
      </div>
    </div>
  );
}
