'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  GoogleAssetSettings,
  GoogleAdsAccount,
  GoogleAnalyticsProperty,
  GoogleBusinessAccount,
  GoogleTagManagerContainer,
  GoogleSearchConsoleSite,
  GoogleMerchantCenterAccount,
  GoogleAccountsResponse
} from '@agency-platform/shared';
import { PlatformIcon } from './ui/platform-icon';
import { 
  Loader2, 
  ChevronUp,
  ChevronDown,
  Trash2,
  X,
  AlertCircle,
  Info,
  CircleDollarSign,
  BarChart3,
  MapPin,
  Tags,
  Search,
  ShoppingBag
} from 'lucide-react';

interface GoogleUnifiedSettingsProps {
  agencyId: string;
  onDisconnect?: () => void;
}

export function GoogleUnifiedSettings({ agencyId, onDisconnect }: GoogleUnifiedSettingsProps) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(true);
  const [settings, setSettings] = useState<GoogleAssetSettings | null>(null);

  // Fetch all Google accounts across products
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['google-accounts', agencyId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/google/accounts?agencyId=${agencyId}`
      );
      if (!response.ok) throw new Error('Failed to fetch Google accounts');
      const result = await response.json();
      return result.data as GoogleAccountsResponse;
    },
  });

  // Fetch current asset settings
  const { data: initialSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['google-asset-settings', agencyId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/google/asset-settings?agencyId=${agencyId}`
      );
      if (!response.ok) throw new Error('Failed to fetch Google settings');
      const json = await response.json();
      return json.data as GoogleAssetSettings;
    },
  });

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  // Save Settings Mutation
  const { mutate: saveSettings, isPending: isSavingSettings } = useMutation({
    mutationFn: async (newSettings: GoogleAssetSettings) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/google/asset-settings`, {
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
      queryClient.invalidateQueries({ queryKey: ['google-asset-settings', agencyId] });
    },
  });

  // Save Account Selection Mutation
  const { mutate: saveAccount } = useMutation({
    mutationFn: async ({ product, accountId, accountName }: { product: string; accountId: string; accountName: string }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/google/account`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId,
          product,
          accountId,
          accountName,
        }),
      });
      if (!response.ok) throw new Error('Failed to save account selection');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-connections', agencyId] });
    },
  });

  const isLoading = isLoadingAccounts || isLoadingSettings;

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
        Failed to load Google settings
      </div>
    );
  }

  // Count enabled assets for summary
  const enabledProducts = [
    settings.googleAds.enabled && 'Ads',
    settings.googleAnalytics.enabled && 'Analytics',
    settings.googleBusinessProfile.enabled && 'Business Profile',
    settings.googleTagManager.enabled && 'Tag Manager',
    settings.googleSearchConsole.enabled && 'Search Console',
    settings.googleMerchantCenter.enabled && 'Merchant Center',
  ].filter(Boolean);
  
  const productSummary = enabledProducts.length > 0 
    ? `${enabledProducts[0]}${enabledProducts.length > 1 ? `, +${enabledProducts.length - 1}` : ''}`
    : 'No products';

  const updateSetting = (key: keyof GoogleAssetSettings, field: string, value: any) => {
    const newSettings = {
      ...settings,
      [key]: { ...settings[key], [field]: value }
    };
    setSettings(newSettings);
    // Auto-save on change
    saveSettings(newSettings);
  };

  const handleAccountSelect = (product: keyof GoogleAssetSettings, accountId: string, accountName: string) => {
    const idField = product === 'googleAnalytics' ? 'propertyId' : 
                    product === 'googleBusinessProfile' ? 'locationId' :
                    product === 'googleTagManager' ? 'containerId' :
                    product === 'googleSearchConsole' ? 'siteUrl' : 'accountId';
    
    updateSetting(product, idField, accountId);
    saveAccount({ product, accountId, accountName });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded p-1 border border-slate-100">
            <PlatformIcon platform="google" size="sm" />
          </div>
          <span className="font-medium text-slate-900">Google {productSummary}</span>
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
          <div className="space-y-4">
            {/* Google Ads */}
            <ProductCard
              icon={<CircleDollarSign className="w-5 h-5 text-blue-600" />}
              label="Google Ads Account"
              enabled={settings.googleAds.enabled}
              onToggle={(val) => updateSetting('googleAds', 'enabled', val)}
              accounts={accountsData?.adsAccounts || []}
              selectedId={settings.googleAds.accountId}
              onAccountSelect={(id, name) => handleAccountSelect('googleAds', id, name)}
              placeholder="Select Ads Account..."
            />

            {/* Google Analytics */}
            <ProductCard
              icon={<BarChart3 className="w-5 h-5 text-orange-500" />}
              label="Google Analytics Account"
              enabled={settings.googleAnalytics.enabled}
              onToggle={(val) => updateSetting('googleAnalytics', 'enabled', val)}
              accounts={accountsData?.analyticsProperties || []}
              selectedId={settings.googleAnalytics.propertyId}
              onAccountSelect={(id, name) => handleAccountSelect('googleAnalytics', id, name)}
              placeholder="Select GA4 Property..."
              requestManageUsers={settings.googleAnalytics.requestManageUsers}
              onRequestManageUsersToggle={(val) => updateSetting('googleAnalytics', 'requestManageUsers', val)}
              tooltip="Enable setting to request Administrator access (instead of Editor access)"
            />

            {/* Google Business Profile */}
            <ProductCard
              icon={<MapPin className="w-5 h-5 text-blue-500" />}
              label="Google Business Profile Location"
              enabled={settings.googleBusinessProfile.enabled}
              onToggle={(val) => updateSetting('googleBusinessProfile', 'enabled', val)}
              accounts={accountsData?.businessAccounts || []}
              selectedId={settings.googleBusinessProfile.locationId}
              onAccountSelect={(id, name) => handleAccountSelect('googleBusinessProfile', id, name)}
              placeholder="Select Business Location..."
              requestManageUsers={settings.googleBusinessProfile.requestManageUsers}
              onRequestManageUsersToggle={(val) => updateSetting('googleBusinessProfile', 'requestManageUsers', val)}
              tooltip="Enable setting to request Owner access (instead of Manager access)"
            />

            {/* Google Tag Manager */}
            <ProductCard
              icon={<Tags className="w-5 h-5 text-blue-400" />}
              label="Google Tag Manager"
              enabled={settings.googleTagManager.enabled}
              onToggle={(val) => updateSetting('googleTagManager', 'enabled', val)}
              accounts={accountsData?.tagManagerContainers || []}
              selectedId={settings.googleTagManager.containerId}
              onAccountSelect={(id, name) => handleAccountSelect('googleTagManager', id, name)}
              placeholder="Select TGM Container..."
              requestManageUsers={settings.googleTagManager.requestManageUsers}
              onRequestManageUsersToggle={(val) => updateSetting('googleTagManager', 'requestManageUsers', val)}
              tooltip="Enable setting to request Administrator access (instead of User access)"
            />

            {/* Google Search Console */}
            <ProductCard
              icon={<Search className="w-5 h-5 text-slate-500" />}
              label="Google Search Console"
              enabled={settings.googleSearchConsole.enabled}
              onToggle={(val) => updateSetting('googleSearchConsole', 'enabled', val)}
              accounts={accountsData?.searchConsoleSites || []}
              selectedId={settings.googleSearchConsole.siteUrl}
              onAccountSelect={(id, name) => handleAccountSelect('googleSearchConsole', id, name)}
              placeholder="Select Search Console Site..."
              requestManageUsers={settings.googleSearchConsole.requestManageUsers}
              onRequestManageUsersToggle={(val) => updateSetting('googleSearchConsole', 'requestManageUsers', val)}
              tooltip="Enable setting to request Owner access (instead of Full access)"
            />

            {/* Google Merchant Center */}
            <ProductCard
              icon={<ShoppingBag className="w-5 h-5 text-red-500" />}
              label="Google Merchant Center"
              enabled={settings.googleMerchantCenter.enabled}
              onToggle={(val) => updateSetting('googleMerchantCenter', 'enabled', val)}
              accounts={accountsData?.merchantCenterAccounts || []}
              selectedId={settings.googleMerchantCenter.accountId}
              onAccountSelect={(id, name) => handleAccountSelect('googleMerchantCenter', id, name)}
              placeholder="Select Merchant Account..."
              requestManageUsers={settings.googleMerchantCenter.requestManageUsers}
              onRequestManageUsersToggle={(val) => updateSetting('googleMerchantCenter', 'requestManageUsers', val)}
              tooltip="Enable setting to request Super Admin access (instead of Standard access)"
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface ProductCardProps {
  icon: React.ReactNode;
  label: string;
  enabled: boolean;
  onToggle: (val: boolean) => void;
  accounts: any[];
  selectedId?: string;
  onAccountSelect: (id: string, name: string) => void;
  placeholder: string;
  requestManageUsers?: boolean;
  onRequestManageUsersToggle?: (val: boolean) => void;
  tooltip?: string;
}

function ProductCard({
  icon,
  label,
  enabled,
  onToggle,
  accounts,
  selectedId,
  onAccountSelect,
  placeholder,
  requestManageUsers,
  onRequestManageUsersToggle,
  tooltip,
}: ProductCardProps) {
  return (
    <div className={`p-4 rounded-lg border transition-all ${enabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-0.5"
        />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium text-slate-900">{label}</span>
          </div>

          {enabled && (
            <div className="space-y-3">
              <div className="relative">
                <select
                  value={selectedId || ''}
                  onChange={(e) => {
                    const account = accounts.find(a => (a.id || a.url) === e.target.value);
                    if (account) {
                      onAccountSelect(e.target.value, account.name || account.displayName || account.url);
                    }
                  }}
                  className="w-full px-3 py-2 pr-10 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                >
                  <option value="">{placeholder}</option>
                  {accounts.map((account) => {
                    const id = account.id || account.url;
                    const name = account.name || account.displayName || account.url;
                    return (
                      <option key={id} value={id}>
                        {name} ({id})
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>

              {onRequestManageUsersToggle && (
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id={`manage-users-${label}`}
                    checked={requestManageUsers || false}
                    onChange={(e) => onRequestManageUsersToggle(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <label htmlFor={`manage-users-${label}`} className="text-xs text-slate-700 cursor-pointer flex items-center gap-1">
                      Request permission to manage users
                      {tooltip && (
                        <div className="group relative">
                          <Info className="h-3 w-3 text-slate-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {tooltip}
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

