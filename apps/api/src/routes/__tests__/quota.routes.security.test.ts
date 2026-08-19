import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { quotaRoutes } from '@/routes/quota.routes';
import { quotaService } from '@/services/quota.service';
import { verifyToken } from '@clerk/backend';

vi.mock('@/services/quota.service', () => ({
  quotaService: {
    getUsage: vi.fn(),
    checkQuota: vi.fn(),
  },
}));

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn(),
}));

describe('quota routes - security', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify();
    await app.register(quotaRoutes);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns the exact 401 body when no authorization token is present', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/quota' });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization token required',
      },
    });
  });

  it('returns the exact 401 body on POST /api/quota/check when no token is present', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/quota/check',
      payload: { metric: 'clients' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization token required',
      },
    });
  });

  it('verifies tokens through the shared Clerk wrapper and returns usage data', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ orgId: 'org-1', sub: 'user-1' } as any);
    vi.mocked(quotaService.getUsage).mockResolvedValue({ usage: 'snapshot' } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/quota',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: { usage: 'snapshot' } });
    expect(verifyToken).toHaveBeenCalledWith('valid-token', {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    expect(quotaService.getUsage).toHaveBeenCalledWith('org-1');
  });

  it('returns 500 when Clerk verification rejects the token', async () => {
    vi.mocked(verifyToken).mockRejectedValue(new Error('invalid token'));

    const response = await app.inject({
      method: 'GET',
      url: '/api/quota',
      headers: { authorization: 'Bearer bad-token' },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch quota information',
      },
    });
  });

  it('returns 400 when the verified token carries no orgId', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ sub: 'user-1' } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/quota',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Organization ID not found in token',
      },
    });
  });
});
