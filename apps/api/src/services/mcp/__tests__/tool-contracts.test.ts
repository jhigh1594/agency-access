import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { AgentPrincipal } from '@/lib/agent-principal.js';
import { createAgentMcpServer } from '@/services/mcp/agent-mcp-server.js';
import { agentAccessOperationsService } from '@/services/agent-access-operations.service.js';
import { agentOperationService } from '@/services/agent-operation.service.js';

vi.mock('@/services/agent-access-operations.service.js', () => ({
  agentAccessOperationsService: {
    getWorkspaceContext: vi.fn(), getReadiness: vi.fn(), prepareAccessRequest: vi.fn(),
    executePreparedOperation: vi.fn(), getRequestState: vi.fn(), initiateConnectionHandoff: vi.fn(),
    saveClient: vi.fn(), updateAgencyProfile: vi.fn(),
  },
}));
vi.mock('@/services/agent-operation.service.js', () => ({ agentOperationService: { getForAgent: vi.fn() } }));
vi.mock('@/services/agent-activity.service.js', () => ({ agentActivityService: { list: vi.fn() } }));
vi.mock('@/lib/env.js', () => ({ env: { FRONTEND_URL: 'https://app.example.com' } }));

const principal: AgentPrincipal = {
  kind: 'agent', ownerSubject: 'user-1', agencyId: 'agency-1', oauthClientId: 'oauth-1', grantId: 'grant-1', displayName: 'Assistant',
  permissions: ['workspace:read', 'connections:read', 'connections:handoff', 'requests:read', 'requests:prepare', 'requests:dispatch', 'operations:read'],
  requestMetadata: { ipAddress: '127.0.0.1', userAgent: 'test', correlationId: 'req-1' },
};

describe('agent MCP tool contracts', () => {
  let client: Client;
  let server: ReturnType<typeof createAgentMcpServer>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    server = createAgentMcpServer(principal);
    client = new Client({ name: 'contract-test', version: '1.0.0' });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await client.close();
    await server.close();
  });

  it('discovers only tools allowed by the active grant', async () => {
    const tools = await client.listTools();
    const names = tools.tools.map((tool) => tool.name);
    expect(names).toContain('authhub_workspace_context');
    expect(names).toContain('authhub_prepare_client_onboarding');
    expect(names).not.toContain('authhub_save_client');
    expect(tools.tools.find((tool) => tool.name === 'authhub_workspace_context')?.annotations).toMatchObject({ readOnlyHint: true });
  });

  it('returns structured output from a scoped read tool and ignores tenant-like arguments', async () => {
    vi.mocked(agentAccessOperationsService.getWorkspaceContext).mockResolvedValue({ agency: { id: 'agency-1', name: 'Agency' }, clients: { items: [], pagination: { total: 0 } }, templates: [], connections: [], requests: [] } as any);
    const result = await client.callTool({ name: 'authhub_workspace_context', arguments: { agencyId: 'agency-other', limit: 10 } });
    expect(result.structuredContent).toMatchObject({ agency: { id: 'agency-1' } });
    expect(agentAccessOperationsService.getWorkspaceContext).toHaveBeenCalledWith(expect.objectContaining({ agencyId: 'agency-1' }), { limit: 10, offset: 0 });
  });

  it('returns an ordinary approval URL for consequential onboarding preparation', async () => {
    vi.mocked(agentAccessOperationsService.prepareAccessRequest).mockResolvedValue({ id: 'op-1', status: 'pending_approval', expiresAt: new Date(Date.now() + 60_000) } as any);
    const result = await client.callTool({ name: 'authhub_prepare_client_onboarding', arguments: { clientId: 'client-1', platforms: [{ platform: 'google_ads', accessLevel: 'manage' }], idempotencyKey: 'key-1' } });
    expect(result.structuredContent).toMatchObject({ operationId: 'op-1', status: 'pending_approval', approvalUrl: 'https://app.example.com/agent-operations/op-1' });
  });
});
