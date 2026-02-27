import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiBaseUrl } from '@/lib/api/api-env';
import type { SubscriptionTier } from '@agency-platform/shared';

const API_URL = getApiBaseUrl();
const DEV_BYPASS_TOKEN = 'dev-bypass-token';
const IS_DEV_BYPASS_ENABLED =
  process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' &&
  process.env.NODE_ENV === 'development';

async function fetchInternalAdmin<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${API_URL}/api/internal-admin${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const rawBody = await response.text();
  let payload: any = null;
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new Error(`Invalid API response (${response.status})`);
    }
  }

  if (!response.ok) {
    throw new Error(payload?.error?.message || `Internal admin request failed (${response.status})`);
  }

  if (!payload || payload.error) {
    throw new Error(payload?.error?.message || 'Empty API response');
  }

  return payload.data as T;
}

export interface InternalAdminOverview {
  mrr: {
    booked: number;
    collectedLast30Days: number;
    excludedSubscriptions: number;
    currency: 'usd';
  };
  subscriptions: {
    total: number;
    active: number;
    trialing: number;
    pastDue: number;
    canceled: number;
    canceledThisPeriod: number;
  };
  topUsageAgencies: Array<{
    agencyId: string;
    name: string;
    email: string;
    tier: string | null;
    usageScore: number;
    clientOnboards: number;
    platformAudits: number;
    teamSeats: number;
  }>;
}

export interface InternalAdminAgency {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  memberCount: number;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
}

export interface InternalAdminAgencyList {
  items: InternalAdminAgency[];
  total: number;
  page: number;
  limit: number;
}

export interface InternalAdminAgencyDetail {
  agency: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
  subscription: {
    id: string;
    tier: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  members: Array<{
    id: string;
    email: string;
    role: string;
    invitedAt: string;
    joinedAt: string | null;
  }>;
  usage: {
    clientOnboards: number;
    platformAudits: number;
    teamSeats: number;
  };
}

export interface InternalAdminSubscription {
  id: string;
  agencyId: string;
  agencyName: string;
  agencyEmail: string;
  tier: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

export interface InternalAdminSubscriptionList {
  items: InternalAdminSubscription[];
  total: number;
  page: number;
  limit: number;
}

export interface ListAgenciesParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListSubscriptionsParams {
  status?: string;
  tier?: string;
  page?: number;
  limit?: number;
}

export interface UpgradeSubscriptionInput {
  agencyId: string;
  newTier: SubscriptionTier;
  updateBehavior?: 'proration-charge-immediately' | 'proration-charge' | 'proration-none';
}

export interface CancelSubscriptionInput {
  agencyId: string;
  cancelAtPeriodEnd?: boolean;
}

function useAdminToken() {
  const { getToken } = useAuth();

  return async () => {
    const token = await getToken();
    if (!token) {
      if (IS_DEV_BYPASS_ENABLED) return DEV_BYPASS_TOKEN;
      throw new Error('No authentication token available');
    }
    return token;
  };
}

export function useInternalAdminOverview() {
  const getAdminToken = useAdminToken();

  return useQuery({
    queryKey: ['internal-admin', 'overview'],
    queryFn: async () => {
      const token = await getAdminToken();
      return fetchInternalAdmin<InternalAdminOverview>('/overview', token);
    },
  });
}

export function useInternalAdminAgencies(params: ListAgenciesParams) {
  const getAdminToken = useAdminToken();
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';

  return useQuery({
    queryKey: ['internal-admin', 'agencies', params],
    queryFn: async () => {
      const token = await getAdminToken();
      return fetchInternalAdmin<InternalAdminAgencyList>(`/agencies${suffix}`, token);
    },
  });
}

export function useInternalAdminAgencyDetail(agencyId: string | null) {
  const getAdminToken = useAdminToken();

  return useQuery({
    queryKey: ['internal-admin', 'agency', agencyId],
    queryFn: async () => {
      if (!agencyId) throw new Error('agencyId is required');
      const token = await getAdminToken();
      return fetchInternalAdmin<InternalAdminAgencyDetail>(`/agencies/${agencyId}`, token);
    },
    enabled: !!agencyId,
  });
}

export function useInternalAdminSubscriptions(params: ListSubscriptionsParams) {
  const getAdminToken = useAdminToken();
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.tier) query.set('tier', params.tier);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';

  return useQuery({
    queryKey: ['internal-admin', 'subscriptions', params],
    queryFn: async () => {
      const token = await getAdminToken();
      return fetchInternalAdmin<InternalAdminSubscriptionList>(`/subscriptions${suffix}`, token);
    },
  });
}

export function useInternalAdminUpgradeSubscription() {
  const getAdminToken = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agencyId, newTier, updateBehavior }: UpgradeSubscriptionInput) => {
      const token = await getAdminToken();
      const response = await fetch(`${API_URL}/api/internal-admin/subscriptions/${agencyId}/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newTier, updateBehavior }),
        cache: 'no-store',
      });

      const rawBody = await response.text();
      let payload: any = null;
      if (rawBody) {
        try {
          payload = JSON.parse(rawBody);
        } catch {
          throw new Error(`Invalid API response (${response.status})`);
        }
      }

      if (!response.ok || payload?.error) {
        throw new Error(payload?.error?.message || 'Failed to upgrade subscription');
      }

      return payload.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-admin', 'overview'] });
      queryClient.invalidateQueries({ queryKey: ['internal-admin', 'subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['internal-admin', 'agencies'] });
    },
  });
}

export function useInternalAdminCancelSubscription() {
  const getAdminToken = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agencyId, cancelAtPeriodEnd }: CancelSubscriptionInput) => {
      const token = await getAdminToken();
      const response = await fetch(`${API_URL}/api/internal-admin/subscriptions/${agencyId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cancelAtPeriodEnd }),
        cache: 'no-store',
      });

      const rawBody = await response.text();
      let payload: any = null;
      if (rawBody) {
        try {
          payload = JSON.parse(rawBody);
        } catch {
          throw new Error(`Invalid API response (${response.status})`);
        }
      }

      if (!response.ok || payload?.error) {
        throw new Error(payload?.error?.message || 'Failed to cancel subscription');
      }

      return payload.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-admin', 'overview'] });
      queryClient.invalidateQueries({ queryKey: ['internal-admin', 'subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['internal-admin', 'agencies'] });
    },
  });
}
