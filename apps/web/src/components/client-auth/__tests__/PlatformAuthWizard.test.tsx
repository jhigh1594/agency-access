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
  GoogleAssetSelector: ({ product, onSelectionChange }: any) => (
    <div>
      <div>{`Google Asset Selector: ${product}`}</div>
      <button
        type="button"
        onClick={() => {
          if (product === 'google_business_profile') {
            onSelectionChange({
              businessAccounts: [],
              availableAssetCount: 0,
            });
            return;
          }

          onSelectionChange({
            adAccounts: ['customers/123'],
            availableAssetCount: 1,
          });
        }}
      >
        {`Report assets for ${product}`}
      </button>
    </div>
  ),
}));

vi.mock('@/components/client-auth/LinkedInAssetSelector', () => ({
  LinkedInAssetSelector: ({ product, onSelectionChange }: any) => (
    <div>
      <div>{`LinkedIn Asset Selector: ${product}`}</div>
      <button
        type="button"
        onClick={() => {
          if (product === 'linkedin_pages') {
            onSelectionChange({
              pages: [],
              availableAssetCount: 0,
            });
            return;
          }

          onSelectionChange({
            adAccounts: ['urn:li:sponsoredAccount:123'],
            availableAssetCount: 1,
          });
        }}
      >
        {`Report assets for ${product}`}
      </button>
    </div>
  ),
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

  it('requires LinkedIn ad account selection before continuing to confirmation', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          data: { success: true },
          error: null,
        }),
      json: async () => ({
        data: { success: true },
        error: null,
      }),
    } as Response);

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

    expect(screen.getByText('LinkedIn Asset Selector: linkedin_ads')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /review access confirmation/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /report assets for linkedin_ads/i }));
    expect(screen.getByRole('button', { name: /save selected accounts/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /save selected accounts/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/client/token-1/save-assets',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /connected/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /finish request/i })).toBeInTheDocument();
    });

    expect(screen.getByText('LinkedIn Ads')).toBeInTheDocument();
  });

  it('lets LinkedIn Pages continue with follow-up when no administered pages are found', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          data: { success: true },
          error: null,
        }),
      json: async () => ({
        data: { success: true },
        error: null,
      }),
    } as Response);

    render(
      <PlatformAuthWizard
        platform="linkedin"
        platformName="LinkedIn"
        products={[{ product: 'linkedin_pages', accessLevel: 'admin' }]}
        accessRequestToken="token-1"
        onComplete={onCompleteMock}
        initialConnectionId="conn-1"
        initialStep={2}
        completionActionLabel="Finish request"
      />
    );

    expect(screen.getByText('LinkedIn Asset Selector: linkedin_pages')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /report assets for linkedin_pages/i }));

    expect(
      await screen.findByRole('button', { name: /continue with follow-up needed/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /continue with follow-up needed/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /connected/i })).toBeInTheDocument();
    });

    expect(screen.getByText('LinkedIn Pages')).toBeInTheDocument();
    expect(screen.getByText(/No pages found yet/i)).toBeInTheDocument();
  });

  it('shows both LinkedIn Ads and LinkedIn Pages in mixed LinkedIn requests', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          data: { success: true },
          error: null,
        }),
      json: async () => ({
        data: { success: true },
        error: null,
      }),
    } as Response);

    render(
      <PlatformAuthWizard
        platform="linkedin"
        platformName="LinkedIn"
        products={[
          { product: 'linkedin_ads', accessLevel: 'admin' },
          { product: 'linkedin_pages', accessLevel: 'admin' },
        ]}
        accessRequestToken="token-1"
        onComplete={onCompleteMock}
        initialConnectionId="conn-1"
        initialStep={2}
        completionActionLabel="Finish request"
      />
    );

    expect(screen.getByText('LinkedIn Asset Selector: linkedin_ads')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn Asset Selector: linkedin_pages')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /report assets for linkedin_ads/i }));
    fireEvent.click(screen.getByRole('button', { name: /report assets for linkedin_pages/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue with follow-up needed/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /connected/i })).toBeInTheDocument();
    });

    expect(screen.getByText('LinkedIn Ads')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn Pages')).toBeInTheDocument();
  });

  it('lets Google continue when a requested product has zero assets and shows follow-up summary copy', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          data: null,
          error: null,
        }),
      json: async () => ({
        data: null,
        error: null,
      }),
    } as Response);

    render(
      <PlatformAuthWizard
        platform="google"
        platformName="Google"
        products={[{ product: 'google_business_profile', accessLevel: 'standard' }]}
        accessRequestToken="token-1"
        onComplete={onCompleteMock}
        initialConnectionId="conn-1"
        initialStep={2}
        completionActionLabel="Finish request"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /report assets for google_business_profile/i }));

    expect(
      await screen.findByRole('button', { name: /continue with follow-up needed/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /continue with follow-up needed/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /connected/i })).toBeInTheDocument();
    });

    expect(
      screen.getByText(/connected successfully, but some requested google products still need follow-up/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Google Business Profile')).toBeInTheDocument();
    expect(screen.getByText(/No locations found yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Follow-up needed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /finish request/i })).toBeInTheDocument();
  });
});
