# Sprint: Unified Onboarding Recovery + Re-entry

- Date: 2026-03-04
- Status: In Progress
- Owners: Web + API
- Scope: Unified onboarding recovery behavior (`/onboarding/unified`) plus authenticated re-entry and dashboard recovery UX.
- Discovery input: Unified onboarding flow review and onboarding drop-off behavior in production-like routing.

## Architecture Baseline Validation

The default `workflow-plan` baseline does not apply to this repository:
- Not applicable: Rails, Phlex, Stimulus, Turbo/Hotwire Native.
- Applicable baseline used for this sprint:
  - Next.js App Router (web)
  - Fastify + Prisma (api)
  - Clerk auth and agency-scoped authorization
  - Tailwind tokenized UI patterns and shared React UI primitives
  - React Query for authenticated data flows

Adaptation note for required planning items:
- “Reusable Phlex primitives/variants” is implemented as reusable React checklist/recovery primitives in `apps/web/src/components/dashboard` and onboarding shared hooks in `apps/web/src/lib/query`.

## Product Decision Log (Locked)

1. Use a hybrid model, not a single-path model:
   - Enforce re-entry to onboarding for users who have not reached first value (no generated access request link yet).
   - Show a dashboard onboarding checklist for users who reached first value but have unfinished optional steps.
2. Onboarding completion is an explicit lifecycle:
   - `not_started`: no agency or no onboarding metadata.
   - `in_progress`: onboarding started but first access request not created.
   - `activated`: first access request created; optional steps may remain.
   - `completed`: final step acknowledged or user explicitly dismisses remaining optional onboarding.
3. Persist onboarding progress server-side in agency settings metadata; do not add a new database column in this sprint.
4. Do not modify invite-flow (`/invite/[token]`) behavior in this sprint.
5. Unified onboarding client step must continue to avoid auto-loading existing clients for net-new users.

## Architecture Approach

1. Add a typed onboarding lifecycle payload under `Agency.settings.onboarding.unifiedV1`:
   - `status`, `lastCompletedStep`, `lastVisitedStep`, `startedAt`, `activatedAt`, `completedAt`, `dismissedAt`, `accessRequestId`.
2. Expand `GET /api/agencies/:id/onboarding-status` to return lifecycle-oriented status while preserving current envelope (`{ data, error }`) and backward compatibility.
3. Add a scoped onboarding progress mutation endpoint (`PATCH /api/agencies/:id/onboarding-progress`) to avoid broad settings overwrites from the web client.
4. Hydrate unified onboarding context from server status on load and persist checkpoint updates when steps advance or key actions succeed.
5. Add authenticated layout gate:
   - If onboarding status is `in_progress`, redirect all authenticated routes except `/onboarding/*` to `/onboarding/unified`.
   - If status is `activated`, do not hard-redirect; rely on dashboard checklist.
6. Add dashboard onboarding checklist surface with clear recovery actions:
   - Resume onboarding at next incomplete step.
   - Dismiss optional tasks once activated.
   - Show completion confirmation after finalization.
7. Keep analytics and error reporting explicit for resume loops, checklist interactions, and onboarding completion.

## Milestones

### Milestone 1: Contract and Persistence Foundation
- `UONB-001`, `UONB-010`, `UONB-011`, `UONB-012`, `UONB-013`, `UONB-014`

### Milestone 2: Re-entry and Resume Mechanics
- `UONB-020`, `UONB-021`, `UONB-022`, `UONB-023`

### Milestone 3: Dashboard Recovery UX
- `UONB-030`, `UONB-031`, `UONB-032`

### Milestone 4: Verification, Polish, and Handoff
- `UONB-040`, `UONB-041`, `UONB-042`

## Ordered Task Board

- [x] `UONB-001` Create sprint artifact with locked decisions, lifecycle definitions, and execution gates.
  Dependency: none
  Acceptance criteria:
  - Sprint file includes architecture, milestones, risks, verification, and mapping references.
  - Hybrid model decisions are explicit and unambiguous.

- [x] `UONB-010` Add shared onboarding lifecycle types and Zod validators.
  Dependency: `UONB-001`
  Acceptance criteria:
  - `packages/shared/src/types.ts` includes typed onboarding lifecycle payload and status union.
  - `packages/shared/src/index.ts` exports new shared types.
  - Runtime validation schema exists for onboarding progress updates in API boundary.

- [x] `UONB-011` Implement onboarding lifecycle resolver in API service.
  Dependency: `UONB-010`
  Acceptance criteria:
  - Resolver derives `not_started|in_progress|activated|completed` from agency + access requests + settings metadata.
  - Resolver is deterministic for missing/partial settings payloads.
  - Existing `getOnboardingStatus` keeps `{ data, error }` contract and does not throw on missing metadata.

- [x] `UONB-012` Extend onboarding status route contract for lifecycle fields.
  Dependency: `UONB-011`
  Acceptance criteria:
  - `GET /agencies/:id/onboarding-status` returns lifecycle fields plus legacy step flags for compatibility.
  - Validation/authorization behavior remains unchanged (`401/403/404` as appropriate).

- [x] `UONB-013` Add scoped onboarding progress update endpoint.
  Dependency: `UONB-010`, `UONB-011`
  Acceptance criteria:
  - New route `PATCH /agencies/:id/onboarding-progress` accepts lifecycle-safe subset only.
  - API merges onboarding metadata without deleting unrelated `settings` keys.
  - Invalid payloads return `400` with typed error envelope.

- [x] `UONB-014` Add API tests for lifecycle contract and authz.
  Dependency: `UONB-012`, `UONB-013`
  Acceptance criteria:
  - Route tests cover success, invalid payload, forbidden agency access, and missing agency.
  - Service tests cover lifecycle transitions (`not_started -> in_progress -> activated -> completed`).

- [x] `UONB-020` Add frontend query helpers for onboarding status/progress.
  Dependency: `UONB-012`, `UONB-013`
  Acceptance criteria:
  - React Query hooks exist for reading status and mutating progress.
  - Frontend throws on API `error` payload per existing pattern.
  - Hooks are reusable by both onboarding page and dashboard.

- [x] `UONB-021` Hydrate and persist unified onboarding context progress.
  Dependency: `UONB-020`
  Acceptance criteria:
  - Context loads server lifecycle state on mount and resumes at next actionable step.
  - Step transitions and access-link generation persist progress asynchronously.
  - Completion and optional-dismiss actions persist terminal status.

- [x] `UONB-022` Add authenticated layout re-entry gate for incomplete onboarding.
  Dependency: `UONB-020`
  Acceptance criteria:
  - Authenticated routes redirect to `/onboarding/unified` when status is `in_progress`.
  - `/onboarding/*` routes are exempt from the gate.
  - Gate failures do not hard-block users on transient API errors (fails open with logged error).

- [x] `UONB-023` Preserve net-new user behavior on client step (no empty-state client search friction).
  Dependency: `UONB-021`
  Acceptance criteria:
  - New users without clients default to create-new mode.
  - Existing-client search UI appears only when client data exists.
  - Regression tests cover typing-first scenario and late-arriving existing clients.

- [x] `UONB-030` Build dashboard onboarding checklist component and placement.
  Dependency: `UONB-020`
  Acceptance criteria:
  - Dashboard displays checklist when status is `in_progress` or `activated`.
  - Checklist is hidden when status is `completed`.
  - CTA links route users to the correct onboarding step.

- [x] `UONB-031` Implement checklist actions (resume, skip optional, finish setup).
  Dependency: `UONB-030`, `UONB-021`
  Acceptance criteria:
  - Resume CTA deep-links to appropriate unified onboarding step.
  - “Skip optional setup” is available only in `activated` state with explicit confirmation.
  - Completion action persists status and removes checklist immediately.

- [x] `UONB-032` Add onboarding recovery analytics events.
  Dependency: `UONB-021`, `UONB-031`
  Acceptance criteria:
  - Events capture: redirected_to_onboarding, checklist_shown, checklist_resume_clicked, onboarding_optional_dismissed, onboarding_completed.
  - Event payload includes agency ID, lifecycle status, and step index when relevant.

- [x] `UONB-040` Add web integration tests for re-entry, resume, and checklist behavior.
  Dependency: `UONB-022`, `UONB-031`
  Acceptance criteria:
  - Tests verify redirect enforcement for `in_progress`.
  - Tests verify dashboard checklist visibility by lifecycle state.
  - Tests verify no redirect loop after completion.

- [ ] `UONB-041` Execute screenshot polish pass (desktop + mobile).
  Dependency: `UONB-030`, `UONB-031`
  Acceptance criteria:
  - Capture onboarding resume state and dashboard checklist state in desktop/mobile.
  - Store artifacts under `docs/images/onboarding-recovery/2026-03-04`.
  - Verify visual consistency with existing tokenized authenticated UI.

- [x] `UONB-042` Refresh documentation and requirement mapping.
  Dependency: `UONB-001`
  Acceptance criteria:
  - Update `docs/sprints/mvp-requirement-mapping.md` with onboarding recovery requirements and `UONB-*` mapping.
  - Add rollout notes and fallback behavior summary in this sprint doc after implementation.

## Verification Strategy

1. API contract and security:
   - Route tests for `/agencies/:id/onboarding-status` and `/agencies/:id/onboarding-progress`.
   - Service tests for lifecycle derivation and metadata merge behavior.

2. Frontend behavior:
   - Unified onboarding context tests for resume hydration and persisted completion.
   - Authenticated layout tests for redirect logic and fail-open behavior.
   - Dashboard tests for checklist visibility and action routing.

3. Regression safety:
   - Confirm no invite-flow test snapshots or behavior change.
   - Confirm net-new users are not forced into empty existing-client search path.

4. Quality gates:
   - `npm run test --workspace=apps/api`
   - `npm run test --workspace=apps/web`
   - `npm run typecheck`
   - `npm run lint`

## Risks and Mitigations

1. Risk: redirect loops trap users between dashboard and onboarding.
   Mitigation: treat `activated` as non-blocking, add explicit completion/dismiss states, and add loop regression tests.

2. Risk: metadata overwrite removes unrelated agency settings.
   Mitigation: scoped onboarding-progress endpoint with explicit merge semantics and tests.

3. Risk: hard gating creates frustration for users who already got value.
   Mitigation: gate only pre-activation; checklist post-activation.

4. Risk: onboarding status request latency degrades route transitions.
   Mitigation: cache lifecycle status in React Query with short stale window and fail-open behavior on transient errors.

5. Risk: analytics gaps obscure onboarding recovery outcomes.
   Mitigation: add dedicated event taxonomy and verify event firing paths in tests.

## Review Findings Queue

1. Onboarding hydration side-effects make context tests noisy; keep `enableProgressHydration` override in provider tests to isolate non-hydration behaviors.
2. Shared runtime schema exports require rebuilding `packages/shared` so API runtime imports stay in sync with new shared symbols.

## Verification Log (2026-03-04)

- `cd apps/api && npm test src/services/__tests__/agency.service.test.ts src/routes/__tests__/agencies.security.test.ts src/routes/__tests__/agencies.onboarding.routes.test.ts`: pass (40 tests).
- `cd apps/web && npm test src/contexts/__tests__/unified-onboarding-context.test.tsx 'src/app/(authenticated)/dashboard/__tests__/page.behavior.test.tsx' 'src/app/(authenticated)/__tests__/layout.onboarding-gate.test.tsx'`: pass (20 tests).
- `cd apps/web && npm test src/components/onboarding/screens/__tests__/client-selection-screen.test.tsx`: pass (3 tests).
- `npm run typecheck --workspace=apps/api`: pass.
- `npm run typecheck --workspace=apps/web`: pass.

## Rollout Notes

1. Existing users with `status=activated` now remain in app and see dashboard checklist actions.
2. Users with `status=in_progress` or `status=not_started` are redirected from authenticated routes back to `/onboarding/unified`.
3. No invite-flow routes were changed in this sprint.
4. Screenshot evidence task `UONB-041` remains open.
