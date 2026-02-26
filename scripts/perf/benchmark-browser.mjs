import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createPerfSessionToken } from './lib/auth.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function arg(name, fallback) {
  const direct = process.argv.find((entry) => entry.startsWith(`${name}=`));
  if (direct) return direct.slice(name.length + 1);

  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];

  return fallback;
}

async function main() {
  const appBase = arg('--app-base', process.env.PERF_APP_BASE || 'http://localhost:3000');
  const label = arg('--label', 'baseline');
  const url = `${appBase}/dashboard`;

  const auth = await createPerfSessionToken();

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleTimings = [];
  const trackedRequests = new WeakMap();
  const apiRequests = [];

  page.on('console', (message) => {
    const text = message.text();
    if (text.includes('dashboard:') || text.includes('layout:')) {
      consoleTimings.push({
        type: message.type(),
        text,
      });
    }
  });

  page.on('request', (request) => {
    const url = request.url();
    if (!url.includes('/api/agencies') && !url.includes('/api/dashboard')) {
      return;
    }

    trackedRequests.set(request, performance.now());
  });

  page.on('response', async (response) => {
    const request = response.request();
    const startedAt = trackedRequests.get(request);
    if (!startedAt) {
      return;
    }

    const finishedAt = performance.now();
    apiRequests.push({
      url: response.url(),
      status: response.status(),
      method: request.method(),
      durationMs: Number((finishedAt - startedAt).toFixed(2)),
    });
  });

  await page.addInitScript((data) => {
    window.localStorage.setItem('__perf_auth_token', data.token);
    window.localStorage.setItem('__perf_principal_id', data.userId);
  }, {
    token: auth.token,
    userId: auth.userId,
  });

  const cdp = await context.newCDPSession(page);
  const traceEvents = [];
  cdp.on('Tracing.dataCollected', (payload) => {
    traceEvents.push(...payload.value);
  });
  const tracingDone = new Promise((resolve) => {
    cdp.once('Tracing.tracingComplete', resolve);
  });

  await cdp.send('Tracing.start', {
    categories: [
      'devtools.timeline',
      'disabled-by-default-devtools.timeline',
      'blink.user_timing',
      'loading',
      'network',
      'v8.execute',
    ].join(','),
    transferMode: 'ReportEvents',
  });

  const navStartedAt = performance.now();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForSelector('text=Dashboard', { timeout: 120000 });
  const navDurationMs = performance.now() - navStartedAt;

  const performanceEntries = await page.evaluate(() => {
    const [nav] = performance.getEntriesByType('navigation');
    const paints = performance.getEntriesByType('paint').map((entry) => ({
      name: entry.name,
      startTime: entry.startTime,
    }));
    const measures = performance.getEntriesByType('measure').map((entry) => ({
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
    }));

    return {
      navigation: nav ? {
        domContentLoadedMs: nav.domContentLoadedEventEnd,
        loadEventMs: nav.loadEventEnd,
        transferSize: nav.transferSize,
      } : null,
      paints,
      measures,
    };
  });

  await cdp.send('Tracing.end');
  await tracingDone;
  const traceJson = JSON.stringify({ traceEvents });

  const traceFile = path.join(__dirname, 'traces', `dashboard-${label}-${Date.now()}.json`);
  const screenshotFile = path.join(__dirname, 'traces', `dashboard-${label}-${Date.now()}.png`);
  const reportFile = path.join(__dirname, 'results', `browser-${label}-${Date.now()}.json`);

  await fs.writeFile(traceFile, traceJson);
  await page.screenshot({ path: screenshotFile, fullPage: true });

  const report = {
    label,
    timestamp: new Date().toISOString(),
    url,
    userId: auth.userId,
    navigationDurationMs: Number(navDurationMs.toFixed(2)),
    performanceEntries,
    consoleTimings,
    apiRequests,
    traceFile,
    screenshotFile,
  };

  await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

  await browser.close();

  process.stdout.write(`Saved browser benchmark report: ${reportFile}\n`);
  process.stdout.write(`Saved trace: ${traceFile}\n`);
  process.stdout.write(`Navigation duration: ${report.navigationDurationMs}ms\n`);
}

main().catch((error) => {
  console.error('benchmark-browser failed:', error);
  process.exit(1);
});
