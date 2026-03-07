import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage from '../page';

const useQueryMock = vi.fn();
const useAgencyOnboardingStatusMock = vi.fn();
const useUpdateOnboardingProgressMock = vi.fn();

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({
    getToken: vi.fn(),
    userId: 'user_123',
    orgId: null,
    isLoaded: true,
  })),
}));

vi.mock('@/lib/dev-auth', () => ({
  DEV_USER_ID: 'dev_user_test_123456789',
  useAuthOrBypass: vi.fn(() => ({
    userId: 'user_123',
    orgId: null,
    isLoaded: true,
    isDevelopmentBypass: false,
  })),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: any) => useQueryMock(options),
}));

vi.mock('@/lib/query/onboarding', () => ({
  useAgencyOnboardingStatus: (agencyId: string | undefined) => useAgencyOnboardingStatusMock(agencyId),
  useUpdateAgencyOnboardingProgress: () => useUpdateOnboardingProgressMock(),
}));

vi.mock('@/lib/perf-harness', () => ({
  readPerfHarnessContext: vi.fn(() => null),
  startPerfTimer: vi.fn(() => null),
}));

vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
  },
}));

vi.mock('@/components/ui', () => ({
  StatCard: ({ label, value }: any) => (
    <div>
      {label}: {String(value)}
    </div>
  ),
  StatusBadge: ({ status }: any) => <span>{status}</span>,
  EmptyState: ({ title, description, actionLabel, actionHref }: any) => (
    <div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && actionHref ? <a href={actionHref}>{actionLabel}</a> : null}
    </div>
  ),
}));

describe('DashboardPage behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAgencyOnboardingStatusMock.mockReturnValue({
      data: null,
      isLoading: false,
    });
    useUpdateOnboardingProgressMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it('shows latest-10 summary messaging when API reports more results exist', async () => {
    useQueryMock.mockReturnValue({
      data: {
        data: {
          agency: {
            id: 'agency_1',
            name: 'Agency One',
            email: 'owner@agency.test',
          },
          stats: {
            totalRequests: 25,
            pendingRequests: 3,
            activeConnections: 42,
            totalPlatforms: 5,
          },
          requests: Array.from({ length: 10 }, (_, i) => ({
            id: `request-${i + 1}`,
            clientName: `Client ${i + 1}`,
            clientEmail: `client${i + 1}@example.com`,
            status: 'pending',
            createdAt: '2026-01-01T00:00:00.000Z',
            platforms: ['google'],
          })),
          connections: Array.from({ length: 10 }, (_, i) => ({
            id: `connection-${i + 1}`,
            clientEmail: `connected${i + 1}@example.com`,
            status: 'active',
            createdAt: '2026-01-01T00:00:00.000Z',
            platforms: ['google'],
          })),
          meta: {
            requests: {
              limit: 10,
              returned: 10,
              total: 25,
              hasMore: true,
            },
            connections: {
              limit: 10,
              returned: 10,
              total: 42,
              hasMore: true,
            },
          },
        },
        error: null,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<DashboardPage />);

    expect(await screen.findByText('Showing latest 10 of 25 requests')).toBeInTheDocument();
    expect(await screen.findByText('Showing latest 10 of 42 connections')).toBeInTheDocument();
  });

  it('links each recent request row to request details', async () => {
    useQueryMock.mockReturnValue({
      data: {
        data: {
          agency: {
            id: 'agency_1',
            name: 'Agency One',
            email: 'owner@agency.test',
          },
          stats: {
            totalRequests: 2,
            pendingRequests: 1,
            activeConnections: 0,
            totalPlatforms: 1,
          },
          requests: [
            {
              id: 'request-1',
              clientId: 'client-123',
              clientName: 'Client One',
              clientEmail: 'client.one@example.com',
              status: 'pending',
              createdAt: '2026-01-01T00:00:00.000Z',
              platforms: ['google'],
            },
            {
              id: 'request-2',
              clientName: 'Client Two',
              clientEmail: 'client.two+east@example.com',
              status: 'partial',
              createdAt: '2026-01-02T00:00:00.000Z',
              platforms: ['meta'],
            },
          ],
          connections: [],
          meta: {
            requests: {
              limit: 10,
              returned: 2,
              total: 2,
              hasMore: false,
            },
            connections: {
              limit: 10,
              returned: 0,
              total: 0,
              hasMore: false,
            },
          },
        },
        error: null,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<DashboardPage />);

    expect(await screen.findByText('Client One')).toBeInTheDocument();
    expect(document.querySelector('a[href=\"/access-requests/request-1\"]')).toBeInTheDocument();
    expect(document.querySelector('a[href=\"/access-requests/request-2\"]')).toBeInTheDocument();
  });

  it('shows onboarding checklist when lifecycle status is in_progress', async () => {
    useQueryMock.mockReturnValue({
      data: {
        data: {
          agency: {
            id: 'agency_1',
            name: 'Agency One',
            email: 'owner@agency.test',
          },
          stats: {
            totalRequests: 0,
            pendingRequests: 0,
            activeConnections: 0,
            totalPlatforms: 0,
          },
          requests: [],
          connections: [],
        },
        error: null,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    useAgencyOnboardingStatusMock.mockReturnValue({
      data: {
        status: 'in_progress',
        completed: false,
        lifecycle: {
          status: 'in_progress',
          lastVisitedStep: 3,
        },
      },
      isLoading: false,
    });

    render(<DashboardPage />);

    expect(await screen.findByText('Finish your onboarding setup')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Resume onboarding' })).toHaveAttribute('href', '/onboarding/unified');
  });

  it('offers help center links in dashboard empty states', async () => {
    useQueryMock.mockReturnValue({
      data: {
        data: {
          agency: {
            id: 'agency_1',
            name: 'Agency One',
            email: 'owner@agency.test',
          },
          stats: {
            totalRequests: 0,
            pendingRequests: 0,
            activeConnections: 0,
            totalPlatforms: 0,
          },
          requests: [],
          connections: [],
          meta: {
            requests: {
              limit: 10,
              returned: 0,
              total: 0,
              hasMore: false,
            },
            connections: {
              limit: 10,
              returned: 0,
              total: 0,
              hasMore: false,
            },
          },
        },
        error: null,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<DashboardPage />);

    const helpLinks = await screen.findAllByRole('link', { name: 'Open Help Center' });
    expect(helpLinks).toHaveLength(2);
    helpLinks.forEach((helpLink) => {
      expect(helpLink).toHaveAttribute('href', 'https://docs.authhub.co');
    });
  });

  it('shows only resume and finish actions when lifecycle status is activated', async () => {
    useQueryMock.mockReturnValue({
      data: {
        data: {
          agency: {
            id: 'agency_1',
            name: 'Agency One',
            email: 'owner@agency.test',
          },
          stats: {
            totalRequests: 0,
            pendingRequests: 0,
            activeConnections: 0,
            totalPlatforms: 0,
          },
          requests: [],
          connections: [],
        },
        error: null,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    useAgencyOnboardingStatusMock.mockReturnValue({
      data: {
        status: 'activated',
        completed: false,
        lifecycle: {
          status: 'activated',
          lastVisitedStep: 5,
          activatedAt: '2026-03-01T00:00:00.000Z',
        },
      },
      isLoading: false,
    });

    render(<DashboardPage />);

    expect(await screen.findByText('Finish your onboarding setup')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Resume onboarding' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finish setup' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Skip optional setup' })).not.toBeInTheDocument();
  });

  it('hides onboarding checklist when onboarding is completed', async () => {
    useQueryMock.mockReturnValue({
      data: {
        data: {
          agency: {
            id: 'agency_1',
            name: 'Agency One',
            email: 'owner@agency.test',
          },
          stats: {
            totalRequests: 0,
            pendingRequests: 0,
            activeConnections: 0,
            totalPlatforms: 0,
          },
          requests: [],
          connections: [],
        },
        error: null,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    useAgencyOnboardingStatusMock.mockReturnValue({
      data: {
        status: 'completed',
        completed: true,
      },
      isLoading: false,
    });

    render(<DashboardPage />);

    expect(screen.queryByText('Finish your onboarding setup')).not.toBeInTheDocument();
  });

  it('preserves loading state while initial data request is pending', () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });
});
