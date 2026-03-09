'use client';

/**
 * OverviewTab Component
 *
 * Displays access requests list with status filtering.
 * Shows each request with platforms, status badge, dates, and revoke action.
 */

import { useState, useMemo } from 'react';
import { ExternalLink, Unlink } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import { Card, EmptyState, PlatformIcon, StatusBadge, Button } from '@/components/ui';
import { CancelRequestModal } from '@/components/access-request-detail/CancelRequestModal';
import { cancelAccessRequest } from '@/lib/api/access-requests';
import type { ClientAccessRequest } from '@agency-platform/shared';
import type { Platform } from '@agency-platform/shared';
import Link from 'next/link';

interface OverviewTabProps {
  clientId: string;
  accessRequests: ClientAccessRequest[];
}

type StatusFilter = 'all' | 'connected' | 'pending' | 'expired' | 'revoked';

function isRevocable(status: ClientAccessRequest['status']): boolean {
  return status === 'pending' || status === 'partial';
}

export function OverviewTab({ clientId, accessRequests }: OverviewTabProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [cancelModalRequest, setCancelModalRequest] = useState<ClientAccessRequest | null>(null);

  // Filter access requests based on selected status
  const filteredRequests = useMemo(() => {
    if (statusFilter === 'all') return accessRequests;

    return accessRequests.filter((request) => {
      switch (statusFilter) {
        case 'connected':
          return request.connectionStatus === 'active' || request.status === 'completed';
        case 'pending':
          return request.status === 'pending' || request.status === 'partial';
        case 'expired':
          return request.status === 'expired' || request.connectionStatus === 'expired';
        case 'revoked':
          return request.status === 'revoked' || request.connectionStatus === 'revoked';
        default:
          return true;
      }
    });
  }, [accessRequests, statusFilter]);

  const statusFilterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All Status' },
    { value: 'connected', label: 'Connected' },
    { value: 'pending', label: 'Pending' },
    { value: 'expired', label: 'Expired' },
    { value: 'revoked', label: 'Revoked' },
  ];

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRevokeConfirm = async () => {
    if (!cancelModalRequest) return;
    setRevokingId(cancelModalRequest.id);
    try {
      const result = await cancelAccessRequest(cancelModalRequest.id, getToken);
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: ['client-detail', clientId] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['clients-with-connections'] });
      }
    } finally {
      setRevokingId(null);
      setCancelModalRequest(null);
    }
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground font-display">Access Requests</h3>

        {/* Status filter */}
        <div>
          <label htmlFor="request-status-filter" className="sr-only">
            Filter access requests by status
          </label>
          <select
            id="request-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="min-h-[44px] px-3 py-2 border border-border bg-card rounded-lg text-sm text-foreground"
          >
            {statusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Access requests list */}
      {filteredRequests.length === 0 ? (
        <Card className="border-dashed border-border/70 bg-muted/10">
          <EmptyState
            title="No access requests found"
            description="Create a new access request to invite this client to authorize platforms."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card
              key={request.id}
              className="p-5 border-black/10 hover:border-border transition-colors"
            >
              <div className="flex items-start justify-between">
                {/* Left side: Name and platforms */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-base font-semibold text-foreground">
                      {request.name}
                    </h4>
                    <StatusBadge
                      status={
                        request.connectionStatus === 'active'
                          ? 'active'
                          : request.status === 'pending'
                          ? 'pending'
                          : request.status === 'expired' || request.connectionStatus === 'expired'
                          ? 'expired'
                          : request.status === 'revoked' || request.connectionStatus === 'revoked'
                          ? 'revoked'
                          : 'unknown'
                      }
                      size="sm"
                    />
                  </div>

                  {/* Platforms */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {request.platforms.length > 0 ? (
                      request.platforms.map((platform) => (
                        <PlatformIcon
                          key={platform}
                          platform={platform as Platform}
                          size="sm"
                        />
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">No platforms</span>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-muted">Created:</span>{' '}
                      {formatDate(request.createdAt)}
                    </div>
                    {request.authorizedAt && (
                      <div>
                        <span className="font-medium text-muted">Authorized:</span>{' '}
                        {formatDate(request.authorizedAt)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: View details + Revoke */}
                <div className="flex items-center gap-3 ml-4">
                  {isRevocable(request.status) && (
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<Unlink className="h-3.5 w-3.5" />}
                      onClick={() => setCancelModalRequest(request)}
                      disabled={revokingId === request.id}
                      aria-label={`Revoke ${request.name}`}
                    >
                      {revokingId === request.id ? 'Revoking...' : 'Revoke'}
                    </Button>
                  )}
                  <Link
                    href={`/access-requests/${request.id}` as any}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/90 min-h-[44px]"
                  >
                    View details
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {cancelModalRequest && (
        <CancelRequestModal
          requestName={cancelModalRequest.name}
          onConfirm={handleRevokeConfirm}
          onClose={() => setCancelModalRequest(null)}
          isPending={revokingId === cancelModalRequest.id}
        />
      )}
    </div>
  );
}
