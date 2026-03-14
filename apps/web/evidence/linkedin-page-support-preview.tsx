import { useCallback, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { CheckCircle2 } from 'lucide-react';
import { LinkedInAssetSelector } from '@/components/client-auth/LinkedInAssetSelector';
import { RequestPlatformsCard } from '@/components/access-request-detail/request-platforms-card';
import { Button, PlatformIcon } from '@/components/ui';
import '@/app/globals.css';

type PreviewScenario =
  | 'step2-pages'
  | 'zero-pages-follow-up'
  | 'mixed-summary'
  | 'request-detail-unresolved';

const SCENARIOS: PreviewScenario[] = [
  'step2-pages',
  'zero-pages-follow-up',
  'mixed-summary',
  'request-detail-unresolved',
];

const PAGE_ASSETS = [
  {
    id: 'urn:li:organization:1001',
    name: 'Northwind Health',
    urn: 'urn:li:organization:1001',
    vanityName: 'northwind-health',
    status: 'ACTIVE',
  },
  {
    id: 'urn:li:organization:1002',
    name: 'Northwind Dental',
    urn: 'urn:li:organization:1002',
    vanityName: 'northwind-dental',
    status: 'ACTIVE',
  },
];

const AD_ASSETS = [
  {
    id: '600100',
    name: 'Northwind Core Ads',
    reference: 'Account 600100',
    status: 'ACTIVE',
  },
  {
    id: '600200',
    name: 'Northwind Expansion Ads',
    reference: 'Account 600200',
    status: 'ACTIVE',
  },
];

function parseScenario(rawScenario: string | null): PreviewScenario {
  if (rawScenario && SCENARIOS.includes(rawScenario as PreviewScenario)) {
    return rawScenario as PreviewScenario;
  }

  return 'step2-pages';
}

function buildJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function installFetchMock(scenario: PreviewScenario): void {
  globalThis.fetch = async (input) => {
    const requestUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const url = new URL(requestUrl, window.location.origin);
    const pathname = url.pathname;

    if (pathname.endsWith('/assets/linkedin_pages')) {
      const pages = scenario === 'step2-pages' ? PAGE_ASSETS : [];
      return buildJsonResponse({ data: pages, error: null });
    }

    if (pathname.endsWith('/assets/linkedin_ads')) {
      return buildJsonResponse({ data: AD_ASSETS, error: null });
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
            LinkedIn Pages Evidence Harness
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
        </div>

        {children}
      </div>
    </div>
  );
}

function StepShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl border-2 border-black bg-card shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
      <div className="border-b-2 border-black bg-muted/20 px-6 py-5">
        <h2 className="font-display text-3xl font-bold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-8 p-6">{children}</div>

      {footer ? <div className="border-t-2 border-black bg-card px-6 py-5">{footer}</div> : null}
    </div>
  );
}

function ProductSummaryCard({
  product,
  lines,
  warning = false,
}: {
  product: 'linkedin_pages' | 'linkedin_ads';
  lines: string[];
  warning?: boolean;
}) {
  return (
    <div
      className={`p-6 text-left ${
        warning
          ? 'border-2 border-[var(--warning)] bg-[var(--warning)]/10'
          : 'border-2 border-[var(--teal)] bg-[var(--teal)]/5'
      }`}
    >
      <div className="mb-3 flex items-center gap-3">
        <PlatformIcon platform={product} size="sm" />
        <h3 className="font-display text-lg font-bold text-[var(--teal)]">
          {product === 'linkedin_pages' ? 'LinkedIn Pages' : 'LinkedIn Ads'}
        </h3>
      </div>
      <ul className="space-y-1 text-sm">
        {lines.map((line) => (
          <li
            key={line}
            className={line.startsWith('Follow-up needed') ? 'font-medium text-[var(--warning)]' : ''}
          >
            {line.startsWith('Follow-up needed') ? line : `✓ ${line}`}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Step2SelectionPreview() {
  const [selection, setSelection] = useState<{ pages: string[]; availableAssetCount: number }>({
    pages: [],
    availableAssetCount: PAGE_ASSETS.length,
  });

  const handleSelectionChange = useCallback((selectedAssets: { pages?: string[]; availableAssetCount?: number }) => {
    setSelection({
      pages: selectedAssets.pages ?? [],
      availableAssetCount: selectedAssets.availableAssetCount ?? 0,
    });
  }, []);

  return (
    <PreviewChrome
      title="LinkedIn Pages Step 2"
      description="Client-side account selection after LinkedIn OAuth with selectable pages."
    >
      <StepShell
        title="Choose accounts to share"
        description="Select the specific LinkedIn Pages you want to share."
        footer={
          <div className="flex justify-center">
            <Button size="xl" variant="brutalist-rounded" disabled={selection.pages.length === 0}>
              Save selected accounts
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b-2 border-black pb-2">
            <PlatformIcon platform="linkedin_pages" size="sm" />
            <h3 className="font-display text-xl font-bold text-ink">LinkedIn Pages</h3>
          </div>

          <LinkedInAssetSelector
            sessionId="preview-linkedin-connection"
            accessRequestToken="preview-token"
            product="linkedin_pages"
            onSelectionChange={handleSelectionChange}
          />
        </div>
      </StepShell>
    </PreviewChrome>
  );
}

function ZeroPagesFollowUpPreview() {
  return (
    <PreviewChrome
      title="LinkedIn Pages Follow-Up"
      description="Client flow after LinkedIn OAuth when no administered pages are discoverable."
    >
      <StepShell
        title="Connected"
        description="Connected successfully, but some requested LinkedIn products still need follow-up."
        footer={
          <div className="flex justify-center">
            <Button size="xl" variant="brutalist-rounded">Finish preview</Button>
          </div>
        }
      >
        <div className="flex justify-center">
          <div className="inline-flex h-24 w-24 items-center justify-center border-2 border-[var(--teal)] bg-[var(--teal)]/10">
            <CheckCircle2 className="h-16 w-16 text-[var(--teal)]" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ProductSummaryCard
            product="linkedin_pages"
            lines={['Follow-up needed: No pages found yet']}
            warning
          />
        </div>
      </StepShell>
    </PreviewChrome>
  );
}

function MixedSummaryPreview() {
  return (
    <PreviewChrome
      title="Mixed LinkedIn Ads + Pages Summary"
      description="Final invite state after the client selects both Campaign Manager accounts and LinkedIn Pages."
    >
      <StepShell
        title="Connected"
        description="Access granted to the accounts you selected."
        footer={
          <div className="flex justify-center">
            <Button size="xl" variant="brutalist-rounded">Finish preview</Button>
          </div>
        }
      >
        <div className="flex justify-center">
          <div className="inline-flex h-24 w-24 items-center justify-center border-2 border-[var(--teal)] bg-[var(--teal)]/10">
            <CheckCircle2 className="h-16 w-16 text-[var(--teal)]" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ProductSummaryCard product="linkedin_ads" lines={['2 Ad Accounts selected']} />
          <ProductSummaryCard product="linkedin_pages" lines={['1 Page selected']} />
        </div>
      </StepShell>
    </PreviewChrome>
  );
}

function RequestDetailPreview() {
  return (
    <PreviewChrome
      title="Agency Request Detail"
      description="Request detail panel showing LinkedIn Pages unresolved follow-up truth after OAuth completes without discovered pages."
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h2 className="font-display text-3xl font-semibold text-ink">Access Request Details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review request configuration and lifecycle status before taking action.
          </p>
        </div>

        <RequestPlatformsCard
          request={{
            id: 'request-linkedin-pages-1',
            agencyId: 'agency-1',
            clientName: 'Northwind Health',
            clientEmail: 'marketing@northwindhealth.com',
            platforms: [
              {
                platformGroup: 'linkedin',
                products: [
                  { product: 'linkedin_ads', accessLevel: 'admin', accounts: [] },
                  { product: 'linkedin_pages', accessLevel: 'admin', accounts: [] },
                ],
              },
            ],
            status: 'partial',
            uniqueToken: 'preview-token',
            expiresAt: '2026-03-17T00:00:00.000Z',
            createdAt: '2026-03-10T12:00:00.000Z',
            updatedAt: '2026-03-10T12:30:00.000Z',
            authorizationProgress: {
              completedPlatforms: ['linkedin'],
              isComplete: false,
              fulfilledProducts: [
                {
                  platformGroup: 'linkedin',
                  product: 'linkedin_ads',
                },
              ],
              unresolvedProducts: [
                {
                  platformGroup: 'linkedin',
                  product: 'linkedin_pages',
                  reason: 'no_assets',
                },
              ],
            },
          }}
        />
      </div>
    </PreviewChrome>
  );
}

function LinkedInPageSupportPreview() {
  const scenario = parseScenario(new URLSearchParams(window.location.search).get('scenario'));

  switch (scenario) {
    case 'step2-pages':
      return <Step2SelectionPreview />;
    case 'zero-pages-follow-up':
      return <ZeroPagesFollowUpPreview />;
    case 'mixed-summary':
      return <MixedSummaryPreview />;
    case 'request-detail-unresolved':
      return <RequestDetailPreview />;
  }
}

installFetchMock(parseScenario(new URLSearchParams(window.location.search).get('scenario')));

ReactDOM.createRoot(document.getElementById('root')!).render(<LinkedInPageSupportPreview />);
