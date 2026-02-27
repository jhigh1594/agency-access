import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { internalAdminRoutes } from '../internal-admin.routes.js';
import { internalAdminService } from '@/services/internal-admin.service.js';
import { subscriptionService } from '@/services/subscription.service.js';

vi.mock('@/services/internal-admin.service.js', () => ({
  internalAdminService: {
    getOverview: vi.fn(),
    listAgencies: vi.fn(),
    getAgencyDetail: vi.fn(),
    listSubscriptions: vi.fn(),
  },
}));
vi.mock('@/services/subscription.service.js', () => ({
  subscriptionService: {
    upgradeSubscription: vi.fn(),
    cancelSubscription: vi.fn(),
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
    if (!mockUserHeader || typeof mockUserHeader !== 'string') {
      request.user = { sub: 'regular_user' };
      return;
    }

    const [sub, email] = mockUserHeader.split('|');
    request.user = { sub, email };
  },
}));

describe('Internal Admin Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(internalAdminRoutes, {
      allowlist: {
        userIds: ['admin_user'],
        emails: ['admin@example.com'],
      },
    });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/internal-admin/overview',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 when authenticated user is not internal admin', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/internal-admin/overview',
      headers: {
        authorization: 'Bearer token',
        'x-mock-user': 'non_admin|user@example.com',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FORBIDDEN');
  });

  it('returns overview data for internal admin users', async () => {
    vi.mocked(internalAdminService.getOverview).mockResolvedValue({
      data: {
        mrr: {
          booked: 133.33,
          collectedLast30Days: 99,
          excludedSubscriptions: 0,
          currency: 'usd',
        },
        subscriptions: {
          total: 5,
          active: 3,
          trialing: 1,
          pastDue: 1,
          canceled: 0,
          canceledThisPeriod: 0,
        },
        topUsageAgencies: [],
      },
      error: null,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/internal-admin/overview',
      headers: {
        authorization: 'Bearer token',
        'x-mock-user': 'admin_user|admin@example.com',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.mrr.booked).toBe(133.33);
  });

  it('returns 400 for invalid agencies pagination query params', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/internal-admin/agencies?page=0&limit=-1',
      headers: {
        authorization: 'Bearer token',
        'x-mock-user': 'admin_user|admin@example.com',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when agency detail is not found', async () => {
    vi.mocked(internalAdminService.getAgencyDetail).mockResolvedValue({
      data: null,
      error: {
        code: 'NOT_FOUND',
        message: 'Agency not found',
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/internal-admin/agencies/missing',
      headers: {
        authorization: 'Bearer token',
        'x-mock-user': 'admin_user|admin@example.com',
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('NOT_FOUND');
  });

  it('passes subscriptions filters and pagination to service', async () => {
    vi.mocked(internalAdminService.listSubscriptions).mockResolvedValue({
      data: {
        items: [],
        total: 0,
        page: 2,
        limit: 25,
      },
      error: null,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/internal-admin/subscriptions?status=active&tier=STARTER&page=2&limit=25',
      headers: {
        authorization: 'Bearer token',
        'x-mock-user': 'admin_user|admin@example.com',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(internalAdminService.listSubscriptions).toHaveBeenCalledWith({
      status: 'active',
      tier: 'STARTER',
      page: 2,
      limit: 25,
    });
  });

  it('returns 400 for invalid upgrade tier', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/internal-admin/subscriptions/agency_1/upgrade',
      headers: {
        authorization: 'Bearer token',
        'x-mock-user': 'admin_user|admin@example.com',
      },
      payload: {
        newTier: 'INVALID',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 403 for subscription mutations when user is not allowlisted', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/internal-admin/subscriptions/agency_1/cancel',
      headers: {
        authorization: 'Bearer token',
        'x-mock-user': 'non_admin|person@example.com',
      },
      payload: {
        cancelAtPeriodEnd: true,
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FORBIDDEN');
  });

  it('upgrades subscription for allowlisted internal admin', async () => {
    vi.mocked(subscriptionService.upgradeSubscription).mockResolvedValue({
      data: {
        tier: 'AGENCY',
        status: 'active',
        currentPeriodEnd: new Date('2026-04-01T00:00:00.000Z'),
      },
      error: null,
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/internal-admin/subscriptions/agency_1/upgrade',
      headers: {
        authorization: 'Bearer token',
        'x-mock-user': 'admin_user|admin@example.com',
      },
      payload: {
        newTier: 'AGENCY',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(subscriptionService.upgradeSubscription).toHaveBeenCalledWith({
      agencyId: 'agency_1',
      newTier: 'AGENCY',
      updateBehavior: undefined,
    });
  });

  it('cancels subscription for allowlisted internal admin', async () => {
    vi.mocked(subscriptionService.cancelSubscription).mockResolvedValue({
      data: {
        status: 'canceled',
        cancelAtPeriodEnd: true,
      },
      error: null,
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/internal-admin/subscriptions/agency_1/cancel',
      headers: {
        authorization: 'Bearer token',
        'x-mock-user': 'admin_user|admin@example.com',
      },
      payload: {
        cancelAtPeriodEnd: true,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(subscriptionService.cancelSubscription).toHaveBeenCalledWith({
      agencyId: 'agency_1',
      cancelAtPeriodEnd: true,
    });
  });
});
