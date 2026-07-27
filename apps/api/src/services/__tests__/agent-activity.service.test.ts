import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma.js';
import { agentActivityService } from '@/services/agent-activity.service.js';

vi.mock('@/lib/prisma.js', () => ({ prisma: { auditLog: { findMany: vi.fn() } } }));

describe('agentActivityService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a stable agency-scoped cursor without secret or PII metadata', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([
      { id: 12n, agencyId: 'agency-1', action: 'AGENT_OPERATION_SUCCEEDED', resourceType: 'agent_operation', resourceId: 'op-1', agentGrantId: 'grant-1', agentOperationId: 'op-1', createdAt: new Date('2026-07-17T10:00:00Z'), metadata: { actionType: 'access_request.dispatch', clientEmail: 'private@example.com', accessToken: 'secret' } },
      { id: 11n, agencyId: 'agency-1', action: 'AGENT_WORKSPACE_READ', resourceType: 'agency', resourceId: 'agency-1', agentGrantId: 'grant-1', agentOperationId: null, createdAt: new Date('2026-07-17T09:00:00Z'), metadata: {} },
    ] as any);
    const result = await agentActivityService.list({ agencyId: 'agency-1', grantId: 'grant-1', limit: 1 });
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ agencyId: 'agency-1', agentGrantId: 'grant-1' }), take: 2 }));
    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBeTruthy();
    expect(JSON.stringify(result)).not.toMatch(/private@example|accessToken|secret/);
  });

  it.each([
    ['partial', { kind: 'access_request', status: 'partial', unresolvedProducts: ['ga4'] }, 'client_follow_up'],
    ['invalid connection', { kind: 'connection', status: 'invalid' }, 'owner_connection_handoff'],
    ['expired approval', { kind: 'operation', status: 'expired' }, 'prepare_new_operation'],
    ['retryable failure', { kind: 'operation', status: 'failed_retryable' }, 'retry_operation'],
    ['revoked grant', { kind: 'grant', status: 'revoked' }, 'reconnect_agent'],
  ])('classifies %s recovery', (_label, state, action) => {
    expect(agentActivityService.recoveryFor(state as any).nextAction).toBe(action);
  });
});
