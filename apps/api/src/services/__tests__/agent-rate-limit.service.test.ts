import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma.js';
import { agentRateLimitService } from '@/services/agent-rate-limit.service.js';

vi.mock('@/lib/prisma.js', () => ({ prisma: { $transaction: vi.fn(), $executeRaw: vi.fn(), auditLog: { count: vi.fn(), create: vi.fn() } } }));
vi.mock('@/lib/env.js', () => ({ env: { AGENT_READ_RATE_LIMIT: 2, AGENT_MUTATION_RATE_LIMIT: 1, AGENT_AGENCY_RATE_LIMIT: 3, AGENT_RATE_LIMIT_WINDOW_SECONDS: 60 } }));

describe('agentRateLimitService', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => callback(prisma)); });

  it('consumes separate per-grant read and mutation budgets plus an agency budget', async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const result = await agentRateLimitService.checkAndConsume({ agencyId: 'agency-1', grantId: 'grant-1', oauthClientId: 'oauth-1', budgetClass: 'read' });
    expect(result.allowed).toBe(true);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ agencyId: 'agency-1', agentGrantId: 'grant-1', action: 'AGENT_RATE_BUDGET_READ' }) }));
  });

  it('denies without consuming when either budget is exhausted', async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    const result = await agentRateLimitService.checkAndConsume({ agencyId: 'agency-1', grantId: 'grant-1', oauthClientId: 'oauth-1', budgetClass: 'mutation' });
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });
});
