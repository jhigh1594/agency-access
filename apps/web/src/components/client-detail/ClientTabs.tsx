'use client';

/**
 * ClientTabs Component
 *
 * Tab navigation for client detail page.
 * Switches between Overview and Activity tabs.
 */

import { useState } from 'react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import type {
  ClientAccessRequest,
  ClientActivityItem,
  ClientDetailPlatformGroup,
  Platform,
} from '@agency-platform/shared';
import { OverviewTab } from './OverviewTab';
import { ActivityTab } from './ActivityTab';
import { GoogleOffboardingPanel } from './GoogleOffboardingPanel';

interface GoogleConnectionInfo {
  connectionId: string;
  label: string;
}

interface ClientTabsProps {
  platformGroups: ClientDetailPlatformGroup[];
  accessRequests: ClientAccessRequest[];
  activity: ClientActivityItem[];
  initialExpandedPlatformGroup?: Platform;
  clientId: string;
  googleConnection?: GoogleConnectionInfo;
}

type TabValue = 'overview' | 'offboarding' | 'activity';

export function ClientTabs({
  platformGroups,
  accessRequests,
  activity,
  initialExpandedPlatformGroup,
  clientId,
  googleConnection,
}: ClientTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  return (
    <Card className="border-black/10 shadow-sm">
      {/* Tab Navigation */}
      <div className="border-b border-border px-6">
        <nav className="flex gap-8" role="tablist" aria-label="Client detail tabs">
          <button
            onClick={() => setActiveTab('overview')}
            type="button"
            role="tab"
            id="client-tab-overview"
            aria-selected={activeTab === 'overview'}
            aria-controls="client-tabpanel-overview"
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors min-h-[44px]',
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            type="button"
            role="tab"
            id="client-tab-activity"
            aria-selected={activeTab === 'activity'}
            aria-controls="client-tabpanel-activity"
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors min-h-[44px]',
              activeTab === 'activity'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            Activity
          </button>
          {googleConnection && (
            <button
              onClick={() => setActiveTab('offboarding')}
              type="button"
              role="tab"
              id="client-tab-offboarding"
              aria-selected={activeTab === 'offboarding'}
              aria-controls="client-tabpanel-offboarding"
              className={cn(
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors min-h-[44px]',
                activeTab === 'offboarding'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              Offboarding
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div
        className="p-6"
        role="tabpanel"
        id={
          activeTab === 'overview'
            ? 'client-tabpanel-overview'
            : activeTab === 'offboarding'
              ? 'client-tabpanel-offboarding'
              : 'client-tabpanel-activity'
        }
        aria-labelledby={
          activeTab === 'overview'
            ? 'client-tab-overview'
            : activeTab === 'offboarding'
              ? 'client-tab-offboarding'
              : 'client-tab-activity'
        }
      >
        {activeTab === 'overview' && (
          <OverviewTab
            platformGroups={platformGroups}
            accessRequests={accessRequests}
            initialExpandedPlatformGroup={initialExpandedPlatformGroup}
          />
        )}
        {activeTab === 'offboarding' && googleConnection && (
          <GoogleOffboardingPanel
            agencyId={clientId}
            connectionId={googleConnection.connectionId}
            connectionLabel={googleConnection.label}
          />
        )}
        {activeTab === 'activity' && (
          <ActivityTab activity={activity} />
        )}
      </div>
    </Card>
  );
}
