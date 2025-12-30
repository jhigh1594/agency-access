'use client';

/**
 * Clients Page
 *
 * List all client connections with their authorized platforms.
 * Shows connection status, platforms, and quick actions.
 */

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, Filter, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { StatusBadge, PlatformIcon, EmptyState } from '@/components/ui';

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  platforms: string[];
  status: 'active' | 'pending' | 'expired' | 'revoked';
  connectionCount: number;
  lastActivityAt: string;
  createdAt: string;
}

export default function ClientsPage() {
  const { orgId } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch clients
  const {
    data: clients = [],
    isLoading,
    error: fetchError,
  } = useQuery<Client[]>({
    queryKey: ['clients', orgId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clients?agencyId=${orgId}`
      );
      if (!response.ok) throw new Error('Failed to fetch clients');
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!orgId,
  });

  // Filter clients based on search query
  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      (client.company && client.company.toLowerCase().includes(query))
    );
  });

  if (isLoading) {
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
        {clients.length > 0 && (
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
        )}

        {/* Empty state */}
        {clients.length === 0 && (
          <EmptyState
            title="No clients yet"
            description="Clients will appear here once they authorize their platforms through access requests."
            actionLabel="Create Access Request"
            actionHref="/access-requests/new"
          />
        )}

        {/* No search results */}
        {clients.length > 0 && filteredClients.length === 0 && (
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
        {filteredClients.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
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
                  <StatusBadge status={client.status} />
                </div>

                {/* Platforms */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-700 mb-2">
                    Connected Platforms ({client.platforms.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {client.platforms.map((platform) => (
                      <PlatformIcon key={platform} platform={platform} size="sm" />
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4">
                  <div>
                    <span className="font-medium">Connections:</span> {client.connectionCount}
                  </div>
                  <div>
                    <span className="font-medium">Last active:</span>{' '}
                    {new Date(client.lastActivityAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => {
                    // TODO: Navigate to client detail page
                    console.log('View client:', client.id);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                >
                  View Details
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Client count */}
        {clients.length > 0 && (
          <div className="mt-6 text-center text-sm text-slate-600">
            Showing {filteredClients.length} of {clients.length} clients
          </div>
        )}
      </div>
    </div>
  );
}
