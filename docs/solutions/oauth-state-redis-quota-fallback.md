# OAuth State Redis Quota Fallback

## Summary

Agency OAuth initiation failed across Google and every other OAuth platform even though provider configuration was intact. The shared failure point was OAuth state-token creation, which depended on Redis writes. Production Redis connectivity was healthy, but Upstash had exhausted its request quota, so `SET` operations started failing with `ERR max requests limit exceeded`.

The durable fix was to make OAuth state creation degrade to a signed stateless fallback token when Redis writes are unavailable, while keeping Redis-backed workers as optional infrastructure.

## Affected Surfaces

- API service startup in [`apps/api/src/index.ts`](/Users/jhigh/agency-access-platform/apps/api/src/index.ts)
- Redis client and readiness checks in [`apps/api/src/lib/redis.ts`](/Users/jhigh/agency-access-platform/apps/api/src/lib/redis.ts)
- OAuth state creation and validation in [`apps/api/src/services/oauth-state.service.ts`](/Users/jhigh/agency-access-platform/apps/api/src/services/oauth-state.service.ts)
- OAuth initiation routes in:
  - [`apps/api/src/routes/agency-platforms/oauth.routes.ts`](/Users/jhigh/agency-access-platform/apps/api/src/routes/agency-platforms/oauth.routes.ts)
  - [`apps/api/src/routes/client-auth/oauth-state.routes.ts`](/Users/jhigh/agency-access-platform/apps/api/src/routes/client-auth/oauth-state.routes.ts)
- Redis-backed BullMQ workers, which remained degraded until Redis quota is restored

## Root Cause

1. OAuth initiation required a Redis-backed state token write.
   - `oauthStateService.createState()` wrote the state payload to Redis before any provider-specific connector code ran.
   - When Redis rejected writes, every OAuth provider failed with the same generic `STATE_CREATION_FAILED`.

2. Upstash request quota was exhausted in production.
   - Deploy logs showed Redis `PING` could succeed and the socket could connect.
   - The first `SET` operation failed with:
     - `ERR max requests limit exceeded. Limit: 500000, Usage: 500006`

3. Startup behavior assumed Redis writeability was required for API viability.
   - Once startup probes validated Redis writes instead of only connectivity, deploys failed before the server bound a port.
   - That behavior was useful diagnostically but too strict for the product’s core OAuth flow.

## Resolution

1. Added a signed stateless OAuth state fallback.
   - If Redis `SET` fails during `createState()`, the service now returns a stateless token signed with the existing `OAUTH_STATE_HMAC_SECRET`.
   - `validateState()` recognizes and validates stateless tokens without Redis.
   - Expiry checks still apply to stateless tokens.

2. Preserved Redis-backed behavior when Redis is healthy.
   - The primary path still uses Redis-backed single-use state tokens when available.
   - Stateless fallback activates only when Redis writes fail.

3. Relaxed startup behavior.
   - Production startup still probes Redis writes for visibility.
   - Redis readiness failure now logs a warning instead of aborting server boot.
   - This keeps OAuth available even while BullMQ/background jobs are degraded.

4. Improved operational diagnostics.
   - OAuth state creation and validation logs now include the underlying error shape rather than only the generic wrapper code.
   - This makes quota exhaustion distinguishable from TLS or connectivity errors.

## Prevention

- Treat Redis as optional for OAuth initiation, not as a hard dependency.
- Keep BullMQ/background jobs isolated from request-path availability.
- Preserve tests for Redis write failure fallback, not just Redis connectivity.
- Monitor Upstash request quota usage before it reaches the hard cap.
- Prefer product-critical graceful degradation over startup failure when an optional dependency is saturated.

## Verification

- `npm test --workspace=apps/api -- src/lib/__tests__/env.test.ts src/lib/__tests__/redis.test.ts src/services/__tests__/oauth-state.service.test.ts`
- `npm run typecheck --workspace=apps/api`
- `npm run build --workspace=apps/api`

## Related Artifacts

- Sprint: [`docs/sprints/2026-03-11-oauth-state-redis-hardening.md`](/Users/jhigh/agency-access-platform/docs/sprints/2026-03-11-oauth-state-redis-hardening.md)
- Earlier investigation: [`docs/solutions/oauth-state-redis-protocol-hardening.md`](/Users/jhigh/agency-access-platform/docs/solutions/oauth-state-redis-protocol-hardening.md)
