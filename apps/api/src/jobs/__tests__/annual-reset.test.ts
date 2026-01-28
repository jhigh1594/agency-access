/**
 * Annual Reset Job Tests
 *
 * Test-Driven Development for annual usage counter reset job.
 * Following Red-Green-Refactor cycle.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { checkAndResetAnnualCounters } from '../annual-reset';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    agencyUsageCounter: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Annual Reset Job - TDD Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAndResetAnnualCounters', () => {
    it('should find counters with past reset dates', async () => {
      const now = new Date('2024-01-15T00:00:00.000Z');
      vi.setSystemTime(now);

      (prisma.agencyUsageCounter.findMany as any).mockResolvedValue([
        {
          id: 'counter-1',
          agencyId: 'agency-1',
          metricType: 'client_onboards',
          period: 'current_year',
        },
        {
          id: 'counter-2',
          agencyId: 'agency-2',
          metricType: 'platform_audits',
          period: 'current_year',
        },
      ]);

      (prisma.agencyUsageCounter.update as any).mockResolvedValue({});

      await checkAndResetAnnualCounters();

      expect(prisma.agencyUsageCounter.findMany).toHaveBeenCalledWith({
        where: {
          period: 'current_year',
          resetAt: { lte: now },
        },
        select: {
          agencyId: true,
          metricType: true,
          period: true,
        },
      });
    });

    it('should reset counters to zero and update reset date', async () => {
      const now = new Date('2024-01-01T00:00:00.000Z');
      vi.setSystemTime(now);

      (prisma.agencyUsageCounter.findMany as any).mockResolvedValue([
        {
          agencyId: 'agency-1',
          metricType: 'client_onboards',
          period: 'current_year',
        },
      ]);

      (prisma.agencyUsageCounter.update as any).mockResolvedValue({});

      await checkAndResetAnnualCounters();

      expect(prisma.agencyUsageCounter.update).toHaveBeenCalledWith({
        where: {
          agencyId_metricType_period: {
            agencyId: 'agency-1',
            metricType: 'client_onboards',
            period: 'current_year',
          },
        },
        data: {
          count: 0,
          resetAt: new Date('2025-01-01T00:00:00.000Z'),
        },
      });
    });

    it('should handle multiple counters concurrently', async () => {
      const now = new Date('2024-01-15T00:00:00.000Z');
      vi.setSystemTime(now);

      (prisma.agencyUsageCounter.findMany as any).mockResolvedValue([
        { agencyId: 'agency-1', metricType: 'client_onboards', period: 'current_year' },
        { agencyId: 'agency-1', metricType: 'platform_audits', period: 'current_year' },
        { agencyId: 'agency-2', metricType: 'client_onboards', period: 'current_year' },
      ]);

      (prisma.agencyUsageCounter.update as any).mockResolvedValue({});

      const result = await checkAndResetAnnualCounters();

      expect(result.reset).toBe(3);
      expect(prisma.agencyUsageCounter.update).toHaveBeenCalledTimes(3);
    });

    it('should return reset count in result', async () => {
      const now = new Date('2024-01-01T00:00:00.000Z');
      vi.setSystemTime(now);

      (prisma.agencyUsageCounter.findMany as any).mockResolvedValue([
        { agencyId: 'agency-1', metricType: 'client_onboards', period: 'current_year' },
        { agencyId: 'agency-2', metricType: 'platform_audits', period: 'current_year' },
      ]);

      (prisma.agencyUsageCounter.update as any).mockResolvedValue({});

      const result = await checkAndResetAnnualCounters();

      expect(result).toEqual({ reset: 2 });
    });

    it('should handle empty results gracefully', async () => {
      const now = new Date('2024-01-01T00:00:00.000Z');
      vi.setSystemTime(now);

      (prisma.agencyUsageCounter.findMany as any).mockResolvedValue([]);

      const result = await checkAndResetAnnualCounters();

      expect(result).toEqual({ reset: 0 });
      expect(prisma.agencyUsageCounter.update).not.toHaveBeenCalled();
    });

    it('should calculate next reset date as next year January 1st', async () => {
      const now = new Date('2024-12-31T23:59:59.000Z');
      vi.setSystemTime(now);

      (prisma.agencyUsageCounter.findMany as any).mockResolvedValue([
        { agencyId: 'agency-1', metricType: 'client_onboards', period: 'current_year' },
      ]);

      (prisma.agencyUsageCounter.update as any).mockResolvedValue({});

      await checkAndResetAnnualCounters();

      expect(prisma.agencyUsageCounter.update).toHaveBeenCalledWith({
        where: expect.anything(),
        data: expect.objectContaining({
          resetAt: new Date('2025-01-01T00:00:00.000Z'),
        }),
      });
    });

    it('should skip all_time period counters', async () => {
      const now = new Date('2024-01-01T00:00:00.000Z');
      vi.setSystemTime(now);

      (prisma.agencyUsageCounter.findMany as any).mockResolvedValue([
        { agencyId: 'agency-1', metricType: 'team_seats', period: 'all_time' },
      ]);

      (prisma.agencyUsageCounter.update as any).mockResolvedValue({});

      const result = await checkAndResetAnnualCounters();

      // Should not reset all_time counters
      expect(result).toEqual({ reset: 0 });
      expect(prisma.agencyUsageCounter.update).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle database errors gracefully', async () => {
      const now = new Date('2024-01-01T00:00:00.000Z');
      vi.setSystemTime(now);

      (prisma.agencyUsageCounter.findMany as any).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(checkAndResetAnnualCounters()).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle leap years correctly', async () => {
      const now = new Date('2024-02-29T00:00:00.000Z'); // Leap year
      vi.setSystemTime(now);

      (prisma.agencyUsageCounter.findMany as any).mockResolvedValue([
        { agencyId: 'agency-1', metricType: 'client_onboards', period: 'current_year' },
      ]);

      (prisma.agencyUsageCounter.update as any).mockResolvedValue({});

      await checkAndResetAnnualCounters();

      expect(prisma.agencyUsageCounter.update).toHaveBeenCalledWith({
        where: expect.anything(),
        data: expect.objectContaining({
          resetAt: new Date('2025-01-01T00:00:00.000Z'),
        }),
      });
    });

    it('should only reset counters with past resetAt dates', async () => {
      const now = new Date('2024-06-01T00:00:00.000Z');
      const futureReset = new Date('2024-12-31T23:59:59.000Z');
      vi.setSystemTime(now);

      (prisma.agencyUsageCounter.findMany as any).mockResolvedValue([
        { agencyId: 'agency-1', metricType: 'client_onboards', period: 'current_year', resetAt: futureReset },
        { agencyId: 'agency-2', metricType: 'platform_audits', period: 'current_year', resetAt: now },
      ]);

      (prisma.agencyUsageCounter.update as any).mockResolvedValue({});

      await checkAndResetAnnualCounters();

      expect(prisma.agencyUsageCounter.findMany).toHaveBeenCalledWith({
        where: {
          period: 'current_year',
          resetAt: { lte: now },
        },
        select: {
          agencyId: true,
          metricType: true,
          period: true,
        },
      });
    });
  });
});
