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
import { Reveal } from '@/components/marketing/reveal';
import {
  AgencyProfileCard,
  TeamMembersCard,
  NotificationsCard,
} from '@/components/settings/general';
import { BillingTab } from '@/components/settings/billing';
import { UsageOverviewCard } from '@/components/settings/usage-overview-card';

function GeneralTabContent() {
  return (
    <>
      <UsageOverviewCard />
      <AgencyProfileCard />
      <TeamMembersCard />
      <NotificationsCard />
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoadingSkeleton />}>
      <Reveal direction="up">
        <SettingsTabs
          generalContent={<GeneralTabContent />}
          billingContent={<BillingTab />}
        />
      </Reveal>
    </Suspense>
  );
}

function SettingsLoadingSkeleton() {
  return (
    <div className="flex-1 bg-paper p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="h-9 w-32 bg-card/50 rounded animate-pulse" />
          <div className="h-4 w-64 bg-card/50 rounded animate-pulse mt-2" />
        </div>
        <div className="flex gap-1 mb-6 border-b border-border pb-3">
          <div className="h-8 w-24 bg-card/50 rounded animate-pulse" />
          <div className="h-8 w-24 bg-card/50 rounded animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="h-48 bg-card rounded-lg border border-border animate-pulse" />
          <div className="h-32 bg-card rounded-lg border border-border animate-pulse" />
        </div>
      </div>
    </div>
  );
}
