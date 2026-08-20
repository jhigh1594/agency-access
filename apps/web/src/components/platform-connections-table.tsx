'use client';

import { Loader2, Link as LinkIcon } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { PlatformIcon } from '@/components/ui/platform-icon';
import { PlatformConnectionRow, PlatformConnection } from './platform-connection-row';
import { useMobile } from '@/hooks/use-mobile';
import { PLATFORM_NAMES, type Platform } from '@agency-platform/shared';

function toStatusBadgeType(status: string): 'active' | 'expired' | 'invalid' | 'pending' {
  switch (status) {
    case 'active': return 'active';
    case 'expired': return 'expired';
    case 'invalid': return 'invalid';
    default: return 'pending';
  }
}

interface PlatformConnectionsTableProps {
  connections: PlatformConnection[];
  refreshingPlatforms: Set<string>;
  isDisconnecting: boolean;
  onRefresh: (platform: string) => void;
  onDisconnect: (platform: string) => void;
  onConnectPlatform?: () => void;
  isLoading?: boolean;
}

export function PlatformConnectionsTable({
  connections,
  refreshingPlatforms,
  isDisconnecting,
  onRefresh,
  onDisconnect,
  onConnectPlatform,
  isLoading = false,
}: PlatformConnectionsTableProps) {
  const isMobile = useMobile();

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-foreground">Loading connections...</span>
        </div>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden p-12">
        <EmptyState
          icon={LinkIcon}
          title="No platforms connected"
          description="Connect platforms to enable delegated access for your clients"
          actionLabel={onConnectPlatform ? 'Connect Your First Platform' : undefined}
          onAction={onConnectPlatform}
        />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {connections.map((connection) => {
          const isRefreshing = refreshingPlatforms.has(connection.platform);
          return (
            <div key={connection.id} className="bg-card rounded-lg shadow-sm border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <PlatformIcon platform={connection.platform} size="md" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {PLATFORM_NAMES[connection.platform as Platform] ?? connection.platform}
                    </p>
                    {connection.connectedBy && <p className="text-xs text-muted-foreground truncate">{connection.connectedBy}</p>}
                  </div>
                </div>
                <StatusBadge status={toStatusBadgeType(connection.status)} size="sm" />
              </div>
              <div className="mb-4 text-sm text-foreground space-y-1">
                <p className="text-xs">Connected {new Date(connection.connectedAt).toLocaleDateString()}</p>
                {connection.expiresAt && <p className="text-xs">Expires {new Date(connection.expiresAt).toLocaleDateString()}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onRefresh(connection.platform)}
                  disabled={isRefreshing}
                  title="Refresh token"
                  className="min-h-[40px] flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <RefreshIcon refreshing={isRefreshing} /> Refresh
                </button>
                <button
                  onClick={() => onDisconnect(connection.platform)}
                  disabled={isDisconnecting}
                  title="Disconnect platform"
                  className="min-h-[40px] flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {isDisconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span aria-hidden="true">×</span>}
                  Disconnect
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted border-b border-border text-sm font-medium text-foreground">
        <div className="col-span-4">Platform</div>
        <div className="col-span-3">Status</div>
        <div className="col-span-3">Connected</div>
        <div className="col-span-2">Actions</div>
      </div>
      <div className="divide-y divide-border">
        {connections.map((connection) => (
          <PlatformConnectionRow
            key={connection.id}
            connection={connection}
            onRefresh={onRefresh}
            onDisconnect={onDisconnect}
            isRefreshing={refreshingPlatforms.has(connection.platform)}
            isDisconnecting={isDisconnecting}
          />
        ))}
      </div>
    </div>
  );
}

function RefreshIcon({ refreshing }: { refreshing: boolean }) {
  return refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span aria-hidden="true">↻</span>;
}
