/**
 * check-expired-requests job tests (U13)
 *
 * Same set of requests expired as the per-request loop did, but via one bulk
 * update, with every webhook still emitted exactly once.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const emitWebhookMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/prisma', () => ({
  prisma: {
    accessRequest: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('@/services/access-request.service', () => ({
  emitAccessRequestLifecycleWebhook: emitWebhookMock,
}));

import { checkExpiredRequests } from '../check-expired-requests';
import { prisma } from '@/lib/prisma';

describe('checkExpiredRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    emitWebhookMock.mockResolvedValue(undefined);
  });

  it('expires the same set of overdue requests in one bulk update and emits each webhook', async () => {
    vi.mocked(prisma.accessRequest.findMany).mockResolvedValue([
      { id: 'req-1', status: 'pending' },
      { id: 'req-2', status: 'pending' },
      { id: 'req-3', status: 'pending' },
    ] as any);
    vi.mocked(prisma.accessRequest.updateMany).mockResolvedValue({ count: 3 } as any);

    const result = await checkExpiredRequests();

    expect(result).toEqual({ expired: 3 });
    expect(prisma.accessRequest.update).not.toHaveBeenCalled();
    expect(prisma.accessRequest.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.accessRequest.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['req-1', 'req-2', 'req-3'] }, status: 'pending' },
      data: { status: 'expired' },
    });

    expect(emitWebhookMock).toHaveBeenCalledTimes(3);
    const emitted = emitWebhookMock.mock.calls.map(
      (call: any[]) => call[0].accessRequestId
    );
    expect(emitted.sort()).toEqual(['req-1', 'req-2', 'req-3']);
    for (const call of emitWebhookMock.mock.calls as any[]) {
      expect(call[0]).toMatchObject({ previousStatus: 'pending', nextStatus: 'expired' });
    }
  });

  it('returns zero and writes nothing when no requests are overdue', async () => {
    vi.mocked(prisma.accessRequest.findMany).mockResolvedValue([] as any);

    const result = await checkExpiredRequests();

    expect(result).toEqual({ expired: 0 });
    expect(prisma.accessRequest.updateMany).not.toHaveBeenCalled();
    expect(emitWebhookMock).not.toHaveBeenCalled();
  });
});
