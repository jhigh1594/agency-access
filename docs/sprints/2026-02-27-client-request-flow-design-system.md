# Sprint: Client Request Flow Design-System + UX Conversion

- Date: 2026-02-27
- Status: Completed
- Owners: Web + API
- Scope: Creator request wizard, request success page, invite flow, OAuth callback, manual invite sub-flows (Beehiiv/Kit/Pinterest), additive client payload enrichment.

## Architecture Approach

1. Keep route and persistence topology unchanged.
2. Additive data contract only for `GET /api/client/:token`.
3. Move UI surfaces to existing tokenized design system (`globals.css` tokens + shared ui primitives).
4. Introduce a reusable flow shell for step-based pages.
5. Maintain current analytics events and add continuity behavior without schema changes.

## Milestones

### Milestone 1: Contract + Docs
- ARWF-001, ARWF-002, ARWF-010, ARWF-020, ARWF-021

### Milestone 2: Creator Flow Migration
- ARWF-100, ARWF-110, ARWF-111, ARWF-120

### Milestone 3: Invite Core + Callback
- ARWF-200, ARWF-201, ARWF-202, ARWF-220

### Milestone 4: Manual Flows
- ARWF-210, ARWF-211

### Milestone 5: Test + Verification
- ARWF-300, ARWF-301, ARWF-400, ARWF-500

## Ordered Task Board

- [x] `ARWF-001` Create sprint artifact.
  Dependency: none
  Acceptance: includes architecture approach, milestones, verification strategy, risks.

- [x] `ARWF-002` Create/refresh PRD requirement mapping doc.
  Dependency: `ARWF-001`
  Acceptance: PRD workflows mapped to sprint task IDs.

- [x] `ARWF-010` Add shared DTO types for enriched client payload.
  Dependency: none
  Acceptance: exported shared types compile in both web and api.

- [x] `ARWF-020` Enrich `GET /api/client/:token` response with:
  - `agencyName`
  - `manualInviteTargets`
  - `authorizationProgress`
  Dependency: `ARWF-010`
  Acceptance: response shape remains `{ data, error }`; old fields preserved.

- [x] `ARWF-021` Add API tests for enriched response + not-found/expired behavior.
  Dependency: `ARWF-020`
  Acceptance: tests added and passing.

- [x] `ARWF-100` Add shared flow-shell UI primitive for wizard pages.
  Dependency: none
  Acceptance: reused in creator wizard and invite flow.

- [x] `ARWF-110` Migrate creator wizard + subcomponents to strict tokens/components.
  Dependency: `ARWF-100`
  Acceptance: no `slate|indigo|gray|red|green|yellow|amber-*` classes in targeted creator files.

- [x] `ARWF-111` Creator UX upgrades: clearer required states, edit links in review, consistent action rail behavior.
  Dependency: `ARWF-110`
  Acceptance: deterministic step nav and keyboard-safe behavior.

- [x] `ARWF-120` Migrate creator success page + improve send actions.
  Dependency: `ARWF-110`
  Acceptance: explicit expiration date messaging and no decorative error glyphs.

- [x] `ARWF-200` Migrate invite core and fix invalid-token infinite loading path.
  Dependency: `ARWF-100`
  Acceptance: invalid/expired token always renders recovery state.

- [x] `ARWF-201` Invite continuity: hydrate completed platforms from API and persist temporary state in `sessionStorage`.
  Dependency: `ARWF-020`
  Acceptance: refresh restores partial completion.

- [x] `ARWF-202` Invoke `/api/client/:token/complete` exactly once at full completion.
  Dependency: `ARWF-201`
  Acceptance: endpoint called once; retryable UI on failure.

- [x] `ARWF-210` Build shared manual-invite shell and migrate Beehiiv/Kit/Pinterest flows.
  Dependency: `ARWF-100`, `ARWF-020`
  Acceptance: no hardcoded fallback email or fabricated progress copy.

- [x] `ARWF-211` Consolidate duplicate Pinterest manual flow path.
  Dependency: `ARWF-210`
  Acceptance: single maintained path and updated imports.

- [x] `ARWF-220` Migrate OAuth callback page to design tokens and consistent CTA/error states.
  Dependency: `ARWF-100`
  Acceptance: callback UI aligns with flow system and accessibility requirements.

- [x] `ARWF-300` Repair/add web tests for creator + recipient flow.
  Dependency: `ARWF-110`, `ARWF-200`
  Acceptance: includes fixed QueryClient harness and completion/error coverage.

- [x] `ARWF-301` Add design compliance tests for targeted migrated files.
  Dependency: `ARWF-110`, `ARWF-210`, `ARWF-220`
  Acceptance: tests fail on forbidden generic classes for scoped files.

- [x] `ARWF-400` End-to-end verification: desktop/mobile + light/dark across creator/recipient/manual surfaces.
  Dependency: all prior work
  Acceptance: no blocker regressions; evidence captured.
  Status note: screenshot evidence captured under `docs/images/client-request-flow/2026-02-27`.

- [x] `ARWF-500` Final quality gates and release checklist update.
  Dependency: `ARWF-400`
  Acceptance: tests/typecheck/lint pass and release notes captured.
  Status note: quality gates run green (lint exits 0 with warnings only).

## Verification Strategy

1. API route tests for `GET /api/client/:token` enriched payload and status behavior.
2. Web integration tests for step gating, completion, and error states.
3. Design compliance tests for migrated files to prevent generic color regressions.
4. Manual flow verification for creator, invite, and each manual platform path in desktop/mobile.

## Risks and Mitigations

1. Monolithic page refactors can regress behavior.
   Mitigation: small file-local commits and milestone-level test runs.

2. Additive payload can drift from frontend assumptions.
   Mitigation: shared DTO types in `@agency-platform/shared` and route tests asserting shape.

3. Manual flow consolidation can break platform-specific guidance.
   Mitigation: shared shell only; per-platform instruction bodies remain isolated.

## Verification Log (2026-02-27)

- `npm run typecheck --workspace=apps/web`: pass
- `npm run typecheck --workspace=apps/api`: pass
- `cd apps/api && npm test src/routes/__tests__/access-requests.routes.test.ts`: pass (15 tests)
- `cd apps/web && npm test 'src/app/(authenticated)/access-requests/new/__tests__/page.test.tsx' 'src/app/invite/[token]/__tests__/page.test.tsx' 'src/app/__tests__/client-request-flow.design.test.ts'`: pass (8 tests)
- `npm run lint --workspace=apps/api`: pass (warnings only)
- `npm run lint --workspace=apps/web`: pass (warnings only)
- `npm run lint`: pass (root aggregator updated to web+api workspaces)
- `cd apps/web && node ./scripts/capture-client-request-flow-evidence.mjs`: pass (32 screenshots)
- Post-evidence bugfix validation:
  - `FlowShell` migrated to `m.div` for LazyMotion strict compatibility.
  - Creator wizard step animations migrated to `m.*` to remove runtime overlay.
  - `ClientSelector` now supports dev-auth bypass path for deterministic mobile evidence capture.

## Evidence Artifacts (ARWF-400)

- Evidence directory: `docs/images/client-request-flow/2026-02-27`
- Script used: `apps/web/scripts/capture-client-request-flow-evidence.mjs`
- Profiles captured:
  - `desktop-light`
  - `desktop-dark`
  - `mobile-light`
  - `mobile-dark`
- Scenarios captured per profile:
  - `creator-wizard`
  - `creator-success`
  - `invite-core`
  - `invite-invalid`
  - `oauth-callback-error`
  - `manual-beehiiv`
  - `manual-kit`
  - `manual-pinterest`
- Total screenshots: `32`

## Review Findings Queue

1. Lint now runs with ESLint flat config in `apps/api` and `apps/web`; both workspaces still emit pre-existing warnings outside this sprint scope.
2. Screenshot evidence pass uses mocked API responses for deterministic visual verification while preserving target flow rendering contracts.
