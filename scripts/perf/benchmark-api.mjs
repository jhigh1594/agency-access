import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { createPerfSessionToken } from './lib/auth.mjs';
import { summarize, round } from './lib/stats.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function arg(name, fallback) {
  const direct = process.argv.find((entry) => entry.startsWith(`${name}=`));
  if (direct) return direct.slice(name.length + 1);

  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];

  return fallback;
}

async function timedFetch(url, init) {
  const startedAt = performance.now();
  const response = await fetch(url, init);
  const bodyText = await response.text();
  const durationMs = performance.now() - startedAt;

  return {
    durationMs,
    status: response.status,
    bodyBytes: Buffer.byteLength(bodyText),
    etag: response.headers.get('etag'),
    cache: response.headers.get('x-cache'),
    responseTime: response.headers.get('x-response-time'),
    body: bodyText,
  };
}

async function main() {
  const apiBase = arg('--api-base', process.env.PERF_API_BASE || 'http://localhost:3001');
  const runs = Number(arg('--runs', process.env.PERF_RUNS || '10'));
  const label = arg('--label', 'baseline');
  const freshTokenPerRun = arg('--fresh-token-per-run', 'false') === 'true';

  const dashboardUrl = `${apiBase}/api/dashboard`;

  const samples = [];

  let latestEtag = null;
  const initialAuth = freshTokenPerRun ? null : await createPerfSessionToken();

  for (let iteration = 1; iteration <= runs; iteration += 1) {
    const auth = freshTokenPerRun ? await createPerfSessionToken() : initialAuth;
    const authHeaders = {
      Authorization: `Bearer ${auth.token}`,
    };
    const agenciesUrl = `${apiBase}/api/agencies?clerkUserId=${encodeURIComponent(auth.userId)}&fields=id,name,email,clerkUserId`;

    const agencies = await timedFetch(agenciesUrl, { headers: authHeaders });
    const dashboard = await timedFetch(dashboardUrl, { headers: authHeaders });

    if (dashboard.etag) {
      latestEtag = dashboard.etag;
    }

    const conditionalHeaders = {
      ...authHeaders,
    };
    if (latestEtag) {
      conditionalHeaders['If-None-Match'] = latestEtag;
    }

    const dashboardConditional = await timedFetch(dashboardUrl, { headers: conditionalHeaders });

    samples.push({
      iteration,
      agencies,
      dashboard,
      dashboardConditional,
      criticalPathMs: round(agencies.durationMs + dashboard.durationMs),
    });

    process.stdout.write(
      `run ${String(iteration).padStart(2, '0')}: ` +
      `agencies=${round(agencies.durationMs)}ms ` +
      `dashboard=${round(dashboard.durationMs)}ms ` +
      `critical=${round(agencies.durationMs + dashboard.durationMs)}ms ` +
      `cond=${round(dashboardConditional.durationMs)}ms\n`
    );
  }

  const agenciesDurations = samples.map((entry) => entry.agencies.durationMs);
  const dashboardDurations = samples.map((entry) => entry.dashboard.durationMs);
  const conditionalDurations = samples.map((entry) => entry.dashboardConditional.durationMs);
  const criticalDurations = samples.map((entry) => entry.criticalPathMs);

  const report = {
    label,
    timestamp: new Date().toISOString(),
    apiBase,
    userId: initialAuth?.userId || null,
    freshTokenPerRun,
    runs,
    summary: {
      agencies: summarize(agenciesDurations),
      dashboard: summarize(dashboardDurations),
      dashboardConditional: summarize(conditionalDurations),
      criticalPath: summarize(criticalDurations),
      firstRun: {
        agenciesMs: round(samples[0].agencies.durationMs),
        dashboardMs: round(samples[0].dashboard.durationMs),
        criticalPathMs: samples[0].criticalPathMs,
      },
    },
    samples,
  };

  const outputFile = path.join(__dirname, 'results', `api-${label}-${Date.now()}.json`);
  await fs.writeFile(outputFile, JSON.stringify(report, null, 2));

  process.stdout.write(`\nSaved API benchmark report: ${outputFile}\n`);
  process.stdout.write(`Critical path mean: ${report.summary.criticalPath.meanMs}ms\n`);
  process.stdout.write(`Critical path p95: ${report.summary.criticalPath.p95Ms}ms\n`);
}

main().catch((error) => {
  console.error('benchmark-api failed:', error);
  process.exit(1);
});
