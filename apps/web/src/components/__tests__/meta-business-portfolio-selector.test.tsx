import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MetaBusinessPortfolioSelector } from '../meta-business-portfolio-selector';

const mockLaunchMetaBusinessLogin = vi.fn();
const mockFinalizeMetaBusinessLogin = vi.fn();

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: vi.fn(async () => 'mock-token'),
  }),
  useUser: () => ({
    user: {
      primaryEmailAddress: { emailAddress: 'owner@agency.com' },
      emailAddresses: [{ emailAddress: 'owner@agency.com' }],
    },
  }),
}));

vi.mock('@/lib/meta-business-login', () => ({
  launchMetaBusinessLogin: (...args: any[]) => mockLaunchMetaBusinessLogin(...args),
  finalizeMetaBusinessLogin: (...args: any[]) => mockFinalizeMetaBusinessLogin(...args),
}));

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('MetaBusinessPortfolioSelector', () => {
  const previousApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
    process.env.NEXT_PUBLIC_META_APP_ID = 'meta-app-123';
    process.env.NEXT_PUBLIC_META_LOGIN_FOR_BUSINESS_CONFIG_ID = 'meta-config-123';
    mockLaunchMetaBusinessLogin.mockResolvedValue({
      accessToken: 'meta-token',
      userId: 'meta-user-1',
    });
    mockFinalizeMetaBusinessLogin.mockResolvedValue({ id: 'conn-meta-1' });
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = previousApiUrl;
    vi.restoreAllMocks();
  });

  it('requests a fresh Meta business list for the portfolio dropdown', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        data: {
          businesses: [{ id: 'biz_1', name: 'Business One' }],
        },
      }),
    }) as Response);

    vi.stubGlobal('fetch', fetchMock);

    renderWithQueryClient(
      <MetaBusinessPortfolioSelector
        agencyId="agency-1"
        onSelect={() => {}}
      />
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const calls = fetchMock.mock.calls as Array<[RequestInfo | URL, RequestInit | undefined]>;
    expect(String(calls[0]?.[0])).toContain('/agency-platforms/meta/business-accounts?agencyId=agency-1&refresh=true');
  });

  it('re-authenticates with Meta instead of reloading the page when no portfolios are found', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            businesses: [],
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            businesses: [{ id: 'biz_1', name: 'Business One' }],
          },
        }),
      } as Response);

    vi.stubGlobal('fetch', fetchMock);

    renderWithQueryClient(
      <MetaBusinessPortfolioSelector
        agencyId="agency-1"
        onSelect={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /log in again/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /log in again/i }));

    await waitFor(() => {
      expect(mockLaunchMetaBusinessLogin).toHaveBeenCalledWith({
        appId: 'meta-app-123',
        configId: 'meta-config-123',
      });
      expect(mockFinalizeMetaBusinessLogin).toHaveBeenCalledWith({
        agencyId: 'agency-1',
        userEmail: 'owner@agency.com',
        getToken: expect.any(Function),
        authPayload: expect.objectContaining({
          accessToken: 'meta-token',
          userId: 'meta-user-1',
        }),
      });
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('option', { name: /Business One \(biz_1\)/ })).toBeInTheDocument();
    });
  });
});
