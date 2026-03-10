import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium, devices } from 'playwright';

const INTERNAL_BASE_URL = 'http://127.0.0.1:4173';
const BASE_URL = process.env.EVIDENCE_BASE_URL || INTERNAL_BASE_URL;
const OUT_DIR = path.resolve(
  process.cwd(),
  '../../docs/images/client-detail-platform-status/2026-03-10'
);

const scenarios = [
  {
    name: 'fully-connected',
    url: '/dev/client-detail/?preset=fully-connected',
    expectedText: 'Core reporting stack',
  },
  {
    name: 'mixed-google-expanded',
    url: '/dev/client-detail/?preset=mixed-google&expand=google',
    expectedText: 'No merchant accounts discovered',
  },
  {
    name: 'revoked-meta',
    url: '/dev/client-detail/?preset=revoked-meta&expand=meta',
    expectedText: 'Connection was revoked by the client',
  },
  {
    name: 'empty-client',
    url: '/dev/client-detail/?preset=empty-client',
    expectedText: 'No requested platforms yet',
  },
  {
    name: 'multi-request-history',
    url: '/dev/client-detail/?preset=multi-request-history',
    expectedText: 'Spring campaign setup',
  },
];

const profiles = [
  {
    name: 'desktop-light',
    contextOptions: {
      viewport: { width: 1440, height: 900 },
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

async function waitForPreviewServer(baseUrl) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/dev/client-detail/`);
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
    ['exec', 'vite', '--', '--config', 'vitest.config.ts', '--host', '127.0.0.1', '--port', '4173'],
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
      `Failed to start Vite preview server for client-detail evidence.\n${output}\n${error}`
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

  const signInHeading = page.getByRole('heading', { name: /sign in/i });
  if (await signInHeading.isVisible().catch(() => false)) {
    throw new Error(
      'Harness route redirected to Clerk. Run the dev server with NEXT_PUBLIC_BYPASS_AUTH=true.'
    );
  }

  await page.getByText(scenario.expectedText, { exact: false }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(400);

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
  console.error('Failed to capture client detail evidence:', error);
  process.exit(1);
});
