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
  shouldEnforceOnboardingRedirect: () => true,
}));

vi.mock('@/lib/analytics/onboarding', () => ({
  trackOnboardingEvent: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: (props: any) => <img alt={props.alt} />,
}));

describe('AuthenticatedLayout agency-check fail-open degradation', () => {
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
    usePathnameMock.mockReturnValue('/clients');
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
  });

  it('renders children without redirect when the agencies fetch rejects', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    render(
      <AuthenticatedLayout>
        <div>Safe Content</div>
      </AuthenticatedLayout>
    );

    expect(screen.getByText('Safe Content')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    expect(replaceMock).not.toHaveBeenCalledWith('/onboarding/unified');
    expect(screen.getByText('Safe Content')).toBeInTheDocument();
  });

  it('renders children without redirect when the API answers non-ok', async () => {
    // Distinct pathname: the module-level agencyCheckDedup set persists across tests.
    usePathnameMock.mockReturnValue('/clients-non-ok');
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: { code: 'PLATFORM_ERROR', message: 'unavailable' } }),
    });

    render(
      <AuthenticatedLayout>
        <div>Safe Content</div>
      </AuthenticatedLayout>
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    expect(replaceMock).not.toHaveBeenCalled();
    expect(screen.getByText('Safe Content')).toBeInTheDocument();
  });
});
