import { logger } from '@/lib/logger.js';

function emptyCounters() {
  return {
    toolCalls: 0,
    authorizationFailures: 0,
    failures: 0,
    rateLimits: 0,
    duplicateSuppressions: 0,
    approvalDecisions: 0,
    approvalLatencyMsTotal: 0,
    connections: 0,
    revocations: 0,
    redactionViolations: 0,
  };
}

let counters = emptyCounters();

export const agentTelemetryService = {
  recordAuthorizationFailure(input: {
    reason: 'missing_token' | 'invalid_token' | 'grant_required' | 'agency_not_allowed';
    agencyId?: string;
    grantId?: string;
    oauthClientId?: string;
  }) {
    counters.authorizationFailures += 1;
    logger.warn('agent authorization denied', { event: 'agent_authorization_failure', ...input });
  },
  recordToolCall(input: {
    agencyId: string; grantId: string; oauthClientId: string; toolName: string;
    riskClass: 'read' | 'reversible' | 'consequential'; outcome: 'success' | 'failure' | 'rate_limited';
    latencyMs: number; correlationId: string; operationId?: string;
  }) {
    counters.toolCalls += 1;
    if (input.outcome !== 'success') counters.failures += 1;
    if (input.outcome === 'rate_limited') counters.rateLimits += 1;
    logger.info('agent tool call', {
      event: 'agent_tool_call', agencyId: input.agencyId, grantId: input.grantId,
      oauthClientId: input.oauthClientId, toolName: input.toolName, riskClass: input.riskClass,
      outcome: input.outcome, latencyMs: Math.max(0, Math.round(input.latencyMs)),
      correlationId: input.correlationId, ...(input.operationId ? { operationId: input.operationId } : {}),
    });
  },
  recordDuplicateSuppression(input: { agencyId: string; grantId: string; operationId: string; actionType: string }) {
    counters.duplicateSuppressions += 1;
    logger.info('agent duplicate effect suppressed', { event: 'agent_duplicate_suppressed', ...input });
  },
  recordApprovalDecision(input: { agencyId: string; grantId: string; operationId: string; decision: 'approved' | 'declined'; latencyMs: number }) {
    counters.approvalDecisions += 1;
    counters.approvalLatencyMsTotal += Math.max(0, input.latencyMs);
    logger.info('agent approval decision', { event: 'agent_approval_decision', ...input, latencyMs: Math.max(0, Math.round(input.latencyMs)) });
  },
  recordConnection(input: { agencyId: string; grantId: string; oauthClientId: string }) {
    counters.connections += 1;
    logger.info('agent connected', { event: 'agent_connected', ...input });
  },
  recordRevocation(input: { agencyId: string; grantId: string }) {
    counters.revocations += 1;
    logger.info('agent grant revoked', { event: 'agent_grant_revoked', ...input });
  },
  recordRedactionViolation(input: { agencyId: string; grantId: string; operationType: string }) {
    counters.redactionViolations += 1;
    logger.warn('agent secret-bearing input rejected', { event: 'agent_redaction_violation', ...input });
  },
  snapshot() {
    return {
      ...counters,
      averageApprovalLatencyMs: counters.approvalDecisions > 0
        ? Math.round(counters.approvalLatencyMsTotal / counters.approvalDecisions)
        : null,
    };
  },
  resetForTests() { counters = emptyCounters(); },
};
