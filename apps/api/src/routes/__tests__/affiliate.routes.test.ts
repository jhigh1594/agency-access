import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { affiliateRoutes } from '../affiliate';

vi.mock('@/services/affiliate.service.js', () => ({
  affiliateService: {
    submitApplication: vi.fn(),
    registerClick: vi.fn(),
    getPortalOverview: vi.fn(),
    getPortalCommissionHistory: vi.fn(),
    createPortalLink: vi.fn(),
  },
}));

vi.mock('@/middleware/auth.js', () => ({
  authenticate: () => async (request: any, reply: any) => {
    if (!request.headers.authorization) {
      return reply.code(401).send({
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Missing token' },
      });
    }

    const mockUserHeader = request.headers['x-mock-user'];
    if (mockUserHeader && typeof mockUserHeader === 'string') {
      const [sub, email] = mockUserHeader.split('|');
      request.user = { sub, email };
      return;
    }

    request.user = { sub: 'partner_user', email: 'partner@example.com' };
  },
}));

vi.mock('@/middleware/affiliate-partner.js', () => ({
  requireAffiliatePartner: () => async (request: any, reply: any) => {
    if (!request.user?.sub) {
      return reply.code(401).send({
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Authenticated affiliate partner context is required' },
      });
    }

    if (request.user.email === 'denied@example.com') {
      return reply.code(403).send({
        data: null,
        error: { code: 'FORBIDDEN', message: 'Approved affiliate partner access is required' },
      });
    }

    request.affiliatePartner = {
      id: 'partner_1',
      email: 'partner@example.com',
      name: 'Partner One',
      status: 'approved',
    };
  },
}));

describe('Affiliate Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(affiliateRoutes, { prefix: '/api' });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('accepts a valid affiliate application', async () => {
    const { affiliateService } = await import('@/services/affiliate.service.js');
    vi.mocked(affiliateService.submitApplication).mockResolvedValue({
      data: { id: 'partner-1', status: 'applied' },
      error: null,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/affiliate/applications',
      payload: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        promotionPlan: 'Newsletter + LinkedIn',
        termsAccepted: true,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      data: { id: 'partner-1', status: 'applied' },
      error: null,
    });
  });

  it('rejects invalid affiliate applications', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/affiliate/applications',
      payload: {
        name: '',
        email: 'not-an-email',
        promotionPlan: 'short',
        termsAccepted: false,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('registers a click for an active referral link', async () => {
    const { affiliateService } = await import('@/services/affiliate.service.js');
    vi.mocked(affiliateService.registerClick).mockResolvedValue({
      data: {
        clickToken: 'click_123',
        destinationPath: '/pricing',
      },
      error: null,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/affiliate/links/janedoe/resolve',
      payload: {
        referrer: 'https://example.com/article',
        utmSource: 'newsletter',
        landingPath: '/affiliate',
      },
      headers: {
        'user-agent': 'Vitest Agent',
        'x-forwarded-for': '203.0.113.10',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        clickToken: 'click_123',
        destinationPath: '/pricing',
      },
      error: null,
    });
    expect(affiliateService.registerClick).toHaveBeenCalledWith(
      'janedoe',
      expect.objectContaining({
        referrer: 'https://example.com/article',
        utmSource: 'newsletter',
        landingPath: '/affiliate',
        userAgent: 'Vitest Agent',
        ipAddress: '203.0.113.10',
      })
    );
  });

  it('returns 404 for unknown or disabled referral links', async () => {
    const { affiliateService } = await import('@/services/affiliate.service.js');
    vi.mocked(affiliateService.registerClick).mockResolvedValue({
      data: null,
      error: {
        code: 'NOT_FOUND',
        message: 'Affiliate link not found',
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/affiliate/links/missing/resolve',
      payload: {},
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('NOT_FOUND');
  });

  it('returns portal overview data for approved affiliate partners', async () => {
    const { affiliateService } = await import('@/services/affiliate.service.js');
    vi.mocked(affiliateService.getPortalOverview).mockResolvedValue({
      data: {
        partner: {
          id: 'partner_1',
          name: 'Partner One',
          email: 'partner@example.com',
          status: 'approved',
          defaultCommissionBps: 3000,
          commissionDurationMonths: 12,
        },
        metrics: {
          clicks: 42,
          referrals: 5,
          customers: 2,
          pendingCommissionCents: 12500,
          paidCommissionCents: 6400,
        },
        primaryLink: {
          id: 'link_1',
          code: 'partner-one',
          status: 'active',
          destinationPath: '/pricing',
          url: 'https://www.authhub.co/r/partner-one',
        },
        links: [],
      },
      error: null,
    } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/affiliate/portal/overview',
      headers: {
        authorization: 'Bearer token',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.metrics.clicks).toBe(42);
    expect(affiliateService.getPortalOverview).toHaveBeenCalledWith('partner_1');
  });

  it('returns 401 when affiliate portal authorization header is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/affiliate/portal/overview',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('UNAUTHORIZED');
  });

  it('returns commission and payout history for approved affiliate partners', async () => {
    const { affiliateService } = await import('@/services/affiliate.service.js');
    vi.mocked(affiliateService.getPortalCommissionHistory).mockResolvedValue({
      data: {
        commissions: [
          {
            id: 'commission_1',
            customerName: 'Acme Agency',
            status: 'pending',
            currency: 'usd',
            amountCents: 3000,
            revenueAmountCents: 10000,
            commissionBps: 3000,
            invoiceDate: '2026-01-01T00:00:00.000Z',
            holdUntil: '2026-02-01T00:00:00.000Z',
            approvedAt: null,
            paidAt: null,
            voidedAt: null,
            createdAt: '2026-01-02T00:00:00.000Z',
            payoutBatchId: null,
            payoutBatchStatus: null,
          },
        ],
        payouts: [
          {
            id: 'batch_1',
            status: 'exported',
            currency: 'usd',
            totalAmountCents: 12500,
            commissionCount: 3,
            periodStart: '2026-01-01T00:00:00.000Z',
            periodEnd: '2026-01-31T00:00:00.000Z',
            exportedAt: '2026-02-05T00:00:00.000Z',
            paidAt: null,
            createdAt: '2026-02-01T00:00:00.000Z',
          },
        ],
      },
      error: null,
    } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/affiliate/portal/commissions',
      headers: {
        authorization: 'Bearer token',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.commissions).toHaveLength(1);
    expect(response.json().data.payouts).toHaveLength(1);
    expect(affiliateService.getPortalCommissionHistory).toHaveBeenCalledWith('partner_1');
  });

  it('creates a campaign variant link for an approved affiliate partner', async () => {
    const { affiliateService } = await import('@/services/affiliate.service.js');
    vi.mocked(affiliateService.createPortalLink).mockResolvedValue({
      data: {
        id: 'link_2',
        code: 'partner-one-newsletter',
        status: 'active',
        destinationPath: '/pricing',
        campaign: 'Newsletter',
        url: 'https://www.authhub.co/r/partner-one-newsletter',
      },
      error: null,
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/affiliate/portal/links',
      headers: {
        authorization: 'Bearer token',
      },
      payload: {
        campaign: 'Newsletter',
        destinationPath: '/pricing',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().data.code).toBe('partner-one-newsletter');
    expect(affiliateService.createPortalLink).toHaveBeenCalledWith('partner_1', {
      campaign: 'Newsletter',
      destinationPath: '/pricing',
    });
  });
});
