import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { helpScoutRoutes } from '../help-scout';

vi.mock('@/services/help-scout.service', () => ({
  helpScoutService: {
    getBeaconIdentity: vi.fn(),
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

describe('Help Scout Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(helpScoutRoutes);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/help-scout/beacon',
    });

    expect(response.statusCode).toBe(401);
  });

  it('returns the signed Beacon identity for the authenticated user', async () => {
    const { helpScoutService } = await import('@/services/help-scout.service');
    vi.mocked(helpScoutService.getBeaconIdentity).mockResolvedValue({
      data: {
        name: 'Alex Johnson',
        email: 'alex@example.com',
        signature: 'signed-value',
      },
      error: null,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/help-scout/beacon',
      headers: { authorization: 'Bearer token' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        name: 'Alex Johnson',
        email: 'alex@example.com',
        signature: 'signed-value',
      },
      error: null,
    });
    expect(helpScoutService.getBeaconIdentity).toHaveBeenCalledWith('user_123');
  });

  it('returns 503 when secure mode is not configured', async () => {
    const { helpScoutService } = await import('@/services/help-scout.service');
    vi.mocked(helpScoutService.getBeaconIdentity).mockResolvedValue({
      data: null,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'Help Scout Beacon secure mode is not configured',
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/help-scout/beacon',
      headers: { authorization: 'Bearer token' },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json().error.code).toBe('NOT_CONFIGURED');
  });
});
