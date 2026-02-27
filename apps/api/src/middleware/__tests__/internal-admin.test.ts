import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { requireInternalAdmin } from '../internal-admin.js';

describe('requireInternalAdmin middleware', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();

    app.addHook('onRequest', async (request: any) => {
      const mockUserHeader = request.headers['x-mock-user'];
      if (mockUserHeader && typeof mockUserHeader === 'string') {
        const [sub, email] = mockUserHeader.split('|');
        request.user = { sub, email };
      }
    });

    app.get('/internal-admin/ping', {
      onRequest: [requireInternalAdmin({
        userIds: ['admin_user'],
        emails: ['admin@example.com'],
      })],
    }, async () => ({ data: { ok: true }, error: null }));
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 when authenticated user context is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/internal-admin/ping',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 when user is not allowlisted', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/internal-admin/ping',
      headers: {
        'x-mock-user': 'non_admin|person@example.com',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FORBIDDEN');
  });

  it('returns 200 when user id is allowlisted', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/internal-admin/ping',
      headers: {
        'x-mock-user': 'admin_user|person@example.com',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.ok).toBe(true);
  });
});
