'use client';

/**
 * ActivityTab Component
 *
 * Displays a timeline of client activity events.
 * Shows request creation, authorization, connection events, and revocations.
 */

import type { ReactNode } from 'react';
import { Clock, FileText, Link2, ShieldX, UserCheck } from 'lucide-react';
import type { ClientActivityItem } from '@agency-platform/shared';
import type { Platform } from '@agency-platform/shared';
import { Card, EmptyState, PlatformIcon } from '@/components/ui';

interface ActivityTabProps {
  activity: ClientActivityItem[];
}

const ACTIVITY_ICONS: Record<string, ReactNode> = {
  request_created: <FileText className="h-4 w-4" />,
  request_completed: <UserCheck className="h-4 w-4" />,
  connection_created: <Link2 className="h-4 w-4" />,
  connection_revoked: <ShieldX className="h-4 w-4" />,
  client_updated: <Clock className="h-4 w-4" />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  request_created: 'bg-primary/10 text-primary',
  request_completed: 'bg-teal/10 text-teal',
  connection_created: 'bg-accent text-accent-foreground',
  connection_revoked: 'bg-coral/10 text-coral',
  client_updated: 'bg-muted/20 text-muted-foreground',
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
      <h3 className="text-lg font-semibold text-foreground font-display mb-6">Activity Timeline</h3>

      {activity.length === 0 ? (
        <Card className="border-dashed border-border/70 bg-muted/10">
          <EmptyState
            title="No activity yet"
            description="Client activity will appear here once requests are created or updated."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {activity.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-4 pb-4 border-b border-border/50 last:border-0 last:pb-0"
            >
              {/* Icon */}
              <div
                className={`p-2.5 rounded-full flex-shrink-0 ${ACTIVITY_COLORS[item.type] || 'bg-muted/20 text-muted-foreground'}`}
              >
                {ACTIVITY_ICONS[item.type] || <Clock className="h-4 w-4" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{item.description}</p>

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
              <div className="text-xs text-muted-foreground flex-shrink-0">
                {getRelativeTime(item.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
