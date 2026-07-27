import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { agentGrantRoutes } from '@/routes/agent-grants';
import { agentGrantService } from '@/services/agent-grant.service';
import * as authorization from '@/lib/authorization.js';
import { agentRolloutService } from '@/services/agent-rollout.service.js';

vi.mock('@/services/agent-grant.service', () => ({
  agentGrantService: {
    listGrants: vi.fn(),
    createOrReactivateGrant: vi.fn(),
    updateGrant: vi.fn(),
    revokeGrant: vi.fn(),
  },
}));

vi.mock('@/services/agent-rollout.service.js', () => ({
  agentRolloutService: { isAgencyAllowed: vi.fn(() => true) },
}));

vi.mock('@/lib/authorization.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/authorization.js')>();
  return {
    ...actual,
    resolvePrincipalAgency: vi.fn(),
  };
});

vi.mock('@/middleware/auth.js', () => ({
  authenticate: () => async (request: any, reply: any) => {
    if (!request.headers.authorization) {
      return reply.code(401).send({
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Missing token' },
      });
    }
    request.user = { sub: 'user-1', orgId: 'org-1' };
  },
}));

describe('agent grant routes security', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify();
    await app.register(agentGrantRoutes);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects cross-agency grant listing', async () => {
    vi.mocked(authorization.resolvePrincipalAgency).mockResolvedValue({
      data: {
        agencyId: 'agency-owner',
        principalId: 'org-1',
        agency: { id: 'agency-owner', name: 'Owner', email: 'owner@example.com' },
      },
      error: null,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/agencies/agency-other/agent-grants',
      headers: { authorization: 'Bearer session' },
    });

    expect(response.statusCode).toBe(403);
    expect(agentGrantService.listGrants).not.toHaveBeenCalled();
  });

  it('creates a grant only for the authenticated owner and principal agency', async () => {
    vi.mocked(authorization.resolvePrincipalAgency).mockResolvedValue({
      data: {
        agencyId: 'agency-owner',
        principalId: 'org-1',
        agency: { id: 'agency-owner', name: 'Owner', email: 'owner@example.com' },
      },
      error: null,
    });
    vi.mocked(agentGrantService.createOrReactivateGrant).mockResolvedValue({ id: 'grant-1' } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/agencies/agency-owner/agent-grants',
      headers: { authorization: 'Bearer session' },
      payload: {
        oauthClientId: 'oauth-client-1',
        displayName: 'Personal agent',
        permissions: ['workspace:read'],
        ownerSubject: 'attacker-controlled',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(agentGrantService.createOrReactivateGrant).toHaveBeenCalledWith(
      expect.objectContaining({
        agencyId: 'agency-owner',
        ownerSubject: 'user-1',
        oauthClientId: 'oauth-client-1',
      })
    );
  });

  it('does not create a grant for a non-allowlisted agency', async () => {
    vi.mocked(agentRolloutService.isAgencyAllowed).mockReturnValueOnce(false);
    vi.mocked(authorization.resolvePrincipalAgency).mockResolvedValue({
      data: { agencyId: 'agency-owner', principalId: 'org-1', agency: { id: 'agency-owner', name: 'Owner', email: 'owner@example.com' } }, error: null,
    });
    const response = await app.inject({ method: 'POST', url: '/agencies/agency-owner/agent-grants', headers: { authorization: 'Bearer session' }, payload: { oauthClientId: 'oauth-1', displayName: 'Agent', permissions: ['workspace:read'] } });
    expect(response.statusCode).toBe(404);
    expect(agentGrantService.createOrReactivateGrant).not.toHaveBeenCalled();
  });
});
