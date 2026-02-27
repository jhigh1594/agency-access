import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.EVIDENCE_BASE_URL || 'http://127.0.0.1:3000';
const OUT_DIR = path.resolve(
  process.cwd(),
  '../../docs/images/internal-admin/2026-02-27'
);

const scenarios = [
  { name: 'overview', url: '/internal/admin', mode: 'success', waitMs: 1200, expectedText: 'Internal Admin' },
  { name: 'agencies', url: '/internal/admin/agencies', mode: 'success', waitMs: 1200, expectedText: 'Agency Monitoring' },
  { name: 'subscriptions', url: '/internal/admin/subscriptions', mode: 'success', waitMs: 1200, expectedText: 'Subscription Monitoring' },
  { name: 'unauthorized', url: '/internal/admin', mode: 'unauthorized', waitMs: 9000, expectedText: 'Internal Admin' },
];

const profiles = [
  {
    name: 'desktop-light',
    contextOptions: { viewport: { width: 1440, height: 900 }, colorScheme: 'light' },
    theme: 'light',
  },
  {
    name: 'mobile-light',
    contextOptions: { viewport: { width: 768, height: 1024 }, colorScheme: 'light' },
    theme: 'light',
  },
];

const mockOverview = {
  mrr: {
    booked: 133.33,
    collectedLast30Days: 199,
    excludedSubscriptions: 1,
    currency: 'usd',
  },
  subscriptions: {
    total: 12,
    active: 9,
    trialing: 2,
    pastDue: 1,
    canceled: 0,
    canceledThisPeriod: 0,
  },
  topUsageAgencies: [
    {
      agencyId: 'agency_1',
      name: 'Northstar Growth',
      email: 'ops@northstar.co',
      tier: 'AGENCY',
      usageScore: 932,
      clientOnboards: 120,
      platformAudits: 800,
      teamSeats: 12,
    },
    {
      agencyId: 'agency_2',
      name: 'Acme Media',
      email: 'hello@acme.media',
      tier: 'STARTER',
      usageScore: 171,
      clientOnboards: 36,
      platformAudits: 120,
      teamSeats: 15,
    },
  ],
};

const mockAgencies = {
  items: [
    {
      id: 'agency_1',
      name: 'Northstar Growth',
      email: 'ops@northstar.co',
      createdAt: '2026-01-01T00:00:00.000Z',
      memberCount: 4,
      subscriptionTier: 'AGENCY',
      subscriptionStatus: 'active',
    },
    {
      id: 'agency_2',
      name: 'Acme Media',
      email: 'hello@acme.media',
      createdAt: '2026-01-08T00:00:00.000Z',
      memberCount: 2,
      subscriptionTier: 'STARTER',
      subscriptionStatus: 'past_due',
    },
  ],
  total: 2,
  page: 1,
  limit: 20,
};

const mockSubscriptions = {
  items: [
    {
      id: 'sub_1',
      agencyId: 'agency_1',
      agencyName: 'Northstar Growth',
      agencyEmail: 'ops@northstar.co',
      tier: 'AGENCY',
      status: 'active',
      currentPeriodStart: '2026-02-01T00:00:00.000Z',
      currentPeriodEnd: '2026-03-01T00:00:00.000Z',
      cancelAtPeriodEnd: false,
      createdAt: '2026-01-15T00:00:00.000Z',
    },
    {
      id: 'sub_2',
      agencyId: 'agency_2',
      agencyName: 'Acme Media',
      agencyEmail: 'hello@acme.media',
      tier: 'STARTER',
      status: 'past_due',
      currentPeriodStart: '2026-02-03T00:00:00.000Z',
      currentPeriodEnd: '2026-03-03T00:00:00.000Z',
      cancelAtPeriodEnd: false,
      createdAt: '2026-01-20T00:00:00.000Z',
    },
  ],
  total: 2,
  page: 1,
  limit: 20,
};

async function installMockRoutes(context, mode) {
  await context.route('**/api/internal-admin/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const pathname = url.pathname;

    if (mode === 'unauthorized') {
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Internal admin access is required',
          },
        }),
      });
    }

    if (pathname.endsWith('/overview')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockOverview, error: null }),
      });
    }

    if (pathname.endsWith('/agencies') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockAgencies, error: null }),
      });
    }

    if (pathname.includes('/agencies/') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            agency: {
              id: 'agency_1',
              name: 'Northstar Growth',
              email: 'ops@northstar.co',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-02-01T00:00:00.000Z',
            },
            subscription: {
              id: 'sub_1',
              tier: 'AGENCY',
              status: 'active',
              currentPeriodStart: '2026-02-01T00:00:00.000Z',
              currentPeriodEnd: '2026-03-01T00:00:00.000Z',
              cancelAtPeriodEnd: false,
            },
            members: [],
            usage: {
              clientOnboards: 120,
              platformAudits: 800,
              teamSeats: 12,
            },
          },
          error: null,
        }),
      });
    }

    if (pathname.endsWith('/subscriptions') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockSubscriptions, error: null }),
      });
    }

    if (pathname.endsWith('/upgrade') && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { tier: 'AGENCY', status: 'active' },
          error: null,
        }),
      });
    }

    if (pathname.endsWith('/cancel') && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { status: 'canceled', cancelAtPeriodEnd: true },
          error: null,
        }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: {}, error: null }),
    });
  });
}

async function captureScenario(browser, profile, scenario) {
  const context = await browser.newContext(profile.contextOptions);
  await installMockRoutes(context, scenario.mode);

  await context.addInitScript((theme) => {
    try {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    } catch {
      // ignore storage issues
    }
  }, profile.theme);

  const page = await context.newPage();
  await page.goto(`${BASE_URL}${scenario.url}`, { waitUntil: 'domcontentloaded' });

  if (profile.name.startsWith('mobile')) {
    await page.waitForTimeout(500);

    for (let attempt = 0; attempt < 4; attempt += 1) {
      if (scenario.expectedText) {
        const isReady = await page.getByText(scenario.expectedText, { exact: false }).isVisible().catch(() => false);
        if (isReady) break;
      }

      const closeButton = page.locator('button:has(.lucide-x)').first();
      const closeIcon = page.locator('div.fixed .lucide-x').first();
      const canClickButton = await closeButton.isVisible({ timeout: 500 }).catch(() => false);
      const canClickIcon = await closeIcon.isVisible({ timeout: 500 }).catch(() => false);

      if (canClickButton) await closeButton.click().catch(() => undefined);
      if (canClickIcon) await closeIcon.click().catch(() => undefined);

      await page.mouse.click(360, 40).catch(() => undefined);
      await page.keyboard.press('Escape').catch(() => undefined);
      await page.waitForTimeout(500);
    }
  }

  await page.waitForTimeout(scenario.waitMs || 1200);

  const fileName = `${profile.name}-${scenario.name}.png`;
  await page.screenshot({
    path: path.join(OUT_DIR, fileName),
    fullPage: true,
  });

  await page.close();
  await context.close();
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    for (const profile of profiles) {
      for (const scenario of scenarios) {
        await captureScenario(browser, profile, scenario);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('Failed to capture internal admin evidence:', error);
  process.exit(1);
});
