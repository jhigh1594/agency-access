import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { mcpRoutes } from '@/routes/mcp.js';
import { agentRateLimitService } from '@/services/agent-rate-limit.service.js';

vi.mock('@/lib/env.js', () => ({ env: { AGENT_MCP_RESOURCE_URL: 'https://api.example.com/mcp', CLERK_OAUTH_ISSUER: 'https://issuer.example', FRONTEND_URL: 'https://app.example.com' } }));
vi.mock('@/middleware/agent-auth.js', () => ({
  authenticateAgent: () => async (request: any, reply: any) => {
    if (!request.headers.authorization) return reply.code(401).send({ data: null, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
    request.agentPrincipal = { kind: 'agent', agencyId: 'agency-1', grantId: 'grant-1', ownerSubject: 'user-1', oauthClientId: 'oauth-1', displayName: 'Agent', permissions: [], requestMetadata: {} };
  },
}));
vi.mock('@/services/agent-access-operations.service.js', () => ({ agentAccessOperationsService: {} }));
vi.mock('@/services/agent-operation.service.js', () => ({ agentOperationService: {} }));
vi.mock('@/services/agent-activity.service.js', () => ({ agentActivityService: {} }));
vi.mock('@/services/agent-rate-limit.service.js', () => ({ agentRateLimitService: { checkAndConsume: vi.fn() } }));
vi.mock('@/services/agent-telemetry.service.js', () => ({ agentTelemetryService: { recordToolCall: vi.fn() } }));

describe('MCP transport security', () => {
  let app: FastifyInstance;
  beforeEach(async () => { vi.mocked(agentRateLimitService.checkAndConsume).mockResolvedValue({ allowed: true, remaining: 10, retryAfterSeconds: 0 }); app = Fastify(); await app.register(mcpRoutes); await app.ready(); });
  afterEach(async () => app.close());

  const initialize = { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } } };

  it('challenges unauthenticated calls with discoverable resource metadata', async () => {
    const response = await app.inject({ method: 'POST', url: '/mcp', headers: { host: 'api.example.com', 'content-type': 'application/json' }, payload: initialize });
    expect(response.statusCode).toBe(401);
    expect(response.headers['www-authenticate']).toContain('/.well-known/oauth-protected-resource/mcp');
  });

  it.each([
    ['wrong host', { host: 'evil.example' }, 'application/json', 421],
    ['wrong origin', { host: 'api.example.com', origin: 'https://evil.example' }, 'application/json', 403],
    ['unexpected content type', { host: 'api.example.com' }, 'text/plain', 415],
  ])('rejects %s before MCP execution', async (_label, headers, contentType, status) => {
    const response = await app.inject({ method: 'POST', url: '/mcp', headers: { ...headers, authorization: 'Bearer valid', 'content-type': contentType }, payload: contentType === 'application/json' ? initialize : JSON.stringify(initialize) });
    expect(response.statusCode).toBe(status);
  });

  it('rejects unsupported methods without creating a transport session', async () => {
    const response = await app.inject({ method: 'GET', url: '/mcp', headers: { host: 'api.example.com', authorization: 'Bearer valid' } });
    expect(response.statusCode).toBe(405);
  });

  it('enforces the per-grant budget even for authenticated agent traffic', async () => {
    vi.mocked(agentRateLimitService.checkAndConsume).mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 42 });
    const response = await app.inject({ method: 'POST', url: '/mcp', headers: { host: 'api.example.com', authorization: 'Bearer valid', 'content-type': 'application/json' }, payload: initialize });
    expect(response.statusCode).toBe(429);
    expect(response.headers['retry-after']).toBe('42');
  });
});
