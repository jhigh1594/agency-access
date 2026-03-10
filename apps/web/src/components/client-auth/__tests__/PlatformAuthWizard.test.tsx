import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PlatformAuthWizard } from '../PlatformAuthWizard';

const { pushMock, onCompleteMock, trackOnboardingEventMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  onCompleteMock: vi.fn(),
  trackOnboardingEventMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('framer-motion', () => ({
  m: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/components/client-auth/PlatformWizardCard', () => ({
  PlatformWizardCard: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/client-auth/MetaAssetSelector', () => ({
  MetaAssetSelector: () => <div>Meta Asset Selector</div>,
}));

vi.mock('@/components/client-auth/GoogleAssetSelector', () => ({
  GoogleAssetSelector: () => <div>Google Asset Selector</div>,
}));

vi.mock('@/components/client-auth/TikTokAssetSelector', () => ({
  TikTokAssetSelector: () => <div>TikTok Asset Selector</div>,
}));

vi.mock('@/components/client-auth/AutomaticPagesGrant', () => ({
  AutomaticPagesGrant: () => <div>Automatic Pages Grant</div>,
}));

vi.mock('@/components/client-auth/AdAccountSharingInstructions', () => ({
  AdAccountSharingInstructions: () => <div>Ad Account Sharing Instructions</div>,
}));

vi.mock('@/components/client-auth/StepHelpText', () => ({
  StepHelpText: ({ title, description }: any) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
    </div>
  ),
}));

vi.mock('@/components/client-auth/AssetSelectorDisabled', () => ({
  AssetSelectorDisabled: () => <div>Asset Selector Disabled</div>,
}));

vi.mock('@/components/ui', () => ({
  Button: ({ children, onClick, type = 'button', isLoading, rightIcon, ...props }: any) => (
    <button type={type} onClick={onClick} data-loading={isLoading ? 'true' : 'false'} {...props}>
      {children}
      {rightIcon ? <span>{rightIcon}</span> : null}
    </button>
  ),
  PlatformIcon: ({ platform }: any) => <div>{platform}</div>,
}));

vi.mock('@/lib/analytics/onboarding', () => ({
  trackOnboardingEvent: trackOnboardingEventMock,
}));

describe('PlatformAuthWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    vi.stubGlobal('location', { href: '' });
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/';
  });

  it('renders the connect step by default for OAuth platforms', () => {
    render(
      <PlatformAuthWizard
        platform="meta"
        platformName="Meta"
        products={[{ product: 'meta_ads', accessLevel: 'standard' }]}
        accessRequestToken="token-1"
        onComplete={onCompleteMock}
      />
    );

    expect(screen.getByRole('heading', { name: /connect meta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connect meta/i })).toBeInTheDocument();
    expect(screen.getByText(/you'll be redirected to meta to sign in and authorize access/i)).toBeInTheDocument();
  });

  it('calls the oauth-url endpoint on the configured API host when connect is clicked', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          data: { authUrl: 'https://example.com/oauth' },
          error: null,
        }),
      json: async () => ({
        data: { authUrl: 'https://example.com/oauth' },
        error: null,
      }),
    } as Response);

    render(
      <PlatformAuthWizard
        platform="meta"
        platformName="Meta"
        products={[{ product: 'meta_ads', accessLevel: 'standard' }]}
        accessRequestToken="token-1"
        onComplete={onCompleteMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /connect meta/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/client/token-1/oauth-url',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ platform: 'meta' }),
        })
      );
    });
  });

  it('shows a friendly error when the authorization service returns non-JSON', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '<!doctype html><html><body>Not JSON</body></html>',
    } as Response);

    render(
      <PlatformAuthWizard
        platform="google"
        platformName="Google"
        products={[{ product: 'google_ads', accessLevel: 'standard' }]}
        accessRequestToken="token-1"
        onComplete={onCompleteMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /connect google/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/authorization service returned an unexpected response/i)
      ).toBeInTheDocument();
    });
  });

  it('redirects Pinterest requests into the manual invite flow', async () => {
    render(
      <PlatformAuthWizard
        platform="pinterest"
        platformName="Pinterest"
        products={[{ product: 'pinterest', accessLevel: 'admin' }]}
        accessRequestToken="token-1"
        onComplete={onCompleteMock}
      />
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/invite/token-1/pinterest/manual');
    });
  });

  it('redirects Mailchimp requests into the manual invite flow', async () => {
    render(
      <PlatformAuthWizard
        platform="mailchimp"
        platformName="Mailchimp"
        products={[{ product: 'mailchimp', accessLevel: 'admin' }]}
        accessRequestToken="token-1"
        onComplete={onCompleteMock}
      />
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/invite/token-1/mailchimp/manual');
    });
  });

  it('lets users review the connect step for manual platforms before resuming setup', async () => {
    render(
      <PlatformAuthWizard
        platform="beehiiv"
        platformName="Beehiiv"
        products={[{ product: 'beehiiv', accessLevel: 'admin' }]}
        accessRequestToken="token-1"
        onComplete={onCompleteMock}
        deferManualRedirect
      />
    );

    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: /resume beehiiv setup/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /continue in beehiiv/i }));

    expect(pushMock).toHaveBeenCalledWith('/invite/token-1/beehiiv/manual');
  });

  it('shows a continue action instead of an empty step for platforms without asset selectors', async () => {
    render(
      <PlatformAuthWizard
        platform="linkedin"
        platformName="LinkedIn"
        products={[{ product: 'linkedin_ads', accessLevel: 'admin' }]}
        accessRequestToken="token-1"
        onComplete={onCompleteMock}
        initialConnectionId="conn-1"
        initialStep={2}
        completionActionLabel="Finish request"
      />
    );

    expect(screen.getByText(/authorization received/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review access confirmation/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /review access confirmation/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /connected/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /finish request/i })).toBeInTheDocument();
    });
  });
});
