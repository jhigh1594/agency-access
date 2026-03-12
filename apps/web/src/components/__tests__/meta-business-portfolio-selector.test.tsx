import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MetaBusinessPortfolioSelector } from '../meta-business-portfolio-selector';

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: vi.fn(async () => 'mock-token'),
  }),
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
});
