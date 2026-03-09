import { describe, expect, it, vi } from 'vitest';

const {
  queueInstances,
  workerInstances,
} = vi.hoisted(() => ({
  queueInstances: [] as Array<{
    name: string;
    handlers: Map<string, (...args: unknown[]) => void>;
  }>,
  workerInstances: [] as Array<{
    name: string;
    handlers: Map<string, (...args: unknown[]) => void>;
  }>,
}));

vi.mock('bullmq', () => ({
  Queue: class MockQueue {
    handlers = new Map<string, (...args: unknown[]) => void>();

    constructor(name: string) {
      queueInstances.push({ name, handlers: this.handlers });
    }

    add = vi.fn();

    on = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      this.handlers.set(event, handler);
      return this;
    });
  },
  Worker: class MockWorker {
    handlers = new Map<string, (...args: unknown[]) => void>();

    constructor(name: string) {
      workerInstances.push({ name, handlers: this.handlers });
    }

    on = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      this.handlers.set(event, handler);
      return this;
    });
  },
}));

vi.mock('@/services/access-request.service', () => ({
  accessRequestService: {
    deleteExpiredRequests: vi.fn(),
  },
}));

vi.mock('@/services/audit.service', () => ({
  auditService: {
    createAuditLog: vi.fn(),
  },
}));

vi.mock('@/services/token-lifecycle.service', () => ({
  refreshClientPlatformAuthorization: vi.fn(),
}));

vi.mock('@/services/webhook-delivery.service', () => ({
  webhookDeliveryService: {
    deliverWebhookEvent: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    platformAuthorization: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

describe('queue runtime safety', () => {
  it('registers error handlers on BullMQ queues and workers', async () => {
    const queueModule = await import('@/lib/queue');

    expect(queueInstances.length).toBeGreaterThan(0);
    expect(
      queueInstances.every(queue => queue.handlers.has('error'))
    ).toBe(true);

    await queueModule.startTokenRefreshWorker();
    await queueModule.startWebhookDeliveryWorker();

    expect(workerInstances.length).toBeGreaterThan(0);
    expect(
      workerInstances.every(worker => worker.handlers.has('error'))
    ).toBe(true);
  });
});
