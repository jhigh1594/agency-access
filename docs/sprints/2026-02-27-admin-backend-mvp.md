# Sprint: Internal Admin Backend MVP

- Date: 2026-02-27
- Status: Completed
- Owners: API + Web
- Scope: Lightweight internal admin surface for cross-agency user/subscription/usage operations.
- Discovery input: `docs/brainstorms/2026-02-27-admin-backend-brainstorm.md`

## Architecture Baseline Validation

The default `workflow-plan` baseline does not apply to this repository:
- Not applicable: Rails, Phlex, Stimulus, Turbo/Hotwire Native.
- Applicable baseline used for this sprint:
  - Next.js App Router (web)
  - Fastify + Prisma (api)
  - Clerk auth
  - Tailwind token-based styling + existing shared UI primitives
  - React Query for frontend data access

Adaptation note for required planning items:
- “Reusable Phlex primitives/variants” is implemented as reusable React UI primitives/variants under `apps/web/src/components/internal-admin` for admin surfaces.

## External Research Decision

No external research is required for planning this MVP.
Reason: the required capabilities (authz middleware, aggregate queries, internal pages, and route tests) are conventional and can be implemented using existing repo patterns.

## Planning Assumptions (To Confirm Before Build)

1. Day-one access model: internal allowlist (Clerk user IDs/emails from env), not customer-facing RBAC.
2. Product boundary: internal-only admin tooling; no agency-admin exposure in this sprint.
3. MRR definition for MVP: booked MRR (normalized monthly run-rate from active/trialing subscriptions), with collected revenue surfaced separately from paid invoices.

## Architecture Approach

1. API isolation:
- Add new Fastify route plugin namespace: `/api/internal-admin/*`.
- Gate every endpoint with `authenticate()` + `requireInternalAdmin()`.

2. Authorization model:
- New env-driven allowlist in API env schema (IDs and/or emails).
- Optional future extension: Clerk claim/role check.

3. Data aggregation layer:
- Add internal admin service for overview metrics and cross-agency list/detail queries.
- Reuse `Subscription`, `Invoice`, `Agency`, `AgencyMember`, and `AgencyUsageCounter`.

4. MRR computation:
- Normalize each active/trialing subscription to monthly value.
- Infer billing interval from Creem `productId` for MVP; persist explicit interval in a follow-up hardening task if needed.

5. Frontend surface:
- Add protected routes under `/internal/admin`, `/internal/admin/agencies`, `/internal/admin/subscriptions`.
- Reuse existing visual token system and shared UI components; avoid introducing new design language.

6. Safety posture:
- Start read-heavy. Allow only low-risk subscription actions (tier change, cancel-at-period-end) with explicit confirmation and server-side guardrails.

## Milestones

### Milestone 1: Security + Foundations
- `ADMN-001`, `ADMN-010`, `ADMN-011`, `ADMN-012`, `ADMN-013`

### Milestone 2: Internal Admin API (Read)
- `ADMN-020`, `ADMN-021`, `ADMN-022`, `ADMN-023`, `ADMN-024`

### Milestone 3: Internal Admin Web Surfaces
- `ADMN-030`, `ADMN-031`, `ADMN-032`, `ADMN-033`, `ADMN-034`, `ADMN-035`

### Milestone 4: Managed Subscription Actions
- `ADMN-040`, `ADMN-041`, `ADMN-042`

### Milestone 5: Quality Gates + Evidence + Handoff
- `ADMN-050`, `ADMN-051`, `ADMN-052`, `ADMN-053`

## Ordered Task Board

- [x] `ADMN-001` Create sprint implementation artifact and lock assumptions.
  Dependency: none
  Acceptance criteria:
  - Plan includes architecture, milestones, risks, verification, and requirement mapping links.
  - Open decisions are explicitly marked with default assumptions.

- [x] `ADMN-010` Add internal-admin env config in API.
  Dependency: `ADMN-001`
  Acceptance criteria:
  - `apps/api/src/lib/env.ts` parses `INTERNAL_ADMIN_USER_IDS` and/or `INTERNAL_ADMIN_EMAILS`.
  - `apps/api/.env.example` documents new variables.
  - Env parsing tests updated in `apps/api/src/lib/__tests__/env.test.ts`.

- [x] `ADMN-011` Implement internal-admin authorization utility.
  Dependency: `ADMN-010`
  Acceptance criteria:
  - New utility resolves whether an authenticated principal is internal-admin.
  - Utility supports both Clerk `sub` and email match path.
  - Returns structured typed errors (`UNAUTHORIZED`/`FORBIDDEN`) consistent with API error contract.

- [x] `ADMN-012` Add API middleware `requireInternalAdmin()` and wire to internal-admin routes.
  Dependency: `ADMN-011`
  Acceptance criteria:
  - All `/api/internal-admin/*` endpoints are blocked for non-admin users.
  - Middleware composes cleanly with existing `authenticate()`.

- [x] `ADMN-013` Add security tests for internal-admin guardrails.
  Dependency: `ADMN-012`
  Acceptance criteria:
  - Missing auth header returns `401`.
  - Authenticated non-admin returns `403`.
  - Admin allowlist user returns `200` on sample endpoint.

- [x] `ADMN-020` Build internal-admin overview query service.
  Dependency: `ADMN-012`
  Acceptance criteria:
  - Service returns: MRR, active subscriptions, past_due count, canceled count (period), trialing count.
  - Response shape is `{ data, error }`.
  - Query performance is bounded (single aggregate pass + indexed filters).

- [x] `ADMN-021` Add agency/user list and detail query functions.
  Dependency: `ADMN-012`
  Acceptance criteria:
  - List supports search by agency name/email and pagination.
  - Detail includes agency metadata, members summary, subscription summary, usage snapshot.
  - Null/missing states are explicit and non-throwing.

- [x] `ADMN-022` Add `/api/internal-admin/overview`, `/agencies`, `/agencies/:agencyId`, `/subscriptions` routes.
  Dependency: `ADMN-020`, `ADMN-021`
  Acceptance criteria:
  - Routes are registered in `apps/api/src/index.ts` with `/api` prefix.
  - Validation failures return `400`.
  - Unexpected errors are thrown/handled via Fastify error handling pattern.

- [x] `ADMN-023` Add API route tests for contracts and filtering behavior.
  Dependency: `ADMN-022`
  Acceptance criteria:
  - Tests cover success contract, validation errors, and pagination/filtering.
  - Tests assert response envelope consistency.

- [x] `ADMN-024` Add MRR calculation tests for interval normalization.
  Dependency: `ADMN-020`
  Acceptance criteria:
  - Monthly and yearly products normalize to monthly run-rate.
  - Non-active statuses are excluded from booked MRR.
  - Unknown product IDs are handled deterministically (excluded + warning path).

- [x] `ADMN-030` Add protected web route group for internal admin pages.
  Dependency: `ADMN-012`
  Acceptance criteria:
  - `/internal/admin*` pages require authenticated user.
  - Non-admin users are denied via API and routed to a clear “not authorized” state.

- [x] `ADMN-031` Add frontend API client + React Query hooks for internal-admin endpoints.
  Dependency: `ADMN-022`
  Acceptance criteria:
  - Hooks exist for overview, agencies list/detail, and subscriptions list.
  - Error handling matches existing frontend pattern (throw on `error`).

- [x] `ADMN-032` Implement `/internal/admin` overview page.
  Dependency: `ADMN-031`
  Acceptance criteria:
  - KPI cards: MRR, active, past_due, canceled, trialing.
  - “Top usage agencies” table is present with deterministic empty state.

- [x] `ADMN-033` Implement `/internal/admin/agencies` page.
  Dependency: `ADMN-031`
  Acceptance criteria:
  - Search field, paginated table, and detail navigation are functional.
  - Columns: agency, email, tier, subscription status, createdAt.

- [x] `ADMN-034` Implement `/internal/admin/subscriptions` page.
  Dependency: `ADMN-031`
  Acceptance criteria:
  - Filters for status and tier.
  - Row includes agency, tier, status, period end, cancel-at-period-end.

- [x] `ADMN-035` Create reusable admin UI primitives/variants + token compliance checks.
  Dependency: `ADMN-032`, `ADMN-033`, `ADMN-034`
  Acceptance criteria:
  - Reusable components (for stat card, status chip, table header/action bar) exist and are reused.
  - No new raw `slate|indigo|gray|red|green|yellow|amber-*` utility classes in new admin pages.
  - Add design compliance tests for targeted admin files.

- [x] `ADMN-040` Add internal-admin subscription action endpoints (upgrade/downgrade/cancel-at-period-end).
  Dependency: `ADMN-022`
  Acceptance criteria:
  - Actions operate on target agency subscription with strict internal-admin auth.
  - Input validation and error codes are explicit.
  - Mutation paths are idempotent where feasible.

- [x] `ADMN-041` Add UI actions with explicit confirmation and optimistic refresh.
  Dependency: `ADMN-040`, `ADMN-034`
  Acceptance criteria:
  - UI requires confirmation before mutation.
  - Success/failure toasts are explicit; data refetch occurs after mutation.

- [x] `ADMN-042` Add mutation security and regression tests.
  Dependency: `ADMN-040`
  Acceptance criteria:
  - Non-admin cannot invoke actions.
  - Invalid tier/status paths return expected errors.
  - Existing customer subscription APIs remain unaffected.

- [x] `ADMN-050` Execute verification matrix (API + web).
  Dependency: milestones 1-4
  Acceptance criteria:
  - `npm run test --workspace=apps/api` (or scoped internal-admin suites) passes.
  - `npm run test --workspace=apps/web` (or scoped admin suites) passes.
  - `npm run typecheck` and `npm run lint` pass for affected workspaces.

- [x] `ADMN-051` Screenshot polish loop across required shells.
  Dependency: `ADMN-032`, `ADMN-033`, `ADMN-034`, `ADMN-041`
  Acceptance criteria:
  - Capture desktop + mobile evidence for:
    - `/internal/admin`
    - `/internal/admin/agencies`
    - `/internal/admin/subscriptions`
    - unauthorized state
  - Store evidence under `docs/images/internal-admin/2026-02-27` (or execution date folder).

- [x] `ADMN-052` Update docs and operational runbook.
  Dependency: `ADMN-050`
  Acceptance criteria:
  - Document env setup, access allowlist changes, and rollback steps.
  - Add endpoint inventory + permissions table.

- [x] `ADMN-053` Refresh MVP requirement mapping.
  Dependency: `ADMN-001`
  Acceptance criteria:
  - `docs/sprints/mvp-requirement-mapping.md` includes admin MVP requirements mapped to `ADMN-*` IDs.

## Verification Strategy

1. API unit/service tests:
- MRR normalization logic.
- Overview aggregates with mixed status/tier fixtures.

2. API security/route tests:
- 401/403/200 coverage for internal-admin endpoints.
- Validation error (400) coverage for query/body constraints.

3. Web tests:
- Query hooks error/success behavior.
- Admin pages render loading, empty, success, and error states.
- Mutation flows for subscription actions (if Milestone 4 included).

4. Design compliance and screenshot validation:
- Static class guard tests for admin pages.
- Screenshot evidence for desktop/mobile across core admin surfaces.

## Risks and Mitigations

1. Risk: accidental exposure of internal-admin data to tenant users.
Mitigation:
- Double gate at API (`authenticate` + `requireInternalAdmin`) and frontend route handling.
- Mandatory security tests before merge.

2. Risk: incorrect MRR due to incomplete interval metadata.
Mitigation:
- Explicit inference rules from Creem product IDs.
- Deterministic behavior for unknown IDs + test coverage.
- Track follow-up for persisted billing interval field.

3. Risk: admin mutations could create unintended billing changes.
Mitigation:
- Confirmation UX, constrained action set, strict validation, and audit log coverage for mutations.

4. Risk: performance degradation from cross-agency aggregate queries.
Mitigation:
- Paginated lists, indexed query patterns, and optional cached daily snapshots as follow-up.

## Release and Rollback Controls

1. Rollout:
- Internal users only (allowlist).
- Prefer feature flag or route-level kill switch via env for fast disable.

2. Rollback:
- Disable internal admin route registration in API.
- Remove web navigation entry and return 404/forbidden for internal pages.

## Exit Criteria

1. Internal-admin routes are inaccessible to non-admin users.
2. Overview page returns accurate MRR + subscription health counters.
3. Agencies/subscriptions pages support operational triage without direct DB access.
4. Verification matrix and screenshot evidence are complete.

## Review Findings Queue

1. Next.js typed route inference did not recognize new internal admin paths during `tsc --noEmit`; temporary navigation uses anchor tags instead of `next/link`.
2. MRR interval detection depends on `creemData.product_id` when present; historical rows without product metadata fall back to tier monthly pricing.
3. Screenshot evidence now uses deterministic mocked `/api/internal-admin/*` responses with `NEXT_PUBLIC_BYPASS_AUTH=true` for stable visual diffs.

## Verification Log (2026-02-27)

- `cd apps/api && npm test src/lib/__tests__/env.test.ts src/lib/__tests__/internal-admin-auth.test.ts src/middleware/__tests__/internal-admin.test.ts src/services/__tests__/internal-admin.service.test.ts src/routes/__tests__/internal-admin.routes.test.ts`: pass (27 tests).
- `cd apps/api && npm test src/routes/__tests__/subscriptions.security.test.ts`: pass (2 tests, regression safety check).
- `cd apps/web && npm test 'src/app/(authenticated)/internal/admin/__tests__/design.test.ts'`: pass (1 test).
- `cd apps/api && npm run typecheck`: pass.
- `cd apps/web && npm run typecheck`: pass.
- `npm run lint --workspace=apps/api`: pass (warnings only, pre-existing).
- `npm run lint --workspace=apps/web`: pass (warnings only, pre-existing).
- `cd apps/web && NEXT_PUBLIC_BYPASS_AUTH=true npm run evidence:internal-admin`: pass.

## Evidence Artifacts (ADMN-051)

- Evidence directory: `docs/images/internal-admin/2026-02-27`
- Total screenshots: `8`
- Captured files:
  - `desktop-light-overview.png`
  - `desktop-light-agencies.png`
  - `desktop-light-subscriptions.png`
  - `desktop-light-unauthorized.png`
  - `mobile-light-overview.png`
  - `mobile-light-agencies.png`
  - `mobile-light-subscriptions.png`
  - `mobile-light-unauthorized.png`
