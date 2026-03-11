# OAuth State Redis Protocol Hardening

## Summary

Shared agency OAuth initiation failures for Meta and Google were caused by the Redis-backed OAuth state-token path, not by connector code.

## Root Cause

Two issues compounded:

1. `apps/api/src/lib/redis.ts` forced `tls: {}` for every production Redis connection.
   - If `REDIS_URL` used `redis://...` instead of `rediss://...`, `ioredis` attempted a TLS connection to a non-TLS endpoint.
   - OAuth initiation then failed on `redis.set(...)`, which surfaced to users as `Failed to create OAuth state token`.

2. `apps/api/src/lib/env.ts` accepted any URL-shaped `REDIS_URL`.
   - Invalid Redis schemes could survive startup and only break at runtime in the OAuth flow.

## Resolution

- Restrict `REDIS_URL` to `redis://` or `rediss://`.
- Derive Redis TLS behavior from the parsed URL protocol (`env.REDIS_TLS`) instead of `NODE_ENV`.
- Add focused Redis config tests covering both protocol paths.
- Refresh OAuth state service tests so they assert the signed payload actually stored in Redis.
- Strip the internal HMAC signature from validated state objects before they leave the service.
- Add logging around OAuth state creation/validation failures and route-level initiation failures.

## Prevention

- Keep Redis URL validation at boot so misconfiguration fails early.
- Preserve the protocol-sensitive Redis tests when changing providers or deployment targets.
- Keep OAuth state tests aligned with security hardening changes, especially when state payload shape changes.

## Verification

- `npm test --workspace=apps/api -- src/lib/__tests__/env.test.ts src/lib/__tests__/redis.test.ts src/services/__tests__/oauth-state.service.test.ts src/routes/__tests__/agency-platforms.routes.test.ts`
- `npm run typecheck --workspace=apps/api`
