import * as z from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AgentPrincipal } from '@/lib/agent-principal.js';
import { mcpStructuredResult } from '@/lib/mcp-adapter.js';
import { agentAccessOperationsService } from '@/services/agent-access-operations.service.js';
import { agentActivityService } from '@/services/agent-activity.service.js';

export function registerContextTools(server: McpServer, principal: AgentPrincipal) {
  if (principal.permissions.includes('workspace:read')) {
    server.registerTool('authhub_workspace_context', {
      title: 'Read AuthHub workspace context',
      description: 'Returns a bounded, sanitized snapshot of the authorized agency workspace.',
      inputSchema: {
        limit: z.number().int().min(1).max(100).default(25),
        offset: z.number().int().min(0).default(0),
        agencyId: z.string().optional().describe('Ignored; agency scope is derived from the grant.'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    }, async ({ limit, offset }) => {
      const data = await agentAccessOperationsService.getWorkspaceContext(principal, { limit, offset });
      return mcpStructuredResult(data as unknown as Record<string, unknown>, 'Authorized AuthHub workspace context loaded.');
    });
  }

  if (principal.permissions.includes('connections:read')) {
    server.registerTool('authhub_check_readiness', {
      title: 'Check agency connection readiness',
      description: 'Checks whether the agency is ready for selected platforms and returns human handoffs for missing connections.',
      inputSchema: { platforms: z.array(z.string().min(1)).min(1).max(25) },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    }, async ({ platforms }) => {
      const data = await agentAccessOperationsService.getReadiness(principal, platforms);
      return mcpStructuredResult(data as unknown as Record<string, unknown>, data.ready ? 'Agency connections are ready.' : 'Agency owner action is required for one or more connections.');
    });
  }

  if (principal.permissions.includes('requests:read')) {
    server.registerTool('authhub_get_access_request', {
      title: 'Read access request state',
      description: 'Returns truthful fulfillment and unresolved-product state for one authorized-agency request.',
      inputSchema: { requestId: z.string().min(1) },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    }, async ({ requestId }) => {
      const data = await agentAccessOperationsService.getRequestState(principal, requestId);
      return mcpStructuredResult(data as unknown as Record<string, unknown>, `Access request is ${data.completionState}.`);
    });
  }

  if (principal.permissions.includes('operations:read')) {
    server.registerTool('authhub_list_activity', {
      title: 'List recent agent activity',
      description: 'Returns cursor-paginated, sanitized activity for this grant and agency.',
      inputSchema: { cursor: z.string().min(1).optional(), limit: z.number().int().min(1).max(100).default(25) },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    }, async ({ cursor, limit }) => {
      const data = await agentActivityService.list({ agencyId: principal.agencyId, grantId: principal.grantId, cursor, limit });
      return mcpStructuredResult(data as unknown as Record<string, unknown>, `Returned ${data.items.length} recent activity records.`);
    });
  }
}
