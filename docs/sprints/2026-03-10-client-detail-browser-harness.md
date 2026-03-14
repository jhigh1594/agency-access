# Sprint: Client Detail Browser Harness

- Date: 2026-03-10
- Status: Completed
- Owners: Web + Shared
- Scope: Add a dev-only browser harness for the authenticated client detail surface so UI verification and screenshot capture can run against deterministic fixture data without live Clerk auth or live API dependencies.
- Discovery input:
  - Browser harness need identified during [`docs/sprints/2026-03-10-client-detail-platform-status.md`](/Users/jhigh/agency-access-platform/docs/sprints/2026-03-10-client-detail-platform-status.md)
  - Existing client detail implementation baseline:
    - [`apps/web/src/app/(authenticated)/clients/[id]/page.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/clients/[id]/page.tsx)
    - [`apps/web/src/components/client-detail/RequestedAccessBoard.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-detail/RequestedAccessBoard.tsx)
  - Existing evidence harness precedent:
    - [`docs/sprints/2026-02-27-admin-backend-mvp.md`](/Users/jhigh/agency-access-platform/docs/sprints/2026-02-27-admin-backend-mvp.md)
    - [`apps/web/scripts/capture-internal-admin-evidence.mjs`](/Users/jhigh/agency-access-platform/apps/web/scripts/capture-internal-admin-evidence.mjs)

## Architecture Baseline Validation

The default `workflow-plan` Rails baseline does not apply directly to this repository.

Applicable baseline for this sprint:
- Next.js App Router frontend in `apps/web`
- Shared TypeScript contracts in `@agency-platform/shared`
- Tailwind through existing semantic UI tokens and shared React primitives
- Dev bypass support already exists through `NEXT_PUBLIC_BYPASS_AUTH=true`
- Playwright evidence scripts are an established pattern for deterministic visual capture

Adaptation note for required planning items:
- “Reusable Phlex primitives/variants” maps here to reusable React fixture builders, harness wrappers, and any shared client-detail rendering helpers needed to keep the harness thin.
- Token-system work is limited to ensuring the harness renders the real client-detail components and does not introduce alternate styling paths.
- Screenshot-polish verification applies to the new harness route and a dedicated evidence script for desktop/mobile states.

## External Research Decision

External research is not required.

Reasoning:
- This is a local tooling and UI verification problem.
- The repository already contains accepted patterns for dev bypass and deterministic browser evidence capture.

## Product Decision Log (Locked)

1. The harness will be fixture-driven, not API-driven, for the first slice.
   - It should render the real client-detail components with local `ClientDetailResponse`-shaped fixture data.
   - This avoids network nondeterminism and simplifies screenshot capture.
2. The harness will be development-only.
   - Route should hard-fail or 404 outside development.
   - It is a tooling surface, not a product surface.
3. The harness should support multiple named presets through query params.
   - Example: `?preset=mixed-google&expand=google`
   - Presets must cover the states needed for client-detail screenshot evidence.
4. The harness should minimize coupling to Clerk and live API fetches.
   - Prefer rendering a dedicated dev page that composes `ClientDetailHeader`, `ClientStats`, and `ClientTabs` directly from fixtures.
   - Do not route through the production query layer in the first slice.
5. Public-route handling is conditional, not automatic.
   - If the harness is intended to work only under `NEXT_PUBLIC_BYPASS_AUTH=true`, no proxy change is required.
   - If the harness must be reachable without bypass, add the route to [`apps/web/src/proxy.ts`](/Users/jhigh/agency-access-platform/apps/web/src/proxy.ts) and cover it in [`apps/web/src/__tests__/proxy.test.ts`](/Users/jhigh/agency-access-platform/apps/web/src/__tests__/proxy.test.ts).
6. The harness must ship with screenshot automation, not just a page.
   - The point is repeatable visual verification, so a dedicated evidence script is part of the sprint scope.

## Architecture Approach

1. Add a dev-only route for the client detail harness.
   - Recommended path: `apps/web/src/app/dev/client-detail/page.tsx`
   - Route accepts search params:
     - `preset`
     - `expand`
2. Add fixture builders in a colocated fixture module.
   - Recommended path: `apps/web/src/components/client-detail/__fixtures__/client-detail-fixtures.ts`
   - Export named presets shaped like `ClientDetailResponse`
3. Build the harness page from the real UI primitives.
   - Render:
     - `ClientDetailHeader`
     - `ClientStats`
     - `ClientTabs`
   - Avoid production data-fetching hooks in the harness page.
4. Add a lightweight dev guard helper.
   - Prevent accidental non-dev exposure.
   - Return a clear not-found or tooling-only message outside development.
5. Add a dedicated Playwright evidence script.
   - Recommended path: `apps/web/scripts/capture-client-detail-evidence.mjs`
   - Capture desktop/mobile across the key presets.
6. Update package scripts and, if required, proxy/public-route coverage.

## Milestones

### Milestone 1: Harness Contract + Planning
- `CDBH-001`, `CDBH-002`, `CDBH-010`, `CDBH-011`

### Milestone 2: Red Tests
- `CDBH-020`, `CDBH-021`, `CDBH-022`

### Milestone 3: Harness Route + Fixtures
- `CDBH-030`, `CDBH-031`, `CDBH-032`

### Milestone 4: Evidence Automation
- `CDBH-040`, `CDBH-041`

### Milestone 5: Verification + Rollout Notes
- `CDBH-050`, `CDBH-051`, `CDBH-052`

## Ordered Task Board

- [x] `CDBH-001` Create sprint artifact for the client detail browser harness.
  Dependency: none
  Acceptance criteria:
  - Sprint doc locks dev-only scope, fixture-first approach, and evidence requirement.
  - Sprint doc distinguishes bypass-only access from optional public-route exposure.

- [x] `CDBH-002` Refresh [`docs/sprints/mvp-requirement-mapping.md`](/Users/jhigh/agency-access-platform/docs/sprints/mvp-requirement-mapping.md) for this sprint.
  Dependency: `CDBH-001`
  Acceptance criteria:
  - Mapping includes stable `CDBH-*` task IDs.
  - Mapping clearly ties the harness to screenshot verification and deterministic UI states.

- [x] `CDBH-010` Lock the harness route contract and preset scheme.
  Dependency: `CDBH-001`
  Acceptance criteria:
  - Route path is decided.
  - Supported query params are explicit.
  - Required presets are named and documented.

- [x] `CDBH-011` Lock the access strategy for the harness.
  Dependency: `CDBH-001`
  Acceptance criteria:
  - Plan explicitly chooses between:
    - bypass-only dev access
    - public dev route with proxy allowlist
  - Any proxy implications are documented before implementation.
  Recommended first-slice choice:
  - bypass-only dev access, because the repo already supports `NEXT_PUBLIC_BYPASS_AUTH=true` in development.

- [x] `CDBH-020` Add failing web tests for fixture loading, preset selection, and dev-only gating.
  Dependency: `CDBH-010`, `CDBH-011`
  Acceptance criteria:
  - Tests fail until the harness page can render a chosen preset.
  - Tests cover an invalid preset fallback.
  - Tests cover non-dev gating behavior.

- [x] `CDBH-021` Add failing tests for expandable preset-driven client-detail rendering.
  Dependency: `CDBH-010`
  Acceptance criteria:
  - Tests prove the harness can pre-expand a platform group via query params.
  - Tests prove the real client-detail components render fixture data, not placeholder markup.

- [x] `CDBH-022` Add failing proxy tests only if the chosen access strategy requires public-route exposure.
  Dependency: `CDBH-011`
  Acceptance criteria:
  - If a proxy change is needed, focused proxy coverage ships in the same slice.
  - If no proxy change is needed, this task is explicitly marked not applicable during implementation.
  Implementation note:
  - Not applicable. The harness remains development-only and does not need a proxy allowlist because Clerk protection is already bypassed for all routes when `NEXT_PUBLIC_BYPASS_AUTH=true` in development.

- [x] `CDBH-030` Implement fixture builders for deterministic client-detail states.
  Dependency: `CDBH-020`
  Acceptance criteria:
  - Fixture module exports at least these presets:
    - `fully-connected`
    - `mixed-google`
    - `revoked-meta`
    - `empty-client`
    - `multi-request-history`
  - Fixtures are typed against shared client-detail contracts.

- [x] `CDBH-031` Implement the dev-only client detail harness page.
  Dependency: `CDBH-020`, `CDBH-021`, `CDBH-030`
  Acceptance criteria:
  - Harness page renders real client-detail components from fixture data.
  - Search params can choose preset and initial expansion target.
  - Non-dev environments do not expose a working harness surface.

- [x] `CDBH-032` Add any reusable harness helpers needed for deterministic rendering.
  Dependency: `CDBH-031`
  Acceptance criteria:
  - Shared logic such as preset parsing or expansion-state derivation is centralized.
  - No duplicated query-param parsing spreads across harness files.

- [x] `CDBH-040` Implement a dedicated Playwright evidence script for the client detail harness.
  Dependency: `CDBH-030`, `CDBH-031`
  Acceptance criteria:
  - Script captures desktop and mobile screenshots for the required presets.
  - Script avoids live network dependencies.
  - Output path is deterministic and versioned under `docs/images/client-detail-platform-status/2026-03-10`.

- [x] `CDBH-041` Add package script wiring and operator instructions.
  Dependency: `CDBH-040`
  Acceptance criteria:
  - `apps/web/package.json` includes an evidence script entry for the new harness.
  - Sprint doc verification section includes the exact command needed to capture evidence.

- [x] `CDBH-050` Perform token-system and visual consistency review on the harness-rendered states.
  Dependency: `CDBH-031`
  Acceptance criteria:
  - Harness renders the production client-detail components without alternate visual paths.
  - Fixture-driven states still satisfy existing design-surface guardrails.
  - Expanded and collapsed states are both screenshot-worthy on desktop and mobile.

- [x] `CDBH-051` Run focused tests, typechecks, and screenshot capture.
  Dependency: `CDBH-040`, `CDBH-041`, `CDBH-050`
  Acceptance criteria:
  - Relevant web tests pass.
  - Relevant web/shared typechecks pass.
  - Screenshot evidence is captured successfully for the required presets.

- [x] `CDBH-052` Record rollout notes, usage instructions, and residual risks in this sprint doc.
  Dependency: `CDBH-051`
  Acceptance criteria:
  - Verification log includes concrete commands and results.
  - Sprint doc explains how future UI work should reuse the harness.
  - Any remaining limitation, such as bypass dependency, is documented explicitly.

## Required Presets

1. `fully-connected`
   - All requested platform groups fulfilled.
2. `mixed-google`
   - Google group partially fulfilled with at least one unresolved product and `expand=google` screenshot coverage.
3. `revoked-meta`
   - Meta group revoked state with historical request context.
4. `empty-client`
   - No grouped access requests yet.
5. `multi-request-history`
   - Multiple request rows present beneath the grouped summary to verify hierarchy.

## Verification Strategy

1. Route and gating correctness
   - Harness page only renders in the intended development access mode.
   - Invalid preset handling is deterministic.

2. Fixture determinism
   - Presets are typed and stable.
   - No live API or Clerk dependency is required for screenshot capture.

3. Frontend behavior
   - Client-detail components render real grouped/request/activity content from fixtures.
   - Expand-state query params work predictably.

4. Visual verification
   - Playwright captures desktop/mobile evidence for the required presets.
   - Screenshots are stored in the expected docs directory.

5. Operational usability
   - Future work on client-detail UI can use one documented command to reproduce evidence.

## Risks and Mitigations

1. A harness route can drift away from the real client-detail page if it reimplements too much layout.
   Mitigation:
   - Compose the real client-detail components directly.
   - Keep harness-specific logic limited to fixtures and query-param parsing.

2. Dev-only routing can accidentally leak into non-dev environments.
   Mitigation:
   - Add explicit environment gating at the page level.
   - Only add proxy/public-route exposure if absolutely necessary.

3. Fixture maintenance can become noisy if each new state is hand-authored from scratch.
   Mitigation:
   - Use base fixture builders with small overrides per preset.

4. Screenshot automation may still depend on environment setup drift.
   Mitigation:
   - The evidence script now self-hosts a Vite preview of the real harness component tree, so it does not depend on Clerk sessions, live APIs, or the current Next dev-server startup state.

## Review Findings Queue

1. Preferred first slice:
   - Do not add proxy allowlist changes unless bypass-only access proves insufficient.
2. Follow-up consideration:
   - If the harness proves useful beyond client detail, promote the pattern into a shared dev-surface convention for authenticated UI evidence.

## Verification Log

- 2026-03-10: Browser harness need identified while closing [`docs/sprints/2026-03-10-client-detail-platform-status.md`](/Users/jhigh/agency-access-platform/docs/sprints/2026-03-10-client-detail-platform-status.md).
- 2026-03-10: Existing precedent confirmed in [`docs/sprints/2026-02-27-admin-backend-mvp.md`](/Users/jhigh/agency-access-platform/docs/sprints/2026-02-27-admin-backend-mvp.md) and [`apps/web/scripts/capture-internal-admin-evidence.mjs`](/Users/jhigh/agency-access-platform/apps/web/scripts/capture-internal-admin-evidence.mjs).
- 2026-03-10: Added red web tests for harness preset fallback, dev-only gating, required fixture exports, and initial platform-group expansion.
  - Command:
    - `npm test --workspace=apps/web -- src/app/dev/client-detail/__tests__/page.test.tsx src/components/client-detail/__tests__/client-detail-harness-fixtures.test.ts src/components/client-detail/__tests__/requested-access-board.test.tsx`
  - Result:
    - Passed: 3 test files, 7 tests.
- 2026-03-10: Implemented fixture-driven harness rendering at [`apps/web/src/app/dev/client-detail/page.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/app/dev/client-detail/page.tsx) with typed presets in [`apps/web/src/components/client-detail/__fixtures__/client-detail-fixtures.ts`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-detail/__fixtures__/client-detail-fixtures.ts).
- 2026-03-10: Added preset-aware initial expansion support to the real client-detail component tree.
  - Files:
    - [`apps/web/src/components/client-detail/ClientTabs.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-detail/ClientTabs.tsx)
    - [`apps/web/src/components/client-detail/OverviewTab.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-detail/OverviewTab.tsx)
    - [`apps/web/src/components/client-detail/RequestedAccessBoard.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/client-detail/RequestedAccessBoard.tsx)
- 2026-03-10: Ran focused web typecheck for the harness slice.
  - Command:
    - `npm run typecheck --workspace=apps/web`
  - Result:
    - Passed.
- 2026-03-10: Captured deterministic desktop/mobile evidence with the dedicated harness script.
  - Command:
    - `npm run evidence:client-detail --workspace=apps/web`
  - Result:
    - Passed.
    - Artifacts written under [`docs/images/client-detail-platform-status/2026-03-10`](/Users/jhigh/agency-access-platform/docs/images/client-detail-platform-status/2026-03-10).

## Usage Notes

1. Manual route verification
   - Run the Next app in development and open `/dev/client-detail/?preset=mixed-google&expand=google`.
   - The route returns `notFound()` when `NODE_ENV=production`.

2. One-command screenshot capture
   - Run `npm run evidence:client-detail --workspace=apps/web`.
   - The script starts a local Vite preview automatically when `EVIDENCE_BASE_URL` is not provided, then writes the required desktop/mobile screenshots to [`docs/images/client-detail-platform-status/2026-03-10`](/Users/jhigh/agency-access-platform/docs/images/client-detail-platform-status/2026-03-10).

3. Preset coverage
   - `fully-connected`
   - `mixed-google` with `expand=google`
   - `revoked-meta` with `expand=meta`
   - `empty-client`
   - `multi-request-history`

## Residual Risks

1. The manual `/dev/client-detail` route still depends on the surrounding Next dev environment for interactive browser use.
   - Screenshot capture is insulated from that dependency by the Vite-backed evidence path, but manual route checks still inherit any unrelated Next startup failures.
2. The fixture set is deliberately additive, not exhaustive.
   - Future client-detail changes that introduce new grouped states should extend the shared base fixture builder instead of adding disconnected one-off objects.
