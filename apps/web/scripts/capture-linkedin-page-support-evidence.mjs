import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium, devices } from 'playwright';

const INTERNAL_BASE_URL = 'http://127.0.0.1:4174';
const BASE_URL = process.env.EVIDENCE_BASE_URL || INTERNAL_BASE_URL;
const OUT_DIR = path.resolve(
  process.cwd(),
  '../../docs/images/linkedin-page-support/2026-03-10'
);

const profiles = [
  {
    name: 'desktop-light',
    contextOptions: {
      viewport: { width: 1440, height: 1100 },
      colorScheme: 'light',
    },
    theme: 'light',
  },
  {
    name: 'mobile-light',
    contextOptions: {
      ...devices['iPhone 13'],
      colorScheme: 'light',
    },
    theme: 'light',
  },
];

const scenarios = [
  {
    name: 'linkedin-page-step2-selection',
    url: '/dev/linkedin-page-support/?scenario=step2-pages',
    expectedText: 'Choose accounts to share',
    prepare: async (page) => {
      await page.getByText('Northwind Dental', { exact: false }).click();
      await page.waitForTimeout(200);
    },
  },
  {
    name: 'linkedin-zero-page-follow-up',
    url: '/dev/linkedin-page-support/?scenario=zero-pages-follow-up',
    expectedText: 'Connected successfully, but some requested LinkedIn products still need follow-up.',
  },
  {
    name: 'linkedin-mixed-summary',
    url: '/dev/linkedin-page-support/?scenario=mixed-summary',
    expectedText: 'Access granted to the accounts you selected.',
  },
  {
    name: 'agency-request-detail-linkedin-pages-unresolved',
    url: '/dev/linkedin-page-support/?scenario=request-detail-unresolved',
    expectedText: 'Still needs follow-up',
  },
];

async function waitForPreviewServer(baseUrl) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/dev/linkedin-page-support/`);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until the preview server is ready.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Preview server did not become ready at ${baseUrl}`);
}

async function startPreviewServer() {
  const preview = spawn(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['exec', 'vite', '--', '--config', 'evidence.vite.config.ts', '--host', '127.0.0.1', '--port', '4174'],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'pipe',
    }
  );

  let output = '';

  const collectOutput = (chunk) => {
    output += chunk.toString();
  };

  preview.stdout.on('data', collectOutput);
  preview.stderr.on('data', collectOutput);

  try {
    await waitForPreviewServer(INTERNAL_BASE_URL);
  } catch (error) {
    preview.kill('SIGTERM');
    throw new Error(
      `Failed to start Vite preview server for LinkedIn page support evidence.\n${output}\n${error}`
    );
  }

  return {
    stop: async () => {
      preview.kill('SIGTERM');
      await new Promise((resolve) => preview.once('exit', resolve));
    },
  };
}

async function captureScenario(browser, profile, scenario) {
  const context = await browser.newContext(profile.contextOptions);

  await context.addInitScript((theme) => {
    try {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    } catch {
      // Ignore storage issues in headless runs.
    }
  }, profile.theme);

  const page = await context.newPage();
  await page.goto(`${BASE_URL}${scenario.url}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.getByText(scenario.expectedText, { exact: false }).first().waitFor({ timeout: 10000 });

  if (scenario.prepare) {
    await scenario.prepare(page);
  }

  await page.screenshot({
    path: path.join(OUT_DIR, `${profile.name}-${scenario.name}.png`),
    fullPage: true,
  });

  await page.close();
  await context.close();
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const previewServer = process.env.EVIDENCE_BASE_URL ? null : await startPreviewServer();
  const browser = await chromium.launch({ headless: true });

  try {
    for (const profile of profiles) {
      for (const scenario of scenarios) {
        await captureScenario(browser, profile, scenario);
      }
    }
  } finally {
    await browser.close();
    if (previewServer) {
      await previewServer.stop();
    }
  }
}

main().catch((error) => {
  console.error('Failed to capture LinkedIn page support evidence:', error);
  process.exit(1);
});
