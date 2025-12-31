'use client';

/**
 * Clients Page
 *
 * List all client connections with their authorized platforms.
 * Shows connection status, platforms, and quick actions.
 */

import { useState, useEffect, Suspense } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, Filter, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge, PlatformIcon, EmptyState } from '@/components/ui';
import type { Platform } from '@agency-platform/shared';
import type { StatusType } from '@/components/ui/status-badge';
import { useSearchParams } from 'next/navigation';

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  platforms: Platform[];
  status: 'active' | 'pending' | 'expired' | 'revoked' | 'none';
  connectionCount: number;
  lastActivityAt: string;
  createdAt: string;
}

// Map client status to StatusBadge StatusType
function mapClientStatusToStatusType(status: Client['status']): StatusType {
  if (status === 'none') {
    return 'unknown';
  }
  return status as StatusType;
}

function ClientsPageContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email');
  
  const [searchQuery, setSearchQuery] = useState(initialEmail || '');
  const [showFilters, setShowFilters] = useState(false);
  const [agencyId, setAgencyId] = useState<string | null>(null);

  // Fetch user's agency by email (same pattern as connections page)
  const { data: agencyData, isLoading: isLoadingAgency } = useQuery({
    queryKey: ['user-agency', user?.primaryEmailAddress?.emailAddress],
    queryFn: async () => {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return null;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agencies?email=${encodeURIComponent(email)}`
      );
      if (!response.ok) throw new Error('Failed to fetch agency');
      const result = await response.json();
      return result.data?.[0] || null;
    },
    enabled: !!user?.primaryEmailAddress?.emailAddress,
  });

  useEffect(() => {
    if (agencyData?.id) {
      setAgencyId(agencyData.id);
    }
  }, [agencyData]);

  // Fetch clients with connection data
  const {
    data: clientsResponse,
    isLoading: isLoadingClients,
    error: fetchError,
  } = useQuery({
    queryKey: ['clients-with-connections', agencyId, searchQuery],
    queryFn: async () => {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`);
      if (searchQuery) url.searchParams.append('search', searchQuery);
      
      const response = await fetch(url.toString(), {
        headers: {
          'x-agency-id': user?.id || '', // Still needed for middleware but UUID is used if available
        }
      });
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    },
    enabled: !!agencyId,
  });

  const clients = clientsResponse?.data?.data || [];
  const pagination = clientsResponse?.data?.pagination || { total: 0 };

  if (isLoadingAgency || (isLoadingClients && !clients.length)) {
    return (
      <div className="flex-1 bg-slate-50 p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-2 text-slate-600">Loading clients...</span>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex-1 bg-slate-50 p-8">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600">Failed to load clients. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage client connections and platform authorizations
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 ${
              showFilters ? 'bg-slate-100' : 'bg-white'
            }`}
          >
            <Filter className="h-5 w-5" />
            Filters
          </button>
        </div>

        {/* Empty state */}
        {clients.length === 0 && !searchQuery && (
          <EmptyState
            title="No clients yet"
            description="Clients will appear here once they authorize their platforms through access requests."
            actionLabel="Create Access Request"
            actionHref="/access-requests/new"
          />
        )}

        {/* No search results */}
        {clients.length === 0 && searchQuery && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="inline-flex p-4 bg-slate-100 rounded-full mb-4">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-900 mb-2">No clients found</p>
            <p className="text-slate-600">
              Try adjusting your search query
            </p>
          </div>
        )}

        {/* Clients Grid */}
        {clients.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client: Client) => (
              <div
                key={client.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Client Info */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{client.name}</h3>
                    <p className="text-sm text-slate-600 truncate">{client.email}</p>
                    {client.company && (
                      <p className="text-xs text-slate-500 mt-1 truncate">{client.company}</p>
                    )}
                  </div>
                  <StatusBadge status={mapClientStatusToStatusType(client.status)} />
                </div>

                {/* Platforms */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-700 mb-2">
                    Connected Platforms ({client.platforms.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {client.platforms.length > 0 ? (
                      client.platforms.map((platform) => (
                        <PlatformIcon key={platform} platform={platform} size="sm" />
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No platforms connected</span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 mb-4">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-400">Total Requests:</span>
                    <span>{client.connectionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-400">Last Activity:</span>
                    <span>
                      {new Date(client.lastActivityAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <Link
                  href={`/clients/${client.id}` as any}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                >
                  View Details
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Client count */}
        {clients.length > 0 && (
          <div className="mt-6 text-center text-sm text-slate-600">
            Showing {clients.length} of {pagination.total} clients
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-slate-50 p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-2 text-slate-600">Loading...</span>
        </div>
      </div>
    }>
      <ClientsPageContent />
    </Suspense>
  );
}
