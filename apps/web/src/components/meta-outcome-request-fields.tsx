'use client';

import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import {
  META_ACCESS_RECIPES,
  type MetaAccessRecipeId,
  type MetaAccessRequestInput,
} from '@agency-platform/shared';
import { CheckCircle2 } from 'lucide-react';
import { resolveApiUrl } from '@/lib/api/api-env';
import { extractApiErrorMessage } from '@/lib/api/extract-error';
import { SingleSelect } from '@/components/ui/single-select';
import { cn } from '@/lib/utils';

type Destination = {
  id: string;
  name: string;
  businessId: string;
  readinessStatus: 'ready' | 'action_needed' | 'unavailable';
  isDefault: boolean;
};

export function getMetaProductsForRecipe(recipeId: MetaAccessRecipeId): string[] {
  if (recipeId === 'meta_organic_social') return ['meta_pages', 'instagram'];
  return ['meta_ads', 'meta_pages', 'instagram'];
}

export function MetaOutcomeRequestFields({
  agencyId,
  value,
  onChange,
  onProductsChange,
}: {
  agencyId?: string;
  value: MetaAccessRequestInput | null;
  onChange: (value: MetaAccessRequestInput | null) => void;
  onProductsChange?: (products: string[]) => void;
}) {
  const { getToken } = useAuth();
  const destinationsQuery = useQuery({
    queryKey: ['meta-destinations', agencyId],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(resolveApiUrl(`/agency-platforms/meta/destinations?agencyId=${agencyId}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error(await extractApiErrorMessage(response, 'Failed to load Meta receiving destinations'));
      const payload = await response.json();
      return (Array.isArray(payload.data) ? payload.data : []) as Destination[];
    },
    enabled: Boolean(agencyId),
    retry: false,
  });

  const readyDestinations = (destinationsQuery.data || []).filter((destination) => destination.readinessStatus === 'ready');
  const selectRecipe = (recipeId: MetaAccessRecipeId) => {
    const defaultDestination = value?.destinationId || readyDestinations.find((destination) => destination.isDefault)?.id || readyDestinations[0]?.id || '';
    onChange(defaultDestination ? { recipeId, destinationId: defaultDestination } : null);
    onProductsChange?.(getMetaProductsForRecipe(recipeId));
  };

  return (
    <section className="space-y-4 rounded-xl border border-coral/30 bg-coral/[0.03] p-4" aria-labelledby="meta-outcome-title">
      <div>
        <h3 id="meta-outcome-title" className="text-sm font-semibold text-foreground">What does the agency need to do in Meta?</h3>
        <p className="mt-1 text-xs text-muted-foreground">AuthHub derives the minimum provider permissions from this outcome. The global access level applies only to other platforms.</p>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {Object.values(META_ACCESS_RECIPES).map((recipe) => {
          const selected = value?.recipeId === recipe.id;
          return (
            <button
              key={recipe.id}
              type="button"
              aria-pressed={selected}
              onClick={() => selectRecipe(recipe.id)}
              className={cn('rounded-lg border p-3 text-left transition-colors', selected ? 'border-coral bg-coral/10' : 'border-border bg-card hover:border-coral/50')}
            >
              <span className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
                {recipe.name}
                {selected ? <CheckCircle2 className="h-4 w-4 text-coral" /> : null}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">{recipe.summary}</span>
            </button>
          );
        })}
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold text-foreground">Receiving Business Portfolio</label>
        <SingleSelect
          options={readyDestinations.map((destination) => ({ value: destination.id, label: `${destination.name} (${destination.businessId})` }))}
          value={value?.destinationId || ''}
          onChange={(destinationId) => value && onChange({ ...value, destinationId })}
          placeholder={destinationsQuery.isLoading ? 'Loading ready destinations…' : 'Choose a ready destination…'}
          disabled={!value || readyDestinations.length === 0}
          ariaLabel="Meta receiving Business Portfolio"
        />
        {!destinationsQuery.isLoading && readyDestinations.length === 0 ? (
          <p role="alert" className="mt-2 text-xs text-coral">No ready Meta destination is available. Check readiness in Connections before sending this request.</p>
        ) : null}
      </div>

      {value ? (
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Minimum access requested</p>
          <ul className="mt-2 space-y-1 text-sm text-foreground">
            {META_ACCESS_RECIPES[value.recipeId].permissionSummary.map((permission) => <li key={permission}>• {permission}</li>)}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
