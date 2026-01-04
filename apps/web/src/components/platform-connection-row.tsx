'use client';

/**
 * PlatformConnectionRow Component
 *
 * Individual table row for platform connection display.
 * Used within the PlatformConnectionsTable component.
 */

import { RefreshCw, Unlink, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { PlatformIcon } from '@/components/ui/platform-icon';
import { getTokenHealth, formatExpirationDate } from '@/lib/token-health';
import { formatRelativeTime } from '@/components/ui/format-relative-time';

// Platform display names
const PLATFORM_NAMES: Record<string, string> = {
  meta: 'Meta',
  google: 'Google',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  snapchat: 'Snapchat',
  instagram: 'Instagram',
};

export interface PlatformConnection {
  id: string;
  platform: string;
  status: string;
  connectedBy: string;
  connectedAt: string;
  expiresAt?: string;
  lastRefreshedAt?: string;
  metadata?: Record<string, any>;
}

interface PlatformConnectionRowProps {
  connection: PlatformConnection;
  onRefresh: (platform: string) => void;
  onDisconnect: (platform: string) => void;
  isRefreshing: boolean;
  isDisconnecting: boolean;
}

export function PlatformConnectionRow({
  connection,
  onRefresh,
  onDisconnect,
  isRefreshing,
  isDisconnecting,
}: PlatformConnectionRowProps) {
  const platformName = PLATFORM_NAMES[connection.platform] || connection.platform;
  const tokenHealth = getTokenHealth(connection.expiresAt || null);

  // Map status to StatusBadge type
  const getStatusType = (status: string): 'active' | 'expired' | 'invalid' | 'pending' => {
    switch (status) {
      case 'active':
        return 'active';
      case 'expired':
        return 'expired';
      case 'invalid':
        return 'invalid';
      default:
        return 'pending';
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors">
      {/* Platform column (col-span-4) */}
      <div className="col-span-4 flex items-center gap-3">
        <PlatformIcon platform={connection.platform as any} size="md" />
        <div className="min-w-0">
          <p className="font-medium text-slate-900 truncate">{platformName}</p>
          {connection.metadata?.businessName && (
            <p className="text-xs text-slate-500 truncate">
              {connection.metadata.businessName}
            </p>
          )}
        </div>
      </div>

      {/* Status column (col-span-3) */}
      <div className="col-span-3">
        <StatusBadge status={getStatusType(connection.status)} size="sm" />
        {connection.expiresAt && tokenHealth.status === 'expiring' && (
          <p className="text-xs text-amber-600 mt-1">
            Expires in {tokenHealth.daysUntilExpiry} days
          </p>
        )}
      </div>

      {/* Connected column (col-span-3) */}
      <div className="col-span-3 text-sm">
        <p className="text-slate-700">
          <span className="font-medium">{connection.connectedBy}</span>
        </p>
        <p className="text-slate-500 text-xs">
          {formatRelativeTime(new Date(connection.connectedAt))}
        </p>
      </div>

      {/* Actions column (col-span-2) */}
      <div className="col-span-2 flex items-center gap-2">
        <button
          onClick={() => onRefresh(connection.platform)}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh token"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" strokeWidth={2} />
          )}
        </button>
        <button
          onClick={() => onDisconnect(connection.platform)}
          disabled={isDisconnecting}
          className="inline-flex items-center justify-center p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Disconnect platform"
        >
          {isDisconnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Unlink className="h-4 w-4" strokeWidth={2} />
          )}
        </button>
      </div>
    </div>
  );
}
