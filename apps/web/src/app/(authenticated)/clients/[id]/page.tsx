'use client';

/**
 * Client Detail Page
 *
 * Shows detailed information about a single client including:
 * - Client profile header with actions
 * - Connection statistics
 * - Access requests list with status filtering
 * - Activity timeline
 */

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { ClientDetailHeader, ClientStats, ClientTabs } from '@/components/client-detail';
import type { ClientDetailResponse } from '@agency-platform/shared';

export default function ClientDetailPage() {
  const params = useParams();
  const user = useUser();
  const clientId = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['client-detail', clientId],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${clientId}/detail`, {
        headers: {
          'x-agency-id': user.user?.id || '',
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch client');
      }
      return response.json() as Promise<{ data: ClientDetailResponse }>;
    },
    enabled: !!clientId && !!user.user?.id,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 bg-slate-50 p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-2 text-slate-600">Loading client details...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/clients"
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            All clients
          </Link>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-600 mb-2">{error instanceof Error ? error.message : 'Failed to load client'}</p>
            <Link href="/clients" className="text-indigo-600 hover:text-indigo-700">
              Return to clients list
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data?.data) {
    return (
      <div className="flex-1 bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/clients"
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            All clients
          </Link>
          <div className="text-center py-12">
            <p className="text-slate-600">Client not found</p>
            <Link href="/clients" className="text-indigo-600 hover:text-indigo-700 mt-2 inline-block">
              Return to clients list
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { client, stats, accessRequests, activity } = data.data;

  return (
    <div className="flex-1 bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb navigation */}
        <Link
          href="/clients"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          All clients
        </Link>

        {/* Client profile header */}
        <ClientDetailHeader client={client} />

        {/* Stats cards */}
        <div className="mt-6">
          <ClientStats stats={stats} />
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <ClientTabs
            accessRequests={accessRequests}
            activity={activity}
          />
        </div>
      </div>
    </div>
  );
}
