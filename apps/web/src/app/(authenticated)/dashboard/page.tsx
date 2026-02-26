'use client';

/**
 * Agency Dashboard
 *
 * Main dashboard for agencies to view access requests and client connections.
 * Optimized to use a single unified API endpoint for better performance.
 * Includes ETag support for conditional requests to save bandwidth.
 */

import { Plus, Users, Key, Activity, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { useAuthOrBypass, DEV_USER_ID } from '@/lib/dev-auth';
import { useQuery } from '@tanstack/react-query';
import posthog from 'posthog-js';
import { StatCard, StatusBadge, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { readPerfHarnessContext, startPerfTimer } from '@/lib/perf-harness';

// Simple in-memory ETag cache for conditional requests
const etagCache = new Map<string, string>();

export default function DashboardPage() {
  const { user } = useUser();
  const clerkAuth = useAuth();
  const { getToken } = clerkAuth;
  const { isDevelopmentBypass } = useAuthOrBypass(clerkAuth);
  const perfHarness = readPerfHarnessContext();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const hasTrackedView = useRef(false);

  // Get Clerk token for API authentication
  useEffect(() => {
    async function fetchToken() {
      const stopTimer = startPerfTimer('dashboard:token-fetch');
      const token = await getToken();
      setAuthToken(token || perfHarness?.token || null);
      stopTimer?.();
    }
    fetchToken();
  }, [getToken, perfHarness?.token]);

  // Single unified query that fetches all dashboard data at once
  // This replaces 4 separate API calls (agency, stats, requests, connections)
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', user?.id || perfHarness?.principalId || 'anonymous'],
    queryFn: async () => {
      if (!authToken) throw new Error('No auth token');

      const cacheKey = `dashboard-${user?.id || perfHarness?.principalId || 'anonymous'}`;
      const stopTimer = startPerfTimer('dashboard:data-fetch');

      try {
        const etag = etagCache.get(cacheKey);

        const headers: Record<string, string> = {
          Authorization: `Bearer ${authToken}`,
        };

        // Add ETag for conditional request
        if (etag) {
          headers['If-None-Match'] = etag;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard`, {
          headers,
        });

        // Handle 304 Not Modified - return cached data
        if (response.status === 304) {
          // Return the cached data with a flag indicating it was not modified
          const cached = etagCache.get(`${cacheKey}-data`);
          if (cached) {
            return JSON.parse(cached);
          }
          // If no cached data, fall through to fetch
        }

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();

        // Cache ETag for next request
        const responseEtag = response.headers.get('ETag')?.replace(/"/g, '');
        if (responseEtag) {
          etagCache.set(cacheKey, responseEtag);
          etagCache.set(`${cacheKey}-data`, JSON.stringify(data));
        }

        return data;
      } finally {
        stopTimer?.();
      }
    },
    enabled: !!authToken,
    staleTime: 5 * 60 * 1000, // 5 minutes - consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Refetch when component mounts
    placeholderData: (previousData) => previousData, // Use stale data while refetching (stale-while-revalidate)
  });

  const agency = dashboardData?.data?.agency;
  const stats = dashboardData?.data?.stats || {
    totalRequests: 0,
    pendingRequests: 0,
    activeConnections: 0,
    totalPlatforms: 0,
  };
  const requests = dashboardData?.data?.requests || [];
  const connections = dashboardData?.data?.connections || [];

  // Track dashboard view in PostHog (only once per mount)
  useEffect(() => {
    if (agency && !hasTrackedView.current) {
      posthog.capture('dashboard_viewed', {
        agency_id: agency.id,
        agency_name: agency.name,
        total_requests: stats.totalRequests,
        pending_requests: stats.pendingRequests,
        active_connections: stats.activeConnections,
        total_platforms: stats.totalPlatforms,
      });
      hasTrackedView.current = true;
    }
  }, [agency, stats]);

  // Show loading state only on first load
  if (isLoading && !dashboardData) {
    return (
      <div className="flex-1 bg-paper p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-coral mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex-1 bg-paper p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-coral/10 border border-coral rounded-lg p-6 text-center">
            <AlertCircle className="h-8 w-8 text-coral mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-coral mb-2">Failed to Load Dashboard</h2>
            <p className="text-coral/90 mb-4">
              {error instanceof Error ? error.message : 'An error occurred while loading the dashboard.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 sm:px-8 bg-coral text-white rounded-lg hover:bg-coral/90 shadow-brutalist hover:shadow-none hover:translate-y-[2px] transition-all font-semibold min-h-[44px]"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show onboarding prompt if no agency found
  if (!agency && !isLoading) {
    return (
      <div className="flex-1 bg-paper p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-acid/10 border border-acid rounded-lg p-6 text-center">
            <AlertCircle className="h-8 w-8 text-acid mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-acid mb-2">Agency Setup Required</h2>
            <p className="text-acid/90 mb-4">
              We couldn't find an agency associated with your account. Let's set one up.
            </p>
            <Link
              href="/onboarding/unified"
              className="inline-flex px-6 sm:px-8 bg-coral text-white rounded-lg hover:bg-coral/90 shadow-brutalist hover:shadow-none hover:translate-y-[2px] transition-all font-semibold min-h-[44px]"
            >
              Complete Onboarding
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-paper p-8">
      <div className="max-w-7xl mx-auto">
        {isDevelopmentBypass && (
          <div className="mb-4 flex justify-end">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900"
              aria-label="Development mode active"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
              Dev Mode · {DEV_USER_ID.slice(0, 12)}...
            </span>
          </div>
        )}
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage client access requests</p>
          </div>
          <Link
            href="/access-requests/new"
            className="inline-flex items-center gap-2 px-6 sm:px-8 bg-coral text-white rounded-lg hover:bg-coral/90 shadow-brutalist hover:shadow-none hover:translate-y-[2px] transition-all font-semibold min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            Create Request
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
        <div className="bg-card rounded-lg shadow-brutalist border border-black/10">
          <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Recent Access Requests</h2>
            <Link
              href="/access-requests/new"
              className="inline-flex items-center gap-2 px-6 sm:px-8 bg-coral text-white rounded-lg hover:bg-coral/90 shadow-brutalist hover:shadow-none hover:translate-y-[2px] transition-all font-semibold min-h-[44px]"
            >
              <Plus className="h-4 w-4" />
              Create Request
            </Link>
          </div>

          {requests.length === 0 ? (
            <EmptyState
              title="No access requests yet"
              description="Create your first access request to start onboarding clients."
            />
          ) : (
            <div className="divide-y divide-black/10">
              {requests.map((request: any, index: number) => (
                <div
                  key={request.id}
                  className={cn(
                    'px-6 py-4 flex items-center justify-between hover:bg-electric/10 transition-colors',
                    index === requests.length - 1 && 'rounded-b-lg'
                  )}
                >
                  <div>
                    <h3 className="font-medium text-ink">{request.clientName}</h3>
                    <p className="text-sm text-muted-foreground">{request.clientEmail}</p>
                    <div className="mt-1 flex gap-2">
                      {request.platforms?.google?.length > 0 && (
                        <span className="text-[10px] bg-teal/10 text-teal-90 px-1.5 py-0.5 rounded border border-teal uppercase font-medium">Google</span>
                      )}
                      {request.platforms?.meta?.length > 0 && (
                        <span className="text-[10px] bg-coral/10 text-coral-90 px-1.5 py-0.5 rounded border border-coral uppercase font-medium">Meta</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">
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
        <div className="bg-card rounded-lg shadow-brutalist border border-black/10 mt-6">
          <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Active Connections</h2>
            <Link href="/clients" className="text-sm text-coral hover:text-coral/90 font-semibold">
              Manage Clients
            </Link>
          </div>

          {connections.length === 0 ? (
            <EmptyState
              title="No client connections yet"
              description="Connections will appear here after clients authorize access."
            />
          ) : (
            <div className="divide-y divide-black/10">
              {connections.map((connection: any, index: number) => (
                <div
                  key={connection.id}
                  className={cn(
                    'px-6 py-4 flex items-center justify-between hover:bg-electric/10 transition-colors',
                    index === connections.length - 1 && 'rounded-b-lg'
                  )}
                >
                  <div>
                    <h3 className="font-medium text-ink">{connection.clientEmail}</h3>
                    <p className="text-xs text-muted">
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
                      className="text-coral hover:text-coral/90 text-sm font-semibold"
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
