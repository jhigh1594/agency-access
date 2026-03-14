# Sprint: Client Detail Platform Status

- Date: 2026-03-10
- Status: In Progress
- Owners: Web + API + Shared
- Scope: Reframe the authenticated client detail page around a platform-group-first `Requested Access` board, with grouped progress like `4/5 connected`, expandable product-level detail, and preserved request/activity history.
- Discovery input:
  - [`docs/brainstorms/2026-03-10-client-detail-platform-status-brainstorm.md`](/Users/jhigh/agency-access-platform/docs/brainstorms/2026-03-10-client-detail-platform-status-brainstorm.md)
  - [`docs/plans/2026-03-10-client-detail-platform-status.md`](/Users/jhigh/agency-access-platform/docs/plans/2026-03-10-client-detail-platform-status.md)
  - Related implementation baselines:
    - [`docs/sprints/2026-03-04-access-request-editing-workflow.md`](/Users/jhigh/agency-access-platform/docs/sprints/2026-03-04-access-request-editing-workflow.md)
    - [`docs/sprints/2026-03-10-cross-platform-post-oauth-fulfillment.md`](/Users/jhigh/agency-access-platform/docs/sprints/2026-03-10-cross-platform-post-oauth-fulfillment.md)
    - [`docs/sprints/2026-03-10-google-post-oauth-account-selection.md`](/Users/jhigh/agency-access-platform/docs/sprints/2026-03-10-google-post-oauth-account-selection.md)

## Architecture Baseline Validation

The default `workflow-plan` Rails baseline does not apply directly to this repository.

Applicable baseline for this sprint:
- Next.js App Router frontend in `apps/web`
- Fastify + Prisma backend in `apps/api`
- Shared TypeScript contracts in `@agency-platform/shared`
- Tailwind and existing tokenized UI primitives in `apps/web/src/components/ui`
- Authenticated agency surfaces remain the existing product shell; this sprint changes information hierarchy inside the client detail page, not navigation architecture

Adaptation note for required planning items:
- “Reusable Phlex primitives/variants” maps here to reusable React client-detail primitives and status-rendering helpers in `apps/web/src/components/client-detail`.
- Token-system work means extending the existing semantic status, spacing, and density patterns rather than introducing one-off palette classes or a new page-specific theme.
- Screenshot-polish verification applies to the authenticated client detail page on desktop and mobile, including collapsed and expanded platform-group states.

## External Research Decision

External research is not required for this sprint.

Reasoning:
- The risk is product synthesis and local contract design, not vendor API uncertainty.
- The repo already contains the relevant fulfillment semantics in request-detail and invite-flow work.
- The core work is additive aggregation and UI hierarchy inside existing product patterns.

## Product Decision Log (Locked)

1. The client detail page becomes platform-group-first.
   - The primary question is operational: what does this client still owe us?
   - Request history remains available, but secondary.
2. The current `Overview` / `Activity` tab structure stays for the first iteration.
   - `Overview` becomes a mixed surface:
     - `Requested Access` board first
     - request history second
   - `Activity` remains the audit trail.
3. Platform-group level is the primary scan unit.
   - Each platform group gets one top-level status and one progress metric, such as `4/5 connected`.
   - Product-level detail is revealed through expansion, not shown by default.
4. Group status must be derived from fulfillment truth, not only latest request badges.
   - Existing request statuses remain visible in history, but do not define the only “current truth.”
5. Contract changes stay additive.
   - Preserve `accessRequests` and `activity`.
   - Add grouped status data to `ClientDetailResponse`.
6. The first slice optimizes for clarity, not a full dashboard rewrite.
   - No broader list/dashboard changes in this sprint.
   - No changes to client authorization flow behavior in this sprint.

## Architecture Approach

1. Extend `ClientDetailResponse` with a grouped summary collection, tentatively `platformGroups`.
   - Each group should include:
     - `platformGroup`
     - top-level status
     - `fulfilledCount`
     - `requestedCount`
     - latest request metadata
     - product-level status entries
2. Add backend aggregation inside the client detail service.
   - Source inputs:
     - client access requests
     - request platform selections
     - connection status
     - persisted granted assets / authorizations where available
   - Reuse fulfillment semantics already established in access request services wherever practical.
3. Introduce a reusable client-detail React primitive for the new board.
   - Dense row layout
   - explicit status + progress
   - accessible expand/collapse for product rows
4. Keep request history rendering intact and move it below the new board inside `Overview`.
5. Preserve design-system compliance through the existing semantic tokens and targeted design tests.

## Milestones

### Milestone 1: Contract Lock + Sprint Setup
- `CDPS-001`, `CDPS-002`, `CDPS-010`, `CDPS-011`

### Milestone 2: Red Tests
- `CDPS-020`, `CDPS-021`, `CDPS-022`

### Milestone 3: Backend Aggregation
- `CDPS-030`, `CDPS-031`

### Milestone 4: Requested Access UI
- `CDPS-040`, `CDPS-041`, `CDPS-042`

### Milestone 5: Polish + Verification
- `CDPS-050`, `CDPS-051`, `CDPS-052`, `CDPS-053`

## Ordered Task Board

- [x] `CDPS-001` Create sprint artifact for client detail platform status work.
  Dependency: none
  Acceptance criteria:
  - Sprint doc locks architecture approach, milestones, and risk controls.
  - Sprint doc explicitly records the platform-group-first decision and additive contract approach.

- [x] `CDPS-002` Refresh [`docs/sprints/mvp-requirement-mapping.md`](/Users/jhigh/agency-access-platform/docs/sprints/mvp-requirement-mapping.md) for this sprint.
  Dependency: `CDPS-001`
  Acceptance criteria:
  - Requirement mapping includes stable `CDPS-*` task IDs.
  - Mapping distinguishes this sprint from access-request-detail and invite-fulfillment work.

- [x] `CDPS-010` Lock the grouped status contract and derivation rules before implementation.
  Dependency: `CDPS-001`
  Acceptance criteria:
  - The grouped response shape is defined before code changes.
  - Group-level and product-level status vocabularies are explicit.
  - Progress semantics use fulfilled-product count over requested-product count.

- [x] `CDPS-011` Lock the page information hierarchy for the first slice.
  Dependency: `CDPS-001`
  Acceptance criteria:
  - `Overview` remains the primary tab and contains both the new board and request history.
  - `Activity` remains unchanged except for compatibility with the new response shape.
  - No broader navigation or shell redesign is introduced.

- [x] `CDPS-020` Add failing shared-type tests for grouped client detail status contracts.
  Dependency: `CDPS-010`
  Acceptance criteria:
  - Tests fail until additive grouped-status schemas/types are exported.
  - Shared type coverage includes the new platform-group status vocabulary.

- [x] `CDPS-021` Add failing API/service tests for client-detail platform-group aggregation.
  Dependency: `CDPS-010`
  Acceptance criteria:
  - Tests cover grouped progress like `1/2` and mixed product states inside one platform group.
  - Tests prove the response remains additive and preserves existing client detail fields.
  - Tests cover at least one non-happy-path status such as `expired` or `revoked`.

- [x] `CDPS-022` Add failing web tests for the `Requested Access` board and overview hierarchy.
  Dependency: `CDPS-011`
  Acceptance criteria:
  - Tests assert the new board renders before request history.
  - Tests cover expand/collapse behavior and product-level status rendering.
  - Design-surface compliance coverage includes any new client-detail component files.

- [x] `CDPS-030` Extend shared contracts and backend client detail response with grouped status data.
  Dependency: `CDPS-020`, `CDPS-021`
  Acceptance criteria:
  - `ClientDetailResponse` gains additive grouped-status data without removing existing fields.
  - Backend response matches the shared contract.
  - Existing API envelope shape remains `{ data: T }`.

- [x] `CDPS-031` Implement deterministic client-detail aggregation from request history and fulfillment data.
  Dependency: `CDPS-021`, `CDPS-030`
  Acceptance criteria:
  - Group-level status is derived from fulfillment truth, not only latest request status.
  - Product-level entries show the exact resolved state used by the group summary.
  - Latest-request metadata is available for contextual actions and copy.

- [x] `CDPS-040` Create a reusable `RequestedAccessBoard` primitive for client detail surfaces.
  Dependency: `CDPS-022`, `CDPS-030`
  Acceptance criteria:
  - The new component accepts grouped client-detail data only, not raw access requests.
  - The component uses existing semantic tokens and shared UI primitives.
  - Expansion is keyboard-accessible with explicit `aria-expanded` state.

- [x] `CDPS-041` Integrate the board into `OverviewTab` while preserving request history behavior.
  Dependency: `CDPS-031`, `CDPS-040`
  Acceptance criteria:
  - `Requested Access` renders above the existing request list.
  - Existing request status filtering and links still work.
  - Empty states remain clear when there are no grouped entries or no request history.

- [x] `CDPS-042` Add reusable status/presentation helpers for dense grouped rows.
  Dependency: `CDPS-040`
  Acceptance criteria:
  - Repeated mapping logic such as status-label translation or progress copy is centralized.
  - Product rows and group rows share a coherent presentation model.
  - No duplicated one-off formatting logic spreads across multiple components.

- [x] `CDPS-050` Perform token-system and density polish on the new client-detail surface.
  Dependency: `CDPS-041`, `CDPS-042`
  Acceptance criteria:
  - New grouped rows feel intentional and operationally dense, not like marketing cards.
  - Styling uses semantic tokens and passes the existing client-detail design guardrails.
  - Mobile layout preserves status, progress, and expand affordance without crowding.

- [ ] `CDPS-051` Capture screenshot evidence across required shells.
  Dependency: `CDPS-050`
  Acceptance criteria:
  - Capture desktop and mobile screenshots for:
    - client detail overview with a mixed partial platform group expanded
    - client detail overview with a fully connected platform group
    - client detail overview empty or low-data state if materially changed
  - Store artifacts under `docs/images/client-detail-platform-status/2026-03-10`.

- [x] `CDPS-052` Run focused regression tests and relevant typechecks.
  Dependency: `CDPS-031`, `CDPS-041`
  Acceptance criteria:
  - Targeted shared, API, and web tests pass.
  - Relevant typechecks pass, or unrelated blockers are documented precisely.
  - Changed client-detail files remain within design-system compliance tests.

- [ ] `CDPS-053` Record rollout notes, residual risks, and review findings in this sprint doc.
  Dependency: `CDPS-051`, `CDPS-052`
  Acceptance criteria:
  - Verification log includes concrete commands and results.
  - Residual ambiguity around group-status wording or next-action routing is documented.
  - Any follow-up work is tied to explicit task IDs or later sprint candidates.

## Verification Strategy

1. Shared contract safety
   - Add or update shared type tests for grouped client-detail status contracts.
   - Ensure additive fields do not break existing imports or consumers.

2. API/service correctness
   - Service tests for grouped aggregation and top-level status derivation.
   - Coverage for mixed fulfillment and at least one expired or revoked edge case.

3. Frontend behavior
   - React Testing Library coverage for:
     - `Requested Access` board rendering
     - expand/collapse product detail
     - overview ordering above request history
   - Preserve current request-history interactions and links.

4. Visual and responsive verification
   - Desktop and mobile screenshot evidence for the authenticated client detail page.
   - Validate dense row readability, status visibility, and expansion affordances.

5. Accessibility spot checks
   - Keyboard access to expand/collapse controls
   - non-color-only status meaning
   - readable layout under smaller widths and zoomed states

## Risks and Mitigations

1. Group-level “current truth” could be inconsistent when multiple historical requests exist for one platform group.
   Mitigation: lock deterministic aggregation rules before implementation and cover with service tests.

2. Product-level fulfillment data may be richer in request-detail flows than in client-detail data today.
   Mitigation: keep the first implementation additive and reuse existing fulfillment semantics where available instead of inventing a second model.

3. The new board could crowd the page or visually compete with request history.
   Mitigation: keep the board dense, row-based, and placed before history inside the existing `Overview` tab rather than adding another top-level dashboard shell.

4. Status wording could drift between group rows, product rows, and existing badges.
   Mitigation: centralize presentation helpers and explicitly test the rendered copy/states.

5. Frontend polish could regress design-system compliance.
   Mitigation: update targeted design-surface tests and require screenshot evidence before closing the sprint.

## Review Findings Queue

1. Open question for implementation:
   - Whether `needs_follow_up` should be a separate top-level status in the initial UI or a presentation layer over `partial`.
2. Open question for implementation:
   - Whether platform-group actions should route to the latest request by default or the most incomplete request.
3. Required verification follow-up:
   - Screenshot evidence is mandatory because the new board changes the first-screen hierarchy of an authenticated workflow surface.
4. Verification blocker:
   - `CDPS-051` remains open because no dedicated authenticated browser harness exists for the client detail page in this session. The page still depends on Clerk auth plus live API responses, so screenshot capture needs either a dev-bypass-compatible page path or a routed browser mock harness.
5. Unrelated repository noise:
   - The broader `packages/shared/src/__tests__/types.test.ts` file still contains an unrelated `google_ads_mcc` expectation failure when run unfiltered. The new client-detail shared-contract tests pass when filtered directly.

## Verification Log

- 2026-03-10: Discovery completed in [`docs/brainstorms/2026-03-10-client-detail-platform-status-brainstorm.md`](/Users/jhigh/agency-access-platform/docs/brainstorms/2026-03-10-client-detail-platform-status-brainstorm.md).
- 2026-03-10: Initial execution handoff drafted in [`docs/plans/2026-03-10-client-detail-platform-status.md`](/Users/jhigh/agency-access-platform/docs/plans/2026-03-10-client-detail-platform-status.md).
- 2026-03-10: `workflow-plan` sprint artifact created and requirement mapping refreshed.
- 2026-03-10: Ran `cd packages/shared && npm test -- src/__tests__/types.test.ts -t "Client detail platform status contracts"` and passed.
- 2026-03-10: Ran `cd apps/api && npm test -- src/services/__tests__/client.service.test.ts` and passed.
- 2026-03-10: Ran `cd apps/web && npm test -- src/components/client-detail/__tests__/requested-access-board.test.tsx src/components/client-detail/__tests__/overview-tab.test.tsx` and passed.
- 2026-03-10: Ran `cd packages/shared && npm run typecheck` and passed.
- 2026-03-10: Ran `cd apps/api && npm run typecheck` and passed.
- 2026-03-10: Ran `cd packages/shared && npm run build` to refresh exported shared types for downstream consumers.
- 2026-03-10: Ran `cd apps/web && npm run typecheck` and passed after rebuilding `packages/shared`.
- 2026-03-10: Ran targeted ESLint on changed runtime files in `apps/api` and `apps/web` and received no runtime-file errors.
