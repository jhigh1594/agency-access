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

vi.mock('@/components/client-auth/PlatformAuthWizard', async () => {
  const React = await vi.importActual<typeof import('react')>('react');

  return {
    PlatformAuthWizard: ({
      onComplete,
      platformName,
      completionActionLabel,
      initialConnectionId,
      initialStep,
    }: any) => {
      const [mountedPlatformName] = React.useState(platformName);

      return (
        <div>
          <p>{`Active platform: ${mountedPlatformName}`}</p>
          {completionActionLabel ? <p>{`Completion action: ${completionActionLabel}`}</p> : null}
          {initialConnectionId ? <p>{`Initial connection: ${initialConnectionId}`}</p> : null}
          {initialStep ? <p>{`Initial step: ${initialStep}`}</p> : null}
          <button type="button" onClick={onComplete}>
            Complete Platform
          </button>
        </div>
      );
    },
  };
});

describe('Invite Flow Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamGetMock.mockImplementation(() => null);
    vi.useRealTimers();
    sessionStorage.clear();
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
    expect(screen.getByText(/review request/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue to connect/i })).toBeInTheDocument();

    vi.useRealTimers();
  }, 10000);

  it('treats null intake fields as an empty review step instead of crashing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          data: {
            id: 'request-1',
            agencyId: 'agency-1',
            agencyName: 'Demo Agency',
            clientName: 'Client',
            clientEmail: 'client@test.com',
            status: 'pending',
            uniqueToken: 'token-123',
            expiresAt: new Date().toISOString(),
            intakeFields: null,
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
      }))
    );

    render(<InvitePage />);

    await waitFor(() => {
      expect(screen.getByText(/review request/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue to connect/i })).toBeInTheDocument();
      expect(screen.getByText(/you will choose which accounts to share next/i)).toBeInTheDocument();
    });
  });

  it('shows the security badge only once in the setup hero', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          data: {
            id: 'request-1',
            agencyId: 'agency-1',
            agencyName: 'Demo Agency',
            clientName: 'Client',
            clientEmail: 'client@test.com',
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
      }))
    );

    render(<InvitePage />);

    await waitFor(() => {
      expect(screen.getAllByText(/oauth only/i)).toHaveLength(1);
    });
  });

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

    const continueButton = await screen.findByRole('button', { name: /continue to connect/i });
    await userEvent.click(continueButton);

    const completeButton = await screen.findByRole('button', { name: /complete platform/i });
    await userEvent.click(completeButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/client/token-123/complete'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('lets the user return to the connect phase from the done step to review platform status', async () => {
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

    await userEvent.click(await screen.findByRole('button', { name: /continue to connect/i }));
    await userEvent.click(await screen.findByRole('button', { name: /complete platform/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back to connect/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /back to connect/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/review connected platforms/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/access confirmed for this platform/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/all set/i)).not.toBeInTheDocument();
  });

  it('keeps the connect step visible until a platform is completed', async () => {
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

    const continueButton = await screen.findByRole('button', { name: /continue to connect/i });
    await userEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText('Connect')).toBeInTheDocument();
      expect(screen.queryByText(/connect 1 more platform/i)).not.toBeInTheDocument();
    });

    expect(
      fetchMock.mock.calls.some(([url]) => String(url).includes('/api/client/token-123/complete'))
    ).toBe(false);
  });

  it('shows only one active platform at a time and collapses the rest of the request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          data: {
            id: 'request-1',
            agencyId: 'agency-1',
            agencyName: 'Demo Agency',
            clientName: 'Client',
            clientEmail: 'client@test.com',
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
              {
                platformGroup: 'meta',
                products: [{ product: 'meta_ads', accessLevel: 'admin' }],
              },
            ],
            manualInviteTargets: { google: {}, meta: {} },
            authorizationProgress: { completedPlatforms: [], isComplete: false },
          },
          error: null,
        }),
      }))
    );

    render(<InvitePage />);

    const continueButton = await screen.findByRole('button', { name: /continue to connect/i });
    await userEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText('Active platform: Google')).toBeInTheDocument();
      expect(screen.queryAllByRole('button', { name: /complete platform/i })).toHaveLength(1);
    });

    expect(screen.queryByText('Active platform: Meta')).not.toBeInTheDocument();
  });

  it('passes an explicit next-platform handoff label to the active platform', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          data: {
            id: 'request-1',
            agencyId: 'agency-1',
            agencyName: 'Demo Agency',
            clientName: 'Client',
            clientEmail: 'client@test.com',
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
              {
                platformGroup: 'meta',
                products: [{ product: 'meta_ads', accessLevel: 'admin' }],
              },
            ],
            manualInviteTargets: { google: {}, meta: {} },
            authorizationProgress: { completedPlatforms: [], isComplete: false },
          },
          error: null,
        }),
      }))
    );

    render(<InvitePage />);

    const continueButton = await screen.findByRole('button', { name: /continue to connect/i });
    await userEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText('Completion action: Continue to Meta')).toBeInTheDocument();
    });
  });

  it('remounts the platform wizard when advancing to the next queued platform', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          data: {
            id: 'request-1',
            agencyId: 'agency-1',
            agencyName: 'Demo Agency',
            clientName: 'Client',
            clientEmail: 'client@test.com',
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
              {
                platformGroup: 'meta',
                products: [{ product: 'meta_ads', accessLevel: 'admin' }],
              },
            ],
            manualInviteTargets: { google: {}, meta: {} },
            authorizationProgress: { completedPlatforms: [], isComplete: false },
          },
          error: null,
        }),
      }))
    );

    render(<InvitePage />);

    await userEvent.click(await screen.findByRole('button', { name: /continue to connect/i }));

    await waitFor(() => {
      expect(screen.getByText('Active platform: Google')).toBeInTheDocument();
      expect(screen.getByText('Completion action: Continue to Meta')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /complete platform/i }));

    await waitFor(() => {
      expect(screen.getByText('Active platform: Meta')).toBeInTheDocument();
      expect(screen.getByText('Completion action: Finish')).toBeInTheDocument();
    });

    expect(screen.queryByText('Active platform: Google')).not.toBeInTheDocument();
  });

  it('supports a direct return to the connect step and focuses the requested platform', async () => {
    searchParamGetMock.mockImplementation((param: string) => {
      if (param === 'view') return 'connect';
      if (param === 'platform') return 'mailchimp';
      return null;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          data: {
            id: 'request-1',
            agencyId: 'agency-1',
            agencyName: 'Demo Agency',
            clientName: 'Client',
            clientEmail: 'client@test.com',
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
              {
                platformGroup: 'mailchimp',
                products: [{ product: 'mailchimp', accessLevel: 'admin' }],
              },
            ],
            manualInviteTargets: { google: {}, mailchimp: { agencyEmail: 'ops@demoagency.com' } },
            authorizationProgress: { completedPlatforms: [], isComplete: false },
          },
          error: null,
        }),
      }))
    );

    render(<InvitePage />);

    await waitFor(() => {
      expect(screen.getByText('Active platform: Mailchimp')).toBeInTheDocument();
      expect(screen.getByText('Completion action: Continue to Google')).toBeInTheDocument();
    });
  });

  it('restores the returning oauth platform as the active stage', async () => {
    searchParamGetMock.mockImplementation((key: string) => {
      if (key === 'step') return '2';
      if (key === 'platform') return 'meta';
      if (key === 'connectionId') return 'conn-meta-1';
      return null;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          data: {
            id: 'request-1',
            agencyId: 'agency-1',
            agencyName: 'Demo Agency',
            clientName: 'Client',
            clientEmail: 'client@test.com',
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
              {
                platformGroup: 'meta',
                products: [{ product: 'meta_ads', accessLevel: 'admin' }],
              },
            ],
            manualInviteTargets: { google: {}, meta: {} },
            authorizationProgress: { completedPlatforms: [], isComplete: false },
          },
          error: null,
        }),
      }))
    );

    render(<InvitePage />);

    await waitFor(() => {
      expect(screen.getByText('Active platform: Meta')).toBeInTheDocument();
      expect(screen.getByText('Initial connection: conn-meta-1')).toBeInTheDocument();
      expect(screen.getByText('Initial step: 2')).toBeInTheDocument();
      expect(screen.queryAllByRole('button', { name: /complete platform/i })).toHaveLength(1);
    });

    expect(screen.queryByText('Active platform: Google')).not.toBeInTheDocument();
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

    const continueButton = await screen.findByRole('button', { name: /continue to connect/i });
    await userEvent.click(continueButton);

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

  it('auto-completes manual platform callback for Shopify', async () => {
    searchParamGetMock.mockImplementation((key: string) => {
      if (key === 'step') return '2';
      if (key === 'platform') return 'shopify';
      if (key === 'connectionId') return 'conn-shopify-1';
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
            status: 'pending',
            uniqueToken: 'token-123',
            expiresAt: new Date().toISOString(),
            intakeFields: [],
            branding: {},
            platforms: [
              {
                platformGroup: 'shopify',
                products: [{ product: 'shopify', accessLevel: 'admin' }],
              },
            ],
            manualInviteTargets: {
              shopify: { shopDomain: 'store-demo.myshopify.com', collaboratorCode: '1234' },
            },
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

  it('auto-completes manual platform callback for Mailchimp', async () => {
    searchParamGetMock.mockImplementation((key: string) => {
      if (key === 'step') return '2';
      if (key === 'platform') return 'mailchimp';
      if (key === 'connectionId') return 'conn-mailchimp-1';
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
            status: 'pending',
            uniqueToken: 'token-123',
            expiresAt: new Date().toISOString(),
            intakeFields: [],
            branding: {},
            platforms: [
              {
                platformGroup: 'mailchimp',
                products: [{ product: 'mailchimp', accessLevel: 'admin' }],
              },
            ],
            manualInviteTargets: {
              mailchimp: { agencyEmail: 'ops@demoagency.com' },
            },
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
  });

  it('returns from a manual platform callback into the next active platform in the queue', async () => {
    searchParamGetMock.mockImplementation((key: string) => {
      if (key === 'step') return '2';
      if (key === 'platform') return 'mailchimp';
      if (key === 'connectionId') return 'conn-mailchimp-1';
      return null;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          data: {
            id: 'request-1',
            agencyId: 'agency-1',
            agencyName: 'Demo Agency',
            clientName: 'Client',
            clientEmail: 'client@test.com',
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
              {
                platformGroup: 'mailchimp',
                products: [{ product: 'mailchimp', accessLevel: 'admin' }],
              },
            ],
            manualInviteTargets: {
              google: {},
              mailchimp: { agencyEmail: 'ops@demoagency.com' },
            },
            authorizationProgress: { completedPlatforms: [], isComplete: false },
          },
          error: null,
        }),
      }))
    );

    render(<InvitePage />);

    await waitFor(() => {
      expect(screen.getByText('Active platform: Google')).toBeInTheDocument();
      expect(screen.getByText('Completion action: Finish')).toBeInTheDocument();
      expect(screen.queryAllByRole('button', { name: /complete platform/i })).toHaveLength(1);
    });

    expect(screen.queryByText('Active platform: Mailchimp')).not.toBeInTheDocument();
  });

  describe('Dynamic step indicator', () => {
    it('should always show setup, connect, and done steps', async () => {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        json: async () => ({
          data: {
            id: 'request-1',
            agencyId: 'agency-1',
            agencyName: 'Demo Agency',
            clientName: 'Client',
            clientEmail: 'client@test.com',
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
            manualInviteTargets: {},
            authorizationProgress: { completedPlatforms: [], isComplete: false },
          },
          error: null,
        }),
      }));

      vi.stubGlobal('fetch', fetchMock);

      render(<InvitePage />);

      await waitFor(() => {
        expect(screen.getByText('Setup')).toBeInTheDocument();
        expect(screen.getByText('Connect')).toBeInTheDocument();
        expect(screen.getByText('Done')).toBeInTheDocument();
      });
    });

    it('should show step 1 of 3 for a fresh request and list the requested platforms', async () => {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        json: async () => ({
          data: {
            id: 'request-1',
            agencyId: 'agency-1',
            agencyName: 'Demo Agency',
            clientName: 'Client',
            clientEmail: 'client@test.com',
            status: 'pending',
            uniqueToken: 'token-123',
            expiresAt: new Date().toISOString(),
            intakeFields: [],
            branding: {
              logoUrl: 'https://cdn.example.com/demo-agency.svg',
            },
            platforms: [{ platformGroup: 'google', products: [{ product: 'google_ads', accessLevel: 'admin' }] }],
            manualInviteTargets: {},
            authorizationProgress: { completedPlatforms: [], isComplete: false },
          },
          error: null,
        }),
      }));

      vi.stubGlobal('fetch', fetchMock);

      render(<InvitePage />);

      await waitFor(() => {
        expect(screen.getByText(/review request/i)).toBeInTheDocument();
        expect(screen.getByText(/share account access with demo agency/i)).toBeInTheDocument();
        expect(screen.getByText(/request for client/i)).toBeInTheDocument();
        expect(screen.getAllByText('Google').length).toBeGreaterThan(0);
        expect(screen.getByText('Google Ads · admin')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: /demo agency logo/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /continue to connect/i })).toBeInTheDocument();
      });
    });
  });
});
