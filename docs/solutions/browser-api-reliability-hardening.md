# Browser API Reliability Hardening

Date: 2026-07-05

## Problem

The dashboard spinner incident exposed a broader browser API boundary risk: production client code could build backend URLs directly from `process.env.NEXT_PUBLIC_API_URL`, sometimes with the wrong route prefix and sometimes without a visible error path. In production this can turn a simple 404 or missing configuration into an endless loading state.

## Decision

Browser API calls must use the shared helper layer:

- `getApiBaseUrl()` and `resolveApiUrl()` from `apps/web/src/lib/api/api-env.ts` for normalized public or custom fetches.
- `authorizedApiFetch()` from `apps/web/src/lib/api/authorized-api-fetch.ts` for protected backend routes that need a Clerk bearer token.
- `parseJsonResponse()` or `extractApiErrorMessage()` for user-visible backend errors.

Raw `process.env.NEXT_PUBLIC_API_URL` reads are limited to the API env helper, tests, and intentional evidence fixtures. The guard lives in `apps/web/src/lib/api/__tests__/api-url-usage.test.ts` and is included in `scripts/perf/web-inp-smoke.sh`.

## Approved Exceptions

- `apps/web/src/lib/api/api-env.ts` is the source of truth for reading `NEXT_PUBLIC_API_URL`.
- Tests may set or assert environment values.
- `apps/web/src/evidence/*` may use fixture env values for offline previews.

## Verification

Run the API URL guard with:

```bash
npm test --workspace=apps/web -- src/lib/api/__tests__/api-url-usage.test.ts
```

The broader web smoke gate also runs it through:

```bash
npm run perf:web:inp-smoke
```
