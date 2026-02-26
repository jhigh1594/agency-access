import fs from 'node:fs/promises';
import path from 'node:path';

function arg(name, fallback) {
  const direct = process.argv.find((entry) => entry.startsWith(`${name}=`));
  if (direct) return direct.slice(name.length + 1);

  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];

  return fallback;
}

function readJson(filePath) {
  return fs.readFile(filePath, 'utf8').then((raw) => JSON.parse(raw));
}

function percentChange(before, after) {
  if (before === 0) return 0;
  return ((after - before) / before) * 100;
}

function fmtMs(value) {
  return `${value.toFixed(2)} ms`;
}

function toRequestSummary(apiRequests) {
  const grouped = new Map();
  for (const req of apiRequests || []) {
    const url = req.url.includes('/api/agencies') ? '/api/agencies' : '/api/dashboard';
    if (!grouped.has(url)) {
      grouped.set(url, { count: 0, durations: [] });
    }
    const item = grouped.get(url);
    item.count += 1;
    item.durations.push(req.durationMs);
  }

  return [...grouped.entries()].map(([url, value]) => ({
    url,
    count: value.count,
    meanMs: value.durations.reduce((acc, current) => acc + current, 0) / value.durations.length,
  }));
}

async function main() {
  const baselineApiPath = arg('--baseline-api', 'scripts/perf/results/api-baseline-1772078666088.json');
  const finalApiPath = arg('--final-api', 'scripts/perf/results/api-final-1772079625774.json');
  const baselineBrowserPath = arg('--baseline-browser', 'scripts/perf/results/browser-baseline-net-1772079054778.json');
  const finalBrowserPath = arg('--final-browser', 'scripts/perf/results/browser-final-rerun-1772079642445.json');
  const outputPath = arg('--out', 'scripts/perf/results/performance-report.html');

  const [baselineApi, finalApi, baselineBrowser, finalBrowser] = await Promise.all([
    readJson(baselineApiPath),
    readJson(finalApiPath),
    readJson(baselineBrowserPath),
    readJson(finalBrowserPath),
  ]);

  const metrics = [
    {
      label: 'Browser Navigation',
      before: baselineBrowser.navigationDurationMs,
      after: finalBrowser.navigationDurationMs,
    },
    {
      label: 'Browser FCP',
      before: baselineBrowser.performanceEntries.paints.find((entry) => entry.name === 'first-contentful-paint')?.startTime || 0,
      after: finalBrowser.performanceEntries.paints.find((entry) => entry.name === 'first-contentful-paint')?.startTime || 0,
    },
    {
      label: 'Browser DCL',
      before: baselineBrowser.performanceEntries.navigation.domContentLoadedMs,
      after: finalBrowser.performanceEntries.navigation.domContentLoadedMs,
    },
    {
      label: 'API Critical Mean',
      before: baselineApi.summary.criticalPath.meanMs,
      after: finalApi.summary.criticalPath.meanMs,
    },
    {
      label: 'API Critical P95',
      before: baselineApi.summary.criticalPath.p95Ms,
      after: finalApi.summary.criticalPath.p95Ms,
    },
  ];

  const maxBarValue = Math.max(...metrics.flatMap((metric) => [metric.before, metric.after]));

  const baselineReqSummary = toRequestSummary(baselineBrowser.apiRequests);
  const finalReqSummary = toRequestSummary(finalBrowser.apiRequests);

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard Performance Report</title>
  <style>
    :root {
      --bg: #f5f3ef;
      --card: #ffffff;
      --ink: #171717;
      --muted: #6b7280;
      --before: #f97316;
      --after: #14b8a6;
      --grid: #e5e7eb;
      --good: #0f766e;
      --bad: #b91c1c;
    }

    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      background: linear-gradient(145deg, #f5f3ef, #ece8df);
      color: var(--ink);
    }

    .wrap {
      max-width: 1080px;
      margin: 0 auto;
      padding: 28px;
    }

    h1 {
      margin: 0;
      font-size: 30px;
    }

    .sub {
      margin-top: 8px;
      color: var(--muted);
      font-size: 14px;
    }

    .grid {
      margin-top: 24px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
    }

    .card {
      background: var(--card);
      border: 2px solid #000;
      border-radius: 12px;
      padding: 14px;
      box-shadow: 4px 4px 0 #000;
    }

    .metric-title {
      font-size: 13px;
      color: var(--muted);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .metric-value {
      font-weight: 700;
      font-size: 22px;
    }

    .delta {
      margin-top: 6px;
      font-size: 13px;
      font-weight: 600;
    }

    .delta.good { color: var(--good); }
    .delta.bad { color: var(--bad); }

    .section {
      margin-top: 28px;
    }

    .bar-group {
      margin-top: 12px;
      border: 1px solid var(--grid);
      border-radius: 10px;
      background: #fff;
      padding: 12px;
    }

    .bar-row {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 14px;
      align-items: center;
      margin: 10px 0;
      font-size: 14px;
    }

    .bars {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .bar {
      height: 14px;
      border-radius: 999px;
    }

    .bar.before { background: var(--before); }
    .bar.after { background: var(--after); }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      background: #fff;
      border: 1px solid var(--grid);
    }

    th, td {
      text-align: left;
      font-size: 13px;
      padding: 10px;
      border-bottom: 1px solid var(--grid);
    }

    th { background: #f9fafb; }

    code {
      background: #f3f4f6;
      padding: 2px 4px;
      border-radius: 4px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Dashboard Performance Report</h1>
    <div class="sub">Generated ${new Date().toISOString()} from benchmark artifacts.</div>

    <div class="grid">
      ${metrics.map((metric) => {
        const delta = percentChange(metric.before, metric.after);
        const improved = delta < 0;
        return `
          <div class="card">
            <div class="metric-title">${metric.label}</div>
            <div class="metric-value">${fmtMs(metric.after)}</div>
            <div>Before: ${fmtMs(metric.before)}</div>
            <div class="delta ${improved ? 'good' : 'bad'}">${improved ? 'Improved' : 'Regressed'} ${Math.abs(delta).toFixed(1)}%</div>
          </div>
        `;
      }).join('')}
    </div>

    <div class="section card">
      <div class="metric-title">Before / After Bars</div>
      <div class="bar-group">
        ${metrics.map((metric) => `
          <div class="bar-row">
            <div>${metric.label}</div>
            <div class="bars">
              <div class="bar before" style="width:${(metric.before / maxBarValue) * 100}%"></div>
              <span>${fmtMs(metric.before)}</span>
              <div class="bar after" style="width:${(metric.after / maxBarValue) * 100}%"></div>
              <span>${fmtMs(metric.after)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="section card">
      <div class="metric-title">Browser API Request Profile</div>
      <table>
        <thead>
          <tr>
            <th>Route</th>
            <th>Baseline Count</th>
            <th>Final Count</th>
            <th>Baseline Mean</th>
            <th>Final Mean</th>
          </tr>
        </thead>
        <tbody>
          ${['/api/agencies', '/api/dashboard'].map((url) => {
            const base = baselineReqSummary.find((entry) => entry.url === url);
            const fin = finalReqSummary.find((entry) => entry.url === url);
            return `
              <tr>
                <td><code>${url}</code></td>
                <td>${base?.count ?? 0}</td>
                <td>${fin?.count ?? 0}</td>
                <td>${base ? fmtMs(base.meanMs) : '-'}</td>
                <td>${fin ? fmtMs(fin.meanMs) : '-'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div class="section card">
      <div class="metric-title">Artifacts</div>
      <p><strong>Baseline API:</strong> <code>${baselineApiPath}</code></p>
      <p><strong>Final API:</strong> <code>${finalApiPath}</code></p>
      <p><strong>Baseline Browser:</strong> <code>${baselineBrowserPath}</code></p>
      <p><strong>Final Browser:</strong> <code>${finalBrowserPath}</code></p>
      <p><strong>Baseline Trace:</strong> <code>${baselineBrowser.traceFile}</code></p>
      <p><strong>Final Trace:</strong> <code>${finalBrowser.traceFile}</code></p>
    </div>
  </div>
</body>
</html>`;

  await fs.writeFile(outputPath, html);
  console.log(`Generated report: ${path.resolve(outputPath)}`);
}

main().catch((error) => {
  console.error('generate-report failed:', error);
  process.exit(1);
});
