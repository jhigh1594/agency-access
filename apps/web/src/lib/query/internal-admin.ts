import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiBaseUrl } from '@/lib/api/api-env';
import {
  AffiliateAdminCommissionAdjustmentSchema,
  AffiliateAdminFraudQueueSchema,
  AffiliateAdminPayoutBatchExportSchema,
  AffiliateAdminPayoutBatchListItemSchema,
  AffiliateAdminPayoutBatchListSchema,
  AffiliateAdminPartnerDetailSchema,
  AffiliateAdminPartnerListSchema,
  AffiliateAdminPartnerMutationSchema,
  AffiliateAdminReferralDisqualificationSchema,
  AffiliateAdminReferralReviewResolutionSchema,
  type AffiliateAdminCommissionAdjustment,
  type AffiliateAdminFraudQueue,
  type AffiliateAdminPayoutBatchExport,
  type AffiliateAdminPayoutBatchList,
  type AffiliateAdminPayoutBatchListItem,
  type AffiliateAdminPartnerDetail,
  type AffiliateAdminPartnerList,
  type AffiliateAdminPartnerMutation,
  type AffiliateAdminReferralDisqualificationInput,
  type AffiliateAdminReferralReviewResolutionInput,
  type SubscriptionTier,
  type WebhookDeliverySummary,
} from '@agency-platform/shared';

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

export interface InternalAdminWebhookEndpoint {
  id: string;
  agencyId: string;
  url: string;
  status: 'active' | 'disabled';
  subscribedEvents: string[];
  failureCount: number;
  secretLastFour: string | null;
  lastDeliveredAt: string | null;
  lastFailedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  agency: {
    id: string;
    name: string;
    email: string;
  };
}

export interface InternalAdminWebhookDelivery extends WebhookDeliverySummary {
  nextAttemptAt?: string | null;
}

export interface InternalAdminWebhookDetail {
  endpoint: Omit<InternalAdminWebhookEndpoint, 'agency'> | null;
  deliveries: InternalAdminWebhookDelivery[];
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

export interface ListWebhookEndpointsParams {
  status?: 'active' | 'disabled';
  search?: string;
  limit?: number;
}

export interface ListAffiliatePayoutBatchesParams {
  status?: string;
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

export interface ListAffiliatePartnersParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GenerateAffiliatePayoutBatchInput {
  periodStart: string;
  periodEnd: string;
  notes?: string;
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

export function useInternalAdminWebhookEndpoints(params: ListWebhookEndpointsParams) {
  const getAdminToken = useAdminToken();
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';

  return useQuery({
    queryKey: ['internal-admin', 'webhooks', params],
    queryFn: async () => {
      const token = await getAdminToken();
      return fetchInternalAdmin<InternalAdminWebhookEndpoint[]>(`/webhooks${suffix}`, token);
    },
  });
}

export function useInternalAdminWebhookDetail(agencyId: string | null, limit = 20) {
  const getAdminToken = useAdminToken();

  return useQuery({
    queryKey: ['internal-admin', 'webhook-detail', agencyId, limit],
    queryFn: async () => {
      if (!agencyId) throw new Error('agencyId is required');
      const token = await getAdminToken();
      return fetchInternalAdmin<InternalAdminWebhookDetail>(`/webhooks/${agencyId}?limit=${limit}`, token);
    },
    enabled: !!agencyId,
  });
}

export function useInternalAdminAffiliatePayoutBatches(params: ListAffiliatePayoutBatchesParams) {
  const getAdminToken = useAdminToken();
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';

  return useQuery({
    queryKey: ['internal-admin', 'affiliate-payout-batches', params],
    queryFn: async () => {
      const token = await getAdminToken();
      const data = await fetchInternalAdmin<AffiliateAdminPayoutBatchList>(`/affiliate/payout-batches${suffix}`, token);
      return AffiliateAdminPayoutBatchListSchema.parse(data);
    },
  });
}

export function useInternalAdminGenerateAffiliatePayoutBatch() {
  const getAdminToken = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ periodStart, periodEnd, notes }: GenerateAffiliatePayoutBatchInput) => {
      const token = await getAdminToken();
      const response = await fetch(`${API_URL}/api/internal-admin/affiliate/payout-batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ periodStart, periodEnd, notes }),
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
        throw new Error(payload?.error?.message || 'Failed to generate affiliate payout batch');
      }

      return AffiliateAdminPayoutBatchListItemSchema.parse(payload.data) as AffiliateAdminPayoutBatchListItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-admin', 'affiliate-payout-batches'] });
    },
  });
}

export function useInternalAdminAffiliateFraudQueue() {
  const getAdminToken = useAdminToken();

  return useQuery({
    queryKey: ['internal-admin', 'affiliate-fraud-queue'],
    queryFn: async () => {
      const token = await getAdminToken();
      const data = await fetchInternalAdmin<AffiliateAdminFraudQueue>('/affiliate/fraud-queue', token);
      return AffiliateAdminFraudQueueSchema.parse(data);
    },
  });
}

export function useInternalAdminExportAffiliatePayoutBatch() {
  const getAdminToken = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ batchId }: { batchId: string }) => {
      const token = await getAdminToken();
      const response = await fetch(`${API_URL}/api/internal-admin/affiliate/payout-batches/${batchId}/export`, {
        method: 'POST',
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

      if (!response.ok || payload?.error) {
        throw new Error(payload?.error?.message || 'Failed to export affiliate payout batch');
      }

      return AffiliateAdminPayoutBatchExportSchema.parse(payload.data) as AffiliateAdminPayoutBatchExport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-admin', 'affiliate-payout-batches'] });
    },
  });
}

export function useInternalAdminResolveAffiliateReferralReview() {
  const getAdminToken = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      referralId,
      ...input
    }: AffiliateAdminReferralReviewResolutionInput & { referralId: string }) => {
      const validated = AffiliateAdminReferralReviewResolutionSchema.parse(input);
      const token = await getAdminToken();
      const response = await fetch(`${API_URL}/api/internal-admin/affiliate/referrals/${referralId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validated),
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
        throw new Error(payload?.error?.message || 'Failed to resolve affiliate referral review');
      }

      return payload.data as { id: string; status: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-admin', 'affiliate-fraud-queue'] });
      queryClient.invalidateQueries({ queryKey: ['internal-admin', 'affiliate-partners'] });
      queryClient.invalidateQueries({ queryKey: ['internal-admin', 'affiliate-partner'] });
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

export function useInternalAdminAffiliatePartners(params: ListAffiliatePartnersParams) {
  const getAdminToken = useAdminToken();
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';

  return useQuery({
    queryKey: ['internal-admin', 'affiliate-partners', params],
    queryFn: async () => {
      const token = await getAdminToken();
      const data = await fetchInternalAdmin<AffiliateAdminPartnerList>(`/affiliate/partners${suffix}`, token);
      return AffiliateAdminPartnerListSchema.parse(data);
    },
  });
}

export function useInternalAdminUpdateAffiliatePartner() {
  const getAdminToken = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ partnerId, ...input }: AffiliateAdminPartnerMutation & { partnerId: string }) => {
      const validated = AffiliateAdminPartnerMutationSchema.parse(input);
      const token = await getAdminToken();
      const response = await fetch(`${API_URL}/api/internal-admin/affiliate/partners/${partnerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validated),
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
        throw new Error(payload?.error?.message || 'Failed to update affiliate partner');
      }

      return payload.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-admin', 'affiliate-partners'] });
    },
  });
}

export function useInternalAdminAffiliatePartnerDetail(partnerId: string | null) {
  const getAdminToken = useAdminToken();

  return useQuery({
    queryKey: ['internal-admin', 'affiliate-partner', partnerId],
    queryFn: async () => {
      if (!partnerId) throw new Error('partnerId is required');
      const token = await getAdminToken();
      const data = await fetchInternalAdmin<AffiliateAdminPartnerDetail>(`/affiliate/partners/${partnerId}`, token);
      return AffiliateAdminPartnerDetailSchema.parse(data);
    },
    enabled: !!partnerId,
  });
}

export function useInternalAdminDisableAffiliateLink() {
  const getAdminToken = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId, internalNotes }: { linkId: string; internalNotes?: string }) => {
      const token = await getAdminToken();
      const response = await fetch(`${API_URL}/api/internal-admin/affiliate/links/${linkId}/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ internalNotes }),
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
        throw new Error(payload?.error?.message || 'Failed to disable affiliate link');
      }

      return payload.data as { id: string; status: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-admin', 'affiliate-partners'] });
      queryClient.invalidateQueries({ queryKey: ['internal-admin', 'affiliate-partner'] });
    },
  });
}

export function useInternalAdminDisqualifyAffiliateReferral() {
  const getAdminToken = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      referralId,
      ...input
    }: AffiliateAdminReferralDisqualificationInput & { referralId: string }) => {
      const validated = AffiliateAdminReferralDisqualificationSchema.parse(input);
      const token = await getAdminToken();
      const response = await fetch(`${API_URL}/api/internal-admin/affiliate/referrals/${referralId}/disqualify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validated),
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
        throw new Error(payload?.error?.message || 'Failed to disqualify affiliate referral');
      }

      return payload.data as { id: string; status: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-admin', 'affiliate-partners'] });
      queryClient.invalidateQueries({ queryKey: ['internal-admin', 'affiliate-partner'] });
    },
  });
}

export function useInternalAdminAdjustAffiliateCommission() {
  const getAdminToken = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commissionId,
      ...input
    }: AffiliateAdminCommissionAdjustment & { commissionId: string }) => {
      const validated = AffiliateAdminCommissionAdjustmentSchema.parse(input);
      const token = await getAdminToken();
      const response = await fetch(`${API_URL}/api/internal-admin/affiliate/commissions/${commissionId}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validated),
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
        throw new Error(payload?.error?.message || 'Failed to adjust affiliate commission');
      }

      return payload.data as { id: string; status: string; amount: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-admin', 'affiliate-partners'] });
      queryClient.invalidateQueries({ queryKey: ['internal-admin', 'affiliate-partner'] });
    },
  });
}
