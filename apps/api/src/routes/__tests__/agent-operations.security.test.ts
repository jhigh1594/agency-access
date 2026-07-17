import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { agentOperationRoutes } from '@/routes/agent-operations.js';
import { agentOperationService } from '@/services/agent-operation.service.js';
import * as authorization from '@/lib/authorization.js';

vi.mock('@/services/agent-operation.service.js', () => ({
  agentOperationService: { getForAgent: vi.fn(), getForOwner: vi.fn(), decide: vi.fn() },
  AgentOperationNotFoundError: class extends Error {},
  AgentOperationStateError: class extends Error {},
}));

vi.mock('@/middleware/agent-auth.js', () => ({
  authenticateAgent: () => async (request: any) => {
    request.agentPrincipal = {
      kind: 'agent', ownerSubject: 'user-1', agencyId: 'agency-1', grantId: 'grant-1',
      oauthClientId: 'oauth-1', displayName: 'Assistant', permissions: ['operations:read'],
      requestMetadata: { ipAddress: '127.0.0.1', userAgent: 'test', correlationId: request.id },
    };
  },
}));

vi.mock('@/middleware/auth.js', () => ({
  authenticate: () => async (request: any) => {
    request.user = { sub: 'user-1', orgId: 'org-1' };
  },
}));

vi.mock('@/lib/authorization.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/authorization.js')>();
  return { ...actual, resolvePrincipalAgency: vi.fn() };
});

describe('agent operation route security', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(authorization.resolvePrincipalAgency).mockResolvedValue({
      data: { agencyId: 'agency-1', principalId: 'org-1', agency: { id: 'agency-1', name: 'Agency', email: 'owner@example.com' } },
      error: null,
    });
    app = Fastify();
    await app.register(agentOperationRoutes);
    await app.ready();
  });

  afterEach(async () => app.close());

  it('reads agent operations only through the server-derived principal', async () => {
    vi.mocked(agentOperationService.getForAgent).mockResolvedValue({ id: 'op-1', agencyId: 'agency-1' } as any);
    const response = await app.inject({ method: 'GET', url: '/agent/operations/op-1?agencyId=agency-other' });
    expect(response.statusCode).toBe(200);
    expect(agentOperationService.getForAgent).toHaveBeenCalledWith(expect.objectContaining({ agencyId: 'agency-1' }), 'op-1');
  });

  it('does not reveal an operation to an owner in another agency', async () => {
    vi.mocked(agentOperationService.getForOwner).mockResolvedValue(null);
    const response = await app.inject({ method: 'GET', url: '/agencies/agency-1/agent-operations/guessed-op' });
    expect(response.statusCode).toBe(404);
    expect(agentOperationService.getForOwner).toHaveBeenCalledWith('agency-1', 'user-1', 'guessed-op');
  });

  it('rejects a route agency that differs from the authenticated owner agency', async () => {
    const response = await app.inject({ method: 'POST', url: '/agencies/agency-other/agent-operations/op-1/decision', payload: { decision: 'approved' } });
    expect(response.statusCode).toBe(403);
    expect(agentOperationService.decide).not.toHaveBeenCalled();
  });
});
