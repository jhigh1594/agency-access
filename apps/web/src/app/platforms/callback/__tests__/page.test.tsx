/**
 * OAuth Callback Page Tests
 *
 * Focus: non-Meta success should redirect back to /connections with query params
 * so the Connections page can invalidate queries and show updated connection state.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CallbackPage from '../page';

const mockPush = vi.fn();
const mockGet = vi.fn();

const { captureMock } = vi.hoisted(() => ({
  captureMock: vi.fn(),
}));

vi.mock('posthog-js', () => ({
  default: {
    capture: captureMock,
  },
}));

vi.mock('@/components/meta-business-portfolio-selector', () => ({
  MetaBusinessPortfolioSelector: () => null,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
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

describe('OAuth Callback Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state when params are missing', () => {
    mockGet.mockImplementation(() => null);
    renderWithQueryClient(<CallbackPage />);
    expect(screen.getByText(/processing your connection/i)).toBeInTheDocument();
  });

  it('shows success state for Google and auto-redirects to /connections with query params', async () => {
    mockGet.mockImplementation((param: string) => {
      if (param === 'success') return 'true';
      if (param === 'platform') return 'google';
      if (param === 'error') return null;
      if (param === 'agencyId') return 'agency-1';
      if (param === 'connectionId') return 'conn-1';
      return null;
    });

    vi.useFakeTimers();
    renderWithQueryClient(<CallbackPage />);

    expect(screen.getByRole('heading', { name: /successfully connected/i })).toBeInTheDocument();
    expect(screen.getByText(/google/i)).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(5000);
    expect(mockPush).toHaveBeenCalledWith('/connections?success=true&platform=google');
    vi.useRealTimers();
  });

  it('shows error state and does not auto-redirect', () => {
    mockGet.mockImplementation((param: string) => {
      if (param === 'error') return 'INVALID_STATE';
      if (param === 'success') return null;
      if (param === 'platform') return 'google';
      return null;
    });

    vi.useFakeTimers();
    renderWithQueryClient(<CallbackPage />);

    expect(screen.getByText(/connection failed/i)).toBeInTheDocument();
    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    expect(screen.getByText(/invalid_state/i)).toBeInTheDocument();

    vi.advanceTimersByTime(10000);
    expect(mockPush).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});

