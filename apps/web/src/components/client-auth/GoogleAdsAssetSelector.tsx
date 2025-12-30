'use client';

/**
 * GoogleAdsAssetSelector - Asset selection for Google Ads platform
 */

import { useState, useEffect } from 'react';
import { AssetGroup, type Asset } from './AssetGroup';
import { Loader2 } from 'lucide-react';

interface GoogleAdsAccount {
  id: string;
  name: string;
  status: string;
}

interface GoogleAdsAssetSelectorProps {
  sessionId: string; // connectionId
  onSelectionChange: (selectedAssets: {
    adAccounts: string[];
  }) => void;
  onError?: (error: string) => void;
}

export function GoogleAdsAssetSelector({
  sessionId,
  onSelectionChange,
  onError,
}: GoogleAdsAssetSelectorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<GoogleAdsAccount[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedAdAccounts, setSelectedAdAccounts] = useState<Set<string>>(new Set());

  // Fetch assets from backend
  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/api/client-assets/${sessionId}/google_ads`);
      const json = await response.json();

      if (json.error) {
        throw new Error(json.error.message || 'Failed to load accounts');
      }

      const fetchedAccounts = json.data || [];
      setAccounts(fetchedAccounts);
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
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAdAccounts]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-900">
              Loading your accounts
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
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

  // Convert accounts to Asset format
  const adAccountAssets: Asset[] = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    description: account.status,
  }));

  const totalSelected = selectedAdAccounts.size;

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-indigo-900">Selected</h3>
            <p className="text-xs text-indigo-700 mt-0.5">
              Accounts you're sharing
            </p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white">
            <span className="text-xl font-bold">{totalSelected}</span>
          </div>
        </div>
      </div>

      {adAccountAssets.length > 0 ? (
        <AssetGroup
          title="Ad Accounts"
          assets={adAccountAssets}
          selectedIds={selectedAdAccounts}
          onSelectionChange={setSelectedAdAccounts}
          icon={
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-white text-lg">📊</span>
            </div>
          }
        />
      ) : (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
          <p className="text-slate-600">No Google Ads accounts found.</p>
        </div>
      )}
    </div>
  );
}

