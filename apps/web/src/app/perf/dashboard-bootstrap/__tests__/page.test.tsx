import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PerfDashboardBootstrapPage from '../page';

const { replaceMock, searchParamGetMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  searchParamGetMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => ({
    get: searchParamGetMock,
  }),
}));

describe('PerfDashboardBootstrapPage', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    vi.clearAllMocks();
    storage.clear();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
        clear: () => {
          storage.clear();
        },
      },
    });
    searchParamGetMock.mockImplementation((key: string) => {
      if (key === 'token') return 'perf_token_123';
      if (key === 'userId') return 'user_perf_123';
      return null;
    });
  });

  it('stores the perf auth context and redirects to the dashboard', async () => {
    render(<PerfDashboardBootstrapPage />);

    expect(
      screen.getByText(/initializing dashboard benchmark/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(window.localStorage.getItem('__perf_auth_token')).toBe('perf_token_123');
      expect(window.localStorage.getItem('__perf_principal_id')).toBe('user_perf_123');
      expect(replaceMock).toHaveBeenCalledWith('/dashboard');
    });
  });
});
