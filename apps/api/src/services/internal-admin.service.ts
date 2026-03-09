import { getIntervalFromProductId } from '@/config/creem.config.js';
import { env } from '@/lib/env.js';
import { prisma } from '@/lib/prisma.js';
import {
  getWebhookSupportDetails,
  listWebhookEndpointsForSupport,
} from '@/services/webhook-management.service.js';
import type {
  AffiliateCommissionStatus,
  AffiliateLinkStatus,
  AffiliateAdminReferralReviewResolutionInput,
  AffiliateAdminCommissionAdjustment,
  AffiliateAdminPartnerDetail,
  AffiliateAdminPartnerMutation,
  AffiliateAdminReferralDisqualificationInput,
  AffiliatePartnerStatus,
} from '@agency-platform/shared';
import { getTierLimitsConfig, type SubscriptionTier } from '@agency-platform/shared';

interface ServiceResult<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

type InternalSubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' | 'incomplete_expired';

interface SubscriptionSummary {
  total: number;
  active: number;
  trialing: number;
  pastDue: number;
  canceled: number;
  canceledThisPeriod: number;
}

interface UsageLeaderboardEntry {
  agencyId: string;
  name: string;
  email: string;
  tier: string | null;
  usageScore: number;
  clientOnboards: number;
  platformAudits: number;
  teamSeats: number;
}

interface OverviewData {
  mrr: {
    booked: number;
    collectedLast30Days: number;
    excludedSubscriptions: number;
    currency: 'usd';
  };
  subscriptions: SubscriptionSummary;
  topUsageAgencies: UsageLeaderboardEntry[];
}

interface ListAgenciesParams {
  search?: string;
  page?: number;
  limit?: number;
  includeSynthetic?: boolean;
}

interface AgencyListItem {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  memberCount: number;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
}

interface ListAgenciesData {
  items: AgencyListItem[];
  total: number;
  page: number;
  limit: number;
}

interface AgencyDetailData {
  agency: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  };
  subscription: {
    id: string;
    tier: string;
    status: string;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  members: Array<{
    id: string;
    email: string;
    role: string;
    invitedAt: Date;
    joinedAt: Date | null;
  }>;
  usage: {
    clientOnboards: number;
    platformAudits: number;
    teamSeats: number;
  };
}

interface ListSubscriptionsParams {
  status?: string;
  tier?: string;
  page?: number;
  limit?: number;
}

interface SubscriptionListItem {
  id: string;
  agencyId: string;
  agencyName: string;
  agencyEmail: string;
  tier: string;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
}

interface ListSubscriptionsData {
  items: SubscriptionListItem[];
  total: number;
  page: number;
  limit: number;
}

interface ListWebhookEndpointsParams {
  status?: 'active' | 'disabled';
  search?: string;
  limit?: number;
}

interface ListAffiliatePayoutBatchesParams {
  status?: string;
  page?: number;
  limit?: number;
}

interface AffiliatePayoutBatchListItem {
  id: string;
  status: string;
  currency: string;
  totalAmount: number;
  commissionCount: number;
  periodStart: Date;
  periodEnd: Date;
  notes: string | null;
  exportedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
}

interface ListAffiliatePayoutBatchesData {
  items: AffiliatePayoutBatchListItem[];
  total: number;
  page: number;
  limit: number;
}

interface ExportAffiliatePayoutBatchData {
  batchId: string;
  fileName: string;
  exportedAt: string;
  rowCount: number;
  csv: string;
}

interface GenerateAffiliatePayoutBatchParams {
  periodStart: Date;
  periodEnd: Date;
  notes?: string;
  userEmail?: string;
}

interface ListAffiliatePartnersParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface AffiliatePartnerListItem {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  websiteUrl: string | null;
  audienceSize: string | null;
  status: string;
  applicationNotes: string | null;
  defaultCommissionBps: number;
  commissionDurationMonths: number;
  appliedAt: Date;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  disabledAt: Date | null;
  referralCount: number;
  commissionCount: number;
  linkCount: number;
}

interface ListAffiliatePartnersData {
  items: AffiliatePartnerListItem[];
  total: number;
  page: number;
  limit: number;
}

interface UpdateAffiliatePartnerInput extends AffiliateAdminPartnerMutation {
  userEmail?: string;
}

interface AffiliateFraudReferralQueueItem {
  id: string;
  partnerId: string;
  partnerName: string;
  referredAgencyId: string;
  referredAgencyName: string;
  status: string;
  riskReasons: string[];
  createdAt: string;
  qualifiedAt: string | null;
  commissionCount: number;
}

interface AffiliateFraudCommissionQueueItem {
  id: string;
  referralId: string;
  partnerId: string;
  partnerName: string;
  customerName: string;
  status: string;
  amountCents: number;
  holdUntil: string;
  createdAt: string;
  riskReasons: string[];
  notes: string | null;
}

interface AffiliateFraudQueueData {
  referrals: AffiliateFraudReferralQueueItem[];
  commissions: AffiliateFraudCommissionQueueItem[];
  counts: {
    flaggedReferrals: number;
    flaggedCommissions: number;
  };
}

interface ResolveAffiliateReferralReviewInput extends AffiliateAdminReferralReviewResolutionInput {
  userEmail?: string;
}

interface SubscriptionForMrr {
  tier: string;
  status: string;
  creemData: any;
}

const BOOKED_MRR_STATUSES = new Set<InternalSubscriptionStatus>(['active', 'trialing']);

function toCurrency(amountInCents: number | null | undefined): number {
  if (!amountInCents) return 0;
  return Number((amountInCents / 100).toFixed(2));
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function resolveProductId(creemData: any): string | undefined {
  if (!creemData || typeof creemData !== 'object') return undefined;
  return creemData.product_id || creemData.productId;
}

function resolveMonthlySubscriptionValue(subscription: SubscriptionForMrr): {
  amount: number;
  excluded: boolean;
} {
  const tier = subscription.tier as SubscriptionTier | undefined;
  const tierPricing = getTierLimitsConfig(tier);
  const productId = resolveProductId(subscription.creemData);

  if (productId) {
    try {
      const interval = getIntervalFromProductId(productId);
      if (interval === 'yearly') {
        return { amount: round2(tierPricing.priceYearly / 12), excluded: false };
      }
      return { amount: tierPricing.priceMonthly, excluded: false };
    } catch {
      return { amount: 0, excluded: true };
    }
  }

  return { amount: tierPricing.priceMonthly, excluded: false };
}

function safePagination(page?: number, limit?: number) {
  const resolvedPage = page && page > 0 ? page : 1;
  const resolvedLimit = limit && limit > 0 ? Math.min(limit, 100) : 20;
  return {
    page: resolvedPage,
    limit: resolvedLimit,
    skip: (resolvedPage - 1) * resolvedLimit,
  };
}

const SYNTHETIC_OR_TEST_AGENCY_FILTERS = [
  {
    email: {
      endsWith: '@clerk.temp',
      mode: 'insensitive' as const,
    },
  },
  {
    AND: [
      {
        name: {
          equals: 'My Agency',
          mode: 'insensitive' as const,
        },
      },
      {
        email: {
          startsWith: 'user@',
          mode: 'insensitive' as const,
        },
      },
      {
        email: {
          endsWith: '.agency',
          mode: 'insensitive' as const,
        },
      },
    ],
  },
  {
    name: {
      contains: 'test',
      mode: 'insensitive' as const,
    },
  },
  {
    email: {
      endsWith: '@test.com',
      mode: 'insensitive' as const,
    },
  },
  {
    email: {
      startsWith: 'test-',
      mode: 'insensitive' as const,
    },
  },
];

function buildAgencyWhere(search?: string, includeSynthetic?: boolean) {
  const filters: any[] = [];

  if (search) {
    filters.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    });
  }

  if (!includeSynthetic) {
    filters.push({
      NOT: {
        OR: SYNTHETIC_OR_TEST_AGENCY_FILTERS,
      },
    });
  }

  if (filters.length === 0) return undefined;
  if (filters.length === 1) return filters[0];

  return {
    AND: filters,
  };
}

function buildAffiliatePartnerWhere(params: ListAffiliatePartnersParams) {
  const filters: any[] = [];

  if (params.status) {
    filters.push({ status: params.status });
  }

  if (params.search) {
    filters.push({
      OR: [
        { name: { contains: params.search, mode: 'insensitive' as const } },
        { email: { contains: params.search, mode: 'insensitive' as const } },
        { companyName: { contains: params.search, mode: 'insensitive' as const } },
      ],
    });
  }

  if (filters.length === 0) return undefined;
  if (filters.length === 1) return filters[0];

  return {
    AND: filters,
  };
}

function normalizeAffiliateDestinationPath(value?: string | null): string {
  if (!value || !value.startsWith('/')) return '/';
  return value;
}

function buildAffiliateLinkUrl(code: string): string {
  return `${env.FRONTEND_URL}/r/${code}`;
}

function appendAdminNote(existing: string | null | undefined, internalNotes: string): string {
  return existing ? `${existing}\n\n${internalNotes}` : internalNotes;
}

function extractRiskReasons(metadata: unknown): string[] {
  if (!metadata || typeof metadata !== 'object' || !('riskReasons' in metadata)) {
    return [];
  }

  const riskReasons = (metadata as { riskReasons?: unknown }).riskReasons;
  if (!Array.isArray(riskReasons)) {
    return [];
  }

  return riskReasons.filter((value): value is string => typeof value === 'string');
}

function resolvePayoutReference(payoutDetails: unknown): string {
  if (!payoutDetails || typeof payoutDetails !== 'object' || Array.isArray(payoutDetails)) {
    return '';
  }

  const candidateKeys = [
    'email',
    'paypalEmail',
    'recipientEmail',
    'accountEmail',
    'handle',
    'accountHolder',
    'accountNumber',
    'iban',
  ];
  for (const key of candidateKeys) {
    const value = (payoutDetails as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  const serialized = JSON.stringify(payoutDetails);
  return serialized === '{}' ? '' : serialized;
}

function escapeCsvField(value: string | number | null | undefined): string {
  const normalized = value === null || value === undefined ? '' : String(value);
  if (!/[",\n]/.test(normalized)) {
    return normalized;
  }

  return `"${normalized.replace(/"/g, '""')}"`;
}

function buildAffiliatePayoutExportCsv(batch: {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  notes: string | null;
  commissions: Array<{
    id: string;
    amount: number;
    partner: {
      id: string;
      name: string;
      email: string;
      payoutMethod: string | null;
      payoutDetails: unknown;
    };
  }>;
}): { csv: string; rowCount: number; commissionCount: number } {
  const groupedRows = new Map<string, {
    partnerId: string;
    partnerName: string;
    partnerEmail: string;
    payoutMethod: string;
    payoutReference: string;
    commissionCount: number;
    approvedAmountCents: number;
  }>();

  for (const commission of batch.commissions) {
    const partner = commission.partner;
    const existing = groupedRows.get(partner.id);

    if (existing) {
      existing.commissionCount += 1;
      existing.approvedAmountCents += commission.amount;
      continue;
    }

    groupedRows.set(partner.id, {
      partnerId: partner.id,
      partnerName: partner.name,
      partnerEmail: partner.email,
      payoutMethod: partner.payoutMethod || 'manual_review_required',
      payoutReference: resolvePayoutReference(partner.payoutDetails),
      commissionCount: 1,
      approvedAmountCents: commission.amount,
    });
  }

  const rows = Array.from(groupedRows.values()).sort((left, right) => {
    const nameComparison = left.partnerName.localeCompare(right.partnerName);
    if (nameComparison !== 0) return nameComparison;

    const emailComparison = left.partnerEmail.localeCompare(right.partnerEmail);
    if (emailComparison !== 0) return emailComparison;

    return left.partnerId.localeCompare(right.partnerId);
  });

  const header = [
    'partner_id',
    'partner_name',
    'partner_email',
    'payout_method',
    'payout_reference',
    'commission_count',
    'approved_amount_cents',
    'batch_id',
    'period_start',
    'period_end',
    'notes',
  ];

  const lines = [
    header.join(','),
    ...rows.map((row) => [
      row.partnerId,
      row.partnerName,
      row.partnerEmail,
      row.payoutMethod,
      row.payoutReference,
      row.commissionCount,
      row.approvedAmountCents,
      batch.id,
      batch.periodStart.toISOString(),
      batch.periodEnd.toISOString(),
      batch.notes || '',
    ].map(escapeCsvField).join(',')),
  ];

  return {
    csv: lines.join('\n'),
    rowCount: rows.length,
    commissionCount: batch.commissions.length,
  };
}

function affiliatePartnerAdminSelect() {
  return {
    id: true,
    name: true,
    email: true,
    companyName: true,
    websiteUrl: true,
    audienceSize: true,
    status: true,
    notes: true,
    defaultCommissionBps: true,
    commissionDurationMonths: true,
    appliedAt: true,
    approvedAt: true,
    rejectedAt: true,
    disabledAt: true,
    _count: {
      select: {
        links: true,
        referrals: true,
        commissions: true,
      },
    },
  } as const;
}

function mapAffiliatePartnerListItem(partner: any): AffiliatePartnerListItem {
  return {
    id: partner.id,
    name: partner.name,
    email: partner.email,
    companyName: partner.companyName || null,
    websiteUrl: partner.websiteUrl || null,
    audienceSize: partner.audienceSize || null,
    status: partner.status,
    applicationNotes: partner.notes || null,
    defaultCommissionBps: partner.defaultCommissionBps,
    commissionDurationMonths: partner.commissionDurationMonths,
    appliedAt: partner.appliedAt,
    approvedAt: partner.approvedAt || null,
    rejectedAt: partner.rejectedAt || null,
    disabledAt: partner.disabledAt || null,
    referralCount: partner._count?.referrals || 0,
    commissionCount: partner._count?.commissions || 0,
    linkCount: partner._count?.links || 0,
  };
}

class InternalAdminService {
  async getOverview(): Promise<ServiceResult<OverviewData>> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [subscriptions, collectedInvoices, usageCounters] = await Promise.all([
      prisma.subscription.findMany({
        select: {
          tier: true,
          status: true,
          creemData: true,
        },
      }),
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: {
          status: 'paid',
          paidAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      prisma.agencyUsageCounter.findMany({
        where: {
          metricType: {
            in: ['client_onboards', 'platform_audits', 'team_seats'],
          },
        },
        include: {
          agency: {
            select: {
              id: true,
              name: true,
              email: true,
              subscription: {
                select: {
                  tier: true,
                },
              },
            },
          },
        },
      }),
    ]);

    let bookedMrr = 0;
    let excludedSubscriptions = 0;

    for (const subscription of subscriptions) {
      if (!BOOKED_MRR_STATUSES.has(subscription.status as InternalSubscriptionStatus)) {
        continue;
      }

      const resolved = resolveMonthlySubscriptionValue(subscription);
      bookedMrr += resolved.amount;
      if (resolved.excluded) excludedSubscriptions += 1;
    }

    const summary: SubscriptionSummary = {
      total: subscriptions.length,
      active: subscriptions.filter(sub => sub.status === 'active').length,
      trialing: subscriptions.filter(sub => sub.status === 'trialing').length,
      pastDue: subscriptions.filter(sub => sub.status === 'past_due').length,
      canceled: subscriptions.filter(sub => sub.status === 'canceled').length,
      canceledThisPeriod: subscriptions.filter(sub => sub.status === 'canceled').length,
    };

    const usageByAgency = new Map<string, UsageLeaderboardEntry>();
    for (const counter of usageCounters) {
      const current = usageByAgency.get(counter.agencyId) || {
        agencyId: counter.agency.id,
        name: counter.agency.name,
        email: counter.agency.email,
        tier: counter.agency.subscription?.tier || null,
        usageScore: 0,
        clientOnboards: 0,
        platformAudits: 0,
        teamSeats: 0,
      };

      if (counter.metricType === 'client_onboards') current.clientOnboards += counter.count;
      if (counter.metricType === 'platform_audits') current.platformAudits += counter.count;
      if (counter.metricType === 'team_seats') current.teamSeats += counter.count;

      current.usageScore = current.clientOnboards + current.platformAudits + current.teamSeats;
      usageByAgency.set(counter.agencyId, current);
    }

    const topUsageAgencies = Array.from(usageByAgency.values())
      .sort((a, b) => b.usageScore - a.usageScore)
      .slice(0, 5);

    return {
      data: {
        mrr: {
          booked: round2(bookedMrr),
          collectedLast30Days: toCurrency(collectedInvoices._sum.amount),
          excludedSubscriptions,
          currency: 'usd',
        },
        subscriptions: summary,
        topUsageAgencies,
      },
      error: null,
    };
  }

  async listAgencies(params: ListAgenciesParams): Promise<ServiceResult<ListAgenciesData>> {
    const { search, includeSynthetic } = params;
    const pagination = safePagination(params.page, params.limit);
    const where = buildAgencyWhere(search, includeSynthetic);

    const [total, agencies] = await Promise.all([
      prisma.agency.count({ where }),
      prisma.agency.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            select: { tier: true, status: true },
          },
          _count: {
            select: { members: true },
          },
        },
      }),
    ]);

    return {
      data: {
        items: agencies.map(agency => ({
          id: agency.id,
          name: agency.name,
          email: agency.email,
          createdAt: agency.createdAt,
          memberCount: agency._count.members,
          subscriptionTier: agency.subscription?.tier || null,
          subscriptionStatus: agency.subscription?.status || null,
        })),
        total,
        page: pagination.page,
        limit: pagination.limit,
      },
      error: null,
    };
  }

  async getAgencyDetail(agencyId: string): Promise<ServiceResult<AgencyDetailData>> {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      include: {
        members: {
          orderBy: { invitedAt: 'desc' },
          select: {
            id: true,
            email: true,
            role: true,
            invitedAt: true,
            joinedAt: true,
          },
        },
        subscription: {
          select: {
            id: true,
            tier: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
          },
        },
        usageCounters: {
          where: {
            metricType: {
              in: ['client_onboards', 'platform_audits', 'team_seats'],
            },
          },
          select: {
            metricType: true,
            count: true,
          },
        },
      },
    });

    if (!agency) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Agency not found',
        },
      };
    }

    const usage = {
      clientOnboards: agency.usageCounters.find(counter => counter.metricType === 'client_onboards')?.count || 0,
      platformAudits: agency.usageCounters.find(counter => counter.metricType === 'platform_audits')?.count || 0,
      teamSeats: agency.usageCounters.find(counter => counter.metricType === 'team_seats')?.count || 0,
    };

    return {
      data: {
        agency: {
          id: agency.id,
          name: agency.name,
          email: agency.email,
          createdAt: agency.createdAt,
          updatedAt: agency.updatedAt,
        },
        subscription: agency.subscription,
        members: agency.members,
        usage,
      },
      error: null,
    };
  }

  async listWebhookEndpoints(
    params: ListWebhookEndpointsParams = {}
  ): Promise<ServiceResult<Array<{
    id: string;
    agencyId: string;
    url: string;
    status: string;
    subscribedEvents: string[];
    failureCount: number;
    secretLastFour: string | null;
    lastDeliveredAt: string | null;
    lastFailedAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    agency: { id: string; name: string; email: string };
  }>>> {
    return listWebhookEndpointsForSupport({
      limit: params.limit ?? 50,
      ...(params.search ? { search: params.search } : {}),
      ...(params.status ? { status: params.status } : {}),
    });
  }

  async getWebhookDetail(
    agencyId: string,
    limit = 20
  ): Promise<ServiceResult<{
    endpoint: {
      id: string;
      agencyId: string;
      url: string;
      status: string;
      subscribedEvents: string[];
      failureCount: number;
      secretLastFour: string | null;
      lastDeliveredAt: string | null;
      lastFailedAt: string | null;
      createdAt: string | null;
      updatedAt: string | null;
    } | null;
    deliveries: Array<{
      id: string;
      eventId: string;
      eventType: string | null;
      status: string;
      attemptNumber: number;
      responseStatus?: number | null;
      responseBodySnippet?: string | null;
      errorMessage?: string | null;
      createdAt: string;
      deliveredAt?: string | null;
      nextAttemptAt?: string | null;
    }>;
  }>> {
    return getWebhookSupportDetails(agencyId, limit);
  }

  async listSubscriptions(params: ListSubscriptionsParams): Promise<ServiceResult<ListSubscriptionsData>> {
    const pagination = safePagination(params.page, params.limit);
    const where = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.tier ? { tier: params.tier } : {}),
    };

    const [total, subscriptions] = await Promise.all([
      prisma.subscription.count({ where }),
      prisma.subscription.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          agency: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      data: {
        items: subscriptions.map(subscription => ({
          id: subscription.id,
          agencyId: subscription.agency.id,
          agencyName: subscription.agency.name,
          agencyEmail: subscription.agency.email,
          tier: subscription.tier,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          createdAt: subscription.createdAt,
        })),
        total,
        page: pagination.page,
        limit: pagination.limit,
      },
      error: null,
    };
  }

  async listAffiliatePayoutBatches(
    params: ListAffiliatePayoutBatchesParams
  ): Promise<ServiceResult<ListAffiliatePayoutBatchesData>> {
    const pagination = safePagination(params.page, params.limit);
    const where = params.status ? { status: params.status } : undefined;

    const [total, batches] = await Promise.all([
      prisma.affiliatePayoutBatch.count({ where }),
      prisma.affiliatePayoutBatch.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: {
        items: batches,
        total,
        page: pagination.page,
        limit: pagination.limit,
      },
      error: null,
    };
  }

  async generateAffiliatePayoutBatch(
    params: GenerateAffiliatePayoutBatchParams
  ): Promise<ServiceResult<AffiliatePayoutBatchListItem>> {
    if (params.periodEnd < params.periodStart) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'periodEnd must be greater than or equal to periodStart',
        },
      };
    }

    const existingBatch = await prisma.affiliatePayoutBatch.findFirst({
      where: {
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        status: {
          in: ['draft', 'approved', 'exported', 'paid'],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingBatch) {
      return {
        data: existingBatch,
        error: null,
      };
    }

    const commissions = await prisma.affiliateCommission.findMany({
      where: {
        payoutBatchId: null,
        status: {
          in: ['pending', 'approved'],
        },
        holdUntil: {
          gte: params.periodStart,
          lte: params.periodEnd,
        },
      },
      orderBy: [
        { holdUntil: 'asc' },
        { createdAt: 'asc' },
      ],
      select: {
        id: true,
        amount: true,
        status: true,
      },
    });

    if (commissions.length === 0) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'No eligible commissions found for this payout period',
        },
      };
    }

    const totalAmount = commissions.reduce((sum, commission) => sum + commission.amount, 0);
    const now = new Date();

    const batch = await prisma.$transaction(async (tx) => {
      const createdBatch = await tx.affiliatePayoutBatch.create({
        data: {
          status: 'draft',
          currency: 'usd',
          periodStart: params.periodStart,
          periodEnd: params.periodEnd,
          totalAmount,
          commissionCount: commissions.length,
          notes: params.notes,
        },
      });

      await tx.affiliateCommission.updateMany({
        where: {
          id: {
            in: commissions.map((commission) => commission.id),
          },
        },
        data: {
          payoutBatchId: createdBatch.id,
          approvedAt: now,
          status: 'approved',
        },
      });

      return createdBatch;
    });

    await prisma.auditLog.create({
      data: {
        action: 'AFFILIATE_PAYOUT_BATCH_GENERATED',
        resourceType: 'affiliate_payout_batch',
        resourceId: batch.id,
        userEmail: params.userEmail,
        metadata: {
          periodStart: params.periodStart.toISOString(),
          periodEnd: params.periodEnd.toISOString(),
          commissionIds: commissions.map((commission) => commission.id),
          commissionCount: commissions.length,
          totalAmount,
        },
      },
    });

    return {
      data: batch,
      error: null,
    };
  }

  async exportAffiliatePayoutBatch(
    batchId: string,
    input: { userEmail?: string }
  ): Promise<ServiceResult<ExportAffiliatePayoutBatchData>> {
    const batch = await prisma.affiliatePayoutBatch.findUnique({
      where: { id: batchId },
      include: {
        commissions: {
          select: {
            id: true,
            amount: true,
            partner: {
              select: {
                id: true,
                name: true,
                email: true,
                payoutMethod: true,
                payoutDetails: true,
              },
            },
          },
        },
      },
    });

    if (!batch) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Affiliate payout batch not found',
        },
      };
    }

    const exportPayload = buildAffiliatePayoutExportCsv(batch);
    const persistedBatch = batch.exportedAt
      ? batch
      : await prisma.affiliatePayoutBatch.update({
        where: { id: batchId },
        data: {
          exportedAt: new Date(),
          status: batch.status === 'paid' ? batch.status : 'exported',
        },
      });

    await prisma.auditLog.create({
      data: {
        action: 'AFFILIATE_PAYOUT_BATCH_EXPORTED',
        resourceType: 'affiliate_payout_batch',
        resourceId: batchId,
        userEmail: input.userEmail,
        metadata: {
          rowCount: exportPayload.rowCount,
          commissionCount: exportPayload.commissionCount,
          exportedAt: persistedBatch.exportedAt?.toISOString() || null,
          fileName: `affiliate-payout-batch-${batch.id}.csv`,
          reExport: Boolean(batch.exportedAt),
        },
      },
    });

    return {
      data: {
        batchId: batch.id,
        fileName: `affiliate-payout-batch-${batch.id}.csv`,
        exportedAt: (persistedBatch.exportedAt || batch.exportedAt || new Date()).toISOString(),
        rowCount: exportPayload.rowCount,
        csv: exportPayload.csv,
      },
      error: null,
    };
  }

  async listAffiliatePartners(
    params: ListAffiliatePartnersParams
  ): Promise<ServiceResult<ListAffiliatePartnersData>> {
    const pagination = safePagination(params.page, params.limit);
    const where = buildAffiliatePartnerWhere(params);

    const [total, partners] = await Promise.all([
      prisma.affiliatePartner.count({ where }),
      prisma.affiliatePartner.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { appliedAt: 'desc' },
        select: affiliatePartnerAdminSelect(),
      }),
    ]);

    return {
      data: {
        items: partners.map(mapAffiliatePartnerListItem),
        total,
        page: pagination.page,
        limit: pagination.limit,
      },
      error: null,
    };
  }

  async updateAffiliatePartner(
    partnerId: string,
    input: UpdateAffiliatePartnerInput
  ): Promise<ServiceResult<AffiliatePartnerListItem>> {
    const existing = await prisma.affiliatePartner.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        status: true,
        notes: true,
      },
    });

    if (!existing) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Affiliate partner not found',
        },
      };
    }

    const now = new Date();
    const data: Record<string, unknown> = {};

    if (input.status) {
      data.status = input.status;

      if (input.status === 'approved') {
        data.approvedAt = now;
        data.rejectedAt = null;
      } else if (input.status === 'rejected') {
        data.rejectedAt = now;
      } else if (input.status === 'disabled') {
        data.disabledAt = now;
      }
    }

    if (typeof input.defaultCommissionBps === 'number') {
      data.defaultCommissionBps = input.defaultCommissionBps;
    }

    if (typeof input.commissionDurationMonths === 'number') {
      data.commissionDurationMonths = input.commissionDurationMonths;
    }

    const updated = await prisma.affiliatePartner.update({
      where: { id: partnerId },
      data,
      select: affiliatePartnerAdminSelect(),
    });

    await prisma.auditLog.create({
      data: {
        action: 'AFFILIATE_PARTNER_UPDATED',
        resourceType: 'affiliate_partner',
        resourceId: partnerId,
        userEmail: input.userEmail,
        metadata: {
          previousStatus: existing.status,
          status: input.status,
          defaultCommissionBps: input.defaultCommissionBps,
          commissionDurationMonths: input.commissionDurationMonths,
          internalNotes: input.internalNotes,
        },
      },
    });

    return {
      data: mapAffiliatePartnerListItem(updated),
      error: null,
    };
  }

  async getAffiliatePartnerDetail(
    partnerId: string
  ): Promise<ServiceResult<AffiliateAdminPartnerDetail>> {
    const partner = await prisma.affiliatePartner.findUnique({
      where: { id: partnerId },
      select: affiliatePartnerAdminSelect(),
    });

    if (!partner) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Affiliate partner not found',
        },
      };
    }

    const [clicks, pendingCommissions, paidCommissions, links, referrals, commissions] = await Promise.all([
      prisma.affiliateClick.count({
        where: { partnerId },
      }),
      prisma.affiliateCommission.aggregate({
        _sum: { amount: true },
        where: {
          partnerId,
          status: {
            in: ['pending', 'approved', 'review_required'],
          },
        },
      }),
      prisma.affiliateCommission.aggregate({
        _sum: { amount: true },
        where: {
          partnerId,
          status: 'paid',
        },
      }),
      prisma.affiliateLink.findMany({
        where: { partnerId },
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          code: true,
          status: true,
          destinationPath: true,
          campaign: true,
          createdAt: true,
          _count: {
            select: {
              clicks: true,
            },
          },
        },
      }),
      prisma.affiliateReferral.findMany({
        where: { partnerId },
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          status: true,
          attributionSource: true,
          commissionBps: true,
          commissionDurationMonths: true,
          disqualificationReason: true,
          metadata: true,
          createdAt: true,
          qualifiedAt: true,
          disqualifiedAt: true,
          referredAgency: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.affiliateCommission.findMany({
        where: { partnerId },
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          status: true,
          amount: true,
          revenueAmount: true,
          commissionBps: true,
          holdUntil: true,
          approvedAt: true,
          paidAt: true,
          voidedAt: true,
          notes: true,
          createdAt: true,
          referral: {
            select: {
              referredAgency: {
                select: {
                  name: true,
                },
              },
            },
          },
          invoice: {
            select: {
              invoiceDate: true,
            },
          },
        },
      }),
    ]);

    return {
      data: {
        partner: {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          companyName: partner.companyName || null,
          websiteUrl: partner.websiteUrl || null,
          audienceSize: (partner.audienceSize || null) as AffiliateAdminPartnerDetail['partner']['audienceSize'],
          status: partner.status as AffiliatePartnerStatus,
          applicationNotes: partner.notes || null,
          defaultCommissionBps: partner.defaultCommissionBps,
          commissionDurationMonths: partner.commissionDurationMonths,
          appliedAt: partner.appliedAt.toISOString(),
          approvedAt: partner.approvedAt?.toISOString() || null,
          rejectedAt: partner.rejectedAt?.toISOString() || null,
          disabledAt: partner.disabledAt?.toISOString() || null,
          referralCount: partner._count?.referrals || 0,
          commissionCount: partner._count?.commissions || 0,
          linkCount: partner._count?.links || 0,
        },
        metrics: {
          clicks,
          referrals: partner._count?.referrals || 0,
          commissions: partner._count?.commissions || 0,
          pendingCommissionCents: pendingCommissions._sum.amount || 0,
          paidCommissionCents: paidCommissions._sum.amount || 0,
        },
        links: links.map((link) => ({
          id: link.id,
          code: link.code,
          status: link.status as AffiliateLinkStatus,
          destinationPath: normalizeAffiliateDestinationPath(link.destinationPath),
          campaign: link.campaign || null,
          url: buildAffiliateLinkUrl(link.code),
          clickCount: link._count.clicks,
          createdAt: link.createdAt.toISOString(),
        })),
        referrals: referrals.map((referral) => ({
          id: referral.id,
          status: referral.status,
          referredAgencyName: referral.referredAgency?.name || 'Unknown agency',
          attributionSource: referral.attributionSource,
          commissionBps: referral.commissionBps,
          commissionDurationMonths: referral.commissionDurationMonths,
          createdAt: referral.createdAt.toISOString(),
          qualifiedAt: referral.qualifiedAt?.toISOString() || null,
          disqualifiedAt: referral.disqualifiedAt?.toISOString() || null,
          disqualificationReason: referral.disqualificationReason || null,
          riskReasons: extractRiskReasons(referral.metadata),
        })),
        commissions: commissions.map((commission) => ({
          id: commission.id,
          customerName: commission.referral?.referredAgency?.name || 'Unknown agency',
          status: commission.status as AffiliateCommissionStatus,
          amountCents: commission.amount,
          revenueAmountCents: commission.revenueAmount,
          commissionBps: commission.commissionBps,
          holdUntil: commission.holdUntil.toISOString(),
          approvedAt: commission.approvedAt?.toISOString() || null,
          paidAt: commission.paidAt?.toISOString() || null,
          voidedAt: commission.voidedAt?.toISOString() || null,
          invoiceDate: commission.invoice?.invoiceDate?.toISOString() || null,
          notes: commission.notes || null,
          createdAt: commission.createdAt.toISOString(),
        })),
      },
      error: null,
    };
  }

  async listAffiliateFraudQueue(): Promise<ServiceResult<AffiliateFraudQueueData>> {
    const [referrals, commissions] = await Promise.all([
      prisma.affiliateReferral.findMany({
        where: {
          status: 'review_required',
        },
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          status: true,
          commissionBps: true,
          commissionDurationMonths: true,
          metadata: true,
          createdAt: true,
          qualifiedAt: true,
          partner: {
            select: {
              id: true,
              name: true,
            },
          },
          referredAgency: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              commissions: true,
            },
          },
        },
      }),
      prisma.affiliateCommission.findMany({
        where: {
          status: 'review_required',
        },
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          status: true,
          amount: true,
          holdUntil: true,
          createdAt: true,
          notes: true,
          partner: {
            select: {
              id: true,
              name: true,
            },
          },
          referral: {
            select: {
              id: true,
              metadata: true,
              referredAgency: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: {
        referrals: referrals.map((referral) => ({
          id: referral.id,
          partnerId: referral.partner.id,
          partnerName: referral.partner.name,
          referredAgencyId: referral.referredAgency.id,
          referredAgencyName: referral.referredAgency.name,
          status: referral.status,
          riskReasons: extractRiskReasons(referral.metadata),
          createdAt: referral.createdAt.toISOString(),
          qualifiedAt: referral.qualifiedAt?.toISOString() || null,
          commissionCount: referral._count.commissions,
        })),
        commissions: commissions.map((commission) => ({
          id: commission.id,
          referralId: commission.referral.id,
          partnerId: commission.partner.id,
          partnerName: commission.partner.name,
          customerName: commission.referral.referredAgency.name,
          status: commission.status,
          amountCents: commission.amount,
          holdUntil: commission.holdUntil.toISOString(),
          createdAt: commission.createdAt.toISOString(),
          riskReasons: extractRiskReasons(commission.referral.metadata),
          notes: commission.notes || null,
        })),
        counts: {
          flaggedReferrals: referrals.length,
          flaggedCommissions: commissions.length,
        },
      },
      error: null,
    };
  }

  async disableAffiliateLink(
    linkId: string,
    input: { internalNotes?: string; userEmail?: string }
  ): Promise<ServiceResult<{ id: string; status: string }>> {
    const link = await prisma.affiliateLink.findUnique({
      where: { id: linkId },
      select: {
        id: true,
        partnerId: true,
        status: true,
      },
    });

    if (!link) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Affiliate link not found',
        },
      };
    }

    const updated = await prisma.affiliateLink.update({
      where: { id: linkId },
      data: {
        status: 'disabled',
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'AFFILIATE_LINK_DISABLED',
        resourceType: 'affiliate_link',
        resourceId: linkId,
        userEmail: input.userEmail,
        metadata: {
          partnerId: link.partnerId,
          previousStatus: link.status,
          status: 'disabled',
          internalNotes: input.internalNotes,
        },
      },
    });

    return {
      data: {
        id: updated.id,
        status: updated.status,
      },
      error: null,
    };
  }

  async disqualifyAffiliateReferral(
    referralId: string,
    input: AffiliateAdminReferralDisqualificationInput & { userEmail?: string }
  ): Promise<ServiceResult<{ id: string; status: string }>> {
    const referral = await prisma.affiliateReferral.findUnique({
      where: { id: referralId },
      select: {
        id: true,
        partnerId: true,
        status: true,
        metadata: true,
      },
    });

    if (!referral) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Affiliate referral not found',
        },
      };
    }

    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const nextReferral = await tx.affiliateReferral.update({
        where: { id: referralId },
        data: {
          status: 'disqualified',
          disqualificationReason: input.reason,
          disqualifiedAt: now,
        },
      });

      await tx.affiliateCommission.updateMany({
        where: {
          referralId,
          paidAt: null,
          status: {
            in: ['pending', 'approved', 'review_required'],
          },
        },
        data: {
          status: 'void',
          voidedAt: now,
          notes: input.internalNotes,
        },
      });

      return nextReferral;
    });

    await prisma.auditLog.create({
      data: {
        action: 'AFFILIATE_REFERRAL_DISQUALIFIED',
        resourceType: 'affiliate_referral',
        resourceId: referralId,
        userEmail: input.userEmail,
        metadata: {
          partnerId: referral.partnerId,
          previousStatus: referral.status,
          status: 'disqualified',
          reason: input.reason,
          riskReasons: extractRiskReasons(referral.metadata),
          internalNotes: input.internalNotes,
        },
      },
    });

    return {
      data: {
        id: updated.id,
        status: updated.status,
      },
      error: null,
    };
  }

  async resolveAffiliateReferralReview(
    referralId: string,
    input: ResolveAffiliateReferralReviewInput
  ): Promise<ServiceResult<{ id: string; status: string }>> {
    const referral = await prisma.affiliateReferral.findUnique({
      where: { id: referralId },
      select: {
        id: true,
        partnerId: true,
        status: true,
        qualifiedAt: true,
        metadata: true,
        _count: {
          select: {
            commissions: true,
          },
        },
      },
    });

    if (!referral) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Affiliate referral not found',
        },
      };
    }

    if (input.resolution === 'disqualify') {
      return this.disqualifyAffiliateReferral(referralId, {
        reason: input.reason,
        internalNotes: input.internalNotes,
        userEmail: input.userEmail,
      });
    }

    const now = new Date();
    const hasCommissionHistory = (referral._count?.commissions || 0) > 0;
    const nextStatus = input.resolution === 'clear'
      ? (referral.qualifiedAt || hasCommissionHistory ? 'qualified' : 'attributed')
      : 'review_required';

    const updated = await prisma.$transaction(async (tx) => {
      const nextReferral = await tx.affiliateReferral.update({
        where: { id: referralId },
        data: {
          status: nextStatus,
          qualifiedAt: nextStatus === 'qualified' ? (referral.qualifiedAt || now) : null,
          disqualificationReason: null,
          disqualifiedAt: null,
        },
      });

      await tx.affiliateCommission.updateMany({
        where: {
          referralId,
          paidAt: null,
          status: input.resolution === 'clear'
            ? 'review_required'
            : {
              in: ['pending', 'approved', 'review_required'],
            },
        },
        data: input.resolution === 'clear'
          ? {
            status: 'pending',
            voidedAt: null,
          }
          : {
            status: 'review_required',
            voidedAt: null,
          },
      });

      return nextReferral;
    });

    await prisma.auditLog.create({
      data: {
        action: 'AFFILIATE_REFERRAL_REVIEW_RESOLVED',
        resourceType: 'affiliate_referral',
        resourceId: referralId,
        userEmail: input.userEmail,
        metadata: {
          partnerId: referral.partnerId,
          previousStatus: referral.status,
          status: updated.status,
          resolution: input.resolution,
          reason: input.reason,
          riskReasons: extractRiskReasons(referral.metadata),
          internalNotes: input.internalNotes,
        },
      },
    });

    return {
      data: {
        id: updated.id,
        status: updated.status,
      },
      error: null,
    };
  }

  async adjustAffiliateCommission(
    commissionId: string,
    input: AffiliateAdminCommissionAdjustment & { userEmail?: string }
  ): Promise<ServiceResult<{ id: string; status: string; amount: number }>> {
    const commission = await prisma.affiliateCommission.findUnique({
      where: { id: commissionId },
      select: {
        id: true,
        partnerId: true,
        status: true,
        amount: true,
        notes: true,
        approvedAt: true,
        paidAt: true,
        voidedAt: true,
      },
    });

    if (!commission) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Affiliate commission not found',
        },
      };
    }

    const now = new Date();
    const data: Record<string, unknown> = {
      notes: appendAdminNote(commission.notes, input.internalNotes),
    };

    if (typeof input.amountCents === 'number') {
      data.amount = input.amountCents;
    }

    if (input.status) {
      data.status = input.status;

      if (input.status === 'approved') {
        data.approvedAt = now;
        data.paidAt = null;
        data.voidedAt = null;
      } else if (input.status === 'paid') {
        data.approvedAt = commission.approvedAt || now;
        data.paidAt = now;
        data.voidedAt = null;
      } else if (input.status === 'void') {
        data.voidedAt = now;
        data.paidAt = null;
      } else {
        data.approvedAt = null;
        data.paidAt = null;
        data.voidedAt = null;
      }
    }

    const updated = await prisma.affiliateCommission.update({
      where: { id: commissionId },
      data,
    });

    await prisma.auditLog.create({
      data: {
        action: 'AFFILIATE_COMMISSION_ADJUSTED',
        resourceType: 'affiliate_commission',
        resourceId: commissionId,
        userEmail: input.userEmail,
        metadata: {
          partnerId: commission.partnerId,
          previousStatus: commission.status,
          status: input.status || commission.status,
          previousAmount: commission.amount,
          amount: input.amountCents ?? commission.amount,
          internalNotes: input.internalNotes,
        },
      },
    });

    return {
      data: {
        id: updated.id,
        status: updated.status,
        amount: updated.amount,
      },
      error: null,
    };
  }
}

export const internalAdminService = new InternalAdminService();
