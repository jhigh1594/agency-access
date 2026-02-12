/**
 * Billing Query Hooks
 *
 * React Query hooks for subscription and billing management.
 */

import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SubscriptionTier, TierLimits } from '@agency-platform/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  const { orgId, getToken } = useAuth();

  return useQuery({
    queryKey: ['subscription', orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('No organization ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/subscriptions/${orgId}`, {
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
    enabled: !!orgId,
  });
}

export function useTierDetails() {
  const { orgId, getToken } = useAuth();

  return useQuery({
    queryKey: ['tier-details', orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('No organization ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/subscriptions/${orgId}/tier`, {
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
    enabled: !!orgId,
  });
}

export function usePaymentMethods() {
  const { orgId, getToken } = useAuth();

  return useQuery({
    queryKey: ['payment-methods', orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('No organization ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/subscriptions/${orgId}/payment-methods`, {
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
    enabled: !!orgId,
  });
}

export function useInvoices() {
  const { orgId, getToken } = useAuth();

  return useQuery({
    queryKey: ['invoices', orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('No organization ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/subscriptions/${orgId}/invoices`, {
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
    enabled: !!orgId,
  });
}

export function useBillingDetails() {
  const { orgId, getToken } = useAuth();

  return useQuery({
    queryKey: ['billing-details', orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('No organization ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/subscriptions/${orgId}/billing-details`, {
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
    enabled: !!orgId,
  });
}

// ============================================================
// MUTATION HOOKS
// ============================================================

export function useOpenPortal() {
  const { orgId, getToken } = useAuth();

  return useMutation({
    mutationFn: async (returnUrl: string) => {
      if (!orgId) throw new Error('No organization ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/subscriptions/portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agencyId: orgId,
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
  const { orgId, getToken } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      tier: SubscriptionTier;
      successUrl: string;
      cancelUrl: string;
    }) => {
      if (!orgId) throw new Error('No organization ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/subscriptions/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agencyId: orgId,
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
  const { orgId, getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (details: BillingDetails) => {
      if (!orgId) throw new Error('No organization ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/subscriptions/${orgId}/billing-details`, {
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
      queryClient.invalidateQueries({ queryKey: ['billing-details', orgId] });
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
  const { orgId, getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpgradeParams): Promise<UpgradeResponse> => {
      if (!orgId) throw new Error('No organization ID');

      const token = await getToken();

      // Map frontend behavior names to Creem API values
      const behaviorMap = {
        immediate: 'proration-charge-immediately',
        'next-cycle': 'proration-charge',
        'no-charge': 'proration-none',
      } as const;

      const response = await fetch(`${API_URL}/api/subscriptions/${orgId}/upgrade`, {
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
      queryClient.invalidateQueries({ queryKey: ['subscription', orgId] });
      queryClient.invalidateQueries({ queryKey: ['tier-details', orgId] });
    },
  });
}

/**
 * Cancel subscription
 */
export function useCancelSubscription() {
  const { orgId, getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CancelParams = {}): Promise<CancelResponse> => {
      if (!orgId) throw new Error('No organization ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/subscriptions/${orgId}/cancel`, {
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
      queryClient.invalidateQueries({ queryKey: ['subscription', orgId] });
      queryClient.invalidateQueries({ queryKey: ['tier-details', orgId] });
    },
  });
}

export function usePrefetchBillingData() {
  const { orgId, getToken } = useAuth();
  const queryClient = useQueryClient();

  return async () => {
    if (!orgId) return;

    const token = await getToken();
    if (!token) return;

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['subscription', orgId],
        queryFn: async () => {
          const response = await fetch(`${API_URL}/api/subscriptions/${orgId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error('Failed to fetch subscription');
          const result = await response.json();
          return result.data as SubscriptionData | null;
        },
      }),
      queryClient.prefetchQuery({
        queryKey: ['tier-details', orgId],
        queryFn: async () => {
          const response = await fetch(`${API_URL}/api/subscriptions/${orgId}/tier`, {
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
