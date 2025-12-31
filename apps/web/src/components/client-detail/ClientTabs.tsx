'use client';

/**
 * ClientTabs Component
 *
 * Tab navigation for client detail page.
 * Switches between Overview and Activity tabs.
 */

import { useState } from 'react';
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
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Tab Navigation */}
      <div className="border-b border-slate-200 px-6">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'activity'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Activity
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab accessRequests={accessRequests} />
        )}
        {activeTab === 'activity' && (
          <ActivityTab activity={activity} />
        )}
      </div>
    </div>
  );
}
