import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryRawMock } = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: queryRawMock,
  },
}));

import { getDashboardStats } from '@/services/connection-aggregation.service';

describe('connection-aggregation.service', () => {
  beforeEach(() => {
    queryRawMock.mockReset();
  });

  it('maps dashboard stats from a single raw query result', async () => {
    queryRawMock.mockResolvedValue([
      {
        total_requests: 12,
        pending_requests: 3,
        active_connections: 5,
        total_platforms: 8,
      },
    ]);

    const result = await getDashboardStats('agency-1');

    expect(result).toEqual({
      data: {
        totalRequests: 12,
        pendingRequests: 3,
        activeConnections: 5,
        totalPlatforms: 8,
      },
      error: null,
    });
    expect(queryRawMock).toHaveBeenCalledOnce();
  });
});
