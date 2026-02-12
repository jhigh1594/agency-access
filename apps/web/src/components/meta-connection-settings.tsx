'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MetaAssetSettings, 
  MetaPermissionLevel,
  MetaPagePermission
} from '@agency-platform/shared';
import { PermissionSelect } from './agency-meta/PermissionSelect';
import { MetaPagePermissionsModal } from './meta-page-permissions-modal';
import { 
  Loader2, 
  Save, 
  Facebook, 
  Instagram, 
  Layout, 
  ShoppingBag,
  AlertCircle
} from 'lucide-react';

interface MetaConnectionSettingsProps {
  agencyId: string;
}

export function MetaConnectionSettings({ agencyId }: MetaConnectionSettingsProps) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<MetaAssetSettings | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  // Fetch current settings
  const { data: initialData, isLoading, error } = useQuery({
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

  useEffect(() => {
    if (initialData) {
      setSettings(initialData);
    }
  }, [initialData]);

  // Save Mutation
  const { mutate: saveSettings, isPending: isSaving } = useMutation({
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
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['meta-asset-settings', agencyId] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="p-8 text-red-500 text-center">
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
  };

  const handleSave = () => {
    if (settings) {
      saveSettings(settings);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Meta Asset Permissions</h3>
          <p className="text-sm text-slate-500">Configure which asset types are requested and their permission levels.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 transition-colors shadow-sm text-sm font-medium"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
          {successMessage}
        </div>
      )}

      <div className="grid gap-4">
        {/* Ad Accounts */}
        <AssetRow 
          icon={
            <img
              src="/meta-color.svg"
              alt="Meta"
              className="h-5 w-5"
            />
          }
          label="Ad Accounts"
          description="Manage client advertising campaigns"
          enabled={settings.adAccount.enabled}
          onToggle={(val) => updateSetting('adAccount', 'enabled', val)}
        >
          <PermissionSelect 
            value={settings.adAccount.permissionLevel}
            onChange={(val) => updateSetting('adAccount', 'permissionLevel', val)}
            disabled={!settings.adAccount.enabled}
          />
        </AssetRow>

        {/* Pages */}
        <AssetRow 
          icon={
            <img
              src="/meta-color.svg"
              alt="Meta"
              className="h-5 w-5"
            />
          }
          label="Facebook Pages"
          description="Access page content and insights"
          enabled={settings.page.enabled}
          onToggle={(val) => updateSetting('page', 'enabled', val)}
        >
          <div className="flex flex-col items-end gap-2">
            <PermissionSelect 
              value={settings.page.permissionLevel}
              onChange={(val) => updateSetting('page', 'permissionLevel', val)}
              disabled={!settings.page.enabled}
            />
            {settings.page.enabled && (
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
                className="text-xs text-indigo-600 font-medium hover:underline"
              >
                {settings.page.limitPermissions ? 'Allow all permissions' : 'Limit permissions'}
              </button>
            )}
          </div>
        </AssetRow>

        {/* Instagram */}
        <AssetRow 
          icon={
            <img
              src="/meta-color.svg"
              alt="Meta"
              className="h-5 w-5"
            />
          }
          label="Instagram Accounts"
          description="Manage connected Instagram business profiles"
          enabled={settings.instagramAccount.enabled}
          onToggle={(val) => updateSetting('instagramAccount', 'enabled', val)}
        >
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              id="ig-full-access"
              checked={settings.instagramAccount.requestFullAccess}
              onChange={(e) => updateSetting('instagramAccount', 'requestFullAccess', e.target.checked)}
              disabled={!settings.instagramAccount.enabled}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="ig-full-access" className="text-xs text-slate-600 cursor-pointer">
              Request full access
            </label>
          </div>
        </AssetRow>

        {/* Datasets / Pixels */}
        <AssetRow 
          icon={
            <img
              src="/meta-color.svg"
              alt="Meta"
              className="h-5 w-5"
            />
          }
          label="Datasets (Pixels)"
          description="Access conversion data and event sets"
          enabled={settings.dataset.enabled}
          onToggle={(val) => updateSetting('dataset', 'enabled', val)}
        >
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              id="ds-full-access"
              checked={settings.dataset.requestFullAccess}
              onChange={(e) => updateSetting('dataset', 'requestFullAccess', e.target.checked)}
              disabled={!settings.dataset.enabled}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="ds-full-access" className="text-xs text-slate-600 cursor-pointer">
              Request full access
            </label>
          </div>
        </AssetRow>

        {/* Catalogs */}
        <AssetRow 
          icon={
            <img
              src="/meta-color.svg"
              alt="Meta"
              className="h-5 w-5"
            />
          }
          label="Product Catalogs"
          description="Manage commerce and product catalogs"
          enabled={settings.catalog.enabled}
          onToggle={(val) => updateSetting('catalog', 'enabled', val)}
        >
          <PermissionSelect 
            value={settings.catalog.permissionLevel}
            onChange={(val) => updateSetting('catalog', 'permissionLevel', val)}
            disabled={!settings.catalog.enabled}
          />
        </AssetRow>
      </div>

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
        isSaving={isSaving}
      />
    </div>
  );
}

function AssetRow({ 
  icon, 
  label, 
  description, 
  enabled, 
  onToggle, 
  children 
}: { 
  icon: React.ReactNode; 
  label: string; 
  description: string; 
  enabled: boolean; 
  onToggle: (val: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className={`p-4 rounded-xl border transition-all ${enabled ? 'bg-card border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${enabled ? 'bg-slate-100' : 'bg-slate-200'}`}>
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">{label}</span>
              {enabled && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-full tracking-wider">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {children}
          <div className="h-8 w-[1px] bg-slate-200" />
          <input 
            type="checkbox" 
            checked={enabled} 
            onChange={(e) => onToggle(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

