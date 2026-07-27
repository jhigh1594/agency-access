import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AgentPrincipal } from '@/lib/agent-principal.js';
import { registerContextTools } from '@/services/mcp/context-tools.js';
import { registerOnboardingTools } from '@/services/mcp/onboarding-tools.js';
import { registerOperationTools } from '@/services/mcp/operation-tools.js';

export function createAgentMcpServer(principal: AgentPrincipal) {
  const server = new McpServer(
    { name: 'AuthHub Access Operations', version: '1.0.0', websiteUrl: 'https://authhub.co' },
    { capabilities: { tools: {} } }
  );
  registerContextTools(server, principal);
  registerOnboardingTools(server, principal);
  registerOperationTools(server, principal);
  return server;
}
