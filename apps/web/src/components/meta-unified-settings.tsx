'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MetaAssetSettings, 
  MetaPermissionLevel,
  MetaPagePermission
} from '@agency-platform/shared';
import { MetaPagePermissionsModal } from './meta-page-permissions-modal';
import { 
  Loader2, 
  ChevronUp,
  ChevronDown,
  Trash2,
  X,
  Facebook, 
  Instagram, 
  ShoppingBag,
  AlertCircle,
  Info,
  AlertTriangle
} from 'lucide-react';

interface MetaUnifiedSettingsProps {
  agencyId: string;
  onDisconnect?: () => void;
}

interface Business {
  id: string;
  name: string;
}

export function MetaUnifiedSettings({ agencyId, onDisconnect }: MetaUnifiedSettingsProps) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(true);
  const [settings, setSettings] = useState<MetaAssetSettings | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>('');
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  // Fetch businesses
  const { data: businessesData, isLoading: isLoadingBusinesses } = useQuery({
    queryKey: ['meta-businesses', agencyId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/meta/business-accounts?agencyId=${agencyId}`
      );
      if (!response.ok) throw new Error('Failed to fetch businesses');
      const result = await response.json();
      return result.data as { businesses: Business[] };
    },
  });

  // Fetch current settings and selected business
  const { data: initialData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['meta-asset-settings', agencyId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/meta/asset-settings?agencyId=${agencyId}`
      );
      if (!response.ok) throw new Error('Failed to fetch settings');
      const json = await response.json();
      return json.data as MetaAssetSettings;
    },
  });

  // Fetch connection to get selected business
  const { data: connectionData } = useQuery({
    queryKey: ['platform-connections', agencyId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/available?agencyId=${agencyId}`
      );
      if (!response.ok) throw new Error('Failed to fetch connections');
      const result = await response.json();
      const metaConnection = result.data?.find((p: any) => p.platform === 'meta' && p.connected);
      return metaConnection;
    },
    enabled: !!agencyId,
  });

  useEffect(() => {
    if (initialData) {
      setSettings(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    if (connectionData?.metadata?.selectedBusinessId) {
      setSelectedBusinessId(connectionData.metadata.selectedBusinessId);
      setSelectedBusinessName(connectionData.metadata.selectedBusinessName || '');
    }
  }, [connectionData]);

  // Save Business Portfolio Mutation
  const { mutate: savePortfolio, isPending: isSavingPortfolio } = useMutation({
    mutationFn: async ({ businessId, businessName }: { businessId: string; businessName: string }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/meta/business`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId,
          businessId,
          businessName,
        }),
      });
      if (!response.ok) throw new Error('Failed to save portfolio');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-connections', agencyId] });
      queryClient.invalidateQueries({ queryKey: ['meta-businesses', agencyId] });
    },
  });

  // Save Settings Mutation
  const { mutate: saveSettings, isPending: isSavingSettings } = useMutation({
    mutationFn: async (newSettings: MetaAssetSettings) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/meta/asset-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId,
          settings: newSettings,
        }),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-asset-settings', agencyId] });
    },
  });

  const businesses = businessesData?.businesses || [];
  const isLoading = isLoadingBusinesses || isLoadingSettings;

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8 text-red-500 text-center">
        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
        Failed to load Meta settings
      </div>
    );
  }

  // Count enabled assets for summary
  const enabledAssets = [
    settings.adAccount.enabled && 'Ad Account',
    settings.page.enabled && 'Page',
    settings.catalog.enabled && 'Catalog',
    settings.dataset.enabled && 'Dataset',
    settings.instagramAccount.enabled && 'Instagram Account',
  ].filter(Boolean);
  const assetSummary = enabledAssets.length > 0 
    ? `${enabledAssets[0]}${enabledAssets.length > 1 ? `, ${enabledAssets[1]}` : ''}${enabledAssets.length > 2 ? `, +${enabledAssets.length - 2}` : ''}`
    : 'No assets';

  const updateSetting = (key: keyof MetaAssetSettings, field: string, value: any) => {
    const newSettings = {
      ...settings,
      [key]: { ...settings[key], [field]: value }
    };
    setSettings(newSettings);
    // Auto-save on change
    saveSettings(newSettings);
  };

  const handleBusinessSelect = (businessId: string) => {
    const business = businesses.find(b => b.id === businessId);
    if (business) {
      setSelectedBusinessId(businessId);
      setSelectedBusinessName(business.name);
      savePortfolio({ businessId: businessId, businessName: business.name });
    }
  };

  const handleClearBusiness = () => {
    setSelectedBusinessId('');
    setSelectedBusinessName('');
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={true}
            readOnly
            className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <img
            src="/meta-color.svg"
            alt="Meta"
            className="w-6 h-6"
          />
          <span className="font-medium text-slate-900">Meta {assetSummary}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-slate-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500" />
            )}
          </button>
          {onDisconnect && (
            <button
              onClick={onDisconnect}
              className="p-1 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="h-5 w-5 text-red-500" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Business Portfolio Selector */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Meta Business Portfolio</h3>
            <div className="relative">
              <select
                value={selectedBusinessId}
                onChange={(e) => handleBusinessSelect(e.target.value)}
                className="w-full px-4 py-3 pr-10 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="">Select a portfolio...</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name} ({business.id})
                  </option>
                ))}
              </select>
              {selectedBusinessId && (
                <button
                  onClick={handleClearBusiness}
                  className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              )}
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Don't see your Business Portfolio? To refresh this list{' '}
              <button 
                onClick={() => window.location.reload()} 
                className="text-indigo-600 font-medium hover:underline"
              >
                log in again
              </button>
            </p>
          </div>

          {/* Asset Cards */}
          <div className="space-y-3">
            {/* Ad Account */}
            <AssetCard
              icon={
                <img
                  src="/meta-color.svg"
                  alt="Meta"
                  className="w-5 h-5"
                />
              }
              label="Ad Account"
              enabled={settings.adAccount.enabled}
              onToggle={(val) => updateSetting('adAccount', 'enabled', val)}
            />

            {/* Page */}
            <AssetCard
              icon={
                <img
                  src="/meta-color.svg"
                  alt="Meta"
                  className="w-5 h-5"
                />
              }
              label={`Page${settings.page.limitPermissions ? '' : ' (all permissions)'}`}
              enabled={settings.page.enabled}
              onToggle={(val) => updateSetting('page', 'enabled', val)}
              extraContent={
                settings.page.enabled && (
                  <button
                    onClick={() => {
                      if (!settings.page.limitPermissions) {
                        // Opening modal to limit permissions
                        setIsPermissionsModalOpen(true);
                      } else {
                        // Clearing limit permissions
                        updateSetting('page', 'limitPermissions', false);
                        updateSetting('page', 'selectedPermissions', undefined);
                      }
                    }}
                    className="text-xs text-indigo-600 font-medium hover:underline mt-1"
                  >
                    {settings.page.limitPermissions ? 'Allow all permissions' : 'Limit permissions'}
                  </button>
                )
              }
            />

            {/* Catalog */}
            <AssetCard
              icon={
                <img
                  src="/meta-color.svg"
                  alt="Meta"
                  className="w-5 h-5"
                />
              }
              label="Catalog"
              enabled={settings.catalog.enabled}
              onToggle={(val) => updateSetting('catalog', 'enabled', val)}
            />

            {/* Dataset */}
            <AssetCard
              icon={
                <img
                  src="/meta-color.svg"
                  alt="Meta"
                  className="w-5 h-5"
                />
              }
              label="Dataset"
              enabled={settings.dataset.enabled}
              onToggle={(val) => updateSetting('dataset', 'enabled', val)}
              extraContent={
                settings.dataset.enabled && (
                  <div className="mt-2 flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="dataset-full-access"
                      checked={settings.dataset.requestFullAccess}
                      onChange={(e) => updateSetting('dataset', 'requestFullAccess', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <label htmlFor="dataset-full-access" className="text-xs text-slate-700 cursor-pointer flex items-center gap-1">
                        Request full Dataset access
                        <Info className="h-3 w-3 text-slate-400" />
                      </label>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enable setting to request full Dataset access within your Business Portfolio
                      </p>
                    </div>
                  </div>
                )
              }
            />

            {/* Instagram Account */}
            <AssetCard
              icon={
                <img
                  src="/meta-color.svg"
                  alt="Meta"
                  className="w-5 h-5"
                />
              }
              label="Instagram Account"
              enabled={settings.instagramAccount.enabled}
              onToggle={(val) => updateSetting('instagramAccount', 'enabled', val)}
              extraContent={
                settings.instagramAccount.enabled && (
                  <div className="mt-2 flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="instagram-full-access"
                      checked={settings.instagramAccount.requestFullAccess}
                      onChange={(e) => updateSetting('instagramAccount', 'requestFullAccess', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <label htmlFor="instagram-full-access" className="text-xs text-slate-700 cursor-pointer flex items-center gap-1">
                        Request full Instagram access
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                      </label>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        This setting will force your clients to manually share Instagram access via their Business Portfolio. You don't need this access to run ads or post Instagram content. Getting this level of access is only required if you're running Instagram Commerce campaigns.{' '}
                        <a href="#" className="text-indigo-600 hover:underline">More info</a>
                      </p>
                    </div>
                  </div>
                )
              }
            />
          </div>
        </div>
      )}

      {/* Meta Page Permissions Modal */}
      <MetaPagePermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        selectedPermissions={settings.page.selectedPermissions || []}
        onSave={(permissions) => {
          updateSetting('page', 'limitPermissions', true);
          updateSetting('page', 'selectedPermissions', permissions);
          setIsPermissionsModalOpen(false);
        }}
        isSaving={isSavingSettings}
      />
    </div>
  );
}

function AssetCard({
  icon,
  label,
  enabled,
  onToggle,
  extraContent,
}: {
  icon: React.ReactNode;
  label: string;
  enabled: boolean;
  onToggle: (val: boolean) => void;
  extraContent?: React.ReactNode;
}) {
  return (
    <div className={`p-4 rounded-lg border transition-all ${enabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-0.5"
          />
          <div className="flex items-center gap-2 text-slate-400">
            {icon}
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-slate-900">{label}</span>
            {extraContent}
          </div>
        </div>
      </div>
    </div>
  );
}

