import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

import { requireAffiliatePartner } from '../affiliate-partner.js';
import { affiliateService } from '@/services/affiliate.service.js';

vi.mock('@/services/affiliate.service.js', () => ({
  affiliateService: {
    resolveAuthenticatedPartner: vi.fn(),
  },
}));

describe('requireAffiliatePartner middleware', () => {
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

    app.get('/affiliate/portal/ping', {
      onRequest: [requireAffiliatePartner()],
    }, async (_request: any) => ({ data: { ok: true }, error: null }));

    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 when authenticated user context is missing', async () => {
    vi.mocked(affiliateService.resolveAuthenticatedPartner).mockResolvedValue({
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authenticated affiliate partner context is required',
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/affiliate/portal/ping',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 when the user is not an approved affiliate partner', async () => {
    vi.mocked(affiliateService.resolveAuthenticatedPartner).mockResolvedValue({
      data: null,
      error: {
        code: 'FORBIDDEN',
        message: 'Approved affiliate partner access is required',
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/affiliate/portal/ping',
      headers: {
        'x-mock-user': 'user_1|person@example.com',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FORBIDDEN');
  });

  it('returns 200 when the user resolves to an approved affiliate partner', async () => {
    vi.mocked(affiliateService.resolveAuthenticatedPartner).mockResolvedValue({
      data: {
        id: 'partner_1',
        email: 'partner@example.com',
        name: 'Partner One',
        status: 'approved',
      },
      error: null,
    } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/affiliate/portal/ping',
      headers: {
        'x-mock-user': 'user_1|partner@example.com',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.ok).toBe(true);
  });
});
