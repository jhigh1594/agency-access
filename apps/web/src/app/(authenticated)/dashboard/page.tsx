/**
 * Agency Dashboard
 *
 * Main dashboard for agencies to view access requests and client connections.
 */

import { Plus, Users, Key, Activity } from 'lucide-react';
import Link from 'next/link';
import { StatCard, StatusBadge, EmptyState } from '@/components/ui';

async function getDashboardData(agencyId: string) {
  // TODO: Replace with actual API calls
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agencies/${agencyId}/access-requests`);
  // const data = await res.json();

  // Placeholder data
  return {
    requests: [],
    connections: [],
    stats: {
      totalRequests: 0,
      pendingRequests: 0,
      activeConnections: 0,
      totalPlatforms: 0,
    },
  };
}

export default async function DashboardPage() {
  // TODO: Get agencyId from Clerk session
  const agencyId = 'placeholder-agency-id';

  const { requests, connections, stats } = await getDashboardData(agencyId);

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
            color="indigo"
          />
          <StatCard
            label="Pending"
            value={stats.pendingRequests}
            icon={<Activity className="h-5 w-5" />}
            color="yellow"
          />
          <StatCard
            label="Active Connections"
            value={stats.activeConnections}
            icon={<Key className="h-5 w-5" />}
            color="emerald"
          />
          <StatCard
            label="Platforms Connected"
            value={stats.totalPlatforms}
            icon={<Activity className="h-5 w-5" />}
            color="blue"
          />
        </div>

        {/* Recent Access Requests */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Recent Access Requests</h2>
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
                <div key={request.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">{request.clientName}</h3>
                    <p className="text-sm text-slate-600">{request.clientEmail}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Client Connections */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mt-6">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Client Connections</h2>
          </div>

          {connections.length === 0 ? (
            <EmptyState
              title="No client connections yet"
              description="Connections will appear here after clients authorize access."
            />
          ) : (
            <div className="divide-y divide-slate-200">
              {connections.map((connection: any) => (
                <div key={connection.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">{connection.clientName}</h3>
                      <p className="text-sm text-slate-600">{connection.clientEmail}</p>
                    </div>
                    <Link
                      href={`/connections/${connection.id}`}
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
