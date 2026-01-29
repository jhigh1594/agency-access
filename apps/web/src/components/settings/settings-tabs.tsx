'use client';

/**
 * Settings Tabs Container
 * 
 * Two-tab layout for settings with URL state sync.
 * - General: Agency profile, team, notifications
 * - Billing: Subscription, usage, invoices
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { Settings, CreditCard } from 'lucide-react';
import { usePrefetchBillingData } from '@/lib/query/billing';

type SettingsTab = 'general' | 'billing';

interface SettingsTabsProps {
  generalContent: React.ReactNode;
  billingContent: React.ReactNode;
}

export function SettingsTabs({ generalContent, billingContent }: SettingsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefetchBilling = usePrefetchBillingData();
  
  const currentTab = (searchParams.get('tab') as SettingsTab) || 'general';

  const setTab = (tab: SettingsTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'billing' as const, label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="flex-1 bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your agency settings and preferences
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              onMouseEnter={tab.id === 'billing' ? prefetchBilling : undefined}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                currentTab === tab.id
                  ? 'text-indigo-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {currentTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {currentTab === 'general' && generalContent}
          {currentTab === 'billing' && billingContent}
        </div>
      </div>
    </div>
  );
}
