import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';

import { sentryTestRoutes } from '../sentry-test.routes.js';
import { sentryWebhooksRoutes } from '../sentry-webhooks.js';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
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
    request.user = request.headers.authorization === 'Bearer admin'
      ? { sub: 'user_admin', email: 'admin@example.com' }
      : { sub: 'user_regular', email: 'user@example.com' };
  },
}));
vi.mock('@/middleware/internal-admin.js', () => ({
  requireInternalAdmin: () => async (request: any, reply: any) => {
    if (request.user?.sub !== 'user_admin') {
      return reply.code(403).send({
        data: null,
        error: { code: 'FORBIDDEN', message: 'Internal admin access is required' },
      });
    }
  },
}));

describe('Sentry debug routes - security', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(sentryTestRoutes);
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects unauthenticated Sentry debug endpoints', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/test/sentry/health',
    });

    expect(response.statusCode).toBe(401);
  });

  it('rejects non-admin authenticated users from Sentry debug endpoints', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/test/sentry/health',
      headers: { authorization: 'Bearer user' },
    });

    expect(response.statusCode).toBe(403);
  });
});

describe('Sentry webhook route - security', () => {
  let app: FastifyInstance;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalWebhookSecret = process.env.SENTRY_WEBHOOK_SECRET;

  beforeEach(async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SENTRY_WEBHOOK_SECRET;
    app = Fastify();
    await app.register(sentryWebhooksRoutes);
  });

  afterEach(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalWebhookSecret === undefined) {
      delete process.env.SENTRY_WEBHOOK_SECRET;
    } else {
      process.env.SENTRY_WEBHOOK_SECRET = originalWebhookSecret;
    }
    await app.close();
  });

  it('rejects production Sentry webhooks when signature verification is not configured', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/webhooks/sentry',
      payload: {
        action: 'created',
        data: {
          issue: { id: 'ISSUE-1' },
        },
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      data: null,
      error: {
        code: 'INVALID_SIGNATURE',
      },
    });
  });

  it('protects the Sentry webhook ping endpoint', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/webhooks/sentry/ping',
    });

    expect(response.statusCode).toBe(401);
  });
});
