'use client';

/**
 * ActivityTab Component
 *
 * Displays a timeline of client activity events.
 * Shows request creation, authorization, connection events, and revocations.
 */

import { Clock, FileText, Link2, ShieldX, UserCheck } from 'lucide-react';
import type { ClientActivityItem } from '@agency-platform/shared';
import type { Platform } from '@agency-platform/shared';
import { PlatformIcon } from '@/components/ui';

interface ActivityTabProps {
  activity: ClientActivityItem[];
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  request_created: <FileText className="h-4 w-4" />,
  request_completed: <UserCheck className="h-4 w-4" />,
  connection_created: <Link2 className="h-4 w-4" />,
  connection_revoked: <ShieldX className="h-4 w-4" />,
  client_updated: <Clock className="h-4 w-4" />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  request_created: 'bg-blue-100 text-blue-600',
  request_completed: 'bg-green-100 text-green-600',
  connection_created: 'bg-indigo-100 text-indigo-600',
  connection_revoked: 'bg-red-100 text-red-600',
  client_updated: 'bg-slate-100 text-slate-600',
};

export function ActivityTab({ activity }: ActivityTabProps) {
  // Format relative time
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const timestamp = new Date(date);
    const diffInMs = now.getTime() - timestamp.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins} minute${diffInMins > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

    return timestamp.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: timestamp.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-900 mb-6">Activity Timeline</h3>

      {activity.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
          <p className="text-slate-600">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activity.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0"
            >
              {/* Icon */}
              <div
                className={`p-2.5 rounded-full flex-shrink-0 ${ACTIVITY_COLORS[item.type] || 'bg-slate-100 text-slate-600'}`}
              >
                {ACTIVITY_ICONS[item.type] || <Clock className="h-4 w-4" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900">{item.description}</p>

                {/* Metadata: platforms */}
                {item.metadata?.platforms && item.metadata.platforms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.metadata.platforms.map((platform) => (
                      <PlatformIcon
                        key={platform}
                        platform={platform as Platform}
                        size="sm"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Time */}
              <div className="text-xs text-slate-500 flex-shrink-0">
                {getRelativeTime(item.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
