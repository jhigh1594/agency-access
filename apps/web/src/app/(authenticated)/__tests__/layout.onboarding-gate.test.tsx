import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AuthenticatedLayout from '../layout';

const replaceMock = vi.fn();
const mockGetToken = vi.fn();
const usePathnameMock = vi.fn();
const useSearchParamsMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
  useSearchParams: () => useSearchParamsMock(),
  useRouter: () => ({
    replace: replaceMock,
    push: vi.fn(),
  }),
  redirect: vi.fn(),
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: mockGetToken,
    userId: 'user_123',
    orgId: null,
    isLoaded: true,
  }),
  UserButton: () => <div>User</div>,
}));

vi.mock('@/lib/dev-auth', () => ({
  useAuthOrBypass: () => ({
    userId: 'user_123',
    orgId: null,
    isLoaded: true,
    isDevelopmentBypass: false,
  }),
  signOutDevBypass: vi.fn(),
}));

vi.mock('@/lib/perf-harness', () => ({
  readPerfHarnessContext: vi.fn(() => null),
  startPerfTimer: vi.fn(() => null),
}));

vi.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children }: any) => <div>{children}</div>,
  SidebarBody: ({ children }: any) => <div>{children}</div>,
  SidebarLink: ({ link }: any) => <a href={link.href}>{link.label}</a>,
}));

vi.mock('@/components/ui/theme-toggle', () => ({
  ThemeToggle: () => <button type="button">Theme</button>,
}));

vi.mock('@/components/trial-banner', () => ({
  TrialBanner: () => null,
}));

vi.mock('@/components/help-scout-beacon', () => ({
  HelpScoutBeacon: () => null,
}));

vi.mock('@/lib/query/billing', () => ({
  useSubscription: () => ({ data: null }),
}));

vi.mock('@/lib/query/onboarding', () => ({
  shouldEnforceOnboardingRedirect: (statusData: { status?: string } | null | undefined) =>
    statusData?.status === 'in_progress' || statusData?.status === 'not_started',
}));

vi.mock('@/lib/analytics/onboarding', () => ({
  trackOnboardingEvent: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: (props: any) => <img alt={props.alt} />,
}));

describe('AuthenticatedLayout onboarding re-entry gate', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
    });
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    mockGetToken.mockResolvedValue('token-123');
    usePathnameMock.mockReturnValue('/connections-layout-default');
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
  });

  it('redirects to unified onboarding when onboarding status is in_progress', async () => {
    usePathnameMock.mockReturnValue('/connections-layout-in-progress');

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'agency-1' }], error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            status: 'in_progress',
            completed: false,
            step: {
              profile: true,
              members: false,
              firstRequest: false,
            },
          },
          error: null,
        }),
      });

    render(
      <AuthenticatedLayout>
        <div>Content</div>
      </AuthenticatedLayout>
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(replaceMock).toHaveBeenCalledWith('/onboarding/unified');
    });
  });

  it('does not redirect when onboarding status is activated', async () => {
    usePathnameMock.mockReturnValue('/connections-layout-activated');

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'agency-1' }], error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            status: 'activated',
            completed: false,
            step: {
              profile: true,
              members: true,
              firstRequest: true,
            },
          },
          error: null,
        }),
      });

    render(
      <AuthenticatedLayout>
        <div>Content</div>
      </AuthenticatedLayout>
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    expect(replaceMock).not.toHaveBeenCalledWith('/onboarding/unified');
  });

  it('renders a help center link in the authenticated shell', async () => {
    usePathnameMock.mockReturnValue('/dashboard');

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'agency-1' }], error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            status: 'completed',
            completed: true,
            step: {
              profile: true,
              members: true,
              firstRequest: true,
            },
          },
          error: null,
        }),
      });

    render(
      <AuthenticatedLayout>
        <div>Content</div>
      </AuthenticatedLayout>
    );

    const helpCenterLink = await screen.findByRole('link', { name: 'Help Center' });
    expect(helpCenterLink).toHaveAttribute('href', 'https://docs.authhub.co');
  });

  it('does not redirect from a dashboard onboarding recovery URL', async () => {
    usePathnameMock.mockReturnValue('/dashboard');
    useSearchParamsMock.mockReturnValue(new URLSearchParams('onboardingRecovery=1'));

    render(
      <AuthenticatedLayout>
        <div>Content</div>
      </AuthenticatedLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
