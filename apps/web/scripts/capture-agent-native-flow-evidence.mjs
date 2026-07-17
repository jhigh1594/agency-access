import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium, devices } from 'playwright';

const INTERNAL_BASE_URL = 'http://127.0.0.1:4176';
const BASE_URL = process.env.EVIDENCE_BASE_URL || INTERNAL_BASE_URL;
const OUT_DIR = path.resolve(process.cwd(), '../../docs/images/agent-native-access-operations/2026-07-17');
const scenarios = ['settings', 'pending', 'approved', 'declined', 'expired', 'canceled'];
const profiles = [{ name: 'desktop', options: { viewport: { width: 1440, height: 1100 }, colorScheme: 'light' } }, { name: 'mobile', options: { ...devices['iPhone 13'], colorScheme: 'light' } }];

async function browserLaunchOptions() {
  const systemChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  try {
    await fs.access(systemChrome);
    return { headless: true, executablePath: systemChrome };
  } catch {
    return { headless: true };
  }
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(`${INTERNAL_BASE_URL}/dev/agent-native/`)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Agent-native evidence preview did not start');
}

async function startServer() {
  if (BASE_URL !== INTERNAL_BASE_URL) return null;
  const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['exec', 'vite', '--', '--config', 'evidence.vite.config.ts', '--host', '127.0.0.1', '--port', '4176'], { cwd: process.cwd(), stdio: 'pipe' });
  await waitForServer();
  return child;
}

await fs.mkdir(OUT_DIR, { recursive: true });
const server = await startServer();
const browser = await chromium.launch(await browserLaunchOptions());
try {
  for (const profile of profiles) {
    const context = await browser.newContext(profile.options);
    const page = await context.newPage();
    for (const scenario of scenarios) {
      await page.goto(`${BASE_URL}/dev/agent-native/?scenario=${scenario}`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(OUT_DIR, `${scenario}-${profile.name}.png`), fullPage: true });
    }
    await context.close();
  }
} finally {
  await browser.close();
  if (server) { server.kill('SIGTERM'); await new Promise((resolve) => server.once('exit', resolve)); }
}
console.log(`Agent-native evidence written to ${OUT_DIR}`);
