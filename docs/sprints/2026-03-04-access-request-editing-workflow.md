# Sprint: Access Request Detail + Editing Workflow

- Date: 2026-03-04
- Status: In Review
- Owners: Web + API
- Scope: Implement authenticated request detail and status-aware request editing for existing client access requests.
- Discovery input: [`docs/brainstorms/2026-03-04-access-request-editing-brainstorm.md`](/Users/jhigh/agency-access-platform/docs/brainstorms/2026-03-04-access-request-editing-brainstorm.md)

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
- “Reusable Phlex primitives/variants” will be implemented as reusable React primitives/variants for request-detail and request-edit surfaces.
- Token-system work is enforced through semantic token usage (`bg-paper`, `text-ink`, `border-border`, shared `Button`/`Card`/`StatusBadge`) and explicit design checks.

## External Research Decision

No external research required for this sprint.
Reasoning:
- Workflow and constraints are product-internal and already documented in discovery.
- Existing local patterns (`FlowShell`, access-request wizard, client detail surfaces, response envelopes) are sufficient for execution.

## Product Decision Log (Locked)

1. Implement in-place editing for eligible request states (`pending`, `partial`), not clone-and-replace.
2. Link token behavior remains invisible to users:
   - No token controls are exposed in request edit.
   - For this sprint, request-edit does not mutate recipient identity, so token remains stable.
3. Request edit does not own client identity fields in this sprint:
   - Client email/name remain canonical in client profile management.
   - Request edit focuses on request configuration (auth model, platforms, access level, intake fields, branding).
4. Non-editable statuses (`completed`, `expired`, `revoked`) are read-only with “Create New Request from This” action.

## Architecture Approach

1. Add authenticated request detail route at `/access-requests/[id]` with status-aware action model.
2. Add authenticated request edit route at `/access-requests/[id]/edit`, reusing existing wizard architecture and components.
3. Introduce reusable request-detail/edit React primitives to avoid page-level duplication.
4. Expand API update contract in `PATCH /access-requests/:id` to support full request configuration updates while enforcing status eligibility.
5. Keep response envelopes unchanged (`{ data, error }`) across all touched routes.
6. Keep request-edit token behavior deterministic and invisible (stable token for this sprint scope).
7. Add regression tests across API route security, status gating, token policy, and web navigation/UX.
8. Execute screenshot-polish pass across desktop/mobile for request detail/edit shells.

## Milestones

### Milestone 1: Contract + Route Foundations
- `ARED-001`, `ARED-010`, `ARED-011`, `ARED-012`, `ARED-013`

### Milestone 2: Detail Surface + Reusable Primitives
- `ARED-020`, `ARED-021`, `ARED-022`, `ARED-023`, `ARED-024`

### Milestone 3: Edit Workflow + Backend Enforcement
- `ARED-030`, `ARED-031`, `ARED-032`, `ARED-033`, `ARED-034`, `ARED-035`

### Milestone 4: Verification, Polish, and Handoff
- `ARED-040`, `ARED-041`, `ARED-042`, `ARED-043`

## Ordered Task Board

- [x] `ARED-001` Create sprint artifact with locked decisions and execution gates.
  Dependency: none
  Acceptance criteria:
  - Sprint file includes architecture approach, milestones, risks, verification strategy, and mapping references.
  - Token behavior policy and editability rules are explicit and unambiguous.

- [x] `ARED-010` Add shared request-edit DTOs and runtime validation schemas.
  Dependency: `ARED-001`
  Acceptance criteria:
  - Shared types cover editable request payload and request detail view model.
  - Zod schemas exist at API boundary for update payload validation.
  - Exports in `packages/shared/src/index.ts` are updated and typecheck clean.

- [x] `ARED-011` Harmonize access-request update status vocabulary with domain model.
  Dependency: `ARED-010`
  Acceptance criteria:
  - Update schema uses supported domain statuses (`pending`, `partial`, `completed`, `expired`, `revoked`) where status mutation is allowed.
  - Legacy-only values (`authorized`, `cancelled`) are removed or normalized safely.
  - Existing authorize/cancel route behavior remains backward compatible.

- [x] `ARED-012` Expand `PATCH /access-requests/:id` to full editable request config.
  Dependency: `ARED-010`, `ARED-011`
  Acceptance criteria:
  - Endpoint accepts `platforms`, `globalAccessLevel` (or mapped equivalent), `intakeFields`, `branding`.
  - Endpoint preserves `{ data, error }` contract with `400/403/404` handling.
  - API refuses updates when request status is non-editable.

- [x] `ARED-013` Implement token policy enforcement in API update flow.
  Dependency: `ARED-012`
  Acceptance criteria:
  - Request-edit updates keep existing token.
  - Token regeneration controls are invisible in the edit UI.
  - Response metadata can still indicate link changes for backwards compatibility.

- [x] `ARED-020` Build reusable request-detail React primitives (Phlex-equivalent requirement).
  Dependency: `ARED-001`
  Acceptance criteria:
  - Create reusable components under `apps/web/src/components/access-request-detail/`.
  - Components encapsulate header/status/actions and section cards.
  - Components are typed and composable for detail and post-save states.

- [x] `ARED-021` Implement `/access-requests/[id]` request detail page.
  Dependency: `ARED-020`
  Acceptance criteria:
  - Page renders request metadata, platforms, auth model/access level, intake summary, branding summary, link actions.
  - Status-aware action rendering follows locked decision log.
  - Not-found/forbidden/error states match existing dashboard/client patterns.

- [x] `ARED-022` Fix entry-point routing to request detail page.
  Dependency: `ARED-021`
  Acceptance criteria:
  - Client detail overview links resolve to `/access-requests/[id]` and no longer dead-end.
  - Dashboard request rows have deterministic access path to request detail (direct or secondary action).
  - Existing client-level navigation behavior remains intentional and tested.

- [x] `ARED-023` Token-system compliance pass for new request detail surface.
  Dependency: `ARED-021`
  Acceptance criteria:
  - New surface uses semantic tokens and shared variants only.
  - No generic raw palette classes introduced in scoped files.
  - Design compliance tests include request detail/edit files.

- [x] `ARED-024` Add request-detail analytics events.
  Dependency: `ARED-021`
  Acceptance criteria:
  - `access_request_detail_viewed` and request action click events are emitted with request/status context.
  - Events do not block rendering when analytics import fails.

- [x] `ARED-030` Implement `/access-requests/[id]/edit` shell and state hydration.
  Dependency: `ARED-021`, `ARED-012`
  Acceptance criteria:
  - Edit route preloads existing request and hydrates wizard state.
  - Non-editable statuses redirect to detail with clear reason.
  - Unsaved changes guard is implemented for back/navigation.

- [x] `ARED-031` Reuse/new shared form primitives for editable wizard sections.
  Dependency: `ARED-030`
  Acceptance criteria:
  - Fundamentals/platform/customize/review sections reuse existing selectors where possible.
  - New shared variant components avoid page-specific duplication.
  - CTA and step framing match existing `FlowShell` conventions.

- [x] `ARED-032` Implement save flow + success messaging with invisible token policy.
  Dependency: `ARED-031`, `ARED-013`
  Acceptance criteria:
  - Save action persists allowed fields and returns to detail or stays with success state.
  - If token rotated, UI shows mandatory resend message and copy action emphasis.
  - If token unchanged, UI confirms update without forcing resend narrative.

- [x] `ARED-033` Lock client identity editing out of request edit surface.
  Dependency: `ARED-030`
  Acceptance criteria:
  - Client name/email fields are not editable in request wizard for this sprint.
  - Surface provides guidance to edit client identity in client profile when needed.
  - API ignores/rejects client identity mutations in request edit payload.

- [x] `ARED-034` Add API tests for update eligibility, token policy, and authz.
  Dependency: `ARED-012`, `ARED-013`
  Acceptance criteria:
  - Tests cover editable vs non-editable status behavior.
  - Tests cover token-stable edit behavior and identity mutation rejection.
  - Tests cover agency ownership enforcement and invalid payload handling.

- [x] `ARED-035` Add web tests for detail/edit routing and status-gated UX.
  Dependency: `ARED-021`, `ARED-030`, `ARED-032`
  Acceptance criteria:
  - Tests verify `/access-requests/[id]` renders expected sections and actions by status.
  - Tests verify edit route hydration and non-editable redirect behavior.
  - Tests verify post-save link-change messaging behavior.

- [ ] `ARED-040` Run full quality gates for touched workspaces.
  Dependency: `ARED-034`, `ARED-035`
  Acceptance criteria:
  - `npm run test --workspace=apps/api` passes.
  - `npm run test --workspace=apps/web` passes.
  - `npm run typecheck` and `npm run lint` pass (or warnings documented if pre-existing).

- [ ] `ARED-041` Execute screenshot polish pass across required shells.
  Dependency: `ARED-021`, `ARED-032`
  Acceptance criteria:
  - Capture desktop + mobile states for:
    - request detail (`pending`, `completed`)
    - request edit (step view, review, post-save success)
  - Save artifacts under `docs/images/access-request-editing/2026-03-04`.
  - Validate visual consistency with existing authenticated shell and tokenized components.

- [x] `ARED-042` Refresh docs and requirement mapping.
  Dependency: `ARED-001`
  Acceptance criteria:
  - `docs/sprints/mvp-requirement-mapping.md` includes Access Request Editing requirement mappings to `ARED-*` tasks.
  - Sprint file rollout notes are updated after implementation.

- [ ] `ARED-043` Final release readiness checklist.
  Dependency: `ARED-040`, `ARED-041`, `ARED-042`
  Acceptance criteria:
  - Open risks are reviewed with mitigation status.
  - Regression checks for existing new-request and invite flows are documented.
  - Remaining follow-up work is explicitly moved to next sprint backlog.

## Verification Strategy

1. API contract + security verification:
   - Route/service tests for `PATCH /access-requests/:id` eligibility, payload validation, token policy, authz.
   - Confirm unchanged envelopes and status codes.

2. Web behavior verification:
   - Unit/integration tests for request detail rendering and edit eligibility gates.
   - Route tests for legacy link entry points now resolving to request detail.
   - Post-save messaging tests for token changed vs unchanged paths.

3. Design-system + UX verification:
   - Scoped design compliance tests for new files.
   - Screenshot-polish run across desktop/mobile states.

4. Regression safety:
   - Confirm no behavior regressions for `/access-requests/new` and `/invite/[token]` core flows.

5. Quality gates:
   - `npm run test --workspace=apps/api`
   - `npm run test --workspace=apps/web`
   - `npm run typecheck`
   - `npm run lint`

## Risks and Mitigations

1. Risk: status-model inconsistencies break existing update flows.
   Mitigation: normalize update status schema early (`ARED-011`) and add focused route/service tests (`ARED-034`).

2. Risk: link behavior confusion creates unnecessary resend actions.
   Mitigation: hide token controls, keep request-edit token stable, and use explicit success messaging (`ARED-013`, `ARED-032`, `ARED-035`).

3. Risk: detail/edit route additions create navigation confusion with existing client routes.
   Mitigation: explicit entry-point updates + route tests (`ARED-022`, `ARED-035`).

4. Risk: UI divergence from design system under schedule pressure.
   Mitigation: reusable primitive task + token compliance task + screenshot-polish gate (`ARED-020`, `ARED-023`, `ARED-041`).

5. Risk: broader request-edit scope causes regressions in creation flow.
   Mitigation: isolate shared state changes, keep update behavior scoped, run targeted regression tests for creation/invite surfaces.

## Review Findings Queue

1. Full test suite gate remains red outside this feature scope:
   - `npm test --workspace=apps/api` currently fails across many pre-existing suites (e.g. clients routes auth expectations, audit service shape changes, oauth-state signature expectations, connector tests).
   - `npm test --workspace=apps/web` currently fails across many pre-existing suites (next/navigation mock drift, settings/platforms redirect tests, legacy selector expectations).
2. Shared package tests are blocked by existing Jest ESM config in [`packages/shared/jest.config.js`](/Users/jhigh/agency-access-platform/packages/shared/jest.config.js) (`module is not defined in ES module scope`).
3. Screenshot evidence task `ARED-041` remains open pending authenticated browser capture run.

## Rollout Notes (To Complete During Execution)

1. Request detail route `/access-requests/[id]` is implemented with authenticated loading, status-aware actions, and analytics events.
2. Edit route `/access-requests/[id]/edit` is enabled for `pending`/`partial` only; non-editable statuses redirect back to detail.
3. Request-edit payload now rejects `clientName/clientEmail`; UI provides “Edit client profile” guidance instead of identity inputs.
4. Dashboard recent request rows now route to request detail (`/access-requests/:id`) to remove client-only dead-end navigation.
