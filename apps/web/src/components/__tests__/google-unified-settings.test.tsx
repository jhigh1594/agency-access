import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleUnifiedSettings } from '../google-unified-settings';

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

function getAuthHeader(init: RequestInit | undefined): string | undefined {
  const headers = init?.headers as any;
  if (!headers) return undefined;
  if (headers instanceof Headers) return headers.get('Authorization') ?? undefined;
  return headers.Authorization ?? headers.authorization;
}

describe('GoogleUnifiedSettings', () => {
  const prevEnv = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = prevEnv;
    vi.restoreAllMocks();
  });

  it('includes Authorization header when fetching accounts and asset settings', async () => {
    const fetchMock = vi.fn(async (input: any, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/agency-platforms/google/accounts')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              adsAccounts: [],
              analyticsProperties: [],
              businessAccounts: [],
              tagManagerContainers: [],
              searchConsoleSites: [],
              merchantCenterAccounts: [],
              hasAccess: true,
            },
          }),
        } as any;
      }

      if (url.includes('/agency-platforms/google/asset-settings')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              googleAds: { enabled: true, requestManageUsers: false },
              googleAnalytics: { enabled: true, requestManageUsers: false },
              googleBusinessProfile: { enabled: true, requestManageUsers: false },
              googleTagManager: { enabled: true, requestManageUsers: false },
              googleSearchConsole: { enabled: true, requestManageUsers: false },
              googleMerchantCenter: { enabled: true, requestManageUsers: false },
            },
          }),
        } as any;
      }

      return {
        ok: true,
        json: async () => ({ data: null }),
      } as any;
    });

    vi.stubGlobal('fetch', fetchMock);

    renderWithQueryClient(<GoogleUnifiedSettings agencyId="agency-1" />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    // Assert both GETs include the Clerk token
    await waitFor(() => {
      const calls = fetchMock.mock.calls as Array<[any, RequestInit | undefined]>;
      const accountsCall = calls.find(([input]) =>
        String(input).includes('/agency-platforms/google/accounts')
      );
      const settingsCall = calls.find(([input]) =>
        String(input).includes('/agency-platforms/google/asset-settings?')
      );

      expect(accountsCall).toBeTruthy();
      expect(settingsCall).toBeTruthy();

      expect(getAuthHeader(accountsCall?.[1])).toBe('Bearer mock-token');
      expect(getAuthHeader(settingsCall?.[1])).toBe('Bearer mock-token');
    });
  });
});

