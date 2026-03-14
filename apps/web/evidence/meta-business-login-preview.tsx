import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlatformsPage from '@/app/onboarding/platforms/page';
import { MetaUnifiedSettings } from '@/components/meta-unified-settings';
import '@/app/globals.css';

type PreviewScenario =
  | 'onboarding-connect'
  | 'settings-selected-business'
  | 'settings-switch-business';

const SCENARIOS: PreviewScenario[] = [
  'onboarding-connect',
  'settings-selected-business',
  'settings-switch-business',
];

const AGENCY_ID = 'agency-evidence';
const SELECTED_BUSINESS = {
  id: '3808519629379919',
  name: 'Jon High',
};

const BUSINESSES = [
  SELECTED_BUSINESS,
  { id: '1039424716237849', name: 'Outdoor DIY' },
  { id: '2440571532778088', name: 'Shaka Stays' },
];

function parseScenario(rawScenario: string | null): PreviewScenario {
  if (rawScenario && SCENARIOS.includes(rawScenario as PreviewScenario)) {
    return rawScenario as PreviewScenario;
  }

  return 'onboarding-connect';
}

function buildJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function installMetaSdkMock(): void {
  (window as any).FB = {
    init: () => undefined,
    login: (callback: (response: any) => void) => {
      window.setTimeout(() => {
        callback({
          status: 'connected',
          authResponse: {
            accessToken: 'short-lived-token',
            userID: 'meta-user-1',
            expiresIn: 3600,
            signedRequest: 'signed-request',
            data_access_expiration_time: 1781044454,
          },
        });
      }, 20);
    },
  };
}

function installFetchMock(scenario: PreviewScenario): void {
  globalThis.fetch = async (input, init) => {
    const requestUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const url = new URL(requestUrl, window.location.origin);
    const pathname = url.pathname;

    if (pathname.endsWith('/agency-platforms/available')) {
      const isSettingsScenario = scenario !== 'onboarding-connect';
      return buildJsonResponse({
        data: isSettingsScenario
          ? [
              {
                platform: 'meta',
                name: 'Meta',
                category: 'recommended',
                connected: true,
                connectedEmail: 'owner@agency.com',
                status: 'active',
                metadata: {
                  selectedBusinessId: SELECTED_BUSINESS.id,
                  selectedBusinessName: SELECTED_BUSINESS.name,
                  metaBusinessAccounts: {
                    businesses: BUSINESSES,
                    hasAccess: true,
                  },
                },
              },
            ]
          : [],
        error: null,
      });
    }

    if (pathname.endsWith('/agency-platforms/meta/business-accounts')) {
      return buildJsonResponse({
        data: {
          businesses: BUSINESSES,
          hasAccess: true,
        },
        error: null,
      });
    }

    if (pathname.endsWith('/agency-platforms/meta/business-login/finalize')) {
      if (scenario === 'onboarding-connect' || scenario === 'settings-switch-business') {
        await delay(10000);
      }

      return buildJsonResponse({
        data: {
          id: 'conn-meta-1',
          agencyId: AGENCY_ID,
          platform: 'meta',
          status: 'active',
          metadata: {
            selectedBusinessId: SELECTED_BUSINESS.id,
            selectedBusinessName: SELECTED_BUSINESS.name,
            metaBusinessAccounts: {
              businesses: BUSINESSES,
              hasAccess: true,
            },
          },
        },
        error: null,
      });
    }

    if (pathname.endsWith('/agency-platforms/meta/asset-settings')) {
      if (init?.method === 'PATCH') {
        return buildJsonResponse({ data: { success: true }, error: null });
      }

      return buildJsonResponse({
        data: {
          adAccount: { enabled: true, permissionLevel: 'analyze' },
          page: { enabled: true, permissionLevel: 'analyze', limitPermissions: false },
          catalog: { enabled: true, permissionLevel: 'analyze' },
          dataset: { enabled: true, requestFullAccess: false },
          instagramAccount: { enabled: true, requestFullAccess: false },
        },
        error: null,
      });
    }

    if (pathname.endsWith('/agency-platforms/meta/business')) {
      return buildJsonResponse({ data: { success: true }, error: null });
    }

    if (pathname.endsWith('/agency-platforms/google/accounts')) {
      return buildJsonResponse({
        data: {
          adsAccounts: [],
          analyticsProperties: [],
          businessAccounts: [],
          tagManagerContainers: [],
          searchConsoleSites: [],
          merchantCenterAccounts: [],
          hasAccess: false,
        },
        error: null,
      });
    }

    return buildJsonResponse({ data: {}, error: null });
  };
}

function PreviewChrome({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Meta Business Login Evidence Harness
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
        </div>

        {children}
      </div>
    </div>
  );
}

function getScenarioCopy(scenario: PreviewScenario) {
  switch (scenario) {
    case 'settings-selected-business':
      return {
        title: 'Meta Settings Selected Business',
        description:
          'The manage-assets modal shows the stored Meta Business Portfolio and the login-time snapshot of available portfolios.',
      };
    case 'settings-switch-business':
      return {
        title: 'Meta Settings Switch Business Re-Auth',
        description:
          'The manage-assets modal is actively re-running Meta Business Login after the user chooses to log in again.',
      };
    case 'onboarding-connect':
    default:
      return {
        title: 'Meta Onboarding Connect',
        description:
          'The onboarding connect surface uses Meta Business Login instead of the legacy redirect-based OAuth initiation path.',
      };
  }
}

function PreviewBody({ scenario }: { scenario: PreviewScenario }) {
  switch (scenario) {
    case 'settings-selected-business':
    case 'settings-switch-business':
      return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <MetaUnifiedSettings agencyId={AGENCY_ID} />
        </div>
      );
    case 'onboarding-connect':
    default:
      return (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <PlatformsPage />
        </div>
      );
  }
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const scenario = parseScenario(params.get('scenario'));
  const copy = getScenarioCopy(scenario);
  const queryClient = React.useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      }),
    []
  );

  React.useEffect(() => {
    installMetaSdkMock();
    installFetchMock(scenario);
  }, [scenario]);

  return (
    <QueryClientProvider client={queryClient}>
      <PreviewChrome title={copy.title} description={copy.description}>
        <PreviewBody scenario={scenario} />
      </PreviewChrome>
    </QueryClientProvider>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Meta Business Login evidence root not found.');
}

ReactDOM.createRoot(rootElement).render(<App />);
