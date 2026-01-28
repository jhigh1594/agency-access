/**
 * Clerk Metadata Sync Job Tests
 *
 * Test-Driven Development for syncing usage counters to Clerk metadata.
 * Following Red-Green-Refactor cycle.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncAllAgencyMetadata } from '../sync-clerk-metadata';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    agency: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/services/clerk-metadata.service', () => ({
  clerkMetadataService: {
    syncQuotaUsage: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { clerkMetadataService } from '@/services/clerk-metadata.service';

describe('Clerk Metadata Sync Job - TDD Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock responses
    (prisma.agency.findMany as any).mockResolvedValue([
      {
        id: 'agency-1',
        clerkUserId: 'clerk_1',
      },
      {
        id: 'agency-2',
        clerkUserId: 'clerk_2',
      },
    ]);

    (clerkMetadataService.syncQuotaUsage as any).mockResolvedValue({
      data: { synced: true },
      error: null,
    });
  });

  describe('syncAllAgencyMetadata', () => {
    it('should fetch all agencies with clerk user IDs', async () => {
      await syncAllAgencyMetadata();

      expect(prisma.agency.findMany).toHaveBeenCalledWith({
        where: { clerkUserId: { not: null } },
        select: { id: true, clerkUserId: true },
        take: 100,
      });
    });

    it('should sync quota usage for each agency', async () => {
      await syncAllAgencyMetadata();

      expect(clerkMetadataService.syncQuotaUsage).toHaveBeenCalledWith('clerk_1', 'agency-1');
      expect(clerkMetadataService.syncQuotaUsage).toHaveBeenCalledWith('clerk_2', 'agency-2');
    });

    it('should return success and failure counts', async () => {
      (clerkMetadataService.syncQuotaUsage as any)
        .mockResolvedValueOnce({ data: { synced: true }, error: null })
        .mockRejectedValueOnce(new Error('Sync failed'));

      const result = await syncAllAgencyMetadata();

      expect(result).toEqual({ success: 1, failed: 1 });
    });

    it('should limit to 100 agencies per run', async () => {
      await syncAllAgencyMetadata();

      expect(prisma.agency.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('should handle agencies without clerk user IDs', async () => {
      (prisma.agency.findMany as any).mockResolvedValue([
        { id: 'agency-1', clerkUserId: null },
        { id: 'agency-2', clerkUserId: 'clerk_2' },
      ]);

      const result = await syncAllAgencyMetadata();

      // Should skip null clerkUserId
      expect(clerkMetadataService.syncQuotaUsage).toHaveBeenCalledTimes(1);
      expect(clerkMetadataService.syncQuotaUsage).toHaveBeenCalledWith('clerk_2', 'agency-2');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (prisma.agency.findMany as any).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(syncAllAgencyMetadata()).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should continue processing other agencies if one fails', async () => {
      (clerkMetadataService.syncQuotaUsage as any)
        .mockResolvedValueOnce({ data: { synced: true }, error: null })
        .mockRejectedValueOnce(new Error('Clerk API error'))
        .mockResolvedValueOnce({ data: { synced: true }, error: null });

      (prisma.agency.findMany as any).mockResolvedValue([
        { id: 'agency-1', clerkUserId: 'clerk_1' },
        { id: 'agency-2', clerkUserId: 'clerk_2' },
        { id: 'agency-3', clerkUserId: 'clerk_3' },
      ]);

      const result = await syncAllAgencyMetadata();

      expect(result.success).toBe(2);
      expect(result.failed).toBe(1);
    });

    it('should handle empty agency list', async () => {
      (prisma.agency.findMany as any).mockResolvedValue([]);

      const result = await syncAllAgencyMetadata();

      expect(result).toEqual({ success: 0, failed: 0 });
      expect(clerkMetadataService.syncQuotaUsage).not.toHaveBeenCalled();
    });

    it('should handle Clerk service errors per agency', async () => {
      (clerkMetadataService.syncQuotaUsage as any).mockResolvedValue({
        data: null,
        error: { code: 'CLERK_FETCH_FAILED', message: 'User not found' },
      });

      const result = await syncAllAgencyMetadata();

      expect(result.failed).toBe(2);
      expect(result.success).toBe(0);
    });
  });

});

