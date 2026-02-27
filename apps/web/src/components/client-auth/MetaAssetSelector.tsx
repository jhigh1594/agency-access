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
import { AssetSelectorLoading, AssetSelectorError, AssetSelectorEmpty } from './AssetSelectorStates';
import { MetaAssetCreator } from './MetaAssetCreator';
import { GuidedRedirectCard } from './GuidedRedirectModal';
import { Plus, ExternalLink } from 'lucide-react';

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
  accessRequestToken: string;
  businessId?: string; // Business Manager ID for creating assets
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
  accessRequestToken,
  businessId,
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

  // Creation UI state
  const [showAdAccountCreator, setShowAdAccountCreator] = useState(false);
  const [showPageCreator, setShowPageCreator] = useState(false);

  // Track if we've already captured the event (to avoid duplicates)
  const hasTrackedSelection = useRef(false);

  // Handle successful ad account creation - auto-select and refresh
  const handleAdAccountCreated = (newAccount: { id: string; name: string }) => {
    // Refresh assets to get the updated list
    fetchAssets().then(() => {
      // Auto-select the newly created account
      setSelectedAdAccounts(prev => new Set([...prev, newAccount.id]));
      setShowAdAccountCreator(false);
    });
  };

  // Handle page creation - refresh list
  const handlePageCreated = () => {
    fetchAssets().then(() => {
      setShowPageCreator(false);
    });
  };
  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(
        `${apiUrl}/api/client/${accessRequestToken}/assets/meta_ads?connectionId=${encodeURIComponent(sessionId)}`
      );
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
  }, [sessionId, accessRequestToken]);

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
      {/* Selection Summary - Brutalist Style */}
      <div className="bg-[var(--coral)]/10 border-2 border-black dark:border-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wide">
              Selected
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Accounts you're sharing
            </p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 border-2 border-black dark:border-white bg-[var(--coral)] text-white">
            <span className="text-xl font-bold">{totalSelected}</span>
          </div>
        </div>
      </div>

      {/* Asset Groups */}
      <div className="space-y-6">
        {/* Ad Accounts - Multi-select Combobox or Creator */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 border-2 border-black dark:border-white bg-blue-500 flex items-center justify-center">
              <span className="text-white text-lg">💼</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--ink)] font-display">Ad Accounts</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                {selectedAdAccounts.size} of {adAccountAssets.length} selected
              </p>
            </div>
          </div>

          {/* Show creator if empty and user clicked "Create New" */}
          {showAdAccountCreator && businessId ? (
            <div className="border-2 border-[var(--coral)] bg-[var(--coral)]/5 p-4 rounded-lg mb-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-[var(--ink)]">Create New Ad Account</h4>
                <button
                  onClick={() => setShowAdAccountCreator(false)}
                  className="text-sm text-slate-500 hover:text-[var(--coral)] underline"
                >
                  Cancel
                </button>
              </div>
              <MetaAssetCreator
                connectionId={sessionId}
                businessId={businessId}
                accessRequestToken={accessRequestToken}
                onSuccess={handleAdAccountCreated}
                onError={onError}
              />
            </div>
          ) : adAccountAssets.length > 0 ? (
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
          ) : (
            /* Empty state with create option */
            <div className="py-8 text-center px-6">
              {/* Empty state icon - Brutalist Square */}
              <div className="w-20 h-20 border-2 border-black dark:border-white bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl" role="img" aria-label="Empty">
                  📭
                </span>
              </div>

              {/* Message */}
              <h3 className="text-lg font-bold text-[var(--ink)] mb-2 font-display">No Ad Accounts Found</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-sm mx-auto">
                You don't have any ad accounts in this Business Manager yet. Create one to get started.
              </p>

              {/* Create button */}
              {businessId ? (
                <button
                  onClick={() => setShowAdAccountCreator(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--coral)] text-white border-2 border-black dark:border-white rounded-[0.75rem] font-bold uppercase tracking-wide shadow-brutalist hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all min-h-[48px]"
                >
                  <Plus className="w-5 h-5" />
                  Create Ad Account
                </button>
              ) : (
                <div className="border-2 border-[var(--warning)] bg-[var(--warning)]/10 p-4 text-sm text-[var(--warning)] max-w-sm mx-auto">
                  Business Manager ID is required to create ad accounts. Please contact support.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pages - Multi-select Combobox or Guided Redirect */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 border-2 border-black dark:border-white bg-indigo-500 flex items-center justify-center">
              <span className="text-white text-lg">📄</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--ink)] font-display">Pages</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                {selectedPages.size} of {pageAssets.length} selected
              </p>
            </div>
          </div>

          {/* Show guided redirect if empty */}
          {pageAssets.length > 0 ? (
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
          ) : showPageCreator ? (
            /* Guided redirect card */
            <GuidedRedirectCard
              title="Create a Facebook Page"
              description="Pages must be created in Meta Business Manager. Follow these steps:"
              businessManagerUrl={`https://business.facebook.com/settings/${businessId}/pages`}
              instructions={[
                { title: 'Click the button below to open Meta Business Manager', description: 'A new tab will open' },
                { title: 'Click "Add a Page" or "Create a New Page"', description: 'Choose to create a new page or add an existing one' },
                { title: 'Follow the prompts to set up your page', description: 'Add name, category, and description' },
                { title: 'Return here and click "Refresh List"', description: 'Your new page will appear in the list' },
              ]}
              onRefresh={handlePageCreated}
            />
          ) : (
            /* Empty state with create option */
            <div className="py-8 text-center px-6">
              {/* Empty state icon - Brutalist Square */}
              <div className="w-20 h-20 border-2 border-black dark:border-white bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl" role="img" aria-label="Empty">
                  📄
                </span>
              </div>

              {/* Message */}
              <h3 className="text-lg font-bold text-[var(--ink)] mb-2 font-display">No Pages Found</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-sm mx-auto">
                You don't have any Facebook Pages in this Business Manager. Create one to get started.
              </p>

              {/* Create button */}
              <button
                onClick={() => setShowPageCreator(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--coral)] text-white border-2 border-black dark:border-white rounded-[0.75rem] font-bold uppercase tracking-wide shadow-brutalist hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all min-h-[48px]"
              >
                <Plus className="w-5 h-5" />
                Create Page
              </button>
            </div>
          )}
        </div>

        {/* Instagram Accounts - Keep as AssetGroup for now */}
        <AssetGroup
          title="Instagram Accounts"
          assets={instagramAssets}
          selectedIds={selectedInstagram}
          onSelectionChange={setSelectedInstagram}
          icon={
            <div className="w-10 h-10 border-2 border-black dark:border-white bg-pink-500 flex items-center justify-center">
              <span className="text-white text-lg">📷</span>
            </div>
          }
          defaultExpanded={instagramAssets.length > 0}
        />
      </div>
    </div>
  );
}
