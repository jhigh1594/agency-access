'use client';

/**
 * GA4AssetSelector - Asset selection for Google Analytics 4 properties
 */

import { useState, useEffect } from 'react';
import { AssetGroup, type Asset } from './AssetGroup';
import { Loader2 } from 'lucide-react';

interface GA4Assets {
  id: string;
  name: string;
  displayName: string;
  accountName: string;
}

interface GA4AssetSelectorProps {
  sessionId: string;
  onSelectionChange: (selectedAssets: {
    properties: string[];
  }) => void;
  onError?: (error: string) => void;
}

export function GA4AssetSelector({
  sessionId,
  onSelectionChange,
  onError,
}: GA4AssetSelectorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [assets, setAssets] = useState<GA4Assets[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());

  // Fetch assets from backend
  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/api/client-assets/${sessionId}/ga4`);
      const json = await response.json();

      if (json.error) {
        throw new Error(json.error.message || 'Failed to load properties');
      }

      const fetchedProperties = json.data || [];
      setAssets(fetchedProperties);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load properties';
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
      properties: Array.from(selectedProperties),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProperties]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-900">
              Loading your properties
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
        <h3 className="text-lg font-bold text-red-900 mb-2">Couldn't load properties</h3>
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

  // Convert properties to Asset format
  const propertyAssets: Asset[] = assets.map((property) => ({
    id: property.id,
    name: property.displayName || property.name,
    description: property.accountName,
  }));

  const totalSelected = selectedProperties.size;

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-indigo-900">Selected</h3>
            <p className="text-xs text-indigo-700 mt-0.5">
              Properties you're sharing
            </p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white">
            <span className="text-xl font-bold">{totalSelected}</span>
          </div>
        </div>
      </div>

      {propertyAssets.length > 0 ? (
        <AssetGroup
          title="Analytics Properties"
          assets={propertyAssets}
          selectedIds={selectedProperties}
          onSelectionChange={setSelectedProperties}
          icon={
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <span className="text-white text-lg">📈</span>
            </div>
          }
        />
      ) : (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
          <p className="text-slate-600">No GA4 properties found.</p>
        </div>
      )}
    </div>
  );
}

