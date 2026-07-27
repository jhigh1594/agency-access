import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma.js';
import type { AgentPrincipal } from '@/lib/agent-principal.js';
import {
  AgentOperationConflictError,
  AgentOperationStateError,
  agentOperationService,
} from '@/services/agent-operation.service.js';

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    agentOperation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    agentGrant: { findFirst: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const principal: AgentPrincipal = {
  kind: 'agent', ownerSubject: 'user-1', agencyId: 'agency-1', oauthClientId: 'oauth-1',
  grantId: 'grant-1', displayName: 'Assistant', permissions: ['requests:dispatch', 'clients:write'],
  requestMetadata: { ipAddress: '127.0.0.1', userAgent: 'agent-test', correlationId: 'req-1' },
};

const preview = {
  agency: { id: 'agency-1', name: 'Agency' }, client: { id: 'client-1', name: 'Client' },
  platforms: ['google_ads'], permissions: ['admin'], externalEffect: 'Email one access request',
  requestingAgent: { grantId: 'grant-1', oauthClientId: 'oauth-1', displayName: 'Assistant' },
  expiresAt: new Date(Date.now() + 60_000).toISOString(), changes: [],
};

describe('agentOperationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => callback(prisma));
  });

  it('prepares consequential work without executing and writes attributed audit data', async () => {
    vi.mocked(prisma.agentOperation.create).mockImplementation(async ({ data }: any) => ({ id: 'op-1', ...data }));

    const operation = await agentOperationService.prepare({
      principal, actionType: 'access_request.dispatch', idempotencyKey: 'key-1',
      input: { clientId: 'client-1' }, approvalPreview: preview,
    });

    expect(operation.status).toBe('pending_approval');
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      actorType: 'agent', actorId: 'user-1', agentGrantId: 'grant-1', agentOperationId: 'op-1',
      oauthClientId: 'oauth-1', agencyId: 'agency-1',
    }) }));
  });

  it('returns the existing operation for an identical retry and conflicts on changed intent', async () => {
    vi.mocked(prisma.agentOperation.create).mockRejectedValue({ code: 'P2002' });
    const existing: any = { id: 'op-1', actionType: 'access_request.dispatch', inputHash: '', status: 'pending_approval' };
    vi.mocked(prisma.agentOperation.findUnique).mockResolvedValue(existing);
    const firstHash = agentOperationService.hashInput({ clientId: 'client-1' });
    existing.inputHash = firstHash;

    await expect(agentOperationService.prepare({ principal, actionType: 'access_request.dispatch', idempotencyKey: 'key-1', input: { clientId: 'client-1' }, approvalPreview: preview })).resolves.toBe(existing);
    await expect(agentOperationService.prepare({ principal, actionType: 'access_request.dispatch', idempotencyKey: 'key-1', input: { clientId: 'client-2' }, approvalPreview: preview })).rejects.toBeInstanceOf(AgentOperationConflictError);
  });

  it('rejects secret-bearing operation snapshots before persistence', async () => {
    await expect(agentOperationService.prepare({ principal, actionType: 'client.upsert', idempotencyKey: 'key-secret', input: { clientId: 'client-1', refreshToken: 'forbidden' } })).rejects.toThrow(/prohibited/i);
    expect(prisma.agentOperation.create).not.toHaveBeenCalled();
  });

  it('allows one concurrent execution claim and one side effect', async () => {
    const operation: any = { id: 'op-1', agencyId: 'agency-1', grantId: 'grant-1', actionType: 'access_request.dispatch', riskClass: 'consequential', status: 'approved', expiresAt: new Date(Date.now() + 60_000), inputSnapshot: { clientId: 'client-1' } };
    vi.mocked(prisma.agentOperation.findFirst).mockResolvedValue(operation);
    vi.mocked(prisma.agentGrant.findFirst).mockResolvedValue({ id: 'grant-1', state: 'active', permissions: ['requests:dispatch'] } as any);
    vi.mocked(prisma.agentOperation.updateMany).mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    vi.mocked(prisma.agentOperation.update).mockImplementation(async ({ data }: any) => ({ ...operation, ...data }));
    const effect = vi.fn().mockResolvedValue({ resourceType: 'access_request', resourceId: 'request-1', message: 'Sent', retryable: false, remediation: [] });

    const [first, second] = await Promise.all([
      agentOperationService.execute({ principal, operationId: 'op-1', effect }),
      agentOperationService.execute({ principal, operationId: 'op-1', effect }),
    ]);

    expect(effect).toHaveBeenCalledTimes(1);
    expect([first.claimed, second.claimed].sort()).toEqual([false, true]);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      metadata: expect.objectContaining({
        targetResourceType: 'access_request',
        targetResourceId: 'request-1',
        outcome: expect.objectContaining({ retryable: false }),
      }),
    }) }));
  });

  it.each(['pending_approval', 'declined', 'expired', 'canceled'])('does not execute from %s', async (status) => {
    vi.mocked(prisma.agentOperation.findFirst).mockResolvedValue({ id: 'op-1', agencyId: 'agency-1', grantId: 'grant-1', actionType: 'access_request.dispatch', riskClass: 'consequential', status, inputSnapshot: {} } as any);
    await expect(agentOperationService.execute({ principal, operationId: 'op-1', effect: vi.fn() })).rejects.toBeInstanceOf(AgentOperationStateError);
  });

  it('recovers a stale execution lease before retrying the idempotent effect', async () => {
    const operation: any = {
      id: 'op-stale', agencyId: 'agency-1', grantId: 'grant-1', actionType: 'access_request.dispatch',
      riskClass: 'consequential', status: 'executing', executionStartedAt: new Date(Date.now() - 11 * 60_000),
      expiresAt: new Date(Date.now() + 60_000), inputSnapshot: { clientId: 'client-1' },
    };
    vi.mocked(prisma.agentOperation.findFirst).mockResolvedValue(operation);
    vi.mocked(prisma.agentGrant.findFirst).mockResolvedValue({ id: 'grant-1', state: 'active', permissions: ['requests:dispatch'] } as any);
    vi.mocked(prisma.agentOperation.updateMany).mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 1 });
    vi.mocked(prisma.agentOperation.update).mockImplementation(async ({ data }: any) => ({ ...operation, ...data }));
    const effect = vi.fn().mockResolvedValue({ resourceType: 'access_request', resourceId: 'request-1', message: 'Sent', retryable: false, remediation: [] });

    const result = await agentOperationService.execute({ principal, operationId: operation.id, effect });

    expect(result.claimed).toBe(true);
    expect(effect).toHaveBeenCalledOnce();
    expect(prisma.agentOperation.updateMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ data: expect.objectContaining({ failureCode: 'STALE_EXECUTION' }) }));
  });

  it('never persists downstream error text in failure state or audit outcome', async () => {
    const operation: any = {
      id: 'op-failure', agencyId: 'agency-1', grantId: 'grant-1', actionType: 'access_request.dispatch',
      riskClass: 'consequential', status: 'approved', expiresAt: new Date(Date.now() + 60_000), inputSnapshot: {},
    };
    vi.mocked(prisma.agentOperation.findFirst).mockResolvedValue(operation);
    vi.mocked(prisma.agentGrant.findFirst).mockResolvedValue({ id: 'grant-1', state: 'active', permissions: ['requests:dispatch'] } as any);
    vi.mocked(prisma.agentOperation.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.agentOperation.update).mockImplementation(async ({ data }: any) => ({ ...operation, ...data }));

    const result: any = await agentOperationService.execute({
      principal,
      operationId: operation.id,
      effect: vi.fn().mockRejectedValue(new Error('accessToken=raw-secret client=private@example.com')),
    });

    const serialized = JSON.stringify({ result, auditCalls: vi.mocked(prisma.auditLog.create).mock.calls });
    expect(result.operation).toMatchObject({ status: 'failed_terminal', failureCode: 'EFFECT_FAILURE' });
    expect(serialized).not.toMatch(/raw-secret|private@example\.com/);
  });

  it('revalidates owner, agency, grant, permission, and expiry before approval', async () => {
    vi.mocked(prisma.agentOperation.findFirst).mockResolvedValue(null);
    await expect(agentOperationService.decide({ agencyId: 'agency-other', ownerSubject: 'attacker', operationId: 'op-1', decision: 'approved', requestMetadata: principal.requestMetadata })).rejects.toThrow(/not found/i);
  });
});
