import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { subscriptionRoutes } from '../subscriptions';
import * as authorization from '@/lib/authorization.js';
import { subscriptionService } from '@/services/subscription.service';

vi.mock('@/lib/authorization.js');
vi.mock('@/services/subscription.service', () => ({
  subscriptionService: {
    createCheckoutSession: vi.fn(),
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

describe('Subscription Routes - Checkout contract', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(subscriptionRoutes);
    vi.clearAllMocks();

    vi.mocked(authorization.resolvePrincipalAgency).mockResolvedValue({
      data: { agencyId: 'agency-owner', principalId: 'user_123' },
      error: null,
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects invalid billing interval', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/subscriptions/checkout',
      headers: { authorization: 'Bearer token' },
      payload: {
        agencyId: 'agency-other',
        tier: 'STARTER',
        billingInterval: 'weekly',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(subscriptionService.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('accepts valid billing interval and uses principal agency', async () => {
    vi.mocked(subscriptionService.createCheckoutSession).mockResolvedValue({
      data: { checkoutUrl: 'https://checkout.example.com/session_123' },
      error: null,
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/subscriptions/checkout',
      headers: { authorization: 'Bearer token' },
      payload: {
        agencyId: 'agency-other',
        tier: 'STARTER',
        billingInterval: 'yearly',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(subscriptionService.createCheckoutSession).toHaveBeenCalledWith({
      agencyId: 'agency-owner',
      tier: 'STARTER',
      billingInterval: 'yearly',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });
  });

  it('defaults billing interval to monthly when omitted', async () => {
    vi.mocked(subscriptionService.createCheckoutSession).mockResolvedValue({
      data: { checkoutUrl: 'https://checkout.example.com/session_123' },
      error: null,
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/subscriptions/checkout',
      headers: { authorization: 'Bearer token' },
      payload: {
        agencyId: 'agency-other',
        tier: 'STARTER',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(subscriptionService.createCheckoutSession).toHaveBeenCalledWith({
      agencyId: 'agency-owner',
      tier: 'STARTER',
      billingInterval: 'monthly',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });
  });
});
