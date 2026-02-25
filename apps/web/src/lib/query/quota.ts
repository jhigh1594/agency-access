/**
 * Quota Query Hooks
 *
 * React Query hooks for quota checking and usage tracking.
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { usage, isLoading } = useQuota();
 *   const checkQuota = useQuotaCheck();
 *
 *   const handleCreateClient = async () => {
 *     const result = await checkQuota({ metric: 'clients' });
 *     if (!result.allowed) {
 *       // Show upgrade modal
 *       setShowUpgradeModal(true);
 *       return;
 *     }
 *     // Proceed with creation
 *   };
 * }
 * ```
 */

import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SubscriptionTier, MetricType, TierLimits } from '@agency-platform/shared';
import { getApiBaseUrl } from '@/lib/api/api-env';

const API_URL = getApiBaseUrl();

// ============================================================
// TYPES
// ============================================================

export interface QuotaCheckInput {
  metric: MetricType;
  requestedAmount?: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  limit: number | 'unlimited';
  used: number;
  remaining: number | 'unlimited';
  currentTier: SubscriptionTier;
  suggestedTier?: SubscriptionTier;
  upgradeUrl?: string;
  resetsAt?: Date;
}

export interface UsageSnapshot extends TierLimits {
  currentTier: SubscriptionTier;
  updatedAt: Date;
}

// ============================================================
// QUERY HOOKS
// ============================================================

/**
 * Get current usage snapshot for agency
 */
export function useQuota() {
  const { orgId, getToken } = useAuth();

  return useQuery({
    queryKey: ['quota', 'usage', orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('No organization ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/quota`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch quota information');
      }

      const result = await response.json();
      return result.data as UsageSnapshot;
    },
    enabled: !!orgId,
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Check if an action is allowed under current quota
 */
export function useQuotaCheck() {
  const { orgId, getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: QuotaCheckInput): Promise<QuotaCheckResult> => {
      if (!orgId) throw new Error('No organization ID');

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/quota/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        // Handle quota exceeded (429) or other errors
        if (response.status === 429) {
          const error = await response.json();
          throw new QuotaExceededError(error.error);
        }
        throw new Error('Failed to check quota');
      }

      const result = await response.json();
      return result.data as QuotaCheckResult;
    },
    onSuccess: () => {
      // Invalidate usage query to get fresh data
      queryClient.invalidateQueries({ queryKey: ['quota', 'usage', orgId] });
    },
  });
}

// ============================================================
// ERROR CLASS
// ============================================================

export class QuotaExceededError extends Error {
  code: string;
  metric: MetricType;
  limit: number | 'unlimited';
  used: number;
  remaining: number | 'unlimited';
  currentTier: SubscriptionTier;
  suggestedTier?: SubscriptionTier;
  upgradeUrl?: string;

  constructor(errorResponse: any) {
    super(errorResponse.message || 'Quota exceeded');
    this.name = 'QuotaExceededError';
    this.code = errorResponse.code;
    this.metric = errorResponse.details?.metric;
    this.limit = errorResponse.details?.limit;
    this.used = errorResponse.details?.used;
    this.remaining = errorResponse.details?.remaining;
    this.currentTier = errorResponse.details?.currentTier;
    this.suggestedTier = errorResponse.details?.suggestedTier;
    this.upgradeUrl = errorResponse.details?.upgradeUrl;
  }
}

// ============================================================
// UTILITY HOOKS
// ============================================================

/**
 * Prefetch quota data for an agency
 */
export function usePrefetchQuota() {
  const { orgId, getToken } = useAuth();
  const queryClient = useQueryClient();

  return async () => {
    if (!orgId) return;

    const token = await getToken();
    if (!token) return;

    await queryClient.prefetchQuery({
      queryKey: ['quota', 'usage', orgId],
      queryFn: async () => {
        const response = await fetch(`${API_URL}/api/quota`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch quota');
        const result = await response.json();
        return result.data as UsageSnapshot;
      },
    });
  };
}
