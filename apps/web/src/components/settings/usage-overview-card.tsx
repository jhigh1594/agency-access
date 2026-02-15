'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { UsageDisplayInline } from '@/components/usage-display';
import { useQuota } from '@/lib/query/quota';

export function UsageOverviewCard() {
  const { orgId } = useAuth();
  const { data: quota, isLoading, isError } = useQuota();

  return (
    <section className="bg-card rounded-lg shadow-brutalist border border-black/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink">Usage Overview</h2>
        <Link
          href="/settings?tab=billing"
          className="text-xs text-coral hover:text-coral/90 font-medium"
        >
          View Details →
        </Link>
      </div>

      {isLoading && (
        <div className="flex flex-wrap gap-2">
          <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
          <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
          <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
        </div>
      )}

      {!isLoading && !orgId && (
        <p className="text-sm text-muted-foreground">
          Usage data requires an active organization context.
        </p>
      )}

      {!isLoading && isError && (
        <p className="text-sm text-coral">
          Failed to load usage data.
        </p>
      )}

      {!isLoading && quota && (
        <div className="flex flex-wrap gap-2">
          <UsageDisplayInline
            metric="clients"
            used={quota.clients.used}
            limit={quota.clients.limit}
            onClick={() => (window.location.href = '/settings?tab=billing')}
          />
          <UsageDisplayInline
            metric="members"
            used={quota.members.used}
            limit={quota.members.limit}
            onClick={() => (window.location.href = '/settings?tab=billing')}
          />
          <UsageDisplayInline
            metric="access_requests"
            used={quota.accessRequests.used}
            limit={quota.accessRequests.limit}
            onClick={() => (window.location.href = '/settings?tab=billing')}
          />
          {quota.templates.limit !== 'unlimited' && (
            <UsageDisplayInline
              metric="templates"
              used={quota.templates.used}
              limit={quota.templates.limit}
              onClick={() => (window.location.href = '/settings?tab=billing')}
            />
          )}
        </div>
      )}
    </section>
  );
}
