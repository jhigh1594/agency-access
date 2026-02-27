import { beforeEach, describe, expect, it, vi } from 'vitest';
import { internalAdminService } from '../internal-admin.service.js';
import { prisma } from '@/lib/prisma.js';
import { getProductId } from '@/config/creem.config.js';

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    subscription: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    invoice: {
      aggregate: vi.fn(),
    },
    agencyUsageCounter: {
      findMany: vi.fn(),
    },
    agency: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('InternalAdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOverview', () => {
    it('calculates booked MRR with monthly/yearly normalization and excludes unknown products', async () => {
      vi.mocked(prisma.subscription.findMany).mockResolvedValue([
        {
          id: 'sub_1',
          tier: 'STARTER',
          status: 'active',
          creemData: { product_id: getProductId('STARTER', 'monthly') },
        },
        {
          id: 'sub_2',
          tier: 'AGENCY',
          status: 'trialing',
          creemData: { product_id: getProductId('AGENCY', 'yearly') },
        },
        {
          id: 'sub_3',
          tier: 'AGENCY',
          status: 'active',
          creemData: { product_id: 'prod_unknown' },
        },
        {
          id: 'sub_4',
          tier: 'PRO',
          status: 'past_due',
          creemData: { product_id: getProductId('STARTER', 'monthly') },
        },
      ] as any);

      vi.mocked(prisma.invoice.aggregate).mockResolvedValue({
        _sum: { amount: 19900 },
      } as any);

      vi.mocked(prisma.agencyUsageCounter.findMany).mockResolvedValue([] as any);

      const result = await internalAdminService.getOverview();

      expect(result.error).toBeNull();
      expect(result.data?.mrr.booked).toBe(133.33);
      expect(result.data?.mrr.excludedSubscriptions).toBe(1);
      expect(result.data?.subscriptions.active).toBe(2);
      expect(result.data?.subscriptions.trialing).toBe(1);
      expect(result.data?.subscriptions.pastDue).toBe(1);
      expect(result.data?.mrr.collectedLast30Days).toBe(199);
    });
  });

  describe('listAgencies', () => {
    it('returns paginated agencies with default pagination', async () => {
      vi.mocked(prisma.agency.count).mockResolvedValue(1);
      vi.mocked(prisma.agency.findMany).mockResolvedValue([
        {
          id: 'agency_1',
          name: 'Acme Agency',
          email: 'owner@acme.com',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          subscription: {
            tier: 'STARTER',
            status: 'active',
          },
          _count: { members: 2 },
        },
      ] as any);

      const result = await internalAdminService.listAgencies({});

      expect(result.error).toBeNull();
      expect(result.data?.total).toBe(1);
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(20);
      expect(result.data?.items[0]).toMatchObject({
        id: 'agency_1',
        name: 'Acme Agency',
        email: 'owner@acme.com',
        memberCount: 2,
        subscriptionTier: 'STARTER',
        subscriptionStatus: 'active',
      });
      expect(prisma.agency.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          NOT: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      }));
    });

    it('can include synthetic and test agencies when explicitly requested', async () => {
      vi.mocked(prisma.agency.count).mockResolvedValue(0);
      vi.mocked(prisma.agency.findMany).mockResolvedValue([] as any);

      await internalAdminService.listAgencies({ includeSynthetic: true });

      expect(prisma.agency.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: undefined,
      }));
    });

    it('applies search and synthetic filters together by default', async () => {
      vi.mocked(prisma.agency.count).mockResolvedValue(0);
      vi.mocked(prisma.agency.findMany).mockResolvedValue([] as any);

      await internalAdminService.listAgencies({ search: 'pillar' });

      expect(prisma.agency.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.any(Array),
            }),
            expect.objectContaining({
              NOT: expect.objectContaining({
                OR: expect.any(Array),
              }),
            }),
          ]),
        }),
      }));
    });
  });

  describe('getAgencyDetail', () => {
    it('returns NOT_FOUND when agency does not exist', async () => {
      vi.mocked(prisma.agency.findUnique).mockResolvedValue(null);

      const result = await internalAdminService.getAgencyDetail('missing_agency');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        code: 'NOT_FOUND',
        message: 'Agency not found',
      });
    });
  });
});
