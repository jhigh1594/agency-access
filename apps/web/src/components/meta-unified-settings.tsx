'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/nextjs';
import { MetaAssetSettings } from '@agency-platform/shared';
import { ManageAssetsSectionCard, ManageAssetsStatusPanel } from './manage-assets-ui';
import { MetaDestinationManager } from './meta-destination-manager';
import { Button } from './ui/button';
import { resolveApiUrl } from '@/lib/api/api-env';
import { extractApiErrorMessage } from '@/lib/api/extract-error';
import { finalizeMetaBusinessLogin, launchMetaBusinessLogin } from '@/lib/meta-business-login';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetaUnifiedSettingsProps {
  agencyId: string;
}

interface Business {
  id: string;
  name: string;
}

export function MetaUnifiedSettings({ agencyId }: MetaUnifiedSettingsProps) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [settings, setSettings] = useState<MetaAssetSettings | null>(null);
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [isReauthenticating, setIsReauthenticating] = useState(false);

  // Fetch businesses
  const {
    data: businessesData,
    error: businessesError,
    refetch: refetchBusinesses,
  } = useQuery({
    queryKey: ['meta-businesses', agencyId],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(
        // Always refresh from Meta when opening Manage Assets so the portfolio dropdown
        // reflects current Business Manager access instead of stale connection metadata.
        resolveApiUrl(`/agency-platforms/meta/business-accounts?agencyId=${agencyId}&refresh=true`),
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) {
        throw new Error(await extractApiErrorMessage(response, 'Failed to fetch businesses'));
      }
      const result = await response.json();
      return result.data as { businesses: Business[] };
    },
    enabled: !!agencyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Fetch current settings and selected business
  const { data: initialData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['meta-asset-settings', agencyId],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(
        resolveApiUrl(`/agency-platforms/meta/asset-settings?agencyId=${agencyId}`),
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
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
      const token = await getToken();
      const response = await fetch(
        resolveApiUrl(`/agency-platforms/available?agencyId=${agencyId}`),
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
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

  // Save Settings Mutation
  const { mutate: saveSettings, isPending: isSavingSettings } = useMutation({
    mutationFn: async (newSettings: MetaAssetSettings) => {
      const token = await getToken();
      const response = await fetch(resolveApiUrl('/agency-platforms/meta/asset-settings'), {
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
      queryClient.invalidateQueries({ queryKey: ['meta-asset-settings', agencyId] });
    },
  });

  const cachedBusinesses = (
    connectionData?.metadata?.metaBusinessAccounts?.businesses as Business[] | undefined
  ) || [];
  const refreshedBusinesses = businessesData?.businesses;
  const businesses = refreshedBusinesses ?? cachedBusinesses;
  const isLoading = isLoadingSettings;
  const businessRefreshWarning = businessesError instanceof Error ? businessesError.message : null;

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8 text-center text-coral">
        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
        Failed to load Meta settings
      </div>
    );
  }

  const updateSetting = (key: keyof MetaAssetSettings, field: string, value: any) => {
    const newSettings = {
      ...settings,
      [key]: { ...settings[key], [field]: value }
    };
    setSettings(newSettings);
    // Auto-save on change
    saveSettings(newSettings);
  };

  const handleReauthenticate = async () => {
    const userEmail =
      user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;
    if (!userEmail) {
      setReauthError('Unable to resolve your account email.');
      return;
    }

    setReauthError(null);
    setIsReauthenticating(true);

    try {
      const authPayload = await launchMetaBusinessLogin({
        appId: process.env.NEXT_PUBLIC_META_APP_ID || '',
        configId: process.env.NEXT_PUBLIC_META_LOGIN_FOR_BUSINESS_CONFIG_ID || '',
      });

      await finalizeMetaBusinessLogin({
        agencyId,
        userEmail,
        getToken,
        authPayload,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['meta-businesses', agencyId] }),
        queryClient.invalidateQueries({ queryKey: ['platform-connections', agencyId] }),
      ]);
      await refetchBusinesses();
    } catch (error) {
      setReauthError((error as Error).message);
    } finally {
      setIsReauthenticating(false);
    }
  };

  return (
    <div className="space-y-6">
      <ManageAssetsSectionCard
        eyebrow="Primary control"
        title="Receiving Business Portfolios"
        description="Register the agency destinations that can receive client access. New requests can use only destinations that pass readiness checks."
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            isLoading={isReauthenticating}
            onClick={() => void handleReauthenticate()}
          >
            {isReauthenticating ? 'Logging in again...' : 'Log in again'}
          </Button>
        }
      >
        <div className="space-y-4">
          <MetaDestinationManager agencyId={agencyId} businesses={businesses} />

          {businessRefreshWarning && cachedBusinesses.length > 0 ? (
            <ManageAssetsStatusPanel
              label="Refresh warning"
              title={businessRefreshWarning}
              description="Showing the last synced portfolios until Meta refresh succeeds."
              tone="warning"
            />
          ) : null}

          {reauthError ? (
            <ManageAssetsStatusPanel
              label="Reauthentication failed"
              title={reauthError}
              tone="danger"
            />
          ) : null}
        </div>
      </ManageAssetsSectionCard>

      <ManageAssetsSectionCard
        eyebrow="Asset access"
        title="Enabled asset types"
        description="Control which supported asset relationships can appear in outcome-based Meta requests."
      >
        <div className="space-y-3">
          <AssetCard
            icon={<img src="/meta-color.svg" alt="Meta" className="h-5 w-5" />}
            label="Ad Account"
            description="Enable ad-account sharing for delegated access requests."
            enabled={settings.adAccount.enabled}
            onToggle={(val) => updateSetting('adAccount', 'enabled', val)}
          />

          <AssetCard
            icon={<img src="/meta-color.svg" alt="Meta" className="h-5 w-5" />}
            label="Page"
            description="Allow Page-based advertising, organic social, and audit recipes when destination readiness supports them."
            enabled={settings.page.enabled}
            onToggle={(val) => updateSetting('page', 'enabled', val)}
          />

          <AssetCard
            icon={<img src="/meta-color.svg" alt="Meta" className="h-5 w-5" />}
            label="Instagram Account"
            description="Verify linked professional Instagram accounts through the selected Page relationship."
            enabled={settings.instagramAccount.enabled}
            onToggle={(val) => updateSetting('instagramAccount', 'enabled', val)}
          />
        </div>
      </ManageAssetsSectionCard>
    </div>
  );
}

function AssetCard({
  icon,
  label,
  description,
  enabled,
  onToggle,
  extraContent,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (val: boolean) => void;
  extraContent?: React.ReactNode;
}) {
  // Match Google ProductCard: section card is the brutalist anchor; rows stay light.
  return (
    <div
      className={cn(
        'rounded-[1rem] border p-4 transition-colors duration-150',
        enabled
          ? 'border-border bg-paper hover:border-black hover:bg-paper/95'
          : 'border-border bg-card/70 opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-1 h-5 w-5 rounded border-border text-coral focus:ring-coral"
        />
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-paper text-muted-foreground">
              {icon}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-ink">{label}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          {extraContent ? <div className="mt-4 border-t border-border pt-4">{extraContent}</div> : null}
        </div>
      </div>
    </div>
  );
}
