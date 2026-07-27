import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@/lib/logger.js';
import { agentTelemetryService } from '@/services/agent-telemetry.service.js';

vi.mock('@/lib/logger.js', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

describe('agentTelemetryService', () => {
  beforeEach(() => { vi.clearAllMocks(); agentTelemetryService.resetForTests(); });

  it('records bounded dimensions and latency without tool arguments, PII, or secrets', () => {
    agentTelemetryService.recordToolCall({ agencyId: 'agency-1', grantId: 'grant-1', oauthClientId: 'oauth-1', toolName: 'authhub_workspace_context', riskClass: 'read', outcome: 'success', latencyMs: 24, correlationId: 'req-1' });
    expect(logger.info).toHaveBeenCalledWith('agent tool call', expect.objectContaining({ toolName: 'authhub_workspace_context', latencyMs: 24, outcome: 'success' }));
    expect(JSON.stringify(vi.mocked(logger.info).mock.calls)).not.toMatch(/arguments|email|token|secret/i);
    expect(agentTelemetryService.snapshot()).toMatchObject({ toolCalls: 1, failures: 0 });
  });

  it('exposes approval, duplicate, connection, revocation, rate-limit, and redaction metrics', () => {
    agentTelemetryService.recordAuthorizationFailure({ reason: 'invalid_token' });
    agentTelemetryService.recordToolCall({ agencyId: 'agency-1', grantId: 'grant-1', oauthClientId: 'oauth-1', toolName: 'authhub_save_client', riskClass: 'reversible', outcome: 'rate_limited', latencyMs: 0, correlationId: 'req-2' });
    agentTelemetryService.recordApprovalDecision({ agencyId: 'agency-1', grantId: 'grant-1', operationId: 'op-1', decision: 'approved', latencyMs: 400 });
    agentTelemetryService.recordDuplicateSuppression({ agencyId: 'agency-1', grantId: 'grant-1', operationId: 'op-1', actionType: 'access_request.dispatch' });
    agentTelemetryService.recordConnection({ agencyId: 'agency-1', grantId: 'grant-1', oauthClientId: 'oauth-1' });
    agentTelemetryService.recordRevocation({ agencyId: 'agency-1', grantId: 'grant-1' });
    agentTelemetryService.recordRedactionViolation({ agencyId: 'agency-1', grantId: 'grant-1', operationType: 'client.upsert' });

    expect(agentTelemetryService.snapshot()).toMatchObject({
      toolCalls: 1, authorizationFailures: 1, failures: 1, rateLimits: 1, approvalDecisions: 1,
      averageApprovalLatencyMs: 400, duplicateSuppressions: 1, connections: 1,
      revocations: 1, redactionViolations: 1,
    });
    expect(JSON.stringify([...vi.mocked(logger.info).mock.calls, ...vi.mocked(logger.warn).mock.calls])).not.toMatch(/client@email|access.?token|api.?key|secret.?id/i);
  });
});
