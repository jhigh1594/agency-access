# Implementation Plan: Critical + High Security Remediation

**Date**: February 14, 2026  
**Status**: Planning  
**Priority**: P0 (Critical) / P1 (High)

---

## Overview

This plan resolves all **Critical** and **High** issues identified in the February 14, 2026 security review:

1. Broken auth/tenant isolation across API routes
2. Unsigned Creem webhook processing
3. Public IDOR paths in client asset routes
4. Dashboard identity spoofing via fallback parsing
5. Clients route trusting caller-controlled `x-agency-id`
6. High-severity dependency vulnerabilities (`fastify`, `axios`)

This plan is implementation-ready, with route-level tasks, tests, rollout, and acceptance criteria.

---

## Security Goals

1. Enforce authenticated identity for all agency-scoped routes.
2. Enforce tenant ownership checks for all reads/writes.
3. Remove trust in caller-provided IDs/headers unless bound to authenticated principal.
4. Require verified signatures for payment webhooks.
5. Eliminate public ID-based access to token-protected data.
6. Patch known high-severity dependency vulnerabilities.

---

## Scope

### In Scope
- `apps/api` auth, authorization, webhook, and route hardening.
- Route-level tests (integration) and service-level tests where ownership validation is added.
- Production dependency upgrades for `fastify` and `axios` (and lockfile updates).

### Out of Scope
- Medium/Low findings from the audit.
- Non-security refactors unrelated to these issues.
- Frontend UX changes beyond required API contract adjustments.

---

## Remediation Specification

## 1) Unified AuthN/AuthZ Contract (Foundation)

### Required behavior
- All agency-scoped endpoints must require `Authorization: Bearer <Clerk JWT>`.
- Authenticated principal is derived only from verified JWT (`authenticate()` middleware).
- Agency target must be derived from trusted identity:
  - Prefer org context (`orgId`) if present and mapped.
  - Otherwise map `sub` to agency via existing agency resolution rules.
- Any explicit `agencyId` param/body/query must be validated against principal ownership.
- Mismatch returns `403 FORBIDDEN`.

### New shared helpers (API)
- `requireAuth` (reuse/extend `authenticate()`).
- `resolvePrincipalAgency(request)` -> `{ agencyId, principalUserId, principalOrgId? }`.
- `assertAgencyAccess(requestedAgencyId, principalAgencyId)`; throws/returns forbidden.
- Optional route wrapper/helper for repetitive guard logic.

### Files
- `apps/api/src/middleware/auth.ts`
- `apps/api/src/services/agency-resolution.service.ts` (or new authz helper module)
- New helper file recommended: `apps/api/src/lib/authorization.ts`

---

## 2) Route Hardening Requirements

## A. Access Requests + Templates + Subscriptions (Critical)

### Access Requests
Current risk: unauthenticated/unauthorized cross-tenant create/read/update/cancel.

Routes to enforce:
- `POST /access-requests`
- `GET /agencies/:id/access-requests`
- `GET /access-requests/:id`
- `PATCH /access-requests/:id`
- `POST /access-requests/:id/authorize`
- `POST /access-requests/:id/cancel`

Spec:
- Add `onRequest: [authenticate()]`.
- Resolve principal agency once per request.
- For any route with agencyId in params/body, enforce ownership.
- For resource-by-id routes, fetch resource first and enforce `resource.agencyId === principalAgencyId`.

Files:
- `apps/api/src/routes/access-requests.ts`

### Templates
Current risk: template read/write/delete across agencies by ID.

Routes to enforce:
- `GET /agencies/:agencyId/templates`
- `GET /templates/:id`
- `POST /agencies/:agencyId/templates`
- `PATCH /templates/:id`
- `DELETE /templates/:id`
- `POST /templates/:id/set-default`

Spec:
- Add auth middleware.
- Enforce agency ownership on both agencyId-param and templateId lookups.

Files:
- `apps/api/src/routes/templates.ts`
- `apps/api/src/services/template.service.ts` (if service-level ownership checks are needed)

### Subscriptions
Current risk: billing/portal/tier/invoice operations possible with arbitrary agencyId.

Routes to enforce:
- Entire `subscriptions` route set.

Spec:
- Add auth middleware at route-group level.
- Ignore caller-provided agencyId in body where possible; derive from principal.
- If endpoint path includes `:agencyId`, enforce equality with principal agency (or remove path agencyId in v2).
- Return `403` on mismatch.

Files:
- `apps/api/src/routes/subscriptions.ts`
- `apps/web/src/lib/query/billing.ts` and `apps/web/src/lib/api/billing.ts` (if contract changes)

## B. Agency Platforms Route Family (Critical)

Current risk: full cross-tenant platform data read/write and token refresh/revoke by arbitrary `agencyId`.

Routes to enforce:
- `agency-platforms` list, available, oauth initiate/callback, connection refresh/revoke, identity/manual routes, asset settings routes.

Spec:
- Add auth hook in `agency-platforms/index.ts` using `authenticate()`.
- Remove deprecated auto-provision behavior that trusts request `agencyId` from query/body.
- Enforce principal agency ownership before all platform operations.
- Keep public-only routes public only if they are truly token-scoped and do not accept arbitrary agency IDs.

Files:
- `apps/api/src/routes/agency-platforms/index.ts`
- `apps/api/src/routes/agency-platforms/list.routes.ts`
- `apps/api/src/routes/agency-platforms/oauth.routes.ts`
- `apps/api/src/routes/agency-platforms/connection.routes.ts`
- `apps/api/src/routes/agency-platforms/assets.routes.ts`
- `apps/api/src/routes/agency-platforms/manual.routes.ts`
- `apps/api/src/routes/agency-platforms/identity.routes.ts`

## C. Client Auth Assets IDOR (Critical)

Current risk:
- `GET /client-assets/:connectionId/:platform` exposes assets from tokens with no auth/ownership check.
- `POST /client/:token/save-assets` ignores token and writes arbitrary `connectionId`.

Spec:
- Remove or protect `GET /client-assets/:connectionId/:platform`.
  - Preferred: replace with token-scoped route `GET /client/:token/assets/:platform`.
  - Validate token, resolve access request, resolve connection from token context only.
- For `save-assets`, `grant-pages-access`, and `ad-accounts-shared`:
  - Require token to map to access request.
  - Verify `connectionId` belongs to `accessRequest.id` and `accessRequest.agencyId`.
  - Reject mismatches with `403`.
- Never allow direct token fetch by naked `connectionId` without ownership proof.

Files:
- `apps/api/src/routes/client-auth/assets.routes.ts`
- `apps/web` callers of `/client-assets/:connectionId/:platform` (search and migrate)

## D. Dashboard + Clients Identity Spoofing (High)

### Dashboard
Current risk: accepts query `clerkUserId`, unverified JWT decode fallback, raw header fallback.

Spec:
- Require `authenticate()` for `/dashboard` and `/dashboard/stats`.
- Remove unverified decode + raw token fallback logic.
- Use verified principal from `request.user`.
- Remove `clerkUserId` query bypass for protected endpoints.

Files:
- `apps/api/src/routes/dashboard.ts`

### Clients
Current risk: trusts `x-agency-id` header and can auto-provision.

Spec:
- Replace custom header auth hook with `authenticate()`.
- Resolve agency from verified principal only.
- Remove `x-agency-id` trust path.

Files:
- `apps/api/src/routes/clients.ts`
- `apps/web` API callers currently sending `x-agency-id`

---

## 3) Webhook Signature Enforcement (Critical)

### Current gap
- `/webhooks/creem` processes payload without verifying signature.

### Required behavior
- Verify signature before any business logic.
- Reject invalid/missing signature with `401`.
- Use raw body string for HMAC verification to avoid reserialization mismatches.
- Keep idempotency checks after signature verification.

### Implementation notes
- Use existing `creem.verifyWebhookSignature(payload, signature)`.
- Ensure Fastify webhook route has access to raw body (configure parser/route option as needed).
- Validate timestamp freshness if required by provider guidance.

Files:
- `apps/api/src/routes/webhooks.ts`
- `apps/api/src/index.ts` (if raw body plugin/config needed)
- `apps/api/src/lib/creem.ts` (minor updates if header parsing needs hardening)

---

## 4) Dependency Vulnerability Remediation (High)

### Required behavior
- Upgrade to non-vulnerable versions of:
  - `fastify`
  - `axios`
- Resolve lockfile and transitive conflicts.
- Re-run security scan and confirm zero high/critical vulnerabilities in production deps.

Files:
- Root `package.json`
- Workspace `package.json` as needed
- `package-lock.json`

---

## Implementation Plan (Phased Tasks)

## Phase 0: Safety Rails + Test Harness (Day 1)

1. Add/standardize auth test utilities for Clerk JWT mocking in API integration tests.
2. Add reusable test helpers for asserting `401`, `403`, and tenant mismatch behavior.
3. Add route inventory checklist to ensure no agency-scoped route is left unguarded.

Deliverable:
- Security test harness in place for red-green workflow.

## Phase 1: Auth Foundation (Days 1-2)

1. Implement `resolvePrincipalAgency` and `assertAgencyAccess`.
2. Update `authenticate()` usage patterns for consistency.
3. Add unit tests for helper behavior:
   - user/org resolution
   - mismatch path
   - missing identity path

Deliverable:
- Shared AuthZ utilities merged and tested.

## Phase 2: Critical Route Families (Days 2-4)

1. Harden `access-requests.ts`.
2. Harden `templates.ts`.
3. Harden `agency-platforms/*` route modules.
4. Harden `client-auth/assets.routes.ts` and remove/replace public ID route.
5. Add integration tests per route group (see Test Plan).

Deliverable:
- All Critical auth/IDOR issues fixed in API routes.

## Phase 3: Webhook Security (Day 4)

1. Enable raw payload capture for webhook route.
2. Enforce signature validation pre-processing.
3. Add tests:
   - missing signature -> 401
   - invalid signature -> 401
   - valid signature -> processed
   - duplicate valid event -> idempotent response

Deliverable:
- Webhook forgery risk eliminated.

## Phase 4: High Route Fixes (Days 4-5)

1. Refactor `dashboard.ts` to strict authenticated identity.
2. Refactor `clients.ts` to stop trusting `x-agency-id`.
3. Update frontend callers to use Authorization token only.
4. Add integration tests for spoof attempt failures.

Deliverable:
- Dashboard/clients impersonation vectors closed.

## Phase 5: Dependency Upgrades + Regression (Day 5)

1. Upgrade `fastify` and `axios` to patched versions.
2. Run full test suite and targeted integration tests.
3. Run `npm audit --omit=dev`.
4. Patch any regressions from framework upgrade.

Deliverable:
- No high/critical prod dependency vulnerabilities.

## Phase 6: Rollout + Monitoring (Day 6)

1. Release behind short-lived feature flags if necessary for contract changes.
2. Deploy to staging, run security regression checklist.
3. Deploy production with monitoring:
   - 401/403 rate spikes
   - webhook 401 rates
   - billing endpoint errors
4. Post-deploy verify all critical flows.

Deliverable:
- Secure rollout completed with observability.

---

## Test Plan (Red -> Green)

For each remediated route, add failing tests first:

1. `401` when auth header missing (for protected routes).
2. `403` when authenticated principal does not own requested agency/resource.
3. `200/201` when principal owns target.
4. No cross-tenant data returned in list/detail routes.
5. For client token routes: token-to-connection binding enforced.
6. For webhook: signature verification pass/fail matrix.

Suggested test files:
- `apps/api/src/routes/__tests__/access-requests.security.test.ts`
- `apps/api/src/routes/__tests__/templates.security.test.ts`
- `apps/api/src/routes/__tests__/agency-platforms.security.test.ts`
- `apps/api/src/routes/client-auth/__tests__/assets.security.test.ts`
- `apps/api/src/routes/__tests__/dashboard.security.test.ts`
- `apps/api/src/routes/__tests__/clients.security.test.ts`
- `apps/api/src/routes/__tests__/webhooks.signature.test.ts`

---

## Acceptance Criteria

1. All Critical and High findings are closed with code + tests.
2. All agency-scoped routes require verified auth and enforce ownership.
3. No route can mutate or read another tenant’s data via arbitrary IDs.
4. Creem webhook rejects unsigned/invalid signatures.
5. `npm audit --omit=dev` reports **0 critical, 0 high** vulnerabilities.
6. Existing valid user workflows still pass regression tests.

---

## Task Breakdown (Execution Checklist)

## Epic A: AuthZ Foundation
- [ ] Implement `resolvePrincipalAgency` helper.
- [ ] Implement `assertAgencyAccess` helper.
- [ ] Add helper unit tests.

## Epic B: Critical API Hardening
- [ ] Protect `access-requests` route group with auth + ownership checks.
- [ ] Protect `templates` route group with auth + ownership checks.
- [ ] Protect all `agency-platforms` routes with auth + ownership checks.
- [ ] Remove/replace public `client-assets/:connectionId/:platform` endpoint.
- [ ] Enforce token-to-connection ownership in client asset mutation routes.
- [ ] Add integration tests for all above.

## Epic C: Webhook Security
- [ ] Enable raw body for Creem route.
- [ ] Verify signature before processing.
- [ ] Add webhook signature/idempotency tests.

## Epic D: High Fixes
- [ ] Refactor dashboard auth to verified principal only.
- [ ] Refactor clients auth to verified principal only.
- [ ] Update web callers relying on `x-agency-id`.
- [ ] Add spoofing/tenant-boundary integration tests.

## Epic E: Dependency Security
- [ ] Upgrade `fastify` to patched version.
- [ ] Upgrade `axios` to patched version.
- [ ] Resolve lockfile and compatibility issues.
- [ ] Re-run audit and capture result in PR.

## Epic F: Release
- [ ] Staging verification checklist complete.
- [ ] Production deploy with monitoring and rollback plan.
- [ ] Post-deploy validation completed.

---

## PR Sequencing Plan

Use this merge order to reduce risk and keep each PR reviewable.

## PR 1: AuthZ Foundation (No Behavior Change Outside New Helpers)
**Goal**: Introduce reusable principal + tenant-guard utilities.

**Files**
- `apps/api/src/lib/authorization.ts` (new)
- `apps/api/src/middleware/auth.ts` (small refactor/export types if needed)
- `apps/api/src/services/agency-resolution.service.ts` (helper integration if required)
- `apps/api/src/lib/__tests__/authorization.test.ts` (new)

**Diff scope**
- Add `resolvePrincipalAgency()`.
- Add `assertAgencyAccess()`.
- Add typed error helper for `FORBIDDEN`.

**Acceptance**
- Unit tests pass.
- No route behavior changed yet.

## PR 2: Access Requests + Templates Hardening (Critical)
**Goal**: Close cross-tenant read/write in two highest-traffic route groups.

**Files**
- `apps/api/src/routes/access-requests.ts`
- `apps/api/src/routes/templates.ts`
- `apps/api/src/routes/__tests__/access-requests.security.test.ts` (new)
- `apps/api/src/routes/__tests__/templates.security.test.ts` (new)

**Diff scope**
- Add `authenticate()` to route groups.
- Enforce ownership for all `agencyId` and resource-ID operations.
- Return `401/403` consistently.

**Acceptance**
- Spoofed agency access fails with `403`.
- Legitimate owner paths still pass.

## PR 3: Agency Platforms Hardening (Critical)
**Goal**: Close cross-tenant access on platform connection/config/token flows.

**Files**
- `apps/api/src/routes/agency-platforms/index.ts`
- `apps/api/src/routes/agency-platforms/list.routes.ts`
- `apps/api/src/routes/agency-platforms/oauth.routes.ts`
- `apps/api/src/routes/agency-platforms/connection.routes.ts`
- `apps/api/src/routes/agency-platforms/assets.routes.ts`
- `apps/api/src/routes/agency-platforms/manual.routes.ts`
- `apps/api/src/routes/agency-platforms/identity.routes.ts`
- `apps/api/src/routes/__tests__/agency-platforms.security.test.ts` (new)

**Diff scope**
- Add auth hook for entire route family.
- Remove/deprecate trust in query/body `agencyId` without ownership validation.
- Enforce principal-tenant checks before all reads/writes.

**Acceptance**
- Cross-tenant listing/refresh/revoke/update blocked.
- Existing in-tenant platform flows remain functional.

## PR 4: Client Asset IDOR Closure (Critical)
**Goal**: Remove public connectionId-based token-backed asset access.

**Files**
- `apps/api/src/routes/client-auth/assets.routes.ts`
- `apps/api/src/routes/client-auth/__tests__/assets.security.test.ts` (new)
- `apps/web/src/lib/api/*` and/or callers of `/client-assets/:connectionId/:platform` (as needed)

**Diff scope**
- Remove or fully protect `GET /client-assets/:connectionId/:platform`.
- Add token-scoped replacement endpoint if needed.
- Enforce token-to-connection ownership checks in:
  - `/client/:token/save-assets`
  - `/client/:token/grant-pages-access`
  - `/client/:token/ad-accounts-shared`

**Acceptance**
- Arbitrary `connectionId` cannot read or mutate data.
- Token flow works only for owning access request/connection.

## PR 5: Webhook Signature Enforcement (Critical)
**Goal**: Prevent forged billing/subscription events.

**Files**
- `apps/api/src/routes/webhooks.ts`
- `apps/api/src/index.ts` (raw body config if needed)
- `apps/api/src/lib/creem.ts` (header parsing hardening if needed)
- `apps/api/src/routes/__tests__/webhooks.signature.test.ts` (new)

**Diff scope**
- Validate webhook signature before idempotency/business logic.
- Reject missing/invalid signature with `401`.
- Ensure raw payload HMAC validation path is used.

**Acceptance**
- Invalid signature events are never processed.
- Valid events still process and remain idempotent.

## PR 6: Dashboard + Clients Spoofing Fixes (High)
**Goal**: Remove identity spoofing via query/header fallback paths.

**Files**
- `apps/api/src/routes/dashboard.ts`
- `apps/api/src/routes/clients.ts`
- `apps/api/src/routes/__tests__/dashboard.security.test.ts` (new)
- `apps/api/src/routes/__tests__/clients.security.test.ts` (new)
- `apps/web/src/lib/api-client.ts`
- `apps/web/src/app/(authenticated)/dashboard/page.tsx`
- `apps/web/src/app/(authenticated)/clients/page.tsx`
- Other callers currently sending `x-agency-id`

**Diff scope**
- Dashboard: require `authenticate()`, remove unverified decode/raw header fallbacks.
- Clients: replace `x-agency-id` trust with verified JWT principal resolution.
- Update frontend API calls to use bearer auth only.

**Acceptance**
- Spoof attempts fail.
- Dashboard/clients load correctly for authenticated users.

## PR 7: Dependency Security Upgrades (High)
**Goal**: Remove known high-severity dependency vulnerabilities.

**Files**
- `package.json`
- `apps/api/package.json` and/or workspace package files as needed
- `package-lock.json`

**Diff scope**
- Upgrade `fastify` to patched version.
- Upgrade `axios` to patched version.
- Fix compatibility issues and test fallout.

**Acceptance**
- `npm audit --omit=dev` => `0 high`, `0 critical`.

## PR 8: Final Security Regression + Release Checklist
**Goal**: Validate all security remediations together before production rollout.

**Files**
- `docs/implementation-plans/security-critical-high-remediation.md` (status updates)
- Optional runbook/checklist doc under `docs/`

**Diff scope**
- Add final verification evidence:
  - test run summaries
  - audit output summary
  - staging validation results

**Acceptance**
- All acceptance criteria in this plan satisfied.

---

## PR Validation Commands

Run per PR (as applicable):

1. `npm run test --workspace=apps/api`
2. `npm run typecheck`
3. `npm run lint`
4. `npm audit --omit=dev` (required for PR 7 and final PR 8)

---

## Risks and Mitigations

1. **Risk**: Contract changes break frontend calls.
   - **Mitigation**: Update client API wrappers in same PR series; add integration tests.

2. **Risk**: Fastify upgrade introduces behavior changes.
   - **Mitigation**: pin/test incrementally; run full suite and smoke tests before merge.

3. **Risk**: Over-tight auth breaks legitimate internal flows.
   - **Mitigation**: explicit allowlist for truly public token routes; test real client invite flow end-to-end.

---

## Rollback Plan

1. Keep route-level changes grouped by feature flag or isolated PRs for selective revert.
2. If webhook validation blocks valid events unexpectedly, roll back to previous release while retaining audit trail.
3. For dependency upgrades, isolate in separate PR to revert independently if needed.

---

## Definition of Done

1. Code merged for all Critical and High remediations.
2. Security tests added and passing.
3. Regression suite passing.
4. Audit clean for high/critical in prod deps.
5. Security review signoff recorded in PR.
