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

import { useState, useEffect } from 'react';
import { AssetGroup, type Asset } from './AssetGroup';
import { Loader2 } from 'lucide-react';

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
    onSelectionChange({
      adAccounts: Array.from(selectedAdAccounts),
      pages: Array.from(selectedPages),
      instagramAccounts: Array.from(selectedInstagram),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAdAccounts, selectedPages, selectedInstagram]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-900">
              Loading your accounts
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Finding ad accounts, pages, and Instagram accounts
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h3 className="text-lg font-bold text-red-900 mb-2">Couldn't load accounts</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={fetchAssets}
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  // Convert assets to Asset format
  const adAccountAssets: Asset[] = (assets?.adAccounts || []).map((account) => ({
    id: account.id,
    name: account.name,
    description: account.status || account.currency || '',
  }));

  const pageAssets: Asset[] = (assets?.pages || []).map((page) => ({
    id: page.id,
    name: page.name,
    description: page.category || '',
  }));

  const instagramAssets: Asset[] = (assets?.instagramAccounts || []).map((account) => ({
    id: account.id,
    name: account.username || account.name || account.id,
    description: account.name || '',
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
        <AssetGroup
          title="Ad Accounts"
          assets={adAccountAssets}
          selectedIds={selectedAdAccounts}
          onSelectionChange={setSelectedAdAccounts}
          icon={
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-white text-lg">💼</span>
            </div>
          }
        />

        <AssetGroup
          title="Pages"
          assets={pageAssets}
          selectedIds={selectedPages}
          onSelectionChange={setSelectedPages}
          icon={
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-lg">📄</span>
            </div>
          }
        />

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
