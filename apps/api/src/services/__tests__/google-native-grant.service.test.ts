import { beforeEach, describe, expect, it, vi } from 'vitest';
import { googleNativeGrantService } from '../google-native-grant.service.js';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    googleNativeGrant: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('GoogleNativeGrantService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('upserts one per-asset native grant record keyed by connection/product/asset/mode', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.googleNativeGrant.upsert as any).mockResolvedValue({
      id: 'grant-1',
      accessRequestId: 'request-1',
      connectionId: 'connection-1',
      product: 'google_ads',
      assetId: 'customers/123',
      assetName: 'Main Account',
      grantMode: 'manager_link',
      requestedRole: 'ADMIN',
      managerCustomerId: '6449142979',
      nativeGrantState: 'pending',
      metadata: { source: 'test' },
    });

    const result = await googleNativeGrantService.upsertGrant({
      accessRequestId: 'request-1',
      connectionId: 'connection-1',
      product: 'google_ads',
      assetId: 'customers/123',
      assetName: 'Main Account',
      grantMode: 'manager_link',
      requestedRole: 'ADMIN',
      managerCustomerId: '6449142979',
      nativeGrantState: 'pending',
      metadata: { source: 'test' },
    });

    expect(result.error).toBeNull();
    expect(prisma.googleNativeGrant.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          connectionId_product_assetId_grantMode: {
            connectionId: 'connection-1',
            product: 'google_ads',
            assetId: 'customers/123',
            grantMode: 'manager_link',
          },
        },
        create: expect.objectContaining({
          accessRequestId: 'request-1',
          connectionId: 'connection-1',
          product: 'google_ads',
          assetId: 'customers/123',
          assetName: 'Main Account',
          grantMode: 'manager_link',
          requestedRole: 'ADMIN',
          managerCustomerId: '6449142979',
          nativeGrantState: 'pending',
          metadata: { source: 'test' },
        }),
        update: expect.objectContaining({
          assetName: 'Main Account',
          requestedRole: 'ADMIN',
          managerCustomerId: '6449142979',
          nativeGrantState: 'pending',
          metadata: { source: 'test' },
        }),
      })
    );
  });

  it('lists grant records for request detail reads in stable newest-first order', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.googleNativeGrant.findMany as any).mockResolvedValue([
      { id: 'grant-2', accessRequestId: 'request-1', createdAt: new Date('2026-03-15T12:00:00Z') },
      { id: 'grant-1', accessRequestId: 'request-1', createdAt: new Date('2026-03-15T11:00:00Z') },
    ]);

    const result = await googleNativeGrantService.listByAccessRequest('request-1');

    expect(result.error).toBeNull();
    expect(prisma.googleNativeGrant.findMany).toHaveBeenCalledWith({
      where: { accessRequestId: 'request-1' },
      orderBy: [{ createdAt: 'desc' }],
    });
    expect(result.data?.map((grant: any) => grant.id)).toEqual(['grant-2', 'grant-1']);
  });

  it('updates reconciliation state and verification timestamps without replacing the whole record', async () => {
    const { prisma } = await import('@/lib/prisma');
    const verifiedAt = new Date('2026-03-15T12:34:56.000Z');

    vi.mocked(prisma.googleNativeGrant.update as any).mockResolvedValue({
      id: 'grant-1',
      nativeGrantState: 'verified',
      verifiedAt,
      providerResourceName: 'customers/123/customerClientLinks/456',
    });

    const result = await googleNativeGrantService.updateGrantState('grant-1', {
      nativeGrantState: 'verified',
      verifiedAt,
      providerResourceName: 'customers/123/customerClientLinks/456',
    });

    expect(result.error).toBeNull();
    expect(prisma.googleNativeGrant.update).toHaveBeenCalledWith({
      where: { id: 'grant-1' },
      data: {
        nativeGrantState: 'verified',
        verifiedAt,
        providerResourceName: 'customers/123/customerClientLinks/456',
      },
    });
  });
});
