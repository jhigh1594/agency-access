import * as z from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AgentPrincipal } from '@/lib/agent-principal.js';
import { mcpStructuredResult, sanitizeOperationForAgent } from '@/lib/mcp-adapter.js';
import { agentAccessOperationsService } from '@/services/agent-access-operations.service.js';
import { agentOperationService } from '@/services/agent-operation.service.js';

export function registerOperationTools(server: McpServer, principal: AgentPrincipal) {
  if (principal.permissions.includes('operations:read')) {
    server.registerTool('authhub_get_operation', {
      title: 'Read agent operation',
      description: 'Returns the durable, sanitized status of one operation belonging to this grant.',
      inputSchema: { operationId: z.string().min(1) },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    }, async ({ operationId }) => {
      const operation = sanitizeOperationForAgent(await agentOperationService.getForAgent(principal, operationId));
      if (!operation) throw new Error('Agent operation not found');
      return mcpStructuredResult(operation as Record<string, unknown>, `Agent operation is ${operation.status}.`);
    });
  }

  if (principal.permissions.includes('requests:dispatch') || principal.permissions.includes('requests:cancel')) {
    server.registerTool('authhub_execute_approved_operation', {
      title: 'Execute approved operation',
      description: 'Claims and executes an already approved operation idempotently. Pending operations remain untouched.',
      inputSchema: { operationId: z.string().min(1) },
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
    }, async ({ operationId }) => {
      const result: any = await agentAccessOperationsService.executePreparedOperation(principal, operationId);
      const operation = sanitizeOperationForAgent(result.operation);
      return mcpStructuredResult({ operation, claimed: result.claimed }, result.claimed ? 'Approved operation execution processed.' : 'Operation was already claimed; current state returned.');
    });
  }
}
