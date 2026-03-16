'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { 
  getDefaultGoogleAssetSettings,
  type GoogleAdsGrantMode,
  GoogleAssetSettings,
  GoogleAccountsResponse
} from '@agency-platform/shared';
import { getGoogleAdsAccountLabel } from '@/lib/google-ads-account-label';
import { ManageAssetsSectionCard, ManageAssetsStatusPanel } from './manage-assets-ui';
import { Button } from './ui/button';
import { SingleSelect } from './ui/single-select';
import { 
  Loader2, 
  AlertCircle,
  Info,
  CircleDollarSign,
  BarChart3,
  MapPin,
  Tags,
  Search,
  ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoogleUnifiedSettingsProps {
  agencyId: string;
}

type GoogleSettingsProductKey = Exclude<keyof GoogleAssetSettings, 'googleAdsManagement'>;

function mergeGoogleSettings(settings: GoogleAssetSettings | null | undefined): GoogleAssetSettings | null {
  if (!settings) {
    return null;
  }

  const defaults = getDefaultGoogleAssetSettings();
  const mergedGoogleAdsManagement = {
    preferredGrantMode:
      settings.googleAdsManagement?.preferredGrantMode ||
      defaults.googleAdsManagement?.preferredGrantMode ||
      'user_invite',
    ...(defaults.googleAdsManagement?.inviteEmail
      ? { inviteEmail: defaults.googleAdsManagement.inviteEmail }
      : {}),
    ...(settings.googleAdsManagement?.inviteEmail
      ? { inviteEmail: settings.googleAdsManagement.inviteEmail }
      : {}),
    ...(settings.googleAdsManagement?.managerCustomerId
      ? { managerCustomerId: settings.googleAdsManagement.managerCustomerId }
      : {}),
    ...(settings.googleAdsManagement?.managerAccountLabel
      ? { managerAccountLabel: settings.googleAdsManagement.managerAccountLabel }
      : {}),
  };

  return {
    ...defaults,
    ...settings,
    googleAdsManagement: mergedGoogleAdsManagement,
    googleAds: {
      ...defaults.googleAds,
      ...settings.googleAds,
    },
    googleAnalytics: {
      ...defaults.googleAnalytics,
      ...settings.googleAnalytics,
    },
    googleBusinessProfile: {
      ...defaults.googleBusinessProfile,
      ...settings.googleBusinessProfile,
    },
    googleTagManager: {
      ...defaults.googleTagManager,
      ...settings.googleTagManager,
    },
    googleSearchConsole: {
      ...defaults.googleSearchConsole,
      ...settings.googleSearchConsole,
    },
    googleMerchantCenter: {
      ...defaults.googleMerchantCenter,
      ...settings.googleMerchantCenter,
    },
  };
}

export function GoogleUnifiedSettings({ agencyId }: GoogleUnifiedSettingsProps) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const [settings, setSettings] = useState<GoogleAssetSettings | null>(null);

  // Fetch all Google accounts across products
  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    error: accountsError,
  } = useQuery({
    queryKey: ['google-accounts', agencyId],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(
        // Always refresh from Google APIs when opening Manage Assets so we don't rely on cached metadata.
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/google/accounts?agencyId=${agencyId}&refresh=true`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch Google accounts');
      const result = await response.json();
      return result.data as GoogleAccountsResponse;
    },
    // Avoid hammering Google APIs on focus/re-mount.
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch current asset settings
  const { data: initialSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['google-asset-settings', agencyId],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/google/asset-settings?agencyId=${agencyId}`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch Google settings');
      const json = await response.json();
      return json.data as GoogleAssetSettings;
    },
  });

  useEffect(() => {
    if (initialSettings) {
      setSettings(mergeGoogleSettings(initialSettings));
    }
  }, [initialSettings]);

  // Save Settings Mutation
  const { mutate: saveSettings, isPending: isSavingSettings } = useMutation({
    mutationFn: async (newSettings: GoogleAssetSettings) => {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/google/asset-settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
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
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/google/account`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
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
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8 text-coral text-center">
        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
        Failed to load Google settings
      </div>
    );
  }

  if (accountsError) {
    return (
      <div className="p-8 text-coral text-center">
        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
        Failed to load Google accounts
      </div>
    );
  }

  const updateSetting = (key: GoogleSettingsProductKey, field: string, value: any) => {
    const newSettings = {
      ...settings,
      [key]: { ...settings[key], [field]: value }
    };
    setSettings(newSettings);
    // Auto-save on change
    saveSettings(newSettings);
  };

  const updateGoogleAdsManagement = (updates: Record<string, any>) => {
    if (!settings) return;

    const nextGoogleAdsManagement = {
      preferredGrantMode: settings.googleAdsManagement?.preferredGrantMode || 'user_invite',
      ...(settings.googleAdsManagement?.inviteEmail
        ? { inviteEmail: settings.googleAdsManagement.inviteEmail }
        : {}),
      ...(settings.googleAdsManagement?.managerCustomerId
        ? { managerCustomerId: settings.googleAdsManagement.managerCustomerId }
        : {}),
      ...(settings.googleAdsManagement?.managerAccountLabel
        ? { managerAccountLabel: settings.googleAdsManagement.managerAccountLabel }
        : {}),
      ...updates,
    };

    const newSettings: GoogleAssetSettings = {
      ...settings,
      googleAdsManagement: nextGoogleAdsManagement,
    };

    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const setAllProductsEnabled = (enabled: boolean) => {
    if (!settings) return;
    const newSettings: GoogleAssetSettings = {
      ...settings,
      googleAds: { ...settings.googleAds, enabled },
      googleAnalytics: { ...settings.googleAnalytics, enabled },
      googleBusinessProfile: { ...settings.googleBusinessProfile, enabled },
      googleTagManager: { ...settings.googleTagManager, enabled },
      googleSearchConsole: { ...settings.googleSearchConsole, enabled },
      googleMerchantCenter: { ...settings.googleMerchantCenter, enabled },
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleAccountSelect = (product: GoogleSettingsProductKey, accountId: string, accountName: string) => {
    const idField = product === 'googleAnalytics' ? 'propertyId' : 
                    product === 'googleBusinessProfile' ? 'locationId' :
                    product === 'googleTagManager' ? 'containerId' :
                    product === 'googleSearchConsole' ? 'siteUrl' : 'accountId';
    
    updateSetting(product, idField, accountId);
    saveAccount({ product, accountId, accountName });
  };

  const hasActiveGoogleAdsSelection = Boolean(
    settings.googleAds.accountId &&
      (accountsData?.adsAccounts || []).some((account) => account.id === settings.googleAds.accountId)
  );
  const staleGoogleAdsAccountId =
    settings.googleAds.accountId && !hasActiveGoogleAdsSelection
      ? settings.googleAds.accountId
      : null;
  const managerAccounts = (accountsData?.adsAccounts || []).filter((account) => account.isManager);
  const googleAdsManagement = settings.googleAdsManagement || getDefaultGoogleAssetSettings().googleAdsManagement!;
  const googleAdsGrantModeOptions = [
    { value: 'manager_link', label: 'Manager account (MCC)' },
    { value: 'user_invite', label: 'Direct user invite' },
  ];

  return (
    <div className="space-y-6">
      <ManageAssetsSectionCard
        eyebrow="Access defaults"
        title="Google Ads access defaults"
        description="Set the agency-wide Google Ads mode the orchestrator should try first. MCC linking is preferred when you have an eligible manager account configured."
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Default grant mode
              </label>
              <SingleSelect
                ariaLabel="Default Google Ads grant mode"
                options={googleAdsGrantModeOptions}
                value={googleAdsManagement.preferredGrantMode}
                onChange={(value) =>
                  updateGoogleAdsManagement({
                    preferredGrantMode: value as GoogleAdsGrantMode,
                  })
                }
                placeholder="Select grant mode..."
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="google-ads-invite-email"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              >
                Invite email
              </label>
              <input
                id="google-ads-invite-email"
                type="email"
                aria-label="Google Ads invite email"
                value={googleAdsManagement.inviteEmail || ''}
                onChange={(event) =>
                  updateGoogleAdsManagement({
                    inviteEmail: event.target.value,
                  })
                }
                className="h-11 w-full rounded-xl border border-border bg-paper px-3 text-sm text-ink shadow-sm outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20"
                placeholder="jon.highmu@gmail.com"
              />
            </div>
          </div>

          {googleAdsManagement.preferredGrantMode === 'manager_link' && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Manager account
                </label>
                <SingleSelect
                  ariaLabel="Select Manager Account"
                  options={managerAccounts.map((account) => ({
                    value: account.id,
                    label: getGoogleAdsAccountLabel(account),
                  }))}
                  value={googleAdsManagement.managerCustomerId || ''}
                  onChange={(value, label) =>
                    updateGoogleAdsManagement({
                      managerCustomerId: value,
                      managerAccountLabel: label,
                    })
                  }
                  placeholder="Select Manager Account..."
                />
              </div>

              {managerAccounts.length === 0 && (
                <ManageAssetsStatusPanel
                  label="MCC readiness"
                  title="No eligible manager account found"
                  description="Refresh Google accounts and connect an eligible Google Ads manager account before defaulting to MCC linking."
                  tone="warning"
                />
              )}
            </>
          )}

          <ManageAssetsStatusPanel
            label="Fallback behavior"
            title="MCC first, direct invite only when safe"
            description="If manager linking is not eligible, the platform can fall back to a direct Google Ads user invite and record why it changed modes."
            tone="default"
          />
        </div>
      </ManageAssetsSectionCard>

      <ManageAssetsSectionCard
        eyebrow="Product controls"
        title="Google products"
        description="Enable the products your agency actually uses, then map each one to the correct account or property."
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setAllProductsEnabled(true)}
              disabled={isSavingSettings}
            >
              Select all
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setAllProductsEnabled(false)}
              disabled={isSavingSettings}
            >
              Deselect all
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <ProductCard
            icon={<CircleDollarSign className="h-5 w-5 text-muted-foreground" />}
            label="Google Ads Account"
            description="Map delegated access to the active Google Ads account your agency will manage."
            enabled={settings.googleAds.enabled}
            onToggle={(val) => updateSetting('googleAds', 'enabled', val)}
            accounts={accountsData?.adsAccounts || []}
            selectedId={hasActiveGoogleAdsSelection ? settings.googleAds.accountId : undefined}
            onAccountSelect={(id, name) => handleAccountSelect('googleAds', id, name)}
            placeholder="Select Ads Account..."
            warningMessage={
              staleGoogleAdsAccountId
                ? `Previously selected Google Ads account is no longer active and must be replaced before you send a new request. Saved account ID: ${staleGoogleAdsAccountId}`
                : undefined
            }
          />

          <ProductCard
            icon={<BarChart3 className="h-5 w-5 text-muted-foreground" />}
            label="Google Analytics Account"
            description="Connect the GA4 property your team needs for reporting and measurement."
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

          <ProductCard
            icon={<MapPin className="h-5 w-5 text-muted-foreground" />}
            label="Google Business Profile Location"
            description="Choose the location your agency needs to manage in Business Profile."
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

          <ProductCard
            icon={<Tags className="h-5 w-5 text-muted-foreground" />}
            label="Google Tag Manager"
            description="Choose the GTM container your agency should maintain."
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

          <ProductCard
            icon={<Search className="h-5 w-5 text-muted-foreground" />}
            label="Google Search Console"
            description="Map Search Console access to the site your agency monitors."
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

          <ProductCard
            icon={<ShoppingBag className="h-5 w-5 text-coral" />}
            label="Google Merchant Center"
            description="Connect the Merchant Center account used for shopping feeds and commerce operations."
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
      </ManageAssetsSectionCard>
    </div>
  );
}

interface ProductCardProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (val: boolean) => void;
  accounts: any[];
  selectedId?: string;
  onAccountSelect: (id: string, name: string) => void;
  placeholder: string;
  requestManageUsers?: boolean;
  onRequestManageUsersToggle?: (val: boolean) => void;
  tooltip?: string;
  warningMessage?: string;
}

function getAccountDisplayName(account: any): string {
  if (account?.type === 'google_ads') {
    return getGoogleAdsAccountLabel(account);
  }

  return account?.displayName || account?.name || account?.url || '';
}

function getAccountId(account: any): string {
  return account?.id || account?.url || '';
}

function getAccountOptionLabel(account: any): string {
  const id = getAccountId(account);
  const name = getAccountDisplayName(account);

  if (!id) {
    return name;
  }

  if (account?.type === 'google_ads') {
    return name;
  }

  return `${name} (${id})`;
}

function ProductCard({
  icon,
  label,
  description,
  enabled,
  onToggle,
  accounts,
  selectedId,
  onAccountSelect,
  placeholder,
  requestManageUsers,
  onRequestManageUsersToggle,
  tooltip,
  warningMessage,
}: ProductCardProps) {
  return (
    <div
      className={cn(
        'rounded-[1rem] border p-4 transition-all',
        enabled ? 'border-black bg-card shadow-brutalist-sm' : 'border-border bg-paper/80 opacity-75'
      )}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          aria-label={`Enable ${label}`}
          className="mt-1 h-5 w-5 rounded border-border text-coral focus:ring-coral"
        />
        <div className="flex-1 space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-paper">
              {icon}
            </div>
            <div className="space-y-1">
              <span className="block text-sm font-semibold text-ink">{label}</span>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          {enabled && (
            <div className="space-y-3">
              <SingleSelect
                options={accounts.map((account) => {
                  const id = getAccountId(account);
                  return { value: id, label: getAccountOptionLabel(account) };
                })}
                value={selectedId || ''}
                onChange={(id, label) => onAccountSelect(id, label)}
                placeholder={placeholder}
              />

              {warningMessage && (
                <ManageAssetsStatusPanel
                  label="Selection warning"
                  title="Saved account needs replacement"
                  description={warningMessage}
                  tone="warning"
                />
              )}

              {onRequestManageUsersToggle && (
                <div className="rounded-[1rem] border border-border bg-paper px-3 py-3">
                  <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id={`manage-users-${label}`}
                    checked={requestManageUsers || false}
                    onChange={(e) => onRequestManageUsersToggle(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-coral focus:ring-coral"
                  />
                  <div className="flex-1">
                    <label htmlFor={`manage-users-${label}`} className="flex items-center gap-1 text-xs text-foreground">
                      Request permission to manage users
                      {tooltip && (
                        <div className="group relative">
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-ink text-white text-[10px] rounded shadow-brutalist opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {tooltip}
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
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
