'use client';

/**
 * OverviewTab Component
 *
 * Displays access requests list with status filtering.
 * Shows each request with platforms, status badge, and dates.
 */

import { useState, useMemo } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { StatusBadge, PlatformIcon } from '@/components/ui';
import type { ClientAccessRequest } from '@agency-platform/shared';
import type { Platform } from '@agency-platform/shared';
import Link from 'next/link';

interface OverviewTabProps {
  accessRequests: ClientAccessRequest[];
}

type StatusFilter = 'all' | 'connected' | 'pending' | 'expired' | 'revoked';

export function OverviewTab({ accessRequests }: OverviewTabProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

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

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Access Requests</h3>

        {/* Status filter dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
          >
            {statusFilterOptions.find((o) => o.value === statusFilter)?.label}
            <ChevronDown className="h-4 w-4" />
          </button>

          {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-slate-200 rounded-lg shadow-lg z-10">
              {statusFilterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value);
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                    statusFilter === option.value ? 'bg-slate-100 font-medium' : ''
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Access requests list */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
          <p className="text-slate-600">No access requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                {/* Left side: Name and platforms */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-base font-semibold text-slate-900">
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
                      <span className="text-sm text-slate-400 italic">No platforms</span>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="flex gap-6 text-sm text-slate-600">
                    <div>
                      <span className="font-medium text-slate-500">Created:</span>{' '}
                      {formatDate(request.createdAt)}
                    </div>
                    {request.authorizedAt && (
                      <div>
                        <span className="font-medium text-slate-500">Authorized:</span>{' '}
                        {formatDate(request.authorizedAt)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: View details link */}
                <Link
                  href={`/access-requests/${request.id}` as any}
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 ml-4"
                >
                  View details
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
