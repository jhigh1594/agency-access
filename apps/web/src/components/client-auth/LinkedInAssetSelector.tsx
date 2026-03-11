'use client';

import { useEffect, useState } from 'react';
import { AssetGroup, type Asset } from './AssetGroup';
import {
  AssetSelectorEmpty,
  AssetSelectorError,
  AssetSelectorLoading,
} from './AssetSelectorStates';

interface LinkedInAsset {
  id: string;
  name: string;
  reference?: string;
  urn?: string;
  vanityName?: string;
  status?: string;
  type?: string;
}

interface LinkedInAssetSelectorProps {
  sessionId: string;
  accessRequestToken: string;
  product: string;
  onSelectionChange: (selectedAssets: {
    adAccounts?: string[];
    pages?: string[];
    availableAssetCount?: number;
  }) => void;
  onError?: (error: string) => void;
}

export function LinkedInAssetSelector({
  sessionId,
  accessRequestToken,
  product,
  onSelectionChange,
  onError,
}: LinkedInAssetSelectorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [assets, setAssets] = useState<LinkedInAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(
        `${apiUrl}/api/client/${accessRequestToken}/assets/${product}?connectionId=${encodeURIComponent(sessionId)}`
      );
      const json = await response.json();

      if (json.error) {
        throw new Error(
          json.error.message ||
            (product === 'linkedin_pages'
              ? 'Failed to load LinkedIn Pages'
              : 'Failed to load ad accounts')
        );
      }

      setAssets(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : product === 'linkedin_pages'
            ? 'Failed to load LinkedIn Pages'
            : 'Failed to load ad accounts';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchAssets();
    }
  }, [sessionId, accessRequestToken, product]);

  useEffect(() => {
    if (product === 'linkedin_pages') {
      onSelectionChange({
        pages: Array.from(selectedIds),
        availableAssetCount: assets.length,
      });
      return;
    }

    onSelectionChange({
      adAccounts: Array.from(selectedIds),
      availableAssetCount: assets.length,
    });
  }, [assets.length, onSelectionChange, product, selectedIds]);

  const isPagesProduct = product === 'linkedin_pages';

  if (isLoading) {
    return (
      <AssetSelectorLoading
        message={
          isPagesProduct ? 'Loading your LinkedIn Pages...' : 'Loading your LinkedIn ad accounts...'
        }
      />
    );
  }

  if (error) {
    return (
      <AssetSelectorError
        title={isPagesProduct ? "Couldn't load LinkedIn Pages" : "Couldn't load LinkedIn ad accounts"}
        message={error}
        onRetry={fetchAssets}
      />
    );
  }

  if (assets.length === 0) {
    return (
      <AssetSelectorEmpty
        title={isPagesProduct ? 'No LinkedIn Pages found' : 'No LinkedIn ad accounts found'}
        description={
          isPagesProduct
            ? "We couldn't find any LinkedIn Pages you can administer with this login."
            : "We couldn't find any Campaign Manager accounts for this LinkedIn login."
        }
      />
    );
  }

  const assetList: Asset[] = assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    description: asset.status || asset.type || asset.vanityName || asset.urn || asset.reference || '',
  }));

  return (
    <div className="space-y-6">
      <div className="bg-[var(--coral)]/10 border-2 border-black dark:border-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wide">
              Selected
            </h3>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">
              {isPagesProduct ? "LinkedIn Pages you're sharing" : "LinkedIn ad accounts you're sharing"}
            </p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 border-2 border-black dark:border-white bg-[var(--coral)] text-white">
            <span className="text-xl font-bold">{selectedIds.size}</span>
          </div>
        </div>
      </div>

      <AssetGroup
        title={isPagesProduct ? 'LinkedIn Pages' : 'Campaign Manager Accounts'}
        assets={assetList}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        icon={
          <div className="w-10 h-10 border-2 border-black dark:border-white bg-coral flex items-center justify-center">
            <span className="text-white text-lg">in</span>
          </div>
        }
      />
    </div>
  );
}
