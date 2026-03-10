import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ClientOAuthCallbackPage from '../page';

const { pushMock, searchParamGetMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  searchParamGetMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => ({
    get: searchParamGetMock,
  }),
}));

vi.mock('@/components/ui', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/logo-spinner', () => ({
  LogoSpinner: () => <div>Loading</div>,
}));

describe('ClientOAuthCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/';
    searchParamGetMock.mockImplementation((param: string) => {
      if (param === 'code') return 'oauth-code';
      if (param === 'state') return 'oauth-state';
      return null;
    });
    global.fetch = vi.fn();
  });

  it('posts the oauth exchange to the configured API host', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          data: {
            connectionId: 'conn-1',
            token: 'token-1',
            platform: 'google',
          },
          error: null,
        }),
    } as Response);

    render(<ClientOAuthCallbackPage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/client/oauth-exchange',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ code: 'oauth-code', state: 'oauth-state' }),
        })
      );
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/invite/token-1?connectionId=conn-1&platform=google&step=2');
    });
  });

  it('shows a controlled error when the oauth exchange returns non-JSON', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '<!doctype html><html><body>Not JSON</body></html>',
    } as Response);

    render(<ClientOAuthCallbackPage />);

    await waitFor(() => {
      expect(screen.getByText(/authorization service returned an unexpected response/i)).toBeInTheDocument();
    });
  });
});
