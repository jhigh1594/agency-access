import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { subscriptionRoutes } from '../subscriptions';
import * as authorization from '@/lib/authorization.js';
import { subscriptionService } from '@/services/subscription.service';

vi.mock('@/lib/authorization.js');
vi.mock('@/services/subscription.service', () => ({
  subscriptionService: {
    getSubscription: vi.fn(),
  },
}));
vi.mock('@/services/tier-limits.service', () => ({
  tierLimitsService: {
    getTierDetails: vi.fn(),
    checkTierLimit: vi.fn(),
    hasFeatureAccess: vi.fn(),
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
    request.user = { sub: 'user_123' };
  },
}));

describe('Subscription Routes - Security', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(subscriptionRoutes);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/subscriptions/agency-1',
    });

    expect(response.statusCode).toBe(401);
  });

  it('uses principal agency even when a different agencyId is requested', async () => {
    vi.mocked(authorization.resolvePrincipalAgency).mockResolvedValue({
      data: { agencyId: 'agency-owner', principalId: 'user_123' },
      error: null,
    });
    vi.mocked(subscriptionService.getSubscription).mockResolvedValue({
      data: null,
      error: null,
    } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/subscriptions/agency-other',
      headers: { authorization: 'Bearer token' },
    });

    expect(response.statusCode).toBe(200);
    expect(subscriptionService.getSubscription).toHaveBeenCalledWith('agency-owner');
  });
});
