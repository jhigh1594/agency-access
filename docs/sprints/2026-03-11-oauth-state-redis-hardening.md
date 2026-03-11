# Sprint: OAuth State Redis Hardening

- Date: 2026-03-11
- Status: Implemented
- Owners: API
- Scope: Diagnose the shared OAuth initiation failure on agency connections, fix the Redis/infra path that breaks OAuth state-token creation, and harden tests and logging around the state-token service.

## Problem Statement

Agency OAuth initiation for Meta and Google is failing with `Failed to create OAuth state token` from `POST /agency-platforms/:platform/initiate`.

Initial diagnosis pointed to shared infrastructure code, not provider connectors:
- both providers fail before redirect URL generation
- OAuth initiation depends on a Redis-backed state token
- Redis writeability, not provider-specific OAuth code, determines whether initiation succeeds
- unit coverage around signed OAuth state payloads is stale, which obscures regressions in the actual state-token flow

Final production diagnosis:
- Upstash Redis request quota was exhausted in production
- Redis socket connection and `PING` could still succeed, but `SET` failed with `ERR max requests limit exceeded`
- OAuth state creation was therefore the shared cross-provider failure point

## Architecture Baseline Validation

The Rails-specific baseline in the workflow skills does not apply directly to this repository.

Applicable baseline for this sprint:
- Fastify backend in `apps/api`
- Redis-backed OAuth state storage is required for CSRF protection
- shared OAuth initiation routes must fail safely and log actionable diagnostics without leaking secrets

## Architecture Approach

1. Harden Redis env parsing and client behavior enough to rule out configuration regressions quickly.
2. Add focused regression coverage for Redis client options and Redis failure handling.
3. Repair OAuth state service tests so they assert the signed payload behavior currently implemented.
4. Log state creation failures from OAuth routes with enough context to distinguish Redis/config failures from connector issues.
5. Add a stateless signed OAuth state fallback so Redis write exhaustion does not take down OAuth initiation.

## Ordered Task Board

- [x] `OSRH-001` Create sprint artifact and lock root-cause hypothesis.
  Dependency: none
  Acceptance criteria:
  - Sprint doc identifies why Meta and Google share the same failure path.
  - Proposed fix is scoped to shared OAuth state infrastructure.

- [x] `OSRH-010` Add failing tests for Redis URL validation and TLS option selection.
  Dependency: `OSRH-001`
  Acceptance criteria:
  - Env tests reject non-Redis URL schemes for `REDIS_URL`.
  - Redis tests prove `redis://` in production does not force TLS.
  - Redis tests prove `rediss://` in production enables TLS.

- [x] `OSRH-020` Add failing tests for signed OAuth state payloads.
  Dependency: `OSRH-001`
  Acceptance criteria:
  - `createState` tests assert a signature is persisted with the state payload.
  - `validateState` tests use correctly signed state fixtures.
  - Error-path tests still cover malformed, expired, and incomplete state data.

- [x] `OSRH-030` Implement Redis config fix and env hardening.
  Dependency: `OSRH-010`
  Acceptance criteria:
  - Redis client behavior is hardened for production managed Redis.
  - Invalid `REDIS_URL` schemes fail during env parsing instead of during OAuth initiation.
  - No unrelated Redis consumers regress in tests.

- [x] `OSRH-040` Improve OAuth initiation diagnostics for state-token creation failures.
  Dependency: `OSRH-030`
  Acceptance criteria:
  - Agency OAuth initiation logs state creation failures with platform and agency context.
  - Logs do not leak OAuth tokens, secrets, or raw request bodies.

- [x] `OSRH-050` Run focused verification and capture residual risks.
  Dependency: `OSRH-020`, `OSRH-030`, `OSRH-040`
  Acceptance criteria:
  - Targeted API tests pass.
  - Residual risk notes call out any required production env follow-up.

- [x] `OSRH-060` Add graceful OAuth fallback for Redis write exhaustion.
  Dependency: `OSRH-040`
  Acceptance criteria:
  - OAuth initiation still returns a valid state token when Redis `SET` fails.
  - OAuth callback validation accepts the stateless fallback token.
  - Production startup warns on Redis write probe failure instead of aborting the API.

## Verification Strategy

1. `env.ts` contract tests for Redis URL parsing
2. Redis client unit tests for managed Redis behavior and readiness probing
3. OAuth state service unit tests for signed state storage/validation and stateless fallback
4. Agency platform route regression test to ensure OAuth initiation surface still passes

## Review Findings Queue

- Resolved: production Redis TLS selection was environment-driven instead of protocol-driven, which could break `redis://` deployments.
- Resolved: OAuth state validation returned the internal HMAC signature field to callers even though it is only needed inside the service.
- Resolved: OAuth initiation failures did not log enough shared-path context to quickly separate Redis/config failures from connector failures.
- Resolved: Redis socket connectivity alone was not enough; production failure came from write-path rejection after Upstash quota exhaustion.
- Resolved: Failing startup on Redis write probes protected diagnostics but took down the API for an optional dependency; startup now warns while OAuth falls back statelessly.

## Verification Log

- `npm test --workspace=apps/api -- src/lib/__tests__/env.test.ts src/lib/__tests__/redis.test.ts src/services/__tests__/oauth-state.service.test.ts src/routes/__tests__/agency-platforms.routes.test.ts`
- `npm run typecheck --workspace=apps/api`
- `npm test --workspace=apps/api -- src/lib/__tests__/env.test.ts src/lib/__tests__/redis.test.ts src/services/__tests__/oauth-state.service.test.ts`
- `npm run build --workspace=apps/api`

## Residual Risks

- Redis-backed BullMQ workers and delayed/background jobs will still be degraded until Upstash quota is restored or the plan is upgraded.
- Stateless OAuth state fallback preserves initiation and callback correctness, but it is not single-use in the same way Redis-backed state tokens are.
