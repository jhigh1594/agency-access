import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.EVIDENCE_BASE_URL || 'http://127.0.0.1:3000';
const OUT_DIR = path.resolve(
  process.cwd(),
  '../../docs/images/affiliate-program/2026-03-08'
);

const profiles = [
  {
    name: 'desktop-light',
    contextOptions: { viewport: { width: 1440, height: 960 }, colorScheme: 'light' },
    theme: 'light',
  },
  {
    name: 'mobile-light',
    contextOptions: { viewport: { width: 430, height: 932 }, colorScheme: 'light' },
    theme: 'light',
  },
];

const mockPartnerOverview = {
  partner: {
    id: 'partner_1',
    name: 'Partner One',
    email: 'partner@example.com',
    status: 'approved',
    defaultCommissionBps: 3000,
    commissionDurationMonths: 12,
  },
  metrics: {
    clicks: 142,
    referrals: 18,
    customers: 7,
    pendingCommissionCents: 24850,
    paidCommissionCents: 61800,
  },
  primaryLink: {
    id: 'link_1',
    code: 'partner-one',
    status: 'active',
    destinationPath: '/pricing',
    campaign: null,
    url: 'http://127.0.0.1:3000/r/partner-one',
  },
  links: [
    {
      id: 'link_1',
      code: 'partner-one',
      status: 'active',
      destinationPath: '/pricing',
      campaign: null,
      url: 'http://127.0.0.1:3000/r/partner-one',
    },
    {
      id: 'link_2',
      code: 'partner-one-newsletter',
      status: 'active',
      destinationPath: '/pricing',
      campaign: 'Newsletter',
      url: 'http://127.0.0.1:3000/r/partner-one-newsletter',
    },
  ],
};

const mockPartnerHistory = {
  commissions: [
    {
      id: 'commission_1',
      customerName: 'Acme Agency',
      status: 'approved',
      currency: 'usd',
      amountCents: 6200,
      revenueAmountCents: 20667,
      commissionBps: 3000,
      invoiceDate: '2026-03-01T00:00:00.000Z',
      holdUntil: '2026-03-31T00:00:00.000Z',
      approvedAt: '2026-04-01T00:00:00.000Z',
      paidAt: null,
      voidedAt: null,
      createdAt: '2026-03-02T00:00:00.000Z',
      payoutBatchId: 'batch_1',
      payoutBatchStatus: 'draft',
    },
    {
      id: 'commission_2',
      customerName: 'Northstar Growth',
      status: 'paid',
      currency: 'usd',
      amountCents: 12400,
      revenueAmountCents: 41333,
      commissionBps: 3000,
      invoiceDate: '2026-02-01T00:00:00.000Z',
      holdUntil: '2026-03-02T00:00:00.000Z',
      approvedAt: '2026-03-03T00:00:00.000Z',
      paidAt: '2026-03-15T00:00:00.000Z',
      voidedAt: null,
      createdAt: '2026-02-02T00:00:00.000Z',
      payoutBatchId: 'batch_0',
      payoutBatchStatus: 'paid',
    },
  ],
  payouts: [
    {
      id: 'batch_0',
      status: 'paid',
      currency: 'usd',
      totalAmountCents: 12400,
      commissionCount: 1,
      periodStart: '2026-02-01T00:00:00.000Z',
      periodEnd: '2026-02-29T23:59:59.999Z',
      exportedAt: '2026-03-10T00:00:00.000Z',
      paidAt: '2026-03-15T00:00:00.000Z',
      createdAt: '2026-03-09T00:00:00.000Z',
    },
  ],
};

const mockAdminPartnerList = {
  items: [
    {
      id: 'partner_1',
      name: 'Partner One',
      email: 'partner@example.com',
      companyName: 'Growth Studio',
      websiteUrl: 'https://growth.example.com',
      audienceSize: '10k_to_50k',
      status: 'approved',
      applicationNotes: 'Newsletter plus LinkedIn and customer workshops.',
      defaultCommissionBps: 3000,
      commissionDurationMonths: 12,
      appliedAt: '2026-03-01T00:00:00.000Z',
      approvedAt: '2026-03-08T00:00:00.000Z',
      rejectedAt: null,
      disabledAt: null,
      referralCount: 2,
      commissionCount: 3,
      linkCount: 2,
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
};

const mockAdminPartnerDetail = {
  partner: mockAdminPartnerList.items[0],
  metrics: {
    clicks: 142,
    referrals: 2,
    commissions: 3,
    pendingCommissionCents: 9300,
    paidCommissionCents: 18600,
  },
  links: [
    {
      id: 'link_1',
      code: 'partner-one',
      status: 'active',
      destinationPath: '/pricing',
      campaign: null,
      url: 'http://127.0.0.1:3000/r/partner-one',
      clickCount: 102,
      createdAt: '2026-03-01T00:00:00.000Z',
    },
    {
      id: 'link_2',
      code: 'partner-one-newsletter',
      status: 'disabled',
      destinationPath: '/pricing',
      campaign: 'Newsletter',
      url: 'http://127.0.0.1:3000/r/partner-one-newsletter',
      clickCount: 40,
      createdAt: '2026-03-04T00:00:00.000Z',
    },
  ],
  referrals: [
    {
      id: 'referral_1',
      status: 'qualified',
      referredAgencyName: 'Acme Agency',
      attributionSource: 'link_cookie',
      commissionBps: 3000,
      commissionDurationMonths: 12,
      createdAt: '2026-03-02T00:00:00.000Z',
      qualifiedAt: '2026-03-03T00:00:00.000Z',
      disqualifiedAt: null,
      disqualificationReason: null,
      riskReasons: [],
    },
    {
      id: 'referral_2',
      status: 'disqualified',
      referredAgencyName: 'Northstar Growth',
      attributionSource: 'link_cookie',
      commissionBps: 3000,
      commissionDurationMonths: 12,
      createdAt: '2026-03-05T00:00:00.000Z',
      qualifiedAt: null,
      disqualifiedAt: '2026-03-07T00:00:00.000Z',
      disqualificationReason: 'self_referral_email',
      riskReasons: ['shared_fingerprint'],
    },
  ],
  commissions: [
    {
      id: 'commission_1',
      customerName: 'Acme Agency',
      status: 'review_required',
      amountCents: 3100,
      revenueAmountCents: 10333,
      commissionBps: 3000,
      holdUntil: '2026-04-01T00:00:00.000Z',
      approvedAt: null,
      paidAt: null,
      voidedAt: null,
      invoiceDate: '2026-03-02T00:00:00.000Z',
      notes: 'Needs manual review',
      createdAt: '2026-03-03T00:00:00.000Z',
    },
    {
      id: 'commission_2',
      customerName: 'Northstar Growth',
      status: 'paid',
      amountCents: 6200,
      revenueAmountCents: 20667,
      commissionBps: 3000,
      holdUntil: '2026-03-15T00:00:00.000Z',
      approvedAt: '2026-03-16T00:00:00.000Z',
      paidAt: '2026-03-25T00:00:00.000Z',
      voidedAt: null,
      invoiceDate: '2026-02-14T00:00:00.000Z',
      notes: null,
      createdAt: '2026-02-15T00:00:00.000Z',
    },
  ],
};

const scenarios = [
  {
    name: 'public-affiliate',
    url: '/affiliate',
    expectedText: 'Apply for the pilot cohort',
    waitMs: 1400,
    installRoutes: async () => {},
  },
  {
    name: 'partner-portal',
    url: '/partners',
    expectedText: 'Your primary referral link',
    waitMs: 1800,
    installRoutes: async (context) => {
      await context.route('**/api/affiliate/portal/overview', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: mockPartnerOverview, error: null }),
        });
      });

      await context.route('**/api/affiliate/portal/commissions', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: mockPartnerHistory, error: null }),
        });
      });

      await context.route('**/api/affiliate/portal/links', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: mockPartnerOverview.links[1],
            error: null,
          }),
        });
      });
    },
  },
  {
    name: 'admin-affiliate-review',
    url: '/internal/admin/affiliates',
    expectedText: 'Partner links',
    waitMs: 1800,
    installRoutes: async (context) => {
      await context.route('**/api/internal-admin/affiliate/partners?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: mockAdminPartnerList, error: null }),
        });
      });

      await context.route('**/api/internal-admin/affiliate/partners/partner_1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: mockAdminPartnerDetail, error: null }),
        });
      });
    },
  },
];

async function prepareContext(context, profile) {
  await context.addInitScript((theme) => {
    try {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    } catch {
      // ignore storage issues
    }
  }, profile.theme);
}

async function captureScenario(browser, profile, scenario) {
  const context = await browser.newContext(profile.contextOptions);
  await prepareContext(context, profile);
  await scenario.installRoutes(context);

  const page = await context.newPage();
  await page.goto(`${BASE_URL}${scenario.url}`, { waitUntil: 'domcontentloaded' });
  await page.getByText(scenario.expectedText, { exact: false }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(scenario.waitMs);

  await page.screenshot({
    path: path.join(OUT_DIR, `${profile.name}-${scenario.name}.png`),
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
  console.error('Failed to capture affiliate program evidence:', error);
  process.exit(1);
});
