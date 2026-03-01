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
import type { ClientAccessRequest, ClientActivityItem } from '@agency-platform/shared';
import { OverviewTab } from './OverviewTab';
import { ActivityTab } from './ActivityTab';

interface ClientTabsProps {
  accessRequests: ClientAccessRequest[];
  activity: ClientActivityItem[];
}

type TabValue = 'overview' | 'activity';

export function ClientTabs({ accessRequests, activity }: ClientTabsProps) {
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
        </nav>
      </div>

      {/* Tab Content */}
      <div
        className="p-6"
        role="tabpanel"
        id={activeTab === 'overview' ? 'client-tabpanel-overview' : 'client-tabpanel-activity'}
        aria-labelledby={activeTab === 'overview' ? 'client-tab-overview' : 'client-tab-activity'}
      >
        {activeTab === 'overview' && (
          <OverviewTab accessRequests={accessRequests} />
        )}
        {activeTab === 'activity' && (
          <ActivityTab activity={activity} />
        )}
      </div>
    </Card>
  );
}
