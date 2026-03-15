import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { authenticate } from '../auth.js';

const { verifyTokenMock } = vi.hoisted(() => ({
  verifyTokenMock: vi.fn(),
}));

const originalNodeEnv = process.env.NODE_ENV;

vi.mock('@clerk/backend', () => ({
  verifyToken: verifyTokenMock,
}));

describe('authenticate middleware', () => {
  beforeEach(() => {
    verifyTokenMock.mockReset();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('reuses existing auth context without requiring auth header', async () => {
    const app = Fastify();

    app.addHook('onRequest', async (request) => {
      (request as any).user = { sub: 'user_prefilled' };
    });
    app.addHook('onRequest', authenticate());

    app.get('/protected', async (request) => {
      return { data: { principalId: (request as any).user?.sub }, error: null };
    });

    const response = await app.inject({ method: 'GET', url: '/protected' });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.principalId).toBe('user_prefilled');
    expect(verifyTokenMock).not.toHaveBeenCalled();

    await app.close();
  });

  it('verifies bearer token when no user context exists', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_verified' });

    const app = Fastify();
    app.addHook('onRequest', authenticate());

    app.get('/protected', async (request) => {
      return { data: { principalId: (request as any).user?.sub }, error: null };
    });

    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: 'Bearer valid_token' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.principalId).toBe('user_verified');
    expect(verifyTokenMock).toHaveBeenCalledTimes(1);

    await app.close();
  });

  it('accepts the development bypass token in development without Clerk verification', async () => {
    process.env.NODE_ENV = 'development';

    const app = Fastify();
    app.addHook('onRequest', authenticate());

    app.get('/protected', async (request) => {
      return { data: { principalId: (request as any).user?.orgId }, error: null };
    });

    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: 'Bearer dev-bypass-token' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.principalId).toBe('dev_org_test_987654321');
    expect(verifyTokenMock).not.toHaveBeenCalled();

    await app.close();
  });
});
