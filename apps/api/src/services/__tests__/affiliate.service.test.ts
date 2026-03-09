import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@/lib/prisma';
import { affiliateService } from '@/services/affiliate.service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    affiliatePartner: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    affiliateLink: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    affiliateClick: {
      create: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    affiliateReferral: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    affiliateCommission: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    affiliatePayoutBatch: {
      findMany: vi.fn(),
    },
  },
}));

describe('AffiliateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitApplication', () => {
    it('creates a new affiliate application', async () => {
      vi.mocked(prisma.affiliatePartner.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.affiliatePartner.create).mockResolvedValue({
        id: 'partner_1',
        status: 'applied',
      } as any);

      const result = await affiliateService.submitApplication({
        name: 'Jane Doe',
        email: 'jane@example.com',
        promotionPlan: 'Newsletter and LinkedIn',
        audienceSize: '1k_to_10k',
        termsAccepted: true,
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        id: 'partner_1',
        status: 'applied',
      });
    });
  });

  describe('registerClick', () => {
    it('returns not found for unknown affiliate links', async () => {
      vi.mocked(prisma.affiliateLink.findFirst).mockResolvedValue(null);

      const result = await affiliateService.registerClick('missing', {
        referrer: 'https://example.com/post',
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        code: 'NOT_FOUND',
        message: 'Affiliate link not found',
      });
    });
  });

  describe('claimReferralForAgency', () => {
    it('returns an existing referral if the agency is already attributed', async () => {
      vi.mocked(prisma.affiliateReferral.findUnique).mockResolvedValue({
        id: 'referral_1',
        status: 'attributed',
      } as any);

      const result = await affiliateService.claimReferralForAgency({
        clickToken: 'click_123',
        agencyId: 'agency_1',
        agencyEmail: 'buyer@example.com',
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        id: 'referral_1',
        status: 'attributed',
      });
      expect(prisma.affiliateClick.findUnique).not.toHaveBeenCalled();
    });

    it('disqualifies self-referrals and stores the fraud reason', async () => {
      vi.mocked(prisma.affiliateReferral.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.affiliateClick.findUnique).mockResolvedValue({
        id: 'click_1',
        partnerId: 'partner_1',
        linkId: 'link_1',
        partner: {
          email: 'partner@example.com',
          defaultCommissionBps: 3000,
          commissionDurationMonths: 12,
        },
      } as any);
      vi.mocked(prisma.affiliateReferral.create).mockResolvedValue({
        id: 'referral_1',
        status: 'disqualified',
      } as any);

      const result = await affiliateService.claimReferralForAgency({
        clickToken: 'click_123',
        agencyId: 'agency_1',
        agencyEmail: 'partner@example.com',
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        id: 'referral_1',
        status: 'disqualified',
      });
      expect(prisma.affiliateReferral.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'disqualified',
            disqualificationReason: 'self_referral_email',
            metadata: {
              riskReasons: ['self_referral_email'],
            },
          }),
        })
      );
    });

    it('marks same-domain referrals as review_required instead of attributing them directly', async () => {
      vi.mocked(prisma.affiliateReferral.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.affiliateClick.findUnique).mockResolvedValue({
        id: 'click_1',
        partnerId: 'partner_1',
        linkId: 'link_1',
        partner: {
          email: 'partner@growthstudio.com',
          defaultCommissionBps: 3000,
          commissionDurationMonths: 12,
        },
      } as any);
      vi.mocked(prisma.affiliateReferral.create).mockResolvedValue({
        id: 'referral_2',
        status: 'review_required',
      } as any);

      const result = await affiliateService.claimReferralForAgency({
        clickToken: 'click_456',
        agencyId: 'agency_2',
        agencyEmail: 'owner@growthstudio.com',
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        id: 'referral_2',
        status: 'review_required',
      });
      expect(prisma.affiliateReferral.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'review_required',
            disqualificationReason: 'same_company_domain',
            metadata: {
              riskReasons: ['same_company_domain'],
            },
          }),
        })
      );
    });
  });

  describe('resolveAuthenticatedPartner', () => {
    it('hydrates clerk user id from an approved email-matched partner', async () => {
      vi.mocked(prisma.affiliatePartner.findFirst).mockResolvedValue({
        id: 'partner_1',
        clerkUserId: null,
        email: 'partner@example.com',
        name: 'Partner One',
        status: 'approved',
        defaultCommissionBps: 3000,
        commissionDurationMonths: 12,
      } as any);
      vi.mocked(prisma.affiliatePartner.update).mockResolvedValue({
        id: 'partner_1',
        clerkUserId: 'user_1',
        email: 'partner@example.com',
        name: 'Partner One',
        status: 'approved',
        defaultCommissionBps: 3000,
        commissionDurationMonths: 12,
      } as any);

      const result = await affiliateService.resolveAuthenticatedPartner({
        sub: 'user_1',
        email: 'Partner@Example.com',
      });

      expect(result.error).toBeNull();
      expect(result.data?.email).toBe('partner@example.com');
      expect(prisma.affiliatePartner.update).toHaveBeenCalledWith({
        where: { id: 'partner_1' },
        data: { clerkUserId: 'user_1' },
        select: expect.any(Object),
      });
    });

    it('rejects users who are not approved affiliate partners', async () => {
      vi.mocked(prisma.affiliatePartner.findFirst).mockResolvedValue({
        id: 'partner_1',
        clerkUserId: null,
        email: 'partner@example.com',
        name: 'Partner One',
        status: 'applied',
        defaultCommissionBps: 3000,
        commissionDurationMonths: 12,
      } as any);

      const result = await affiliateService.resolveAuthenticatedPartner({
        sub: 'user_1',
        email: 'partner@example.com',
      });

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('FORBIDDEN');
    });
  });

  describe('getPortalOverview', () => {
    it('returns partner metrics and ensures a primary link exists', async () => {
      vi.mocked(prisma.affiliatePartner.findUnique).mockResolvedValue({
        id: 'partner_1',
        email: 'partner@example.com',
        name: 'Partner One',
        status: 'approved',
        defaultCommissionBps: 3000,
        commissionDurationMonths: 12,
      } as any);
      vi.mocked(prisma.affiliateLink.findMany)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: 'link_1',
            code: 'partner-one',
            status: 'active',
            destinationPath: '/pricing',
            campaign: null,
          },
        ] as any);
      vi.mocked(prisma.affiliateLink.count).mockResolvedValue(0);
      vi.mocked(prisma.affiliateLink.create).mockResolvedValue({
        id: 'link_1',
        code: 'partner-one',
        status: 'active',
        destinationPath: '/pricing',
        campaign: null,
      } as any);
      vi.mocked(prisma.affiliateClick.count).mockResolvedValue(42);
      vi.mocked(prisma.affiliateReferral.count)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2);
      vi.mocked(prisma.affiliateCommission.aggregate)
        .mockResolvedValueOnce({ _sum: { amount: 12500 } } as any)
        .mockResolvedValueOnce({ _sum: { amount: 6400 } } as any);

      const result = await affiliateService.getPortalOverview('partner_1');

      expect(result.error).toBeNull();
      expect(result.data?.metrics).toEqual({
        clicks: 42,
        referrals: 5,
        customers: 2,
        pendingCommissionCents: 12500,
        paidCommissionCents: 6400,
      });
      expect(result.data?.primaryLink?.url).toContain('/r/partner-one');
      expect(result.data?.links).toHaveLength(1);
      expect(prisma.affiliateLink.create).toHaveBeenCalled();
    });
  });

  describe('createPortalLink', () => {
    it('creates a campaign variant link for the partner', async () => {
      vi.mocked(prisma.affiliatePartner.findUnique).mockResolvedValue({
        id: 'partner_1',
        email: 'partner@example.com',
        name: 'Partner One',
        status: 'approved',
        defaultCommissionBps: 3000,
        commissionDurationMonths: 12,
      } as any);
      vi.mocked(prisma.affiliateLink.count).mockResolvedValue(0);
      vi.mocked(prisma.affiliateLink.create).mockResolvedValue({
        id: 'link_2',
        code: 'partner-one-newsletter',
        status: 'active',
        destinationPath: '/pricing',
        campaign: 'Newsletter',
      } as any);

      const result = await affiliateService.createPortalLink('partner_1', {
        campaign: 'Newsletter',
        destinationPath: '/pricing',
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        id: 'link_2',
        code: 'partner-one-newsletter',
        status: 'active',
        destinationPath: '/pricing',
        campaign: 'Newsletter',
        url: expect.stringContaining('/r/partner-one-newsletter'),
      });
    });
  });

  describe('getPortalCommissionHistory', () => {
    it('returns sanitized commission and payout batch history for approved partners', async () => {
      vi.mocked(prisma.affiliatePartner.findUnique).mockResolvedValue({
        id: 'partner_1',
        email: 'partner@example.com',
        name: 'Partner One',
        status: 'approved',
        defaultCommissionBps: 3000,
        commissionDurationMonths: 12,
      } as any);
      vi.mocked(prisma.affiliateCommission.findMany).mockResolvedValue([
        {
          id: 'commission_1',
          status: 'pending',
          currency: 'usd',
          amount: 3000,
          revenueAmount: 10000,
          commissionBps: 3000,
          holdUntil: new Date('2026-02-01T00:00:00.000Z'),
          approvedAt: null,
          paidAt: null,
          voidedAt: null,
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
          referral: {
            referredAgency: {
              name: 'Acme Agency',
            },
          },
          invoice: {
            invoiceDate: new Date('2026-01-01T00:00:00.000Z'),
          },
          payoutBatch: null,
        },
      ] as any);
      vi.mocked(prisma.affiliatePayoutBatch.findMany).mockResolvedValue([
        {
          id: 'batch_1',
          status: 'exported',
          currency: 'usd',
          totalAmount: 12500,
          commissionCount: 3,
          periodStart: new Date('2026-01-01T00:00:00.000Z'),
          periodEnd: new Date('2026-01-31T00:00:00.000Z'),
          exportedAt: new Date('2026-02-05T00:00:00.000Z'),
          paidAt: null,
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
        },
      ] as any);

      const result = await affiliateService.getPortalCommissionHistory('partner_1');

      expect(result.error).toBeNull();
      expect(result.data?.commissions).toEqual([
        expect.objectContaining({
          id: 'commission_1',
          customerName: 'Acme Agency',
          status: 'pending',
          amountCents: 3000,
          revenueAmountCents: 10000,
        }),
      ]);
      expect(result.data?.payouts).toEqual([
        expect.objectContaining({
          id: 'batch_1',
          status: 'exported',
          totalAmountCents: 12500,
          commissionCount: 3,
        }),
      ]);
    });
  });
});
