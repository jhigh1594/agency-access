'use client';

/**
 * GoogleAssetSelector - Generic asset selector for all Google products
 * 
 * Supports:
 * - google_ads: Ad Accounts
 * - ga4: Analytics Properties
 * - google_business_profile: Business Profile Locations
 * - google_tag_manager: Tag Manager Containers
 * - google_search_console: Search Console Sites
 * - google_merchant_center: Merchant Center Accounts
 */

import { useState, useEffect } from 'react';
import { AssetGroup, type Asset } from './AssetGroup';
import { AssetSelectorLoading, AssetSelectorError, AssetSelectorEmpty } from './AssetSelectorStates';

interface GoogleAssetSelectorProps {
  sessionId: string; // connectionId
  accessRequestToken: string;
  product: string; // e.g., 'google_ads', 'ga4', 'google_business_profile', etc.
  onSelectionChange: (selectedAssets: {
    adAccounts?: string[];
    properties?: string[];
    businessAccounts?: string[];
    containers?: string[];
    sites?: string[];
    merchantAccounts?: string[];
  }) => void;
  onError?: (error: string) => void;
}

// Map product IDs to API platform identifiers
const PRODUCT_TO_PLATFORM: Record<string, string> = {
  'google_ads': 'google_ads',
  'ga4': 'ga4',
  'google_business_profile': 'google_business_profile',
  'google_tag_manager': 'google_tag_manager',
  'google_search_console': 'google_search_console',
  'google_merchant_center': 'google_merchant_center',
};

// Map product IDs to asset type keys
const PRODUCT_TO_ASSET_KEY: Record<string, string> = {
  'google_ads': 'adAccounts',
  'ga4': 'properties',
  'google_business_profile': 'businessAccounts',
  'google_tag_manager': 'containers',
  'google_search_console': 'sites',
  'google_merchant_center': 'merchantAccounts',
};

export function GoogleAssetSelector({
  sessionId,
  accessRequestToken,
  product,
  onSelectionChange,
  onError,
}: GoogleAssetSelectorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Get title based on product type (defined early since it's used in early returns)
  const getTitle = () => {
    const titles: Record<string, string> = {
      'google_ads': 'Ad Accounts',
      'ga4': 'Analytics Properties',
      'google_business_profile': 'Business Profile Locations',
      'google_tag_manager': 'Tag Manager Containers',
      'google_search_console': 'Search Console Sites',
      'google_merchant_center': 'Merchant Center Accounts',
    };
    return titles[product] || 'Accounts';
  };

  // Fetch assets from backend
  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const platform = PRODUCT_TO_PLATFORM[product] || product;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(
        `${apiUrl}/api/client/${accessRequestToken}/assets/${platform}?connectionId=${encodeURIComponent(sessionId)}`
      );
      const json = await response.json();

      if (json.error) {
        throw new Error(json.error.message || 'Failed to load accounts');
      }

      // Handle both array responses and object responses
      const fetchedAssets = Array.isArray(json.data) ? json.data : [];
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
  }, [sessionId, product, accessRequestToken]);

  // Notify parent of changes
  useEffect(() => {
    const assetKey = PRODUCT_TO_ASSET_KEY[product];
    if (!assetKey) return;

    const selection: any = {};
    selection[assetKey] = Array.from(selectedIds);
    onSelectionChange(selection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds]);

  if (isLoading) {
    return (
      <AssetSelectorLoading
        message={`Loading your ${getTitle().toLowerCase()}...`}
      />
    );
  }

  if (error) {
    return (
      <AssetSelectorError
        title={`Couldn't load ${getTitle()}`}
        message={error}
        onRetry={fetchAssets}
      />
    );
  }

  // Convert assets to Asset format
  // Prefer displayName over name since 'name' often contains API paths like "properties/123456"
  const assetList: Asset[] = assets.map((asset) => {
    let name: string;
    let description: string = '';

    // Handle different product types with appropriate formatting
    if (product === 'google_tag_manager') {
      // Tag Manager: Show container name, description as account name
      name = asset.name || `Container ${asset.id}`;
      description = asset.accountName ? `Account: ${asset.accountName}` : '';
    } else if (product === 'google_search_console') {
      // Search Console: Show clean URL, description as permission level
      const url = asset.url || asset.id || '';
      // Remove protocol and trailing slash for cleaner display
      name = url.replace(/^https?:\/\//, '').replace(/\/$/, '') || url;
      description = asset.permissionLevel 
        ? `Permission: ${asset.permissionLevel}` 
        : '';
    } else {
      // Other products: Use standard mapping
      name = asset.displayName || asset.name || asset.username || asset.url || `Account ${asset.id}`;
      description = asset.status || asset.accountName || asset.category || asset.permissionLevel || '';
    }

    return {
      id: asset.id,
      name,
      description,
    };
  });

  const totalSelected = selectedIds.size;

  if (assetList.length === 0) {
    return (
      <AssetSelectorEmpty
        title={`No ${getTitle()} found`}
        description={`We couldn't find any ${getTitle().toLowerCase()} for this Google account. You may need to create one first in your Google ${getTitle().includes('Account') ? 'account' : 'product'} center.`}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-indigo-900">Selected</h3>
            <p className="text-xs text-indigo-700 mt-0.5">
              {getTitle()} you're sharing
            </p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white">
            <span className="text-xl font-bold">{totalSelected}</span>
          </div>
        </div>
      </div>

      <AssetGroup
        title={getTitle()}
        assets={assetList}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        icon={
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <span className="text-white text-lg">📊</span>
          </div>
        }
      />
    </div>
  );
}
