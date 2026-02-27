import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InvitePage from '../page';

const { searchParamGetMock } = vi.hoisted(() => ({
  searchParamGetMock: vi.fn(() => null),
}));

vi.mock('next/navigation', () => ({
  useParams: vi.fn(() => ({ token: 'token-123' })),
  useSearchParams: vi.fn(() => ({
    get: searchParamGetMock,
  })),
}));

vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
  },
}));

vi.mock('@/components/client-auth/PlatformAuthWizard', () => ({
  PlatformAuthWizard: ({ onComplete, platformName }: any) => (
    <div>
      <p>{platformName}</p>
      <button type="button" onClick={onComplete}>
        Complete Platform
      </button>
    </div>
  ),
}));

describe('Invite Flow Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamGetMock.mockImplementation(() => null);
    vi.useRealTimers();
  });

  it('renders explicit error state for invalid token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ error: { message: 'Access request expired' } }),
      }))
    );

    render(<InvitePage />);

    await waitFor(() => {
      expect(screen.getByText(/request link unavailable/i)).toBeInTheDocument();
      expect(screen.getByText(/access request expired/i)).toBeInTheDocument();
    });
  });

  it('shows delayed then timeout state and can recover with retry', async () => {
    vi.useFakeTimers();

    const validPayload = {
      data: {
        id: 'request-1',
        agencyId: 'agency-1',
        agencyName: 'Demo Agency',
        clientName: 'Client',
        clientEmail: 'client@test.com',
        authModel: 'delegated_access',
        status: 'pending',
        uniqueToken: 'token-123',
        expiresAt: new Date().toISOString(),
        intakeFields: [],
        branding: {},
        platforms: [
          {
            platformGroup: 'google',
            products: [{ product: 'google_ads', accessLevel: 'admin' }],
          },
        ],
        manualInviteTargets: { google: {} },
        authorizationProgress: { completedPlatforms: [], isComplete: false },
      },
      error: null,
    };

    let callCount = 0;
    const fetchMock = vi.fn(async () => {
      callCount += 1;
      if (callCount === 1) {
        return new Promise(() => {});
      }

      return {
        ok: true,
        json: async () => validPayload,
      } as Response;
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<InvitePage />);

    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(screen.getByText(/still loading/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(12000);
    });
    expect(screen.getByText(/still working on it/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText(/connect 1 more platform/i)).toBeInTheDocument();

    vi.useRealTimers();
  }, 10000);

  it('calls completion endpoint when all platforms are complete', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/api/client/token-123/complete')) {
        return {
          ok: true,
          json: async () => ({ data: { success: true }, error: null }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({
          data: {
            id: 'request-1',
            agencyId: 'agency-1',
            agencyName: 'Demo Agency',
            clientName: 'Client',
            clientEmail: 'client@test.com',
            authModel: 'delegated_access',
            status: 'pending',
            uniqueToken: 'token-123',
            expiresAt: new Date().toISOString(),
            intakeFields: [],
            branding: {},
            platforms: [
              {
                platformGroup: 'google',
                products: [{ product: 'google_ads', accessLevel: 'admin' }],
              },
            ],
            manualInviteTargets: { google: {} },
            authorizationProgress: { completedPlatforms: [], isComplete: false },
          },
          error: null,
        }),
      } as Response;
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<InvitePage />);

    const completeButton = await screen.findByRole('button', { name: /complete platform/i });
    await userEvent.click(completeButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/client/token-123/complete'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('submits completion without JSON content-type header', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/api/client/token-123/complete')) {
        return {
          ok: true,
          json: async () => ({ data: { success: true }, error: null }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({
          data: {
            id: 'request-1',
            agencyId: 'agency-1',
            agencyName: 'Demo Agency',
            clientName: 'Client',
            clientEmail: 'client@test.com',
            authModel: 'delegated_access',
            status: 'pending',
            uniqueToken: 'token-123',
            expiresAt: new Date().toISOString(),
            intakeFields: [],
            branding: {},
            platforms: [
              {
                platformGroup: 'google',
                products: [{ product: 'google_ads', accessLevel: 'admin' }],
              },
            ],
            manualInviteTargets: { google: {} },
            authorizationProgress: { completedPlatforms: [], isComplete: false },
          },
          error: null,
        }),
      } as Response;
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<InvitePage />);

    const completeButton = await screen.findByRole('button', { name: /complete platform/i });
    await userEvent.click(completeButton);

    await waitFor(() => {
      const completionCall = fetchMock.mock.calls.find(([url]) =>
        String(url).includes('/api/client/token-123/complete')
      );
      expect(completionCall?.[1]).toEqual({ method: 'POST' });
    });
  });

  it('auto-completes manual platform callback for Beehiiv without reopening the wizard', async () => {
    searchParamGetMock.mockImplementation((key: string) => {
      if (key === 'step') return '2';
      if (key === 'platform') return 'beehiiv';
      if (key === 'connectionId') return 'conn-beehiiv-1';
      return null;
    });

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/api/client/token-123/complete')) {
        return {
          ok: true,
          json: async () => ({ data: { success: true }, error: null }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({
          data: {
            id: 'request-1',
            agencyId: 'agency-1',
            agencyName: 'Demo Agency',
            clientName: 'Client',
            clientEmail: 'client@test.com',
            authModel: 'delegated_access',
            status: 'pending',
            uniqueToken: 'token-123',
            expiresAt: new Date().toISOString(),
            intakeFields: [],
            branding: {},
            platforms: [
              {
                platformGroup: 'beehiiv',
                products: [{ product: 'beehiiv', accessLevel: 'admin' }],
              },
            ],
            manualInviteTargets: { beehiiv: { agencyEmail: 'ops@demoagency.com' } },
            authorizationProgress: { completedPlatforms: [], isComplete: false },
          },
          error: null,
        }),
      } as Response;
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<InvitePage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/client/token-123/complete'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    expect(screen.queryByRole('button', { name: /complete platform/i })).not.toBeInTheDocument();
  });
});
