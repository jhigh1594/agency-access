'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { resolveApiUrl } from '@/lib/api/api-env';
import { extractApiErrorMessage } from '@/lib/api/extract-error';
import { Button } from '@/components/ui/button';
import { SingleSelect } from '@/components/ui/single-select';

type Business = { id: string; name: string };
type Check = { id: string; label: string; status: 'pass' | 'action_needed' | 'unavailable'; message: string };
type Destination = {
  id: string;
  businessId: string;
  name: string;
  isDefault: boolean;
  readinessStatus: 'ready' | 'action_needed' | 'unavailable';
  readinessDetails?: { checks?: Check[] };
  lastReadinessCheckAt?: string;
};

export function MetaDestinationManager({ agencyId, businesses }: { agencyId: string; businesses: Business[] }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [businessId, setBusinessId] = useState('');

  const destinationsQuery = useQuery({
    queryKey: ['meta-destinations', agencyId],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(resolveApiUrl(`/agency-platforms/meta/destinations?agencyId=${agencyId}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error(await extractApiErrorMessage(response, 'Failed to load receiving portfolios'));
      const payload = await response.json();
      return (Array.isArray(payload.data) ? payload.data : []) as Destination[];
    },
    enabled: Boolean(agencyId),
    retry: false,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['meta-destinations', agencyId] });

  const addMutation = useMutation({
    mutationFn: async () => {
      const business = businesses.find((entry) => entry.id === businessId);
      if (!business) throw new Error('Choose a Business Portfolio to add');
      const token = await getToken();
      const response = await fetch(resolveApiUrl('/agency-platforms/meta/destinations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ agencyId, businessId: business.id, name: business.name }),
      });
      if (!response.ok) throw new Error(await extractApiErrorMessage(response, 'Failed to add receiving portfolio'));
    },
    onSuccess: async () => {
      setBusinessId('');
      await refresh();
    },
  });

  const defaultMutation = useMutation({
    mutationFn: async (destinationId: string) => {
      const token = await getToken();
      const response = await fetch(resolveApiUrl(`/agency-platforms/meta/destinations/${destinationId}/default`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ agencyId }),
      });
      if (!response.ok) throw new Error(await extractApiErrorMessage(response, 'Failed to set default receiving portfolio'));
    },
    onSuccess: refresh,
  });

  const readinessMutation = useMutation({
    mutationFn: async (destinationId: string) => {
      const token = await getToken();
      const response = await fetch(resolveApiUrl(`/agency-platforms/meta/destinations/${destinationId}/readiness`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ agencyId }),
      });
      if (!response.ok) throw new Error(await extractApiErrorMessage(response, 'Failed to check destination readiness'));
    },
    onSuccess: refresh,
  });

  const destinations = destinationsQuery.data || [];
  const availableBusinesses = businesses.filter((business) => !destinations.some((destination) => destination.businessId === business.id));
  const mutationError = addMutation.error || defaultMutation.error || readinessMutation.error;

  return (
    <div className="space-y-4">
      {destinationsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading receiving portfolios…</div>
      ) : destinations.map((destination) => (
        <article key={destination.id} className="rounded-[1rem] border border-border bg-paper p-4" aria-label={`${destination.name} receiving portfolio`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-ink">{destination.name}</h3>
                {destination.isDefault ? <span className="rounded-full bg-teal/10 px-2 py-0.5 text-xs font-medium text-teal">Default</span> : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Portfolio ID {destination.businessId}</p>
            </div>
            <ReadinessBadge status={destination.readinessStatus} />
          </div>

          {destination.readinessDetails?.checks?.length ? (
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {destination.readinessDetails.checks.filter((check) => check.status !== 'pass').map((check) => (
                <li key={check.id}>{check.label}: {check.message}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => readinessMutation.mutate(destination.id)} disabled={readinessMutation.isPending}>
              <RefreshCw className="mr-2 h-4 w-4" />Check readiness
            </Button>
            {!destination.isDefault ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => defaultMutation.mutate(destination.id)} disabled={defaultMutation.isPending}>
                Set as default
              </Button>
            ) : null}
          </div>
        </article>
      ))}

      {destinationsQuery.error ? <p role="alert" className="text-sm text-coral">{(destinationsQuery.error as Error).message}</p> : null}
      {mutationError ? <p role="alert" className="text-sm text-coral">{(mutationError as Error).message}</p> : null}

      {availableBusinesses.length > 0 ? (
        <div className="rounded-[1rem] border border-dashed border-border p-4">
          <label className="mb-2 block text-sm font-semibold text-ink">Add receiving portfolio</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="min-w-0 flex-1">
              <SingleSelect
                options={availableBusinesses.map((business) => ({ value: business.id, label: `${business.name} (${business.id})` }))}
                value={businessId}
                onChange={setBusinessId}
                placeholder="Choose a portfolio…"
                ariaLabel="Add receiving Business Portfolio"
              />
            </div>
            <Button type="button" onClick={() => addMutation.mutate()} disabled={!businessId || addMutation.isPending}>Add destination</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReadinessBadge({ status }: { status: Destination['readinessStatus'] }) {
  if (status === 'ready') {
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-teal"><CheckCircle2 className="h-4 w-4" />Ready</span>;
  }
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-coral"><AlertCircle className="h-4 w-4" />{status === 'unavailable' ? 'Unavailable' : 'Action needed'}</span>;
}
