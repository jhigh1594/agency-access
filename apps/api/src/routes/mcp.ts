import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { env } from '@/lib/env.js';
import { authenticateAgent } from '@/middleware/agent-auth.js';
import { createAgentMcpServer } from '@/services/mcp/agent-mcp-server.js';
import { agentRateLimitService } from '@/services/agent-rate-limit.service.js';
import { agentTelemetryService } from '@/services/agent-telemetry.service.js';

function metadataUrl(): string {
  const resource = new URL(env.AGENT_MCP_RESOURCE_URL);
  return `${resource.origin}/.well-known/oauth-protected-resource${resource.pathname}`;
}

async function validateMcpEdge(request: FastifyRequest, reply: FastifyReply) {
  const resource = new URL(env.AGENT_MCP_RESOURCE_URL);
  const requestHost = request.headers.host?.toLowerCase();
  if (!requestHost || requestHost !== resource.host.toLowerCase()) {
    return reply.code(421).send({ data: null, error: { code: 'MISDIRECTED_REQUEST', message: 'Request host does not match the MCP resource' } });
  }
  const origin = request.headers.origin;
  if (origin) {
    const allowedOrigins = new Set([resource.origin, env.FRONTEND_URL ? new URL(env.FRONTEND_URL).origin : null].filter(Boolean));
    if (!allowedOrigins.has(origin)) {
      return reply.code(403).send({ data: null, error: { code: 'ORIGIN_NOT_ALLOWED', message: 'Origin is not allowed for the MCP resource' } });
    }
  }
  if (request.method === 'POST' && !request.headers['content-type']?.toLowerCase().startsWith('application/json')) {
    return reply.code(415).send({ data: null, error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'MCP requests require application/json' } });
  }
}

const agentAuth = authenticateAgent();
async function authenticateMcp(request: FastifyRequest, reply: FastifyReply) {
  reply.header('WWW-Authenticate', `Bearer resource_metadata="${metadataUrl()}"`);
  return agentAuth(request, reply);
}

const mutationTools = new Set([
  'authhub_prepare_client_onboarding', 'authhub_execute_approved_operation',
  'authhub_prepare_access_request_cancel',
  'authhub_start_connection_handoff', 'authhub_save_client', 'authhub_update_agency_profile',
]);

const consequentialTools = new Set([
  'authhub_prepare_client_onboarding',
  'authhub_prepare_access_request_cancel',
  'authhub_execute_approved_operation',
]);

function protocolCall(request: FastifyRequest) {
  const body = request.body as { method?: string; params?: { name?: string } } | undefined;
  const toolName = body?.method === 'tools/call' ? body.params?.name : undefined;
  return {
    toolName: toolName || body?.method || 'unknown',
    budgetClass: toolName && mutationTools.has(toolName) ? 'mutation' as const : 'read' as const,
  };
}

function telemetryRisk(toolName: string, budgetClass: 'read' | 'mutation') {
  if (consequentialTools.has(toolName)) return 'consequential' as const;
  return budgetClass === 'read' ? 'read' as const : 'reversible' as const;
}

async function enforceAgentRateLimit(request: FastifyRequest, reply: FastifyReply) {
  const principal = request.agentPrincipal!;
  const call = protocolCall(request);
  const result = await agentRateLimitService.checkAndConsume({
    agencyId: principal.agencyId, grantId: principal.grantId,
    oauthClientId: principal.oauthClientId, budgetClass: call.budgetClass,
  });
  if (!result.allowed) {
    reply.header('Retry-After', String(result.retryAfterSeconds));
    agentTelemetryService.recordToolCall({
      agencyId: principal.agencyId, grantId: principal.grantId, oauthClientId: principal.oauthClientId,
      toolName: call.toolName, riskClass: telemetryRisk(call.toolName, call.budgetClass),
      outcome: 'rate_limited', latencyMs: 0, correlationId: principal.requestMetadata.correlationId || request.id,
    });
    return reply.code(429).send({ jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Agent rate limit exceeded' } });
  }
}

export async function mcpRoutes(fastify: FastifyInstance) {
  const resourcePath = new URL(env.AGENT_MCP_RESOURCE_URL).pathname.replace(/^\//, '');
  fastify.get(`/.well-known/oauth-protected-resource/${resourcePath}`, async (_request, reply) => {
    return reply.send({
      resource: env.AGENT_MCP_RESOURCE_URL,
      authorization_servers: [env.CLERK_OAUTH_ISSUER],
      bearer_methods_supported: ['header'],
      scopes_supported: ['openid', 'profile', 'user:org:read'],
      resource_documentation: `${(env.FRONTEND_URL || new URL(env.AGENT_MCP_RESOURCE_URL).origin).replace(/\/$/, '')}/docs/agent-access`,
    });
  });

  fastify.post('/mcp', {
    bodyLimit: 256 * 1024,
    onRequest: [validateMcpEdge, authenticateMcp],
    preHandler: [enforceAgentRateLimit],
  }, async (request, reply) => {
    const startedAt = performance.now();
    const call = protocolCall(request);
    const server = createAgentMcpServer(request.agentPrincipal!);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    const close = () => {
      void transport.close();
      void server.close();
    };
    reply.raw.once('close', close);
    try {
      await server.connect(transport);
      reply.hijack();
      await transport.handleRequest(request.raw, reply.raw, request.body);
      agentTelemetryService.recordToolCall({
        agencyId: request.agentPrincipal!.agencyId, grantId: request.agentPrincipal!.grantId,
        oauthClientId: request.agentPrincipal!.oauthClientId, toolName: call.toolName,
        riskClass: telemetryRisk(call.toolName, call.budgetClass), outcome: 'success',
        latencyMs: performance.now() - startedAt, correlationId: request.agentPrincipal!.requestMetadata.correlationId || request.id,
      });
      return reply;
    } catch (error) {
      close();
      agentTelemetryService.recordToolCall({
        agencyId: request.agentPrincipal!.agencyId, grantId: request.agentPrincipal!.grantId,
        oauthClientId: request.agentPrincipal!.oauthClientId, toolName: call.toolName,
        riskClass: telemetryRisk(call.toolName, call.budgetClass), outcome: 'failure',
        latencyMs: performance.now() - startedAt, correlationId: request.agentPrincipal!.requestMetadata.correlationId || request.id,
      });
      if (!reply.raw.headersSent) {
        return reply.code(500).send({ jsonrpc: '2.0', id: null, error: { code: -32603, message: 'Internal server error' } });
      }
      request.log.error({ error }, 'MCP transport failed after response started');
      return reply;
    }
  });

  const methodNotAllowed = async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(405).send({ jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Method not allowed' } });
  };
  fastify.get('/mcp', { onRequest: [validateMcpEdge, authenticateMcp] }, methodNotAllowed);
  fastify.delete('/mcp', { onRequest: [validateMcpEdge, authenticateMcp] }, methodNotAllowed);
}
