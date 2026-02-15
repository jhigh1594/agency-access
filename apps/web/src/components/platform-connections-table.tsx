'use client';

/**
 * PlatformConnectionsTable Component
 *
 * Table component for displaying agency platform connections.
 * Includes header row, connection rows, and responsive breakpoints.
 */

import { Loader2, Link as LinkIcon } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { PlatformConnectionRow, PlatformConnection } from './platform-connection-row';

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
  // Loading state
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

  // Empty state
  if (connections.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden p-12">
        <EmptyState
          icon={LinkIcon}
          title="No platforms connected"
          description="Connect platforms to enable delegated access for your clients"
          actionLabel={onConnectPlatform ? "Connect Your First Platform" : undefined}
          onAction={onConnectPlatform}
        />
      </div>
    );
  }

  return (
    <>
      {/* Desktop table view */}
      <div className="hidden lg:block bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted border-b border-border text-sm font-medium text-foreground">
          <div className="col-span-4">Platform</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-3">Connected</div>
          <div className="col-span-2">Actions</div>
        </div>

        {/* Table rows */}
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

      {/* Tablet view - adjusted columns */}
      <div className="hidden md:block lg:bg-card lg:rounded-lg lg:shadow-sm lg:border lg:border-border lg:overflow-hidden">
        <div className="md:bg-card md:rounded-lg md:shadow-sm md:border md:border-border md:overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted border-b border-border text-sm font-medium text-foreground">
            <div className="col-span-5">Platform</div>
            <div className="col-span-4">Status</div>
            <div className="col-span-3">Actions</div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-border">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-electric/10 transition-colors"
              >
                {/* Platform column (col-span-5) */}
                <div className="col-span-5 flex items-center gap-3">
                  <div className="hidden sm:block">
                    {/* Use PlatformIcon but hide on very small screens */}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {connection.platform.charAt(0).toUpperCase() + connection.platform.slice(1)}
                    </p>
                    {connection.connectedBy && (
                      <p className="text-xs text-muted-foreground truncate">
                        {connection.connectedBy}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status column (col-span-4) */}
                <div className="col-span-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      connection.status === 'active'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : connection.status === 'expired'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }`}
                  >
                    {connection.status}
                  </span>
                </div>

                {/* Actions column (col-span-3) */}
                <div className="col-span-3 flex items-center gap-2">
                  <button
                    onClick={() => onRefresh(connection.platform)}
                    disabled={refreshingPlatforms.has(connection.platform)}
                    className="inline-flex items-center justify-center p-2 text-foreground hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh token"
                  >
                    {refreshingPlatforms.has(connection.platform) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => onDisconnect(connection.platform)}
                    disabled={isDisconnecting}
                    className="inline-flex items-center justify-center p-2 text-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Disconnect platform"
                  >
                    {isDisconnecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {connections.map((connection) => (
          <div
            key={connection.id}
            className="bg-card rounded-lg shadow-sm border border-border p-4"
          >
            {/* Platform header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {connection.platform.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {connection.platform.charAt(0).toUpperCase() + connection.platform.slice(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">{connection.connectedBy}</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  connection.status === 'active'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : connection.status === 'expired'
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                }`}
              >
                {connection.status}
              </span>
            </div>

            {/* Connection details */}
            <div className="mb-4 text-sm text-foreground space-y-1">
              <p className="text-xs">
                Connected {new Date(connection.connectedAt).toLocaleDateString()}
              </p>
              {connection.expiresAt && (
                <p className="text-xs">
                  Expires {new Date(connection.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => onRefresh(connection.platform)}
                disabled={refreshingPlatforms.has(connection.platform)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {refreshingPlatforms.has(connection.platform) ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                )}
                Refresh
              </button>
              <button
                onClick={() => onDisconnect(connection.platform)}
                disabled={isDisconnecting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {isDisconnecting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                )}
                Disconnect
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
