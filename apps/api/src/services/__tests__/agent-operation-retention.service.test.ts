import { describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma.js';
import { agentOperationRetentionService } from '@/services/agent-operation-retention.service.js';
import { Prisma } from '@prisma/client';

vi.mock('@/lib/prisma.js', () => ({ prisma: { agentOperation: { updateMany: vi.fn() } } }));

describe('agentOperationRetentionService', () => {
  it('removes old snapshots while preserving operation and audit records', async () => {
    vi.mocked(prisma.agentOperation.updateMany).mockResolvedValue({ count: 3 });
    await expect(agentOperationRetentionService.sanitizeExpiredSnapshots({ olderThanDays: 90 })).resolves.toMatchObject({ sanitized: 3 });
    expect(prisma.agentOperation.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: { in: expect.arrayContaining(['succeeded', 'expired', 'canceled']) } }),
      data: { inputSnapshot: {}, approvalPreview: Prisma.DbNull, failureMessage: null },
    }));
  });
});
