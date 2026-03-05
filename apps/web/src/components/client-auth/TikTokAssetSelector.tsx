'use client';

import { useEffect, useMemo, useState } from 'react';
import { AssetGroup, type Asset } from './AssetGroup';
import { AssetSelectorEmpty, AssetSelectorError, AssetSelectorLoading } from './AssetSelectorStates';

interface TikTokAdvertiser {
  id: string;
  name: string;
  status?: string;
  businessCenterId?: string;
}

interface TikTokBusinessCenter {
  id: string;
  name: string;
}

interface TikTokBusinessCenterAssetGroup {
  bcId: string;
  advertisers: TikTokAdvertiser[];
}

interface TikTokAssetsResponse {
  advertisers: TikTokAdvertiser[];
  businessCenters: TikTokBusinessCenter[];
  businessCenterAssets: TikTokBusinessCenterAssetGroup[];
}

interface TikTokAssetSelectorProps {
  sessionId: string;
  accessRequestToken: string;
  onSelectionChange: (selectedAssets: {
    adAccounts: string[];
    selectedAdvertiserIds: string[];
    selectedBusinessCenterId?: string;
    availableAdvertisers: TikTokAdvertiser[];
    availableBusinessCenters: TikTokBusinessCenter[];
  }) => void;
  onError?: (error: string) => void;
}

export function TikTokAssetSelector({
  sessionId,
  accessRequestToken,
  onSelectionChange,
  onError,
}: TikTokAssetSelectorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<TikTokAssetsResponse>({
    advertisers: [],
    businessCenters: [],
    businessCenterAssets: [],
  });
  const [selectedAdvertisers, setSelectedAdvertisers] = useState<Set<string>>(new Set());
  const [selectedBusinessCenterId, setSelectedBusinessCenterId] = useState<string>('');

  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(
        `${apiUrl}/api/client/${accessRequestToken}/assets/tiktok?connectionId=${encodeURIComponent(sessionId)}`
      );
      const json = await response.json();

      if (!response.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to load TikTok ad accounts');
      }

      setAssets({
        advertisers: json.data?.advertisers || [],
        businessCenters: json.data?.businessCenters || [],
        businessCenterAssets: json.data?.businessCenterAssets || [],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load TikTok ad accounts';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, accessRequestToken]);

  const visibleAdvertisers = useMemo(() => {
    if (!selectedBusinessCenterId) {
      return assets.advertisers;
    }

    const match = assets.businessCenterAssets.find((item) => item.bcId === selectedBusinessCenterId);
    if (match) {
      return match.advertisers;
    }

    return assets.advertisers.filter(
      (advertiser) => advertiser.businessCenterId === selectedBusinessCenterId
    );
  }, [assets, selectedBusinessCenterId]);

  useEffect(() => {
    onSelectionChange({
      adAccounts: Array.from(selectedAdvertisers),
      selectedAdvertiserIds: Array.from(selectedAdvertisers),
      selectedBusinessCenterId: selectedBusinessCenterId || undefined,
      availableAdvertisers: assets.advertisers,
      availableBusinessCenters: assets.businessCenters,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAdvertisers, selectedBusinessCenterId, assets]);

  if (isLoading) {
    return (
      <AssetSelectorLoading message="Loading your TikTok ad accounts..." />
    );
  }

  if (error) {
    return (
      <AssetSelectorError
        title="Couldn't load TikTok ad accounts"
        message={error}
        onRetry={fetchAssets}
      />
    );
  }

  if (assets.advertisers.length === 0) {
    return (
      <AssetSelectorEmpty
        title="No TikTok ad accounts found"
        description="We couldn't find any authorized TikTok advertisers for this connection."
      />
    );
  }

  const advertiserAssets: Asset[] = visibleAdvertisers.map((advertiser) => ({
    id: advertiser.id,
    name: advertiser.name,
    metadata: {
      id: advertiser.id,
      status: advertiser.status,
    },
  }));

  return (
    <div className="space-y-6">
      <div className="bg-[var(--coral)]/10 border-2 border-black dark:border-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wide">Selected</h3>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">
              TikTok ad accounts you're sharing
            </p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 border-2 border-black dark:border-white bg-[var(--coral)] text-white">
            <span className="text-xl font-bold">{selectedAdvertisers.size}</span>
          </div>
        </div>
      </div>

      {assets.businessCenters.length > 0 && (
        <div className="space-y-2">
          <label
            htmlFor="tiktok-business-center"
            className="block text-sm font-semibold text-ink"
          >
            Business Center
          </label>
          <select
            id="tiktok-business-center"
            value={selectedBusinessCenterId}
            onChange={(event) => setSelectedBusinessCenterId(event.target.value)}
            className="w-full rounded-lg border-2 border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            <option value="">All Business Centers</option>
            {assets.businessCenters.map((businessCenter) => (
              <option key={businessCenter.id} value={businessCenter.id}>
                {businessCenter.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <AssetGroup
        title="TikTok Ad Accounts"
        assets={advertiserAssets}
        selectedIds={selectedAdvertisers}
        onSelectionChange={setSelectedAdvertisers}
        icon={(
          <div className="w-10 h-10 border-2 border-black dark:border-white bg-coral flex items-center justify-center">
            <span className="text-white text-lg">🎵</span>
          </div>
        )}
      />
    </div>
  );
}
