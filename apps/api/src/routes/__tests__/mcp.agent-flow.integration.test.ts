import { afterEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { AgentPrincipal } from '@/lib/agent-principal.js';
import { createAgentMcpServer } from '@/services/mcp/agent-mcp-server.js';
import { agentAccessOperationsService } from '@/services/agent-access-operations.service.js';
import { agentOperationService } from '@/services/agent-operation.service.js';

vi.mock('@/lib/env.js', () => ({ env: { FRONTEND_URL: 'https://app.example.com' } }));
vi.mock('@/services/agent-activity.service.js', () => ({ agentActivityService: { list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }) } }));
vi.mock('@/services/agent-access-operations.service.js', () => ({ agentAccessOperationsService: {
  getWorkspaceContext: vi.fn(), getReadiness: vi.fn(), prepareAccessRequest: vi.fn(), executePreparedOperation: vi.fn(),
  getRequestState: vi.fn(), initiateConnectionHandoff: vi.fn(), saveClient: vi.fn(), updateAgencyProfile: vi.fn(),
} }));
vi.mock('@/services/agent-operation.service.js', () => ({ agentOperationService: { getForAgent: vi.fn() } }));

const principal: AgentPrincipal = {
  kind: 'agent', ownerSubject: 'owner-1', agencyId: 'agency-1', oauthClientId: 'oauth-1', grantId: 'grant-1', displayName: 'Chief of Staff',
  permissions: ['workspace:read', 'connections:read', 'connections:handoff', 'requests:read', 'requests:prepare', 'requests:dispatch', 'operations:read'],
  requestMetadata: { ipAddress: '127.0.0.1', userAgent: 'integration-test', correlationId: 'flow-1' },
};

describe('complete agent MCP flow', () => {
  let client: Client | null = null;
  let server: ReturnType<typeof createAgentMcpServer> | null = null;
  afterEach(async () => { if (client) await client.close(); if (server) await server.close(); });

  it('connects, checks readiness, prepares approval, executes once, and monitors truthful partial state', async () => {
    vi.mocked(agentAccessOperationsService.getWorkspaceContext).mockResolvedValue({ agency: { id: 'agency-1', name: 'Northstar' }, clients: { items: [{ id: 'client-1', name: 'Jamie', company: 'Acme' }], pagination: { total: 1 } }, templates: [], connections: [], requests: [] } as any);
    vi.mocked(agentAccessOperationsService.getReadiness).mockResolvedValue({ ready: true, connections: [{ platform: 'google_ads', state: 'active', healthy: true }] } as any);
    vi.mocked(agentAccessOperationsService.prepareAccessRequest).mockResolvedValue({ id: 'op-1', status: 'pending_approval', expiresAt: new Date(Date.now() + 60_000) } as any);
    vi.mocked(agentAccessOperationsService.executePreparedOperation).mockResolvedValue({ claimed: true, operation: { id: 'op-1', actionType: 'access_request.dispatch', riskClass: 'consequential', status: 'succeeded', result: { resourceType: 'access_request', resourceId: 'request-1', message: 'Sent', retryable: false, remediation: [] } } } as any);
    vi.mocked(agentAccessOperationsService.getRequestState).mockResolvedValue({ id: 'request-1', status: 'partial', completionState: 'follow_up_needed', platforms: ['google_ads'], fulfilledProducts: [], unresolvedProducts: ['google_ads'], nextActions: ['Ask client to select an asset'] } as any);
    vi.mocked(agentOperationService.getForAgent).mockResolvedValue({ id: 'op-1', actionType: 'access_request.dispatch', riskClass: 'consequential', status: 'succeeded' } as any);

    const pair = InMemoryTransport.createLinkedPair();
    server = createAgentMcpServer(principal);
    client = new Client({ name: 'reference-host', version: '1.0.0' });
    await server.connect(pair[1]);
    await client.connect(pair[0]);

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toContain('authhub_prepare_client_onboarding');
    expect((await client.callTool({ name: 'authhub_workspace_context', arguments: { limit: 25 } })).structuredContent).toMatchObject({ agency: { id: 'agency-1' } });
    expect((await client.callTool({ name: 'authhub_check_readiness', arguments: { platforms: ['google_ads'] } })).structuredContent).toMatchObject({ ready: true });
    expect((await client.callTool({ name: 'authhub_prepare_client_onboarding', arguments: { clientId: 'client-1', platforms: [{ platform: 'google_ads', accessLevel: 'manage' }], idempotencyKey: 'flow-1' } })).structuredContent).toMatchObject({ operationId: 'op-1', status: 'pending_approval', approvalUrl: expect.stringContaining('/agent-operations/op-1') });
    expect((await client.callTool({ name: 'authhub_execute_approved_operation', arguments: { operationId: 'op-1' } })).structuredContent).toMatchObject({ claimed: true, operation: { status: 'succeeded' } });
    expect((await client.callTool({ name: 'authhub_get_access_request', arguments: { requestId: 'request-1' } })).structuredContent).toMatchObject({ completionState: 'follow_up_needed', unresolvedProducts: ['google_ads'] });
  });
});
