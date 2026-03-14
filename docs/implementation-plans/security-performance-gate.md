# Security Endpoint Performance Gate

This document defines the repeatable latency gate for the high-risk security remediations:

- `GET /api/agencies`
- `GET /api/agencies/:id`
- `POST /agency-platforms/meta/complete-oauth`
- `PUT /agency-platforms/:id/verify`

## Baseline Capture

1. Start the API in an environment representative of production.
2. Run benchmark and save output:

```bash
cd apps/api
BENCH_AUTH_TOKEN="<jwt>" \
BENCH_AGENCY_ID="<agency-id>" \
BENCH_CLERK_USER_ID="<principal-id>" \
BENCH_CONNECTION_ID="<connection-id>" \
BENCH_OUTPUT_PATH="security-benchmark-baseline.json" \
npm run bench:security
```

## CI Gate

Use the captured baseline as the reference for subsequent runs:

```bash
cd apps/api
BENCH_AUTH_TOKEN="<jwt>" \
BENCH_AGENCY_ID="<agency-id>" \
BENCH_CLERK_USER_ID="<principal-id>" \
BENCH_CONNECTION_ID="<connection-id>" \
BENCH_BASELINE_PATH="security-benchmark-baseline.json" \
BENCH_P95_BUDGET_PERCENT="5" \
npm run bench:security
```

The benchmark exits non-zero if any endpoint exceeds a `+5%` p95 latency regression.

## Notes

- Default runs per scenario: `50` (`BENCH_RUNS` to override).
- Default API base URL: `http://localhost:3001` (`API_BASE_URL` to override).
- Results include status ranges to quickly catch unexpected auth or validation regressions during benchmark runs.
