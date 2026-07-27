import { prisma } from '@/lib/prisma.js';
import { Prisma } from '@prisma/client';

const terminalStatuses = ['succeeded', 'failed_terminal', 'declined', 'expired', 'canceled'];

export const agentOperationRetentionService = {
  async sanitizeExpiredSnapshots({ olderThanDays = 90 }: { olderThanDays?: number } = {}) {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const result = await prisma.agentOperation.updateMany({
      where: { status: { in: terminalStatuses }, completedAt: { lt: cutoff } },
      data: { inputSnapshot: {}, approvalPreview: Prisma.DbNull, failureMessage: null },
    });
    return { sanitized: result.count, cutoff };
  },
};
