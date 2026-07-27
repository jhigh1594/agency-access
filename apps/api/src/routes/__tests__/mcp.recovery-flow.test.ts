import { describe, expect, it, vi } from 'vitest';
import { agentActivityService } from '@/services/agent-activity.service.js';

vi.mock('@/lib/prisma.js', () => ({ prisma: { auditLog: { findMany: vi.fn() } } }));

describe('MCP recovery floor', () => {
  it('keeps retry guidance distinct from new approval and human handoff guidance', () => {
    expect(agentActivityService.recoveryFor({ kind: 'operation', status: 'failed_retryable' })).toMatchObject({ nextAction: 'retry_operation', retryable: true });
    expect(agentActivityService.recoveryFor({ kind: 'operation', status: 'expired' })).toMatchObject({ nextAction: 'prepare_new_operation', retryable: false });
    expect(agentActivityService.recoveryFor({ kind: 'connection', status: 'invalid' })).toMatchObject({ nextAction: 'owner_connection_handoff', humanRequired: true });
    expect(agentActivityService.recoveryFor({ kind: 'access_request', status: 'partial', unresolvedProducts: ['ga4'] })).toMatchObject({ nextAction: 'client_follow_up', humanRequired: true });
  });
});
