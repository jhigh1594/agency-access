import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { dashboardRoutes } from '../dashboard';
import * as authorization from '@/lib/authorization.js';
import * as aggregation from '@/services/connection-aggregation.service';

vi.mock('@/lib/authorization.js');
vi.mock('@/services/connection-aggregation.service', () => ({
  getDashboardStats: vi.fn(),
}));
vi.mock('@/services/access-request.service', () => ({
  accessRequestService: {
    getAgencyAccessRequests: vi.fn(),
  },
}));
vi.mock('@/services/connection.service', () => ({
  connectionService: {
    getAgencyConnectionSummaries: vi.fn(),
  },
}));
vi.mock('@/lib/cache', () => ({
  getCached: vi.fn(async ({ fetch }) => ({ ...(await fetch()), cached: false })),
  CacheKeys: { dashboard: (agencyId: string) => `dashboard:${agencyId}` },
  CacheTTL: { MEDIUM: 300 },
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    agency: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'agency-owner',
        name: 'Owner Agency',
        email: 'owner@example.com',
      }),
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
    request.user = { sub: 'user_123' };
  },
}));

describe('Dashboard Routes - Security', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(dashboardRoutes);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/dashboard',
    });

    expect(response.statusCode).toBe(401);
  });

  it('returns 403 for dashboard stats when query agencyId does not match principal', async () => {
    vi.mocked(authorization.resolvePrincipalAgency).mockResolvedValue({
      data: { agencyId: 'agency-owner', principalId: 'user_123' },
      error: null,
    });
    vi.mocked(authorization.assertAgencyAccess).mockReturnValue({
      code: 'FORBIDDEN',
      message: 'You do not have access to this agency resource',
    });

    const response = await app.inject({
      method: 'GET',
      url: '/dashboard/stats?agencyId=agency-other',
      headers: { authorization: 'Bearer token' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FORBIDDEN');
    expect(aggregation.getDashboardStats).not.toHaveBeenCalled();
  });
});

