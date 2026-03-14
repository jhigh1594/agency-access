# Sprint: Google Account Discovery Hardening

- Date: 2026-03-10
- Status: Implemented
- Owners: API + Web
- Scope: Harden post-OAuth Google asset discovery so each requested Google product makes the correct discovery calls, returns the correct entity type, and drives truthful zero-assets state in the invite UI.
- Supersedes/extends:
  - [`docs/sprints/2026-03-10-google-post-oauth-account-selection.md`](/Users/jhigh/agency-access-platform/docs/sprints/2026-03-10-google-post-oauth-account-selection.md)
  - [`docs/solutions/google-authorization-fulfillment-truthfulness.md`](/Users/jhigh/agency-access-platform/docs/solutions/google-authorization-fulfillment-truthfulness.md)
  - [`docs/solutions/google-selector-stale-response-guard.md`](/Users/jhigh/agency-access-platform/docs/solutions/google-selector-stale-response-guard.md)

## Problem Statement

The Google fulfillment model now treats OAuth truthfully, but the underlying discovery layer still has correctness gaps:
- `availableAssetCount` in the invite UI is only pushed after a selection change, so a loaded zero-assets state can be misclassified until the client clicks.
- Google Business Profile currently fetches accounts while the UI and fulfillment model treat the requested entity as locations.
- Merchant Center discovery does not currently follow the documented authinfo-to-account-list flow.
- The client asset route fetches all Google product inventories even when the invite only needs one product, which broadens failure surface and makes correctness harder to reason about.
- Test coverage does not currently prove these product-specific discovery paths.

## Architecture Baseline Validation

The default `workflow-plan` Rails baseline does not apply directly to this repository.

Applicable baseline for this sprint:
- Next.js App Router frontend in `apps/web`
- Fastify + Prisma backend in `apps/api`
- Shared TypeScript contracts in `@agency-platform/shared`
- Existing invite runtime and Google fulfillment evaluator remain the baseline; this sprint hardens discovery fidelity underneath them

Adaptation note for planning requirements:
- “Reusable Phlex primitives/variants” maps here to additive invite/runtime helpers and connector-level discovery methods rather than new UI primitives.
- Token-system work is limited to preserving the current invite design while making empty-state readiness truthful on first render.

## External Research Decision

External research is required for this sprint because Google discovery endpoints are correctness-sensitive and vendor contracts may drift.

Primary sources to use during implementation:
- Google Business Profile Business Information API docs for `accounts.locations.list`
- Google Content API for Shopping docs for `accounts.authinfo` and `accounts.list`
- Google Search Console scope and site-listing docs, only to confirm current scope requirements if implementation changes
- Google Ads official docs only for validating existing accessible-customer flow if touched

## Product Decision Log (Locked)

1. Post-OAuth Google discovery must be product-scoped.
   - When the client opens the selector for `ga4`, the backend should not need to fetch Merchant Center and Business Profile as a side effect.
2. Requested entity types must match user-facing copy.
   - Google Business Profile means selectable locations, not just top-level business accounts.
3. Zero-assets truthfulness must be driven from load completion, not only user interaction.
   - The selector must persist `availableAssetCount` as soon as discovery finishes.
4. Merchant Center discovery must follow documented accessible-account resolution rather than optimistic undocumented root listing.
5. The sprint is still Google-only.
   - Do not generalize all grouped platforms unless the implementation path requires a shared abstraction.

## Architecture Approach

1. Split Google discovery into explicit per-product fetch paths in the connector or a small adapter layer.
   - Keep a grouped convenience method only if existing agency routes still need it.
2. Update the client asset route so Google product requests call the specific discovery method for that product.
3. Change Google Business Profile discovery to resolve locations and map them into the existing shared shape expected by the selector.
4. Change Merchant Center discovery to:
   - resolve accessible merchant IDs from the documented authinfo endpoint
   - fetch account detail per accessible merchant account
5. Fix `GoogleAssetSelector` so `availableAssetCount` is emitted after load, not only after selection changes.
6. Add TDD coverage at the connector, route, and wizard layers so each product-level path is explicitly verified.

## Milestones

### Milestone 1: Contract + Research Lock
- `GADH-001`, `GADH-002`, `GADH-010`

### Milestone 2: Red Tests
- `GADH-020`, `GADH-021`, `GADH-022`

### Milestone 3: Backend Discovery Corrections
- `GADH-030`, `GADH-031`, `GADH-032`

### Milestone 4: Frontend Truthfulness
- `GADH-040`, `GADH-041`, `GADH-042`

### Milestone 5: Verification + Review
- `GADH-050`, `GADH-051`, `GADH-052`

## Ordered Task Board

- [x] `GADH-001` Create follow-up sprint artifact for Google discovery hardening.
  Dependency: none
  Acceptance criteria:
  - Sprint doc captures the scoped discovery defects separately from the fulfillment-truthfulness sprint.
  - Task IDs are stable and additive.

- [x] `GADH-002` Refresh [`docs/sprints/mvp-requirement-mapping.md`](/Users/jhigh/agency-access-platform/docs/sprints/mvp-requirement-mapping.md) for Google discovery hardening.
  Dependency: `GADH-001`
  Acceptance criteria:
  - Mapping distinguishes discovery correctness from the earlier fulfillment semantics work.
  - Requirements map to `GADH-*` tasks only.

- [x] `GADH-010` Lock the product-scoped Google discovery contract.
  Dependency: `GADH-001`
  Acceptance criteria:
  - The plan identifies which Google products use which discovery endpoints.
  - The selector-facing entity type is explicit for each product.
  - Any additive shared-type impact is identified before code changes.

- [x] `GADH-020` Add failing backend tests for product-scoped Google asset fetching.
  Dependency: `GADH-010`
  Acceptance criteria:
  - Asset-route tests prove `google_business_profile` uses location discovery.
  - Asset-route tests prove `google_merchant_center` uses the Merchant Center-specific discovery path.
  - Tests prove requesting one Google product does not require fetching every Google product inventory.

- [x] `GADH-021` Add failing connector tests for Business Profile and Merchant Center discovery.
  Dependency: `GADH-010`
  Acceptance criteria:
  - Business Profile tests prove the connector maps locations into selector-ready items.
  - Merchant Center tests prove accessible merchant IDs are resolved before account detail listing.
  - Existing GA4 behavior remains covered.

- [x] `GADH-022` Add failing frontend tests for zero-assets propagation on initial load.
  Dependency: `GADH-010`
  Acceptance criteria:
  - `GoogleAssetSelector` reports `availableAssetCount: 0` immediately after an empty fetch completes.
  - `PlatformAuthWizard` renders follow-up-needed state from loaded zero-assets data without requiring user clicks.

- [x] `GADH-030` Refactor Google discovery into explicit per-product methods and route dispatch.
  Dependency: `GADH-020`, `GADH-021`
  Acceptance criteria:
  - The client asset route dispatches to the requested Google product only.
  - Existing grouped discovery callers remain functional or are updated safely.
  - Per-product errors remain isolated and do not break other products.

- [x] `GADH-031` Correct Google Business Profile discovery to return selectable locations.
  Dependency: `GADH-021`
  Acceptance criteria:
  - Discovery uses the documented Business Profile location path.
  - Returned data supports the existing multi-select UI without misleading labels.
  - Zero-locations responses are treated as valid empty inventory, not transport failure.

- [x] `GADH-032` Correct Merchant Center discovery to follow accessible-account resolution.
  Dependency: `GADH-021`
  Acceptance criteria:
  - Discovery uses the documented authinfo step for accessible-account resolution.
  - The selector receives stable merchant account IDs and deterministic fallback names when only merchant IDs are available.
  - Missing Merchant Center access results in empty inventory rather than an unhandled route failure.

- [x] `GADH-033` Complete Merchant Center discovery with account detail and sub-account listing.
  Dependency: `GADH-032`
  Acceptance criteria:
  - Discovery follows `accounts.authinfo` with account detail and list calls where available.
  - Top-level Merchant Center accounts and accessible sub-accounts are both surfaced without duplicate IDs.
  - Synthetic fallback names are only used when Google does not return a name.

- [x] `GADH-034` Add pagination handling for Business Profile account and location discovery.
  Dependency: `GADH-031`
  Acceptance criteria:
  - Business Profile account discovery follows `nextPageToken` when present.
  - Location discovery follows `nextPageToken` when present.
  - Multi-page location inventories are returned as a single flattened selector list.

- [x] `GADH-035` Audit-log Google token reads during client asset discovery.
  Dependency: `GADH-030`
  Acceptance criteria:
  - Google client asset fetches create an AuditLog entry with platform, source, user email, and request-derived IP metadata.
  - Existing TikTok token-read logging remains intact.
  - No token values are written into audit metadata.

- [x] `GADH-040` Fix Google selector readiness to persist asset counts on load completion.
  Dependency: `GADH-022`
  Acceptance criteria:
  - `availableAssetCount` is emitted whenever fetched assets change.
  - Existing multi-select behavior remains intact.
  - No regression to the save/continue gating logic for non-empty products.

- [x] `GADH-041` Keep invite copy and summary states aligned with corrected discovery entities.
  Dependency: `GADH-031`, `GADH-032`, `GADH-040`
  Acceptance criteria:
  - Business Profile copy no longer implies locations when only accounts are returned.
  - Success and empty states remain calm and truthful on desktop and mobile.
  - Product summaries still distinguish selected assets from zero-assets follow-up.

- [x] `GADH-042` Ignore stale Google selector fetch results when the active session or product changes.
  Dependency: `GADH-040`
  Acceptance criteria:
  - Earlier in-flight Google selector requests cannot overwrite a newer product/session load.
  - `availableAssetCount` is published only for the latest request context.
  - Focused selector tests prove the zero-assets continue path cannot be unlocked by stale results.

- [x] `GADH-050` Run focused regression tests and relevant typechecks.
  Dependency: `GADH-030`, `GADH-040`
  Acceptance criteria:
  - Relevant API and web tests pass.
  - Relevant shared/api/web typechecks pass or blocking unrelated failures are documented precisely.

- [x] `GADH-051` Run targeted review on discovery correctness and contract safety.
  Dependency: `GADH-050`
  Acceptance criteria:
  - Review checks route dispatch correctness, secure token usage, and selector truthfulness.
  - Findings are captured in this sprint doc and resolved or explicitly documented.

- [x] `GADH-052` Capture rollout notes and residual risks in this sprint doc.
  Dependency: `GADH-051`
  Acceptance criteria:
  - Verification log records the concrete commands run.
  - Residual gaps, if any, are tied to specific Google products or environment prerequisites.

## Verification Strategy

1. Connector correctness
   - Unit tests for Business Profile location mapping
   - Unit tests for Merchant Center authinfo/account listing
   - Regression coverage for GA4 and any touched Ads behavior

2. Route correctness
   - Asset-route tests proving per-product dispatch and connection ownership enforcement remain intact

3. Frontend truthfulness
   - Selector tests proving `availableAssetCount` updates on load
   - Wizard tests proving zero-assets follow-up state is available without extra interaction

4. Contract safety
   - Confirm no token storage changes; OAuth secrets remain in Infisical only
   - Confirm additive behavior does not regress existing request-completion semantics

## Risks and Mitigations

1. Google API contracts differ by product and can fail asymmetrically.
   Mitigation: test per-product discovery independently and rely on official vendor docs only.

2. Refactoring from grouped discovery to product-scoped dispatch could break agency-facing grouped Google surfaces.
   Mitigation: retain or adapt a grouped convenience path where still needed, and verify all current callers.

3. Business Profile location discovery may require extra nesting or pagination assumptions.
   Mitigation: start with documented location listing behavior and encode pagination assumptions in tests.

4. Merchant Center access patterns may vary by account topology.
   Mitigation: treat inaccessible or missing accounts as empty inventory unless the API returns a true transport error worth surfacing.

5. Frontend empty-state fixes could accidentally alter existing selection behavior.
   Mitigation: keep the change scoped to effect dependencies and cover with focused tests.

## Review Findings Queue

1. No unresolved change-specific correctness findings remain after the stale-response follow-up patch.
2. Residual environment prerequisite: Google Ads account discovery still depends on `GOOGLE_ADS_DEVELOPER_TOKEN` being configured with sufficient access level for the target accounts.
3. Workspace blocker: `npm run typecheck --workspace=apps/api` currently fails because of unrelated issues in `apps/api/instrument.ts` and `apps/api/src/routes/sentry-test.routes.ts`.

## Verification Log

- `npm test --workspace=apps/api -- src/services/connectors/__tests__/google.connector.test.ts`
  Result: pass
- `npm test --workspace=apps/api -- src/routes/client-auth/__tests__/assets.google.test.ts`
  Result: pass
- `npm test --workspace=apps/web -- src/components/client-auth/__tests__/GoogleAssetSelector.test.tsx`
  Result: pass
- `npm test --workspace=apps/web -- src/components/client-auth/__tests__/PlatformAuthWizard.test.tsx`
  Result: pass
- `npm test --workspace=apps/api -- src/routes/client-auth/__tests__/assets.tiktok.test.ts`
  Result: pass
- `npm test --workspace=apps/api -- src/routes/client-auth/__tests__/assets.security.test.ts`
  Result: pass
- `npm run typecheck --workspace=packages/shared`
  Result: pass
- `npm test --workspace=apps/web -- src/components/client-auth/__tests__/GoogleAssetSelector.test.tsx`
  Result: pass
- `npm test --workspace=apps/web -- src/components/client-auth/__tests__/PlatformAuthWizard.test.tsx`
  Result: pass
- `npm test --workspace=apps/web -- src/components/access-request-detail/__tests__/request-platforms-card.test.tsx`
  Result: pass
- `npm run typecheck --workspace=apps/web`
  Result: pass
- `npm run typecheck --workspace=apps/api`
  Result: fails due unrelated existing issues:
  - `apps/api/instrument.ts(74,7)` invalid `captureUnhandledRejections` property on `NodeOptions`
  - `apps/api/src/index.ts(2,8)` `instrument.ts` outside configured `rootDir`
  - `apps/api/src/routes/sentry-test.routes.ts(32,7)` unused `@ts-expect-error`
  - `apps/api/src/routes/sentry-test.routes.ts(127,9)` / `(143,24)` implicit `any[]` for `taskFiles`
  - `apps/api/src/routes/sentry-test.routes.ts(131,12)` / `(132,12)` `statSync` missing on imported `fs/promises`
- `npm test --workspace=apps/api -- src/services/connectors/__tests__/google.connector.test.ts`
  Result: pass
- `npm test --workspace=apps/api -- src/routes/client-auth/__tests__/assets.google.test.ts`
  Result: pass
- `npm test --workspace=apps/api -- src/routes/client-auth/__tests__/assets.tiktok.test.ts`
  Result: pass
- `npm test --workspace=apps/api -- src/routes/client-auth/__tests__/assets.security.test.ts`
  Result: pass
- `npm run typecheck --workspace=packages/shared`
  Result: pass
- `npm run typecheck --workspace=apps/api`
  Result: fails due unrelated existing issues:
  - `apps/api/instrument.ts(74,7)` invalid `captureUnhandledRejections` property on `NodeOptions`
  - `apps/api/src/index.ts(2,8)` `instrument.ts` outside configured `rootDir`
  - `apps/api/src/routes/sentry-test.routes.ts(32,7)` unused `@ts-expect-error`
  - `apps/api/src/routes/sentry-test.routes.ts(127,9)` / `(143,24)` implicit `any[]` for `taskFiles`
  - `apps/api/src/routes/sentry-test.routes.ts(131,12)` / `(132,12)` `statSync` missing on imported `fs/promises`
