'use client';

/**
 * Agency Dashboard
 *
 * Main dashboard for agencies to view access requests and client connections.
 */

import { Plus, Users, Key, Activity, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { StatCard, StatusBadge, EmptyState } from '@/components/ui';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { user } = useUser();
  const [agencyId, setAgencyId] = useState<string | null>(null);

  // Fetch agency by email (same pattern as connections page)
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

  // Fetch dashboard stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats', agencyId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/stats?agencyId=${agencyId}`
      );
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!agencyId,
  });

  // Fetch recent access requests
  const { data: requestsData, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['recent-requests', agencyId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agencies/${agencyId}/access-requests?limit=10`
      );
      if (!response.ok) throw new Error('Failed to fetch requests');
      return response.json();
    },
    enabled: !!agencyId,
  });

  // Fetch client connections
  const { data: connectionsData, isLoading: isLoadingConnections } = useQuery({
    queryKey: ['client-connections', agencyId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/connections?agencyId=${agencyId}`
      );
      if (!response.ok) throw new Error('Failed to fetch connections');
      return response.json();
    },
    enabled: !!agencyId,
  });

  const stats = statsData?.data || {
    totalRequests: 0,
    pendingRequests: 0,
    activeConnections: 0,
    totalPlatforms: 0,
  };

  const requests = requestsData?.data || [];
  const connections = connectionsData?.data || [];

  const isLoading = isLoadingAgency || isLoadingStats || isLoadingRequests || isLoadingConnections;

  if (isLoading && !agencyId) {
    return (
      <div className="flex-1 bg-slate-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!agencyId && !isLoadingAgency && user?.primaryEmailAddress?.emailAddress) {
    return (
      <div className="flex-1 bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">Agency Setup Required</h2>
            <p className="text-yellow-800 mb-4">
              We couldn't find an agency associated with your account. Let's set one up.
            </p>
            <Link
              href="/onboarding/agency"
              className="inline-flex px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Complete Onboarding
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-600 mt-1">Manage client access requests</p>
          </div>
          <Link
            href="/access-requests/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Request
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Requests"
            value={stats.totalRequests}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label="Pending"
            value={stats.pendingRequests}
            icon={<Activity className="h-5 w-5" />}
          />
          <StatCard
            label="Active Connections"
            value={stats.activeConnections}
            icon={<Key className="h-5 w-5" />}
          />
          <StatCard
            label="Platforms Connected"
            value={stats.totalPlatforms}
            icon={<Activity className="h-5 w-5" />}
          />
        </div>

        {/* Recent Access Requests */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Access Requests</h2>
            <Link href="/access-requests/new" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Create New
            </Link>
          </div>

          {requests.length === 0 ? (
            <EmptyState
              title="No access requests yet"
              description="Create your first access request to start onboarding clients."
              actionLabel="Create Request"
              actionHref="/access-requests/new"
            />
          ) : (
            <div className="divide-y divide-slate-200">
              {requests.map((request: any) => (
                <div key={request.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <h3 className="font-medium text-slate-900">{request.clientName}</h3>
                    <p className="text-sm text-slate-600">{request.clientEmail}</p>
                    <div className="mt-1 flex gap-2">
                      {request.platforms?.google?.length > 0 && (
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 uppercase font-medium">Google</span>
                      )}
                      {request.platforms?.meta?.length > 0 && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 uppercase font-medium">Meta</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                    <StatusBadge status={request.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Client Connections */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mt-6">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Active Connections</h2>
            <Link href="/clients" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Manage Clients
            </Link>
          </div>

          {connections.length === 0 ? (
            <EmptyState
              title="No client connections yet"
              description="Connections will appear here after clients authorize access."
            />
          ) : (
            <div className="divide-y divide-slate-200">
              {connections.map((connection: any) => (
                <div key={connection.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <h3 className="font-medium text-slate-900">{connection.clientEmail}</h3>
                    <p className="text-xs text-slate-500">
                      Connected on {new Date(connection.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {connection.authorizations?.map((auth: any) => (
                        <div 
                          key={auth.id} 
                          className="h-7 w-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden"
                          title={auth.platform}
                        >
                          <img 
                            src={auth.platform.includes('google') ? '/google-ads.svg' : '/meta-color.svg'} 
                            className="h-4 w-4"
                            alt={auth.platform}
                          />
                        </div>
                      ))}
                    </div>
                    <Link
                      href={`/clients?email=${encodeURIComponent(connection.clientEmail)}`}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
