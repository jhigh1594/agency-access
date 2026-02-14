import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { clientRoutes } from '../clients';
import * as authorization from '@/lib/authorization.js';

vi.mock('@/lib/authorization.js');
vi.mock('@/services/client.service', () => ({
  createClient: vi.fn(),
  getClients: vi.fn(),
  getClientById: vi.fn(),
  updateClient: vi.fn(),
  findClientByEmail: vi.fn(),
  deleteClient: vi.fn(),
  getClientsWithConnections: vi.fn().mockResolvedValue([]),
  getClientDetail: vi.fn(),
  ClientError: class extends Error {},
}));
vi.mock('@/services/quota.service', () => ({
  quotaService: {
    checkQuota: vi.fn().mockResolvedValue({
      allowed: true,
      current: 0,
      limit: 100,
      remaining: 100,
      metric: 'clients',
    }),
  },
  QuotaExceededError: class extends Error {
    toJSON() {
      return { error: { code: 'QUOTA_EXCEEDED', message: 'Quota exceeded' } };
    }
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

describe('Client Routes - Security', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(clientRoutes);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/clients',
    });

    expect(response.statusCode).toBe(401);
  });

  it('returns 403 when principal agency cannot be resolved', async () => {
    vi.mocked(authorization.resolvePrincipalAgency).mockResolvedValue({
      data: null,
      error: {
        code: 'FORBIDDEN',
        message: 'Unable to resolve agency for authenticated user',
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/clients',
      headers: { authorization: 'Bearer token' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FORBIDDEN');
  });
});

