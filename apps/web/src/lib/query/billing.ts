/**
 * Billing Query Hooks
 *
 * React Query hooks for subscription and billing management.
 */

import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SubscriptionTier, TierLimits } from '@agency-platform/shared';
import { getApiBaseUrl } from '@/lib/api/api-env';

const API_URL = getApiBaseUrl();

function resolvePrincipalId(orgId: string | null | undefined, userId: string | null | undefined): string | null {
  return orgId ?? userId ?? null;
}

// ============================================================
// TYPES
// ============================================================

export interface SubscriptionData {
  id: string;
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

export interface TierDetailsData {
  tier: SubscriptionTier;
  status: string;
  limits: TierLimits;
  features: string[];
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  invoiceDate: string;
  pdfUrl?: string;
}

export interface BillingDetails {
  name: string;
  email: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  taxId?: string;
}

export type UpdateBehavior = 'immediate' | 'next-cycle' | 'no-charge';

export interface UpgradeParams {
  newTier: SubscriptionTier;
  updateBehavior?: UpdateBehavior;
}

export interface CancelParams {
  cancelAtPeriodEnd?: boolean;
}

export interface UpgradeResponse {
  tier: SubscriptionTier;
  status: string;
  effectiveDate?: string;
}

export interface CancelResponse {
  status: string;
  cancelAtPeriodEnd: boolean;
  effectiveDate?: string;
}

// ============================================================
// QUERY HOOKS
// ============================================================

export function useSubscription() {
  const { orgId, userId, getToken } = useAuth();
  const principalId = resolvePrincipalId(orgId, userId);

  return useQuery({
    queryKey: ['subscription', principalId],
    queryFn: async () => {
      if (!principalId) throw new Error('No authenticated principal ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/subscriptions/${principalId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const result = await response.json();
      return result.data as SubscriptionData | null;
    },
    enabled: !!principalId,
  });
}

export function useTierDetails() {
  const { orgId, userId, getToken } = useAuth();
  const principalId = resolvePrincipalId(orgId, userId);

  return useQuery({
    queryKey: ['tier-details', principalId],
    queryFn: async () => {
      if (!principalId) throw new Error('No authenticated principal ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/subscriptions/${principalId}/tier`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tier details');
      }

      const result = await response.json();
      return result.data as TierDetailsData;
    },
    enabled: !!principalId,
  });
}

export function usePaymentMethods() {
  const { orgId, userId, getToken } = useAuth();
  const principalId = resolvePrincipalId(orgId, userId);

  return useQuery({
    queryKey: ['payment-methods', principalId],
    queryFn: async () => {
      if (!principalId) throw new Error('No authenticated principal ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/subscriptions/${principalId}/payment-methods`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const result = await response.json();
      return result.data as PaymentMethod[];
    },
    enabled: !!principalId,
  });
}

export function useInvoices() {
  const { orgId, userId, getToken } = useAuth();
  const principalId = resolvePrincipalId(orgId, userId);

  return useQuery({
    queryKey: ['invoices', principalId],
    queryFn: async () => {
      if (!principalId) throw new Error('No authenticated principal ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/subscriptions/${principalId}/invoices`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const result = await response.json();
      return result.data as Invoice[];
    },
    enabled: !!principalId,
  });
}

export function useBillingDetails() {
  const { orgId, userId, getToken } = useAuth();
  const principalId = resolvePrincipalId(orgId, userId);

  return useQuery({
    queryKey: ['billing-details', principalId],
    queryFn: async () => {
      if (!principalId) throw new Error('No authenticated principal ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/subscriptions/${principalId}/billing-details`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch billing details');
      }

      const result = await response.json();
      return result.data as BillingDetails;
    },
    enabled: !!principalId,
  });
}

// ============================================================
// MUTATION HOOKS
// ============================================================

export function useOpenPortal() {
  const { orgId, userId, getToken } = useAuth();
  const principalId = resolvePrincipalId(orgId, userId);

  return useMutation({
    mutationFn: async (returnUrl: string) => {
      if (!principalId) throw new Error('No authenticated principal ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/subscriptions/portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agencyId: principalId,
          returnUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to open portal');
      }

      const result = await response.json();
      return result.data as { portalUrl: string };
    },
  });
}

export function useCreateCheckout() {
  const { orgId, userId, getToken } = useAuth();
  const principalId = resolvePrincipalId(orgId, userId);

  return useMutation({
    mutationFn: async (params: {
      tier: SubscriptionTier;
      successUrl: string;
      cancelUrl: string;
    }) => {
      if (!principalId) throw new Error('No authenticated principal ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/subscriptions/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agencyId: principalId,
          tier: params.tier,
          successUrl: params.successUrl,
          cancelUrl: params.cancelUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const result = await response.json();
      return result.data as { checkoutUrl: string };
    },
  });
}

export function useUpdateBillingDetails() {
  const { orgId, userId, getToken } = useAuth();
  const principalId = resolvePrincipalId(orgId, userId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (details: BillingDetails) => {
      if (!principalId) throw new Error('No authenticated principal ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/subscriptions/${principalId}/billing-details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(details),
      });

      if (!response.ok) {
        throw new Error('Failed to update billing details');
      }

      const result = await response.json();
      return result.data as BillingDetails;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-details', principalId] });
    },
  });
}

// ============================================================
// SUBSCRIPTION MANAGEMENT MUTATIONS
// ============================================================

/**
 * Upgrade or downgrade subscription tier
 */
export function useUpgradeSubscription() {
  const { orgId, userId, getToken } = useAuth();
  const principalId = resolvePrincipalId(orgId, userId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpgradeParams): Promise<UpgradeResponse> => {
      if (!principalId) throw new Error('No authenticated principal ID');

      const token = await getToken();

      // Map frontend behavior names to Creem API values
      const behaviorMap = {
        immediate: 'proration-charge-immediately',
        'next-cycle': 'proration-charge',
        'no-charge': 'proration-none',
      } as const;

      const response = await fetch(`${API_URL}/api/subscriptions/${principalId}/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newTier: params.newTier,
          updateBehavior: behaviorMap[params.updateBehavior || 'next-cycle'],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to upgrade subscription');
      }

      const result = await response.json();
      return result.data as UpgradeResponse;
    },
    onSuccess: () => {
      // Invalidate subscription queries to refetch
      queryClient.invalidateQueries({ queryKey: ['subscription', principalId] });
      queryClient.invalidateQueries({ queryKey: ['tier-details', principalId] });
    },
  });
}

/**
 * Cancel subscription
 */
export function useCancelSubscription() {
  const { orgId, userId, getToken } = useAuth();
  const principalId = resolvePrincipalId(orgId, userId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CancelParams = {}): Promise<CancelResponse> => {
      if (!principalId) throw new Error('No authenticated principal ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/subscriptions/${principalId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to cancel subscription');
      }

      const result = await response.json();
      return result.data as CancelResponse;
    },
    onSuccess: () => {
      // Invalidate subscription queries to refetch
      queryClient.invalidateQueries({ queryKey: ['subscription', principalId] });
      queryClient.invalidateQueries({ queryKey: ['tier-details', principalId] });
    },
  });
}

export function usePrefetchBillingData() {
  const { orgId, userId, getToken } = useAuth();
  const principalId = resolvePrincipalId(orgId, userId);
  const queryClient = useQueryClient();

  return async () => {
    if (!principalId) return;

    const token = await getToken();
    if (!token) return;

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['subscription', principalId],
        queryFn: async () => {
          const response = await fetch(`${API_URL}/api/subscriptions/${principalId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error('Failed to fetch subscription');
          const result = await response.json();
          return result.data as SubscriptionData | null;
        },
      }),
      queryClient.prefetchQuery({
        queryKey: ['tier-details', principalId],
        queryFn: async () => {
          const response = await fetch(`${API_URL}/api/subscriptions/${principalId}/tier`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error('Failed to fetch tier details');
          const result = await response.json();
          return result.data as TierDetailsData;
        },
      }),
    ]);
  };
}
