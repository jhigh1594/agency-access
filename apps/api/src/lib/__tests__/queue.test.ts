import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { auditService } from '@/services/audit.service';
import { refreshClientPlatformAuthorization } from '@/services/token-lifecycle.service';
import { webhookDeliveryService } from '@/services/webhook-delivery.service';
import {
  processExpiringTokens,
  queueWebhookDelivery,
  startWebhookDeliveryWorker,
  startTokenRefreshWorker,
  WEBHOOK_DELIVERY_JOB,
  TOKEN_REFRESH_JOB,
} from '@/lib/queue';

const { queueAddMock, workerProcessors } = vi.hoisted(() => ({
  queueAddMock: vi.fn(),
  workerProcessors: new Map<string, (job: any) => Promise<any>>(),
}));

vi.mock('bullmq', () => ({
  Queue: class MockQueue {
    add = queueAddMock;
    on = vi.fn();
  },
  Worker: class MockWorker {
    on = vi.fn();

    constructor(name: string, processor: (job: any) => Promise<any>) {
      workerProcessors.set(name, processor);
    }
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

vi.mock('@/services/audit.service', () => ({
  auditService: {
    createAuditLog: vi.fn(),
  },
}));

vi.mock('@/services/access-request.service', () => ({
  accessRequestService: {
    deleteExpiredRequests: vi.fn(),
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

describe('queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    workerProcessors.clear();
  });

  it('queues refresh jobs only for automatic-refresh OAuth platforms', async () => {
    vi.mocked(prisma.platformAuthorization.findMany).mockResolvedValue([
      {
        connectionId: 'conn-google',
        platform: 'google_ads',
      },
      {
        connectionId: 'conn-meta',
        platform: 'meta_ads',
      },
      {
        connectionId: 'conn-klaviyo',
        platform: 'klaviyo',
      },
    ] as any);

    const result = await processExpiringTokens();

    expect(result).toEqual({ queued: 1 });
    expect(queueAddMock).toHaveBeenCalledTimes(1);
    expect(queueAddMock).toHaveBeenCalledWith(
      TOKEN_REFRESH_JOB,
      { connectionId: 'conn-google', platform: 'google_ads' },
      expect.objectContaining({
        jobId: 'refresh-conn-google-google_ads',
      })
    );
  });

  it('refresh worker delegates refresh jobs to the lifecycle service', async () => {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    vi.mocked(prisma.platformAuthorization.findFirst).mockResolvedValue({
      id: 'auth-1',
      connectionId: 'conn-1',
      platform: 'google_ads',
      status: 'active',
      connection: {
        agencyId: 'agency-1',
        clientEmail: 'client@example.com',
      },
    } as any);
    vi.mocked(refreshClientPlatformAuthorization).mockResolvedValue({
      data: {
        outcome: 'refreshed',
        accessToken: 'new-access-token',
        expiresAt,
      },
      error: null,
    });
    vi.mocked(auditService.createAuditLog).mockResolvedValue({ data: {}, error: null } as any);

    await startTokenRefreshWorker();
    const processor = workerProcessors.get('token-refresh');

    expect(processor).toBeTypeOf('function');

    const result = await processor!({
      name: TOKEN_REFRESH_JOB,
      id: 'job-1',
      data: {
        connectionId: 'conn-1',
        platform: 'google_ads',
      },
    });

    expect(result).toEqual({ success: true, expiresAt });
    expect(refreshClientPlatformAuthorization).toHaveBeenCalledWith('conn-1', 'google_ads');
    expect(auditService.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REFRESHED',
        resourceId: 'conn-1',
      })
    );
  });

  it('queues outbound webhook deliveries with bounded retry settings', async () => {
    await queueWebhookDelivery('event-1');

    expect(queueAddMock).toHaveBeenCalledWith(
      WEBHOOK_DELIVERY_JOB,
      { eventId: 'event-1' },
      expect.objectContaining({
        jobId: 'webhook-event-1',
        attempts: expect.any(Number),
        backoff: expect.objectContaining({
          type: 'exponential',
        }),
      })
    );
  });

  it('webhook delivery worker delegates delivery jobs to the webhook delivery service', async () => {
    vi.mocked(webhookDeliveryService.deliverWebhookEvent).mockResolvedValue({
      data: {
        deliveryId: 'delivery-1',
        retryable: false,
      },
      error: null,
    } as any);

    await startWebhookDeliveryWorker();
    const processor = workerProcessors.get('webhook-delivery');

    expect(processor).toBeTypeOf('function');

    const result = await processor!({
      name: WEBHOOK_DELIVERY_JOB,
      attemptsMade: 0,
      data: {
        eventId: 'event-1',
      },
    });

    expect(result).toEqual({
      success: true,
      deliveryId: 'delivery-1',
    });
    expect(webhookDeliveryService.deliverWebhookEvent).toHaveBeenCalledWith({
      eventId: 'event-1',
      attemptNumber: 1,
    });
  });

  it('webhook delivery worker throws on retryable delivery failures so BullMQ retries the job', async () => {
    vi.mocked(webhookDeliveryService.deliverWebhookEvent).mockResolvedValue({
      data: {
        deliveryId: 'delivery-1',
        retryable: true,
      },
      error: {
        code: 'DELIVERY_FAILED',
        message: 'Endpoint temporarily unavailable',
      },
    } as any);

    await startWebhookDeliveryWorker();
    const processor = workerProcessors.get('webhook-delivery');

    await expect(
      processor!({
        name: WEBHOOK_DELIVERY_JOB,
        attemptsMade: 1,
        data: {
          eventId: 'event-1',
        },
      })
    ).rejects.toThrow('Endpoint temporarily unavailable');
  });
});
