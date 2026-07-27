import { env } from '@/lib/env.js';
import { prisma } from '@/lib/prisma.js';

type BudgetClass = 'read' | 'mutation';

function actionFor(budgetClass: BudgetClass) {
  return budgetClass === 'read' ? 'AGENT_RATE_BUDGET_READ' : 'AGENT_RATE_BUDGET_MUTATION';
}

export const agentRateLimitService = {
  async checkAndConsume(input: {
    agencyId: string;
    grantId: string;
    oauthClientId: string;
    budgetClass: BudgetClass;
  }) {
    const windowSeconds = env.AGENT_RATE_LIMIT_WINDOW_SECONDS;
    const windowStart = new Date(Date.now() - windowSeconds * 1000);
    const grantLimit = input.budgetClass === 'read' ? env.AGENT_READ_RATE_LIMIT : env.AGENT_MUTATION_RATE_LIMIT;
    const action = actionFor(input.budgetClass);
    return prisma.$transaction(async (transaction) => {
      const lockKeys = [`agency:${input.agencyId}`, `grant:${input.grantId}`].sort();
      for (const lockKey of lockKeys) {
        await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
      }
      const [grantCount, agencyCount] = await Promise.all([
        transaction.auditLog.count({ where: { agentGrantId: input.grantId, action, createdAt: { gte: windowStart } } }),
        transaction.auditLog.count({ where: { agencyId: input.agencyId, action: { in: ['AGENT_RATE_BUDGET_READ', 'AGENT_RATE_BUDGET_MUTATION'] }, createdAt: { gte: windowStart } } }),
      ]);
      if (grantCount >= grantLimit || agencyCount >= env.AGENT_AGENCY_RATE_LIMIT) {
        return { allowed: false as const, retryAfterSeconds: windowSeconds };
      }
      await transaction.auditLog.create({
        data: {
          agencyId: input.agencyId,
          action,
          resourceType: 'agent_rate_budget',
          resourceId: input.grantId,
          actorType: 'agent',
          agentGrantId: input.grantId,
          oauthClientId: input.oauthClientId,
          metadata: { budgetClass: input.budgetClass },
        },
      });
      return {
        allowed: true as const,
        remaining: Math.min(grantLimit - grantCount - 1, env.AGENT_AGENCY_RATE_LIMIT - agencyCount - 1),
        retryAfterSeconds: 0,
      };
    });
  },
};
