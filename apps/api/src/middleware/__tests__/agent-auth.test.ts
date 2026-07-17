import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { authenticateAgent } from '@/middleware/agent-auth.js';
import { verifyAgentAccessToken } from '@/lib/agent-auth-metadata.js';
import { agentGrantService } from '@/services/agent-grant.service.js';

vi.mock('@/lib/agent-auth-metadata.js', () => ({
  verifyAgentAccessToken: vi.fn(),
}));

vi.mock('@/services/agent-grant.service.js', () => ({
  agentGrantService: {
    resolveActiveGrant: vi.fn(),
    touchGrant: vi.fn(),
  },
}));

vi.mock('@/services/agent-rollout.service.js', () => ({
  agentRolloutService: { isAgencyAllowed: vi.fn(() => true) },
}));

vi.mock('@/lib/env.js', () => ({ env: { FRONTEND_URL: 'https://app.example.com' } }));

describe('agent authentication middleware', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(agentGrantService.touchGrant).mockResolvedValue(undefined);
    app = Fastify();
    app.get('/probe', { onRequest: [authenticateAgent()] }, async (request) => ({
      data: (request as any).agentPrincipal,
    }));
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('resolves an active grant into a server-derived agent principal', async () => {
    vi.mocked(verifyAgentAccessToken).mockResolvedValue({
      ownerSubject: 'user_1',
      clerkPrincipalId: 'org_1',
      oauthClientId: 'oauth-client-1',
      issuer: 'https://issuer.example',
      audience: ['https://api.example/mcp'],
    });
    vi.mocked(agentGrantService.resolveActiveGrant).mockResolvedValue({
      id: 'grant-1',
      agencyId: 'agency-1',
      ownerSubject: 'user_1',
      oauthClientId: 'oauth-client-1',
      displayName: 'Personal agent',
      permissions: ['workspace:read'],
      state: 'active',
    } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/probe',
      headers: {
        authorization: 'Bearer oauth-token',
        'x-agency-id': 'agency-attacker-selected',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toMatchObject({
      kind: 'agent',
      ownerSubject: 'user_1',
      agencyId: 'agency-1',
      oauthClientId: 'oauth-client-1',
      grantId: 'grant-1',
      permissions: ['workspace:read'],
    });
    expect(agentGrantService.resolveActiveGrant).toHaveBeenCalledWith({
      ownerSubject: 'user_1',
      oauthClientId: 'oauth-client-1',
      clerkPrincipalId: 'org_1',
    });
  });

  it('rejects a missing bearer token before grant lookup', async () => {
    const response = await app.inject({ method: 'GET', url: '/probe' });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('UNAUTHORIZED');
    expect(agentGrantService.resolveActiveGrant).not.toHaveBeenCalled();
  });

  it('rejects invalid, expired, wrong-issuer, audience, or resource tokens uniformly', async () => {
    vi.mocked(verifyAgentAccessToken).mockRejectedValue(new Error('wrong audience'));

    const response = await app.inject({
      method: 'GET',
      url: '/probe',
      headers: { authorization: 'Bearer invalid-token' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired agent access token',
      },
    });
  });

  it('returns setup-required without exposing tenant data when no grant exists', async () => {
    vi.mocked(verifyAgentAccessToken).mockResolvedValue({
      ownerSubject: 'user_1',
      clerkPrincipalId: 'org_1',
      oauthClientId: 'oauth-client-1',
      issuer: 'https://issuer.example',
      audience: ['https://api.example/mcp'],
    });
    vi.mocked(agentGrantService.resolveActiveGrant).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/probe',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toMatchObject({
      code: 'AGENT_GRANT_REQUIRED',
      message: 'The agency owner must approve this agent in AuthHub',
      details: { oauthClientId: 'oauth-client-1', setupUrl: expect.stringContaining('connect=oauth-client-1') },
    });
  });
});
