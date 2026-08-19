import { prisma } from '@/lib/prisma.js';

const TERMINAL_RUN_STATUSES = new Set([
  'completed',
  'completed_with_manual_follow_up',
  'incomplete',
  'canceled',
]);

export const FROZEN_ITEM_STATUSES = new Set([
  'revoked_verified',
  'already_absent',
  'attestation_recorded',
  'failed_terminal',
]);

const SUCCESS_ITEM_STATUSES = new Set(['revoked_verified', 'already_absent']);

const VALID_TRANSITIONS: Record<string, Set<string>> = {
  prepared: new Set(['awaiting_approval', 'queued', 'canceled']),
  awaiting_approval: new Set(['queued', 'canceled']),
  queued: new Set(['executing']),
  executing: new Set(['receipt_pending', 'completed', 'completed_with_manual_follow_up', 'incomplete']),
  receipt_pending: new Set(['completed', 'completed_with_manual_follow_up', 'incomplete']),
};

const SENSITIVE_FIELDS = new Set([
  'accessToken',
  'refreshToken',
  'tokenSecretId',
  'secretId',
  'rawProviderResponse',
  'responseBody',
]);

function stripSensitive(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key)) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = stripSensitive(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export const clientOffboardingService = {
  async prepare(input: {
    agencyId: string;
    connectionId: string;
    idempotencyKey: string;
    intentHash: string;
  }) {
    try {
      const run = await prisma.$transaction(async (tx) => {
        const existingRun = await tx.googleOffboardingRun.findFirst({
          where: {
            idempotencyKey: input.idempotencyKey,
            status: { notIn: [...TERMINAL_RUN_STATUSES] },
          },
        });

        if (existingRun) return existingRun;

        const connection = await tx.clientConnection.findUnique({
          where: { id: input.connectionId },
        });

        if (!connection || connection.agencyId !== input.agencyId) {
          throw new Error('Connection not found or agency mismatch');
        }

        if (connection.status !== 'active') {
          throw new Error('Connection is not active');
        }

        const activeRunCount = await tx.googleOffboardingRun.count({
          where: {
            connectionId: input.connectionId,
            status: { notIn: [...TERMINAL_RUN_STATUSES] },
          },
        });

        if (activeRunCount > 0) {
          throw new Error('An active offboarding run already exists for this connection');
        }

        const sourceGrants = await tx.googleNativeGrant.findMany({
          where: { connectionId: input.connectionId },
        });

        const createdRun = await tx.googleOffboardingRun.create({
          data: {
            agencyId: input.agencyId,
            connectionId: input.connectionId,
            status: 'prepared',
            idempotencyKey: input.idempotencyKey,
            snapshotHash: input.intentHash,
          },
        });

        if (sourceGrants.length > 0) {
          await tx.googleOffboardingItem.createMany({
            data: sourceGrants.map((grant) => ({
              runId: createdRun.id,
              productId: (grant as Record<string, unknown>).product as string,
              classification: 'eligible_automatic',
              status: 'pending',
              assetLabel: `${(grant as Record<string, unknown>).product ?? 'unknown'}-${grant.id}`,
              grantId: grant.id,
            })),
          });
        }

        return createdRun;
      });

      return run;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const existingRun = await prisma.googleOffboardingRun.findFirst({
          where: {
            idempotencyKey: input.idempotencyKey,
            status: { notIn: [...TERMINAL_RUN_STATUSES] },
          },
        });
        if (existingRun) return existingRun;
      }
      throw error;
    }
  },

  async transition(input: {
    runId: string;
    to: string;
    actorId?: string;
  }) {
    const run = await prisma.googleOffboardingRun.findUnique({
      where: { id: input.runId },
    });

    if (!run) {
      throw new Error('Run not found');
    }

    if (TERMINAL_RUN_STATUSES.has(run.status)) {
      throw new Error(`Cannot transition a terminal run with status: ${run.status}`);
    }

    const allowedNext = VALID_TRANSITIONS[run.status];
    if (!allowedNext || !allowedNext.has(input.to)) {
      throw new Error(`Invalid transition from ${run.status} to ${input.to}`);
    }

    const updated = await prisma.googleOffboardingRun.update({
      where: { id: input.runId },
      data: {
        status: input.to,
        ...(input.to === 'canceled' ? { finalOutcome: 'canceled' } : {}),
        ...(input.actorId ? { approvedById: input.actorId, approvedAt: new Date() } : {}),
      },
    });

    return updated;
  },

  async getRun(input: { runId: string }) {
    const run = await prisma.googleOffboardingRun.findUnique({
      where: { id: input.runId },
      include: {
        items: {
          include: {
            grant: { select: { id: true, product: true, assetId: true, assetName: true } },
          },
        },
      },
    });

    if (!run) return null;

    return stripSensitive(run as unknown as Record<string, unknown>);
  },

  async getItemAttempts(input: { itemId: string; runId: string }) {
    const attempts = await prisma.googleOffboardingAttempt.findMany({
      where: { itemId: input.itemId, runId: input.runId },
      orderBy: { createdAt: 'asc' },
    });

    return attempts.map((a) => stripSensitive(a as unknown as Record<string, unknown>));
  },

  async updateItemStatus(input: {
    itemId: string;
    status: string;
    providerOutcome?: string;
    reason?: string;
  }) {
    return prisma.googleOffboardingItem.updateMany({
      where: { id: input.itemId, status: { notIn: [...FROZEN_ITEM_STATUSES] } },
      data: {
        status: input.status,
        ...(input.providerOutcome ? { providerOutcome: input.providerOutcome } : {}),
        ...(input.reason ? { reason: input.reason } : {}),
      },
    });
  },

  async addAttempt(input: {
    itemId: string;
    runId: string;
    action: string;
    providerOutcome?: string;
    requestId?: string;
    responseClassification?: string;
    errorCode?: string;
    errorMessage?: string;
  }) {
    return prisma.googleOffboardingAttempt.create({
      data: {
        itemId: input.itemId,
        runId: input.runId,
        action: input.action,
        ...(input.providerOutcome ? { providerOutcome: input.providerOutcome } : {}),
        ...(input.requestId ? { requestId: input.requestId } : {}),
        ...(input.responseClassification ? { responseClassification: input.responseClassification } : {}),
        ...(input.errorCode ? { errorCode: input.errorCode } : {}),
        ...(input.errorMessage ? { errorMessage: input.errorMessage } : {}),
      },
    });
  },

  async deriveRunStatus(input: { runId: string; assumeStatus?: string }) {
    let currentStatus = input.assumeStatus;

    if (!currentStatus) {
      const run = await prisma.googleOffboardingRun.findUnique({
        where: { id: input.runId },
        select: { status: true },
      });

      if (!run) throw new Error('Run not found');
      currentStatus = run.status;
    }

    const allowed = new Set(['executing', 'receipt_pending']);
    if (!allowed.has(currentStatus)) {
      throw new Error(`deriveRunStatus is only allowed from 'executing' or 'receipt_pending' (current: ${currentStatus})`);
    }

    const items = await prisma.googleOffboardingItem.findMany({
      where: { runId: input.runId },
    });

    let status: string;

    if (items.length === 0) {
      status = 'incomplete';
    } else {
      const hasRetryableFailure = items.some((i) => i.status === 'failed_retryable');
      const hasTerminalFailure = items.some((i) => i.status === 'failed_terminal');

      if (hasRetryableFailure || hasTerminalFailure) {
        status = 'incomplete';
      } else {
        const allSuccess = items.every((i) => SUCCESS_ITEM_STATUSES.has(i.status));
        if (allSuccess) {
          status = 'completed';
        } else {
          const allAutomaticResolved = items
            .filter((i) => i.classification === 'eligible_automatic')
            .every((i) => SUCCESS_ITEM_STATUSES.has(i.status));
          status = allAutomaticResolved ? 'completed_with_manual_follow_up' : 'incomplete';
        }
      }
    }

    await prisma.googleOffboardingRun.update({
      where: { id: input.runId },
      data: { status },
    });

    return status;
  },

  async updateItemSnapshot(input: {
    itemId: string;
    productId: string;
    classification: string;
  }) {
    const item = await prisma.googleOffboardingItem.findFirst({
      where: { id: input.itemId },
    });

    if (!item) {
      throw new Error('Item not found');
    }

    if (FROZEN_ITEM_STATUSES.has(item.status)) {
      throw new Error('Item snapshot is immutable: item is in a frozen/terminal state');
    }

    return prisma.googleOffboardingItem.updateMany({
      where: { id: input.itemId },
      data: {
        productId: input.productId,
        classification: input.classification,
      },
    });
  },

  async serializeReceipt(input: { runId: string }) {
    const run = await prisma.googleOffboardingRun.findUnique({
      where: { id: input.runId },
    });

    if (!run) throw new Error('Run not found');

    const [items, attempts] = await Promise.all([
      prisma.googleOffboardingItem.findMany({
        where: { runId: input.runId },
      }),
      prisma.googleOffboardingAttempt.findMany({
        where: { runId: input.runId },
      }),
    ]);

    const sanitizedRun = stripSensitive(run as unknown as Record<string, unknown>);
    const sanitizedItems = items.map((i) => stripSensitive(i as unknown as Record<string, unknown>));
    const sanitizedAttempts = attempts.map((a) => stripSensitive(a as unknown as Record<string, unknown>));

    return {
      run: sanitizedRun,
      items: sanitizedItems,
      attempts: sanitizedAttempts,
    };
  },

  async confirmRun(input: { runId: string; actorId: string }) {
    return this.transition({
      runId: input.runId,
      to: 'awaiting_approval',
      actorId: input.actorId,
    });
  },

  async deriveRunOutcome(input: { runId: string }) {
    const status = await this.deriveRunStatus(input);

    await prisma.googleOffboardingRun.update({
      where: { id: input.runId },
      data: { finalOutcome: status },
    });

    return status;
  },
};
