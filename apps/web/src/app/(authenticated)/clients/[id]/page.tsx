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
import { useAuth } from '@clerk/nextjs';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { ClientDetailHeader, ClientStats, ClientTabs } from '@/components/client-detail';
import type { ClientDetailResponse } from '@agency-platform/shared';

export default function ClientDetailPage() {
  const params = useParams();
  const { getToken } = useAuth();
  const clientId = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['client-detail', clientId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No auth token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${clientId}/detail`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch client');
      }
      return response.json() as Promise<{ data: ClientDetailResponse }>;
    },
    enabled: !!clientId,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 bg-paper p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
          <span className="ml-2 text-muted-foreground">Loading client details...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 bg-paper p-8">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/clients"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            All clients
          </Link>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-coral mx-auto mb-3" />
            <p className="text-coral mb-2">{error instanceof Error ? error.message : 'Failed to load client'}</p>
            <Link href="/clients" className="text-primary hover:text-primary/90">
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
      <div className="flex-1 bg-paper p-8">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/clients"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            All clients
          </Link>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Client not found</p>
            <Link href="/clients" className="text-primary hover:text-primary/90 mt-2 inline-block">
              Return to clients list
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { client, stats, accessRequests, activity } = data.data;

  return (
    <div className="flex-1 bg-paper p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb navigation */}
        <Link
          href="/clients"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
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
