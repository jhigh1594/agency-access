import { getIntervalFromProductId } from '@/config/creem.config.js';
import { prisma } from '@/lib/prisma.js';
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
}

export const internalAdminService = new InternalAdminService();
