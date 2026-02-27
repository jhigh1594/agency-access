#!/usr/bin/env node

import fs from 'node:fs';

const DEFAULT_RUNS = Number(process.env.BENCH_RUNS || 50);
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const AUTH_TOKEN = process.env.BENCH_AUTH_TOKEN;
const AGENCY_ID = process.env.BENCH_AGENCY_ID || 'agency-1';
const CLERK_USER_ID = process.env.BENCH_CLERK_USER_ID || 'user_123';
const CONNECTION_ID = process.env.BENCH_CONNECTION_ID || 'connection-1';
const BASELINE_PATH = process.env.BENCH_BASELINE_PATH;
const P95_BUDGET_PERCENT = Number(process.env.BENCH_P95_BUDGET_PERCENT || 5);

if (!AUTH_TOKEN) {
  console.error('Missing BENCH_AUTH_TOKEN. Aborting.');
  process.exit(1);
}

const scenarios = [
  {
    key: 'agencies_list',
    method: 'GET',
    path: `/api/agencies?clerkUserId=${encodeURIComponent(CLERK_USER_ID)}&fields=id,name,email,clerkUserId`,
  },
  {
    key: 'agencies_get',
    method: 'GET',
    path: `/api/agencies/${AGENCY_ID}`,
  },
  {
    key: 'meta_complete_oauth',
    method: 'POST',
    path: '/agency-platforms/meta/complete-oauth',
    body: {
      agencyId: AGENCY_ID,
      connectionId: CONNECTION_ID,
      businessId: '123456789012345',
      businessName: 'Benchmark Business',
    },
  },
  {
    key: 'identity_verify',
    method: 'PUT',
    path: `/agency-platforms/${CONNECTION_ID}/verify`,
  },
];

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function runScenario(scenario, runs) {
  const latencies = [];
  const statusCodes = [];

  for (let i = 0; i < runs; i += 1) {
    const started = process.hrtime.bigint();
    const response = await fetch(`${BASE_URL}${scenario.path}`, {
      method: scenario.method,
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: scenario.body ? JSON.stringify(scenario.body) : undefined,
    });
    const elapsedNs = process.hrtime.bigint() - started;
    const elapsedMs = Number(elapsedNs) / 1_000_000;

    latencies.push(elapsedMs);
    statusCodes.push(response.status);

    // Consume body to avoid leaking sockets during benchmark runs.
    await response.text();
  }

  const p50 = percentile(latencies, 50);
  const p95 = percentile(latencies, 95);
  const p99 = percentile(latencies, 99);
  const avg = latencies.reduce((sum, value) => sum + value, 0) / latencies.length;

  return {
    key: scenario.key,
    method: scenario.method,
    path: scenario.path,
    runs,
    avgMs: Number(avg.toFixed(2)),
    p50Ms: Number(p50.toFixed(2)),
    p95Ms: Number(p95.toFixed(2)),
    p99Ms: Number(p99.toFixed(2)),
    minStatus: Math.min(...statusCodes),
    maxStatus: Math.max(...statusCodes),
  };
}

function loadBaseline(path) {
  if (!path) return null;
  if (!fs.existsSync(path)) return null;
  const raw = fs.readFileSync(path, 'utf8');
  return JSON.parse(raw);
}

function evaluateBudget(current, baseline) {
  if (!baseline) return { pass: true, regressions: [] };

  const byKey = new Map((baseline.results || []).map((entry) => [entry.key, entry]));
  const regressions = [];

  for (const result of current.results) {
    const previous = byKey.get(result.key);
    if (!previous || !previous.p95Ms) continue;

    const allowed = previous.p95Ms * (1 + P95_BUDGET_PERCENT / 100);
    if (result.p95Ms > allowed) {
      regressions.push({
        key: result.key,
        baselineP95Ms: previous.p95Ms,
        currentP95Ms: result.p95Ms,
        allowedP95Ms: Number(allowed.toFixed(2)),
      });
    }
  }

  return {
    pass: regressions.length === 0,
    regressions,
  };
}

async function main() {
  const results = [];
  for (const scenario of scenarios) {
    // eslint-disable-next-line no-await-in-loop
    const summary = await runScenario(scenario, DEFAULT_RUNS);
    results.push(summary);
  }

  const output = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    runsPerScenario: DEFAULT_RUNS,
    budget: {
      metric: 'p95',
      maxRegressionPercent: P95_BUDGET_PERCENT,
    },
    results,
  };

  const baseline = loadBaseline(BASELINE_PATH);
  const budget = evaluateBudget(output, baseline);
  output.budgetCheck = budget;

  console.table(
    results.map((result) => ({
      endpoint: `${result.method} ${result.path}`,
      avgMs: result.avgMs,
      p95Ms: result.p95Ms,
      p99Ms: result.p99Ms,
      statusRange: `${result.minStatus}-${result.maxStatus}`,
    }))
  );

  if (BASELINE_PATH) {
    if (budget.pass) {
      console.log(`p95 budget check passed (<= +${P95_BUDGET_PERCENT}%).`);
    } else {
      console.error(`p95 budget check failed (>${P95_BUDGET_PERCENT}% regression).`);
      console.error(JSON.stringify(budget.regressions, null, 2));
    }
  }

  const json = JSON.stringify(output, null, 2);
  console.log(json);

  if (process.env.BENCH_OUTPUT_PATH) {
    fs.writeFileSync(process.env.BENCH_OUTPUT_PATH, json);
  }

  if (BASELINE_PATH && !budget.pass) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
