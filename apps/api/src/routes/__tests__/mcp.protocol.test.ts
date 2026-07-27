import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { mcpRoutes } from '@/routes/mcp.js';

vi.mock('@/lib/env.js', () => ({
  env: {
    AGENT_MCP_RESOURCE_URL: 'http://localhost/mcp',
    CLERK_OAUTH_ISSUER: 'https://issuer.example',
    FRONTEND_URL: 'http://localhost:3000',
  },
}));
vi.mock('@/middleware/agent-auth.js', () => ({
  authenticateAgent: () => async (request: any, reply: any) => {
    if (!request.headers.authorization) return reply.code(401).send({ data: null, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
    request.agentPrincipal = {
      kind: 'agent', ownerSubject: 'user-1', agencyId: 'agency-1', oauthClientId: 'oauth-1', grantId: 'grant-1', displayName: 'Assistant',
      permissions: ['workspace:read'], requestMetadata: { ipAddress: '127.0.0.1', userAgent: 'test', correlationId: request.id },
    };
  },
}));
vi.mock('@/services/agent-access-operations.service.js', () => ({ agentAccessOperationsService: { getWorkspaceContext: vi.fn() } }));
vi.mock('@/services/agent-operation.service.js', () => ({ agentOperationService: { getForAgent: vi.fn() } }));
vi.mock('@/services/agent-activity.service.js', () => ({ agentActivityService: { list: vi.fn() } }));
vi.mock('@/services/agent-rate-limit.service.js', () => ({ agentRateLimitService: { checkAndConsume: vi.fn().mockResolvedValue({ allowed: true, remaining: 10, retryAfterSeconds: 0 }) } }));
vi.mock('@/services/agent-telemetry.service.js', () => ({ agentTelemetryService: { recordToolCall: vi.fn() } }));

describe('MCP protocol route', () => {
  let app: FastifyInstance;
  beforeEach(async () => {
    app = Fastify();
    await app.register(mcpRoutes);
    await app.ready();
  });
  afterEach(async () => app.close());

  it('publishes OAuth protected resource metadata without tenant data', async () => {
    const response = await app.inject({ method: 'GET', url: '/.well-known/oauth-protected-resource/mcp', headers: { host: 'localhost' } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ resource: 'http://localhost/mcp', authorization_servers: ['https://issuer.example'] });
    expect(response.body).not.toMatch(/agency-1|user-1|grant-1/);
  });

  it('initializes over stateless Streamable HTTP with the official SDK transport', async () => {
    const response = await app.inject({
      method: 'POST', url: '/mcp', headers: { host: 'localhost', authorization: 'Bearer valid', 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      payload: { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test-host', version: '1.0.0' } } },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ jsonrpc: '2.0', id: 1, result: { serverInfo: { name: 'AuthHub Access Operations' }, capabilities: { tools: {} } } });
  });
});
