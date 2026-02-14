import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { templateRoutes } from '../templates';
import * as templateService from '@/services/template.service';
import * as authorization from '@/lib/authorization.js';

vi.mock('@/services/template.service');
vi.mock('@/lib/authorization.js');

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

describe('Template Routes - Security', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(templateRoutes);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/agencies/agency-1/templates',
    });

    expect(response.statusCode).toBe(401);
  });

  it('returns 403 when accessing templates for a different agency', async () => {
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
      url: '/agencies/agency-other/templates',
      headers: { authorization: 'Bearer token' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('FORBIDDEN');
    expect(templateService.getAgencyTemplates).not.toHaveBeenCalled();
  });
});
