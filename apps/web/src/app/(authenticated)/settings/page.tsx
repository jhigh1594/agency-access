'use client';

/**
 * Settings Page
 *
 * Two-tab structure:
 * - General: Agency Profile, Team Members, Notifications
 * - Billing: Current plan, usage, comparison, payments, invoices
 */

import { Suspense } from 'react';
import { SettingsTabs } from '@/components/settings/settings-tabs';
import {
  AgencyProfileCard,
  TeamMembersCard,
  NotificationsCard,
} from '@/components/settings/general';
import { BillingTab } from '@/components/settings/billing';

function GeneralTabContent() {
  return (
    <>
      <AgencyProfileCard />
      <TeamMembersCard />
      <NotificationsCard />
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoadingSkeleton />}>
      <SettingsTabs
        generalContent={<GeneralTabContent />}
        billingContent={<BillingTab />}
      />
    </Suspense>
  );
}

function SettingsLoadingSkeleton() {
  return (
    <div className="flex-1 bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="h-9 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-slate-200 rounded animate-pulse mt-2" />
        </div>
        <div className="flex gap-1 mb-6 border-b border-slate-200 pb-3">
          <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="h-48 bg-white rounded-lg border border-slate-200 animate-pulse" />
          <div className="h-32 bg-white rounded-lg border border-slate-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
