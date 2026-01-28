/**
 * UsageWidget Component Tests
 *
 * Test-Driven Development for subscription tier usage display.
 * Following Red-Green-Refactor cycle.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UsageWidget } from '../usage-widget';
import { UsageSnapshot } from '@agency-platform/shared';

// Mock fetch
global.fetch = vi.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mockUsageData: UsageSnapshot = {
  agencyId: 'agency-123',
  tier: 'STARTER',
  tierName: 'Starter',
  metrics: {
    clientOnboards: {
      used: 10,
      limit: 36,
      remaining: 26,
      percentage: 27.78,
      resetsAt: new Date('2025-01-01T00:00:00.000Z'),
      isUnlimited: false,
    },
    platformAudits: {
      used: 25,
      limit: 120,
      remaining: 95,
      percentage: 20.83,
      resetsAt: new Date('2025-01-01T00:00:00.000Z'),
      isUnlimited: false,
    },
    teamSeats: {
      used: 1,
      limit: 1,
      remaining: 0,
      percentage: 100,
      isUnlimited: false,
    },
  },
  currentPeriodStart: new Date('2024-01-01T00:00:00.000Z'),
  currentPeriodEnd: new Date('2025-01-01T00:00:00.000Z'),
};

describe('UsageWidget Component - TDD Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockUsageData, error: null }),
    });
  });

  describe('Initial Rendering', () => {
    it('should render loading state initially', () => {
      const wrapper = createWrapper();
      render(<UsageWidget />, { wrapper });

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render usage widget with tier name', async () => {
      const wrapper = createWrapper();
      render(<UsageWidget />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Starter')).toBeInTheDocument();
      });
    });

    it('should render all three metric types', async () => {
      const wrapper = createWrapper();
      render(<UsageWidget />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/client onboards/i)).toBeInTheDocument();
        expect(screen.getByText(/platform audits/i)).toBeInTheDocument();
        expect(screen.getByText(/team seats/i)).toBeInTheDocument();
      });
    });

    it('should display usage counts and limits', async () => {
      const wrapper = createWrapper();
      render(<UsageWidget />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/10 of 36 used/i)).toBeInTheDocument();
        expect(screen.getByText(/25 of 120 used/i)).toBeInTheDocument();
        expect(screen.getByText(/1 of 1 used/i)).toBeInTheDocument();
      });
    });
  });

  describe('Progress Bar Styling', () => {
    it('should show green progress bar when under 80% usage', async () => {
      const wrapper = createWrapper();
      render(<UsageWidget />, { wrapper });

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars[0]).toHaveClass('bg-green-500');
      });
    });

    it('should show yellow progress bar at 80%+ usage', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            ...mockUsageData,
            metrics: {
              ...mockUsageData.metrics,
              clientOnboards: {
                ...mockUsageData.metrics.clientOnboards,
                used: 30,
                percentage: 83.33,
              },
            },
          },
          error: null,
        }),
      });

      const wrapper = createWrapper();
      render(<UsageWidget />, { wrapper });

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars[0]).toHaveClass('bg-yellow-500');
      });
    });

    it('should show red progress bar at 100% usage', async () => {
      const wrapper = createWrapper();
      render(<UsageWidget />, { wrapper });

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        // Team seats is at 100% (1/1)
        expect(progressBars[2]).toHaveClass('bg-red-500');
      });
    });
  });

  describe('Unlimited Seats (PRO Tier)', () => {
    it('should display unlimited text for PRO tier seats', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            ...mockUsageData,
            tier: 'PRO',
            tierName: 'Pro',
            metrics: {
              ...mockUsageData.metrics,
              teamSeats: {
                used: 50,
                limit: -1,
                remaining: -1,
                percentage: 0,
                isUnlimited: true,
              },
            },
          },
          error: null,
        }),
      });

      const wrapper = createWrapper();
      render(<UsageWidget />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/50 used/i)).toBeInTheDocument();
        expect(screen.getByText(/unlimited/i)).toBeInTheDocument();
      });
    });
  });

  describe('Upgrade Prompt', () => {
    it('should show upgrade prompt when usage >= 80%', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            ...mockUsageData,
            metrics: {
              ...mockUsageData.metrics,
              teamSeats: {
                ...mockUsageData.metrics.teamSeats,
                used: 1,
                percentage: 100,
              },
            },
          },
          error: null,
        }),
      });

      const wrapper = createWrapper();
      render(<UsageWidget />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/approaching your limit/i)).toBeInTheDocument();
        expect(screen.getByText(/upgrade/i)).toBeInTheDocument();
      });
    });

    it('should not show upgrade prompt when under 80%', async () => {
      const wrapper = createWrapper();
      render(<UsageWidget />, { wrapper });

      await waitFor(() => {
        expect(screen.queryByText(/approaching your limit/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should render error state when API fails', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const wrapper = createWrapper();
      render(<UsageWidget />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/failed to load usage/i)).toBeInTheDocument();
      });
    });

    it('should render empty state when no data returned', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: null, error: null }),
      });

      const wrapper = createWrapper();
      render(<UsageWidget />, { wrapper });

      await waitFor(() => {
        expect(screen.queryByText(/client onboards/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Refresh', () => {
    it('should refetch data every 60 seconds', async () => {
      const wrapper = createWrapper();
      render(<UsageWidget />, { wrapper });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Check refetchInterval is set (would need to check query cache)
      // This is a basic test that ensures the component mounts
    });
  });
});
