import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, devices } from 'playwright';

const BASE_URL = process.env.EVIDENCE_BASE_URL || 'http://127.0.0.1:3000';
const OUT_DIR = path.resolve(
  process.cwd(),
  '../../docs/images/client-request-flow/2026-02-27'
);
const TOKEN = 'evidence-token';
const DELAYED_TOKEN = 'evidence-delayed-token';
const TIMEOUT_TOKEN = 'evidence-timeout-token';

const REQUEST_PAYLOAD = {
  id: 'request-evidence',
  agencyId: 'agency-123',
  agencyName: 'Northstar Growth',
  clientName: 'Acme Co',
  clientEmail: 'marketing@acme.co',
  authModel: 'delegated_access',
  status: 'pending',
  uniqueToken: TOKEN,
  expiresAt: '2026-03-06T00:00:00.000Z',
  platforms: [
    {
      platformGroup: 'google',
      products: [{ product: 'google_ads', accessLevel: 'admin' }],
    },
    {
      platformGroup: 'meta',
      products: [{ product: 'meta_ads', accessLevel: 'standard' }],
    },
  ],
  intakeFields: [],
  branding: {},
  manualInviteTargets: {
    beehiiv: { agencyEmail: 'ops@northstar.co' },
    kit: { agencyEmail: 'ops@northstar.co' },
    pinterest: { agencyEmail: 'ops@northstar.co', businessId: '123456789' },
  },
  authorizationProgress: {
    completedPlatforms: ['google'],
    isComplete: false,
  },
};

const SUCCESS_PAYLOAD = {
  id: 'evidence-success',
  agencyId: 'agency-123',
  clientName: 'Acme Co',
  clientEmail: 'marketing@acme.co',
  authModel: 'delegated_access',
  platforms: [
    {
      platformGroup: 'google',
      products: [{ product: 'google_ads', accessLevel: 'admin' }],
    },
    {
      platformGroup: 'meta',
      products: [{ product: 'meta_ads', accessLevel: 'standard' }],
    },
  ],
  status: 'pending',
  uniqueToken: TOKEN,
  expiresAt: '2026-03-06T00:00:00.000Z',
  createdAt: '2026-02-27T00:00:00.000Z',
  updatedAt: '2026-02-27T00:00:00.000Z',
  intakeFields: [],
  branding: {},
};

const scenarios = [
  { name: 'creator-wizard', url: '/access-requests/new' },
  { name: 'creator-success', url: '/access-requests/evidence-success/success' },
  { name: 'invite-core', url: `/invite/${TOKEN}` },
  { name: 'invite-delayed', url: `/invite/${DELAYED_TOKEN}`, waitMs: 9000 },
  { name: 'invite-timeout', url: `/invite/${TIMEOUT_TOKEN}`, waitMs: 21000 },
  { name: 'invite-invalid', url: '/invite/invalid-token' },
  { name: 'oauth-callback-error', url: '/invite/oauth-callback?error=access_denied&platform=meta' },
  { name: 'manual-beehiiv', url: `/invite/${TOKEN}/beehiiv/manual` },
  { name: 'manual-kit', url: `/invite/${TOKEN}/kit/manual` },
  { name: 'manual-pinterest', url: `/invite/${TOKEN}/pinterest/manual` },
];

const profiles = [
  {
    name: 'desktop-light',
    contextOptions: { viewport: { width: 1440, height: 900 }, colorScheme: 'light' },
    theme: 'light',
  },
  {
    name: 'desktop-dark',
    contextOptions: { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' },
    theme: 'dark',
  },
  {
    name: 'mobile-light',
    contextOptions: { ...devices['iPhone 13'], colorScheme: 'light' },
    theme: 'light',
  },
  {
    name: 'mobile-dark',
    contextOptions: { ...devices['iPhone 13'], colorScheme: 'dark' },
    theme: 'dark',
  },
];

async function mockApi(context) {
  await context.route('**/*', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const pathname = url.pathname;

    if (!pathname.includes('/api/') && !pathname.includes('/agency-platforms/') && !pathname.includes('/agencies/')) {
      return route.continue();
    }

    if (pathname === '/api/client/invalid-token') {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          error: { code: 'REQUEST_EXPIRED', message: 'Access request expired' },
        }),
      });
    }

    if (pathname === `/api/client/${TOKEN}`) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: REQUEST_PAYLOAD, error: null }),
      });
    }

    if (pathname === `/api/client/${DELAYED_TOKEN}`) {
      await new Promise((resolve) => setTimeout(resolve, 9000));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            ...REQUEST_PAYLOAD,
            uniqueToken: DELAYED_TOKEN,
          },
          error: null,
        }),
      });
    }

    if (pathname === `/api/client/${TIMEOUT_TOKEN}`) {
      await new Promise((resolve) => setTimeout(resolve, 30000));
      try {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              ...REQUEST_PAYLOAD,
              uniqueToken: TIMEOUT_TOKEN,
            },
            error: null,
          }),
        });
      } catch {
        return;
      }
    }

    if (pathname === `/api/client/${TOKEN}/complete` && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { success: true }, error: null }),
      });
    }

    if (pathname === `/api/client/${TOKEN}/agency-business-id`) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { businessId: '123456789', businessName: 'Acme Ads' }, error: null }),
      });
    }

    if (pathname === '/api/agencies') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ id: 'agency-123', name: 'Northstar Growth' }],
          error: null,
        }),
      });
    }

    if (pathname === '/agency-platforms/available') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { platform: 'google', connected: true, status: 'active' },
            { platform: 'meta', connected: true, status: 'active' },
            { platform: 'kit', connected: true, status: 'active' },
            { platform: 'pinterest', connected: true, status: 'active' },
          ],
          error: null,
        }),
      });
    }

    if (pathname === '/api/clients' && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'client-1',
              agencyId: 'agency-123',
              name: 'Acme Co',
              company: 'Acme Co',
              email: 'marketing@acme.co',
              website: 'https://acme.co',
              language: 'en',
              createdAt: '2026-02-01T00:00:00.000Z',
              updatedAt: '2026-02-01T00:00:00.000Z',
            },
          ],
          error: null,
        }),
      });
    }

    if (pathname === '/agencies/agency-123/templates') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], error: null }),
      });
    }

    if (pathname === '/api/access-requests/evidence-success') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: SUCCESS_PAYLOAD, error: null }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: {}, error: null }),
    });
  });
}

async function captureProfile(browser, profile) {
  const context = await browser.newContext(profile.contextOptions);
  await mockApi(context);

  await context.addInitScript((theme) => {
    try {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    } catch {
      // Ignore localStorage issues in non-persistent contexts.
    }
  }, profile.theme);

  for (const scenario of scenarios) {
    const page = await context.newPage();
    await page.goto(`${BASE_URL}${scenario.url}`, { waitUntil: 'domcontentloaded' });

    if (scenario.name === 'creator-wizard') {
      await page.getByText('New Access Request').waitFor({ timeout: 15000 }).catch(() => undefined);
    }

    if (scenario.name === 'invite-core') {
      await page.getByText('Authorize access for').waitFor({ timeout: 15000 }).catch(() => undefined);
    }

    if (profile.name.startsWith('mobile') && scenario.name.startsWith('creator-')) {
      const closeIcon = page.locator('div.fixed .lucide-x').first();
      const canClose = await closeIcon.isVisible({ timeout: 1500 }).catch(() => false);
      if (canClose) {
        await closeIcon.click();
      }
      await page.waitForTimeout(350);
    }

    await page.waitForTimeout(scenario.waitMs || 800);

    const fileName = `${profile.name}-${scenario.name}.png`;
    await page.screenshot({
      path: path.join(OUT_DIR, fileName),
      fullPage: true,
    });
    await page.close();
  }

  await context.close();
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    for (const profile of profiles) {
      await captureProfile(browser, profile);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('Failed to capture flow evidence:', error);
  process.exit(1);
});
