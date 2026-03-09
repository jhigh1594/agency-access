import { createHash, randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';

import {
  AffiliateApplicationInputSchema,
  AffiliatePartnerCommissionHistorySchema,
  AffiliatePartnerPortalOverviewSchema,
  AffiliatePortalLinkCreateInputSchema,
  type AffiliateCommissionLedgerEntry,
  type AffiliateLinkSummary,
  type AffiliatePartnerCommissionHistory,
  type AffiliatePartnerPortalOverview,
  type AffiliatePayoutBatchSummary,
  type AffiliatePortalLinkCreateInput,
  type AffiliateApplicationInput,
} from '@agency-platform/shared';

import { resolveAffiliatePartnerPrincipal } from '@/lib/affiliate-partner-auth.js';
import { env } from '@/lib/env.js';
import { prisma } from '@/lib/prisma.js';
import {
  buildDefaultAffiliateCommissionScheduleFromEnv,
  evaluateAffiliateReferralRisk,
} from './affiliate-program.service.js';

interface ServiceResult<T> {
  data: T | null;
  error: { code: string; message: string; details?: any } | null;
}

interface RegisterClickInput {
  referrer?: string | null;
  landingPath?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface ClaimReferralInput {
  clickToken: string;
  agencyId: string;
  agencyEmail?: string | null;
}

interface AuthUserClaims {
  sub?: string;
  email?: string;
  email_address?: string;
  emailAddress?: string;
  email_addresses?: Array<{ email_address?: string; emailAddress?: string }>;
}

type PortalPartner = {
  id: string;
  clerkUserId: string | null;
  email: string;
  name: string;
  status: string;
  defaultCommissionBps: number;
  commissionDurationMonths: number;
};

function hashOptional(value?: string | null): string | null {
  if (!value) return null;
  return createHash('sha256').update(value).digest('hex');
}

function normalizeDestinationPath(value?: string | null): string {
  if (!value || !value.startsWith('/')) return '/';
  return value;
}

function slugifyCodePart(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return normalized || 'partner';
}

function buildLinkUrl(code: string): string {
  return `${env.FRONTEND_URL}/r/${code}`;
}

function buildDefaultCommissionMetadataForPartner(partner: {
  defaultCommissionBps: number;
  commissionDurationMonths: number;
}) {
  const defaultSchedule = buildDefaultAffiliateCommissionScheduleFromEnv();
  const totalDuration = defaultSchedule.reduce((sum, tier) => sum + tier.durationMonths, 0);

  if (
    defaultSchedule.length === 0 ||
    partner.defaultCommissionBps !== env.AFFILIATE_DEFAULT_COMMISSION_BPS ||
    partner.commissionDurationMonths !== totalDuration
  ) {
    return {};
  }

  return {
    commissionSchedule: defaultSchedule,
  };
}

function extractEmailDomain(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  const atIndex = normalized.lastIndexOf('@');
  if (atIndex < 0 || atIndex === normalized.length - 1) {
    return null;
  }

  return normalized.slice(atIndex + 1);
}

function affiliatePartnerSelect() {
  return {
    id: true,
    clerkUserId: true,
    email: true,
    name: true,
    status: true,
    defaultCommissionBps: true,
    commissionDurationMonths: true,
  } as const;
}

function formatLinkSummary(link: {
  id: string;
  code: string;
  status: string;
  destinationPath: string;
  campaign?: string | null;
}): AffiliateLinkSummary {
  return {
    id: link.id,
    code: link.code,
    status: link.status as AffiliateLinkSummary['status'],
    destinationPath: normalizeDestinationPath(link.destinationPath),
    campaign: link.campaign || null,
    url: buildLinkUrl(link.code),
  };
}

class AffiliateService {
  private async ensureUniqueLinkCode(base: string): Promise<string> {
    const normalizedBase = slugifyCodePart(base).slice(0, 48);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = attempt === 0 ? '' : `-${attempt + 1}`;
      const candidate = `${normalizedBase}${suffix}`;
      const existingCount = await prisma.affiliateLink.count({
        where: { code: candidate },
      });

      if (existingCount === 0) {
        return candidate;
      }
    }

    return `${normalizedBase}-${randomBytes(3).toString('hex')}`;
  }

  private async ensurePrimaryLink(partner: PortalPartner) {
    const existingLinks = await prisma.affiliateLink.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        code: true,
        status: true,
        destinationPath: true,
        campaign: true,
      },
    });

    if (existingLinks.length > 0) {
      return existingLinks;
    }

    const code = await this.ensureUniqueLinkCode(partner.name);
    await prisma.affiliateLink.create({
      data: {
        partnerId: partner.id,
        code,
        destinationPath: '/pricing',
        status: 'active',
      },
    });

    return prisma.affiliateLink.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        code: true,
        status: true,
        destinationPath: true,
        campaign: true,
      },
    });
  }

  async resolveAuthenticatedPartner(
    user: AuthUserClaims | undefined,
  ): Promise<ServiceResult<PortalPartner>> {
    const principal = resolveAffiliatePartnerPrincipal(user);
    if (principal.error || !principal.data) {
      return {
        data: null,
        error: principal.error || {
          code: 'UNAUTHORIZED',
          message: 'Authenticated affiliate partner context is required',
        },
      };
    }

    const partner = await prisma.affiliatePartner.findFirst({
      where: {
        OR: [
          { clerkUserId: principal.data.userId },
          { email: principal.data.email },
        ],
      },
      select: affiliatePartnerSelect(),
    });

    if (!partner || partner.status !== 'approved') {
      return {
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Approved affiliate partner access is required',
        },
      };
    }

    if (!partner.clerkUserId) {
      const updatedPartner = await prisma.affiliatePartner.update({
        where: { id: partner.id },
        data: { clerkUserId: principal.data.userId },
        select: affiliatePartnerSelect(),
      });

      return { data: updatedPartner, error: null };
    }

    return { data: partner, error: null };
  }

  async submitApplication(
    input: AffiliateApplicationInput
  ): Promise<ServiceResult<{ id: string; status: string }>> {
    const validated = AffiliateApplicationInputSchema.safeParse(input);
    if (!validated.success) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid affiliate application',
          details: validated.error.flatten(),
        },
      };
    }

    const existing = await prisma.affiliatePartner.findUnique({
      where: { email: validated.data.email },
      select: { id: true, status: true },
    });

    if (existing) {
      return {
        data: null,
        error: {
          code: 'CONFLICT',
          message: 'An affiliate application already exists for this email',
        },
      };
    }

    const partner = await prisma.affiliatePartner.create({
      data: {
        email: validated.data.email,
        name: validated.data.name,
        companyName: validated.data.companyName || null,
        websiteUrl: validated.data.websiteUrl || null,
        audienceSize: validated.data.audienceSize || null,
        notes: validated.data.promotionPlan,
        status: 'applied',
        defaultCommissionBps: env.AFFILIATE_DEFAULT_COMMISSION_BPS,
        commissionDurationMonths: env.AFFILIATE_DEFAULT_COMMISSION_MONTHS,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return { data: partner, error: null };
  }

  async registerClick(
    code: string,
    input: RegisterClickInput
  ): Promise<ServiceResult<{ clickToken: string; destinationPath: string }>> {
    const link = await prisma.affiliateLink.findFirst({
      where: {
        code,
        status: 'active',
        partner: {
          status: 'approved',
        },
      },
      select: {
        id: true,
        partnerId: true,
        destinationPath: true,
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

    const clickToken = randomBytes(18).toString('hex');
    await prisma.affiliateClick.create({
      data: {
        partnerId: link.partnerId,
        linkId: link.id,
        clickToken,
        referrer: input.referrer || null,
        landingPath: input.landingPath || null,
        utmSource: input.utmSource || null,
        utmMedium: input.utmMedium || null,
        utmCampaign: input.utmCampaign || null,
        ipHash: hashOptional(input.ipAddress),
        userAgentHash: hashOptional(input.userAgent),
      },
    });

    return {
      data: {
        clickToken,
        destinationPath: normalizeDestinationPath(link.destinationPath),
      },
      error: null,
    };
  }

  async claimReferralForAgency(
    input: ClaimReferralInput
  ): Promise<ServiceResult<{ id: string; status: string }>> {
    const existing = await prisma.affiliateReferral.findUnique({
      where: { referredAgencyId: input.agencyId },
      select: { id: true, status: true },
    });

    if (existing) {
      return { data: existing, error: null };
    }

    const click = await prisma.affiliateClick.findUnique({
      where: { clickToken: input.clickToken },
      select: {
        id: true,
        partnerId: true,
        linkId: true,
        partner: {
          select: {
            email: true,
            defaultCommissionBps: true,
            commissionDurationMonths: true,
          },
        },
      },
    });

    if (!click) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Affiliate click not found',
        },
      };
    }

    const risk = evaluateAffiliateReferralRisk({
      partnerEmail: click.partner.email,
      referredCustomerEmail: input.agencyEmail,
      sameCompanyDomain:
        extractEmailDomain(click.partner.email) !== null &&
        extractEmailDomain(click.partner.email) === extractEmailDomain(input.agencyEmail),
    });

    const defaultCommissionMetadata = buildDefaultCommissionMetadataForPartner({
      defaultCommissionBps: click.partner.defaultCommissionBps,
      commissionDurationMonths: click.partner.commissionDurationMonths,
    });
    const metadata = {
      ...defaultCommissionMetadata,
      ...(risk.reasons.length > 0 ? { riskReasons: risk.reasons } : {}),
    };

    const referral = await prisma.affiliateReferral.create({
      data: {
        partnerId: click.partnerId,
        linkId: click.linkId,
        clickId: click.id,
        referredAgencyId: input.agencyId,
        status: risk.outcome === 'clear' ? 'attributed' : risk.outcome,
        commissionBps: click.partner.defaultCommissionBps,
        commissionDurationMonths: click.partner.commissionDurationMonths,
        disqualificationReason: risk.reasons[0] || null,
        metadata:
          Object.keys(metadata).length > 0 ? (metadata as Prisma.InputJsonValue) : undefined,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return { data: referral, error: null };
  }

  async getPortalOverview(
    partnerId: string
  ): Promise<ServiceResult<AffiliatePartnerPortalOverview>> {
    const partner = await prisma.affiliatePartner.findUnique({
      where: { id: partnerId },
      select: affiliatePartnerSelect(),
    });

    if (!partner || partner.status !== 'approved') {
      return {
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Approved affiliate partner access is required',
        },
      };
    }

    const links = await this.ensurePrimaryLink(partner);
    const [clicks, referrals, customers, pendingAggregate, paidAggregate] = await Promise.all([
      prisma.affiliateClick.count({
        where: { partnerId },
      }),
      prisma.affiliateReferral.count({
        where: { partnerId },
      }),
      prisma.affiliateReferral.count({
        where: {
          partnerId,
          referredAgency: {
            subscription: {
              is: {
                status: {
                  in: ['active', 'trialing'],
                },
              },
            },
          },
        },
      }),
      prisma.affiliateCommission.aggregate({
        where: {
          partnerId,
          status: {
            in: ['pending', 'approved', 'review_required'],
          },
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.affiliateCommission.aggregate({
        where: {
          partnerId,
          status: 'paid',
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const overview = AffiliatePartnerPortalOverviewSchema.parse({
      partner: {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        status: partner.status,
        defaultCommissionBps: partner.defaultCommissionBps,
        commissionDurationMonths: partner.commissionDurationMonths,
      },
      metrics: {
        clicks,
        referrals,
        customers,
        pendingCommissionCents: pendingAggregate._sum.amount || 0,
        paidCommissionCents: paidAggregate._sum.amount || 0,
      },
      primaryLink: links[0] ? formatLinkSummary(links[0]) : null,
      links: links.map((link) => formatLinkSummary(link)),
    });

    return {
      data: overview,
      error: null,
    };
  }

  async getPortalCommissionHistory(
    partnerId: string
  ): Promise<ServiceResult<AffiliatePartnerCommissionHistory>> {
    const partner = await prisma.affiliatePartner.findUnique({
      where: { id: partnerId },
      select: affiliatePartnerSelect(),
    });

    if (!partner || partner.status !== 'approved') {
      return {
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Approved affiliate partner access is required',
        },
      };
    }

    const [commissions, payouts] = await Promise.all([
      prisma.affiliateCommission.findMany({
        where: { partnerId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          currency: true,
          amount: true,
          revenueAmount: true,
          commissionBps: true,
          holdUntil: true,
          approvedAt: true,
          paidAt: true,
          voidedAt: true,
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
          payoutBatch: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
      prisma.affiliatePayoutBatch.findMany({
        where: {
          commissions: {
            some: { partnerId },
          },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          currency: true,
          totalAmount: true,
          commissionCount: true,
          periodStart: true,
          periodEnd: true,
          exportedAt: true,
          paidAt: true,
          createdAt: true,
        },
      }),
    ]);

    const ledgerEntries: AffiliateCommissionLedgerEntry[] = commissions.map((commission) => ({
      id: commission.id,
      customerName: commission.referral?.referredAgency?.name || 'Unknown agency',
      status: commission.status as AffiliateCommissionLedgerEntry['status'],
      currency: commission.currency,
      amountCents: commission.amount,
      revenueAmountCents: commission.revenueAmount,
      commissionBps: commission.commissionBps,
      invoiceDate: commission.invoice?.invoiceDate?.toISOString() || null,
      holdUntil: commission.holdUntil.toISOString(),
      approvedAt: commission.approvedAt?.toISOString() || null,
      paidAt: commission.paidAt?.toISOString() || null,
      voidedAt: commission.voidedAt?.toISOString() || null,
      createdAt: commission.createdAt.toISOString(),
      payoutBatchId: commission.payoutBatch?.id || null,
      payoutBatchStatus: commission.payoutBatch?.status as AffiliateCommissionLedgerEntry['payoutBatchStatus'] || null,
    }));

    const payoutEntries: AffiliatePayoutBatchSummary[] = payouts.map((batch) => ({
      id: batch.id,
      status: batch.status as AffiliatePayoutBatchSummary['status'],
      currency: batch.currency,
      totalAmountCents: batch.totalAmount,
      commissionCount: batch.commissionCount,
      periodStart: batch.periodStart.toISOString(),
      periodEnd: batch.periodEnd.toISOString(),
      exportedAt: batch.exportedAt?.toISOString() || null,
      paidAt: batch.paidAt?.toISOString() || null,
      createdAt: batch.createdAt.toISOString(),
    }));

    return {
      data: AffiliatePartnerCommissionHistorySchema.parse({
        commissions: ledgerEntries,
        payouts: payoutEntries,
      }),
      error: null,
    };
  }

  async createPortalLink(
    partnerId: string,
    input: AffiliatePortalLinkCreateInput,
  ): Promise<ServiceResult<AffiliateLinkSummary>> {
    const validated = AffiliatePortalLinkCreateInputSchema.safeParse(input);
    if (!validated.success) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid affiliate link settings',
          details: validated.error.flatten(),
        },
      };
    }

    const partner = await prisma.affiliatePartner.findUnique({
      where: { id: partnerId },
      select: affiliatePartnerSelect(),
    });

    if (!partner || partner.status !== 'approved') {
      return {
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Approved affiliate partner access is required',
        },
      };
    }

    const code = await this.ensureUniqueLinkCode(`${partner.name}-${validated.data.campaign}`);
    const link = await prisma.affiliateLink.create({
      data: {
        partnerId,
        code,
        campaign: validated.data.campaign,
        destinationPath: normalizeDestinationPath(validated.data.destinationPath),
        status: 'active',
      },
      select: {
        id: true,
        code: true,
        status: true,
        destinationPath: true,
        campaign: true,
      },
    });

    return {
      data: formatLinkSummary(link),
      error: null,
    };
  }
}

export const affiliateService = new AffiliateService();
