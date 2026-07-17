import * as z from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AgentPrincipal } from '@/lib/agent-principal.js';
import { env } from '@/lib/env.js';
import { mcpStructuredResult } from '@/lib/mcp-adapter.js';
import { agentAccessOperationsService } from '@/services/agent-access-operations.service.js';

export function registerOnboardingTools(server: McpServer, principal: AgentPrincipal) {
  if (principal.permissions.includes('requests:prepare') && principal.permissions.includes('requests:dispatch')) {
    server.registerTool('authhub_prepare_client_onboarding', {
      title: 'Prepare client onboarding',
      description: 'Validates client onboarding and creates a pending owner approval. It does not create or email a request before approval.',
      inputSchema: {
        clientId: z.string().min(1),
        templateId: z.string().min(1).optional(),
        platforms: z.array(z.object({
          platform: z.string().min(1),
          accessLevel: z.enum(['manage', 'view_only']),
          accountId: z.string().min(1).max(200).optional(),
        })).min(1).max(25).optional(),
        idempotencyKey: z.string().min(1).max(200),
        agencyId: z.string().optional().describe('Ignored; agency scope is derived from the grant.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    }, async ({ clientId, templateId, platforms, idempotencyKey }) => {
      const operation: any = await agentAccessOperationsService.prepareAccessRequest(principal, { clientId, templateId, platforms, idempotencyKey });
      const data = {
        operationId: operation.id,
        status: operation.status,
        approvalUrl: `${(env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '')}/agent-operations/${operation.id}`,
        expiresAt: operation.expiresAt instanceof Date ? operation.expiresAt.toISOString() : operation.expiresAt || null,
      };
      return mcpStructuredResult(data, 'Client onboarding is prepared and waiting for agency owner approval.');
    });
  }

  if (principal.permissions.includes('requests:cancel')) {
    server.registerTool('authhub_prepare_access_request_cancel', {
      title: 'Prepare access request cancellation',
      description: 'Creates an owner approval preview. It does not cancel the request before approval.',
      inputSchema: { requestId: z.string().min(1), idempotencyKey: z.string().min(1).max(200) },
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    }, async ({ requestId, idempotencyKey }) => {
      const operation: any = await agentAccessOperationsService.prepareCancelAccessRequest(principal, { requestId, idempotencyKey });
      return mcpStructuredResult({ operationId: operation.id, status: operation.status, approvalUrl: `${(env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '')}/agent-operations/${operation.id}` }, 'Cancellation is prepared and waiting for owner approval.');
    });
  }

  if (principal.permissions.includes('connections:handoff')) {
    server.registerTool('authhub_start_connection_handoff', {
      title: 'Start owner connection handoff',
      description: 'Returns an authenticated AuthHub URL where the owner can complete provider consent. Credentials are never accepted.',
      inputSchema: {
        platform: z.string().min(1),
        idempotencyKey: z.string().min(1).max(200),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    }, async ({ platform, idempotencyKey }) => {
      const result: any = await agentAccessOperationsService.initiateConnectionHandoff(principal, { platform, idempotencyKey });
      const operationResult = result.operation?.result;
      const data = {
        operationId: result.operation?.id,
        status: result.operation?.status,
        claimed: result.claimed,
        platform,
        completionState: operationResult?.completionState || 'follow_up_needed',
        handoffUrl: operationResult?.remediation?.[0],
      };
      return mcpStructuredResult(data, operationResult?.message || 'The agency owner must complete provider authorization in AuthHub.');
    });
  }

  if (principal.permissions.includes('clients:write')) {
    server.registerTool('authhub_save_client', {
      title: 'Create or update an agency client',
      description: 'Idempotently saves a client profile inside the authorized agency.',
      inputSchema: {
        id: z.string().min(1).optional(), name: z.string().min(1).max(120), company: z.string().min(1).max(160),
        email: z.email(), website: z.url().optional(), language: z.enum(['en', 'es', 'nl']).optional(),
        idempotencyKey: z.string().min(1).max(200),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    }, async (input) => {
      const result: any = await agentAccessOperationsService.saveClient(principal, input);
      return mcpStructuredResult({ operationId: result.operation?.id, status: result.operation?.status, claimed: result.claimed }, 'Client save operation processed.');
    });
  }

  if (principal.permissions.includes('agency:write')) {
    server.registerTool('authhub_update_agency_profile', {
      title: 'Update reversible agency profile settings',
      description: 'Idempotently updates the agency name, website, or logo URL.',
      inputSchema: {
        name: z.string().min(1).max(160).optional(), website: z.url().optional(), logoUrl: z.url().optional(),
        idempotencyKey: z.string().min(1).max(200),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    }, async (input) => {
      const result: any = await agentAccessOperationsService.updateAgencyProfile(principal, input);
      return mcpStructuredResult({ operationId: result.operation?.id, status: result.operation?.status, claimed: result.claimed }, 'Agency profile update processed.');
    });
  }
}
