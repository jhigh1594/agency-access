# Sprint: Shopify Flow Inversion (Client-Provided Store + Collaborator Code)

- Date: 2026-03-05
- Status: Completed
- Owners: Web + API
- Scope: Invert Shopify manual flow so agencies only enable Shopify, and clients provide store ID + collaborator code during invite flow.
- Discovery input:
  - Leadsie Shopify help flow: https://help.leadsie.com/article/87-how-to-get-access-to-shopify-stores
  - Shopify collaborator docs: https://help.shopify.com/en/manual/your-account/users/security/collaborator-accounts
  - Internal implementation review (2026-03-05) showing current ownership inversion.

## Architecture Baseline Validation

The default `workflow-plan` baseline does not apply to this repository:
- Not applicable: Rails, Phlex, Stimulus, Turbo/Hotwire Native.
- Applicable baseline used for this sprint:
  - Next.js App Router + React Query (web)
  - Fastify + Prisma (api)
  - Clerk auth and agency-scoped authorization
  - Shared types from `@agency-platform/shared`
  - Tailwind semantic-token UI system and shared UI primitives

Adaptation note for required planning items:
- “Reusable Phlex primitives/variants” are implemented here as reusable React detail primitives for Shopify submission visibility in authenticated agency surfaces.
- Token-system tasks are enforced via semantic classes and design-compliance test updates.

## External Research Decision

External research required and completed.
Reasoning:
- The correct Shopify collaborator flow is externally defined by Shopify + Leadsie patterns.
- Misalignment currently exists between internal agency/client role ownership and external expected workflow.

Resulting locked product direction:
1. Agency does **not** input client `shopDomain` or collaborator code on `/connections`.
2. Client provides Shopify store + collaborator code during invite flow.
3. Agency can view client-submitted Shopify details after submission, then request access in Shopify Partners.

## Architecture Approach

1. Invert agency-side Shopify contract:
   - `POST /agency-platforms/shopify/manual-connect` becomes an enablement action (no store/code required).
   - Existing Shopify edit path in Connections is removed or converted to non-editable info state.
2. Keep client invite as source of truth for Shopify identity:
   - Client flow collects `shopDomain` + collaborator code and submits once complete.
   - Flow UX is aligned to Leadsie-style 3-step progression semantics (`Connect Shopify` -> `Select Store` -> `Connected`).
3. Make client-submitted Shopify details visible to agency in authenticated request detail:
   - Add Shopify submission view model on access-request detail payload.
   - Add reusable request-detail UI primitive for Shopify collaborator submission status/details.
4. Preserve security controls:
   - No collaborator code in logs/error payloads.
   - Agency reads of Shopify collaborator details create audit events.
   - Keep ownership checks strict (only same-agency request can view details).
5. Add backward-compatibility/migration handling:
   - Existing “agency-entered Shopify details” records do not block the new model.
   - Existing hash-only Shopify submissions degrade gracefully (show “client must re-confirm code”) until resubmitted.

## Milestones

### Milestone 1: Contract Inversion + Domain Rules
- `SINV-001`, `SINV-010`, `SINV-011`, `SINV-012`

### Milestone 2: Agency Connections UX Inversion
- `SINV-020`, `SINV-021`, `SINV-022`, `SINV-023`

### Milestone 3: Client Flow Alignment + Agency Visibility
- `SINV-030`, `SINV-031`, `SINV-032`, `SINV-033`, `SINV-034`

### Milestone 4: Verification, Polish, and Release Controls
- `SINV-040`, `SINV-041`, `SINV-042`, `SINV-043`

## Ordered Task Board

- [x] `SINV-001` Create sprint artifact with locked inversion decisions and risk controls.
  Dependency: none
  Acceptance criteria:
  - Sprint file documents architecture, milestones, risks, verification strategy, and requirement mapping.
  - Role ownership is explicit: agency enables Shopify; client provides store/code.

- [x] `SINV-010` Update Shopify agency manual-connect contract to enablement-only input.
  Dependency: `SINV-001`
  Acceptance criteria:
  - Shopify branch in `agency-platforms/manual-connect` does not require `shopDomain` or collaborator code.
  - API still enforces agency ownership and idempotent conflict behavior.
  - Response envelope remains `{ data, error }`.

- [x] `SINV-011` Update Shopify agency manual-invitation/edit semantics.
  Dependency: `SINV-010`
  Acceptance criteria:
  - Agency “edit details” path for Shopify is removed or converted to supported behavior that does not collect client-owned fields.
  - Any legacy Shopify detail-update API path returns deterministic error/help messaging if called.
  - Tests cover unsupported edit behavior for Shopify.

- [x] `SINV-012` Define/implement Shopify submission read model for agency request detail.
  Dependency: `SINV-001`
  Acceptance criteria:
  - Access-request detail payload includes Shopify submission status and values needed to execute Partner request.
  - Agency ownership authorization is enforced on every read.
  - Detail reads are audit-logged (`SHOPIFY_SUBMISSION_VIEWED` or equivalent action).

- [x] `SINV-020` Invert `/connections` Shopify connect UX to “enable workflow” (no client data form).
  Dependency: `SINV-010`
  Acceptance criteria:
  - Clicking `Connect` for Shopify no longer opens data-entry fields for store/code.
  - UI copy explains that client supplies store + collaborator code via access-request link.
  - Connection card state reflects “enabled / waiting for client submission” where applicable.

- [x] `SINV-021` Refactor `ManualInvitationModal` Shopify branch into info-only variant or dedicated lightweight modal.
  Dependency: `SINV-020`
  Acceptance criteria:
  - Shopify path removes `shopDomain` + collaborator code form controls.
  - Existing email/business-ID platform behavior remains unchanged.
  - Component remains type-safe and regression-tested.

- [x] `SINV-022` Update platform card/actions for Shopify (remove `Edit Details` data-entry action).
  Dependency: `SINV-020`
  Acceptance criteria:
  - Shopify connected card action is non-editing guidance or details-view action.
  - No path remains where agency can directly submit client shop/code from Connections.
  - UI labels align with new ownership model.

- [x] `SINV-023` Token-system compliance task for new/changed agency UI states.
  Dependency: `SINV-020`, `SINV-021`, `SINV-022`
  Acceptance criteria:
  - New UI surfaces use semantic token classes and existing shared components.
  - Design compliance tests include touched Shopify files.
  - No raw non-token palette classes introduced.

- [x] `SINV-030` Align Shopify invite UX to explicit 3-step flow semantics.
  Dependency: `SINV-001`
  Acceptance criteria:
  - Client journey communicates `Connect Shopify` -> `Select Store` -> `Connected`.
  - Step copy mirrors collaborator-request reality (client enters store/code, agency requests via Partners).
  - Existing completion callback behavior (`?step=2&platform=shopify`) remains stable.

- [x] `SINV-031` Ensure client submission endpoint remains source-of-truth and idempotent per access request.
  Dependency: `SINV-030`
  Acceptance criteria:
  - Duplicate submissions update existing Shopify manual client connection deterministically or return clear conflict semantics.
  - Submission stores retrievable collaborator details required by agency action flow.
  - Logs and errors never expose raw collaborator code beyond authorized UI surface.

- [x] `SINV-032` Add reusable request-detail primitive for Shopify submission visibility (Phlex-equivalent requirement).
  Dependency: `SINV-012`
  Acceptance criteria:
  - New reusable component under `apps/web/src/components/access-request-detail/` displays Shopify submission status/details.
  - Primitive is shared-ready (not page-local) and typed.
  - Empty/pending/submitted/error states are supported.

- [x] `SINV-033` Render Shopify submission details on authenticated access-request detail page.
  Dependency: `SINV-032`
  Acceptance criteria:
  - Agency can see client `shopDomain` and collaborator code (or required re-confirmation prompt for legacy hash-only entries).
  - Visibility is scoped to owned requests only.
  - Copy includes “next action” guidance for Shopify Partners request flow.

- [x] `SINV-034` Add audit logging for agency reads of Shopify collaborator details.
  Dependency: `SINV-012`, `SINV-033`
  Acceptance criteria:
  - Every successful agency read of collaborator details creates audit record with request + connection context.
  - Log payload excludes plaintext collaborator code.
  - Tests validate action type and metadata shape.

- [x] `SINV-040` Add API tests for inversion behavior and authorization.
  Dependency: `SINV-010`, `SINV-011`, `SINV-012`, `SINV-031`, `SINV-034`
  Acceptance criteria:
  - Tests cover agency Shopify enablement without client fields.
  - Tests cover blocked/unsupported Shopify edit-detail path.
  - Tests cover client Shopify submit + agency detail-read ownership enforcement.
  - Tests cover audit logging of Shopify detail reads.

- [x] `SINV-041` Add web tests for connections inversion and detail visibility.
  Dependency: `SINV-020`, `SINV-022`, `SINV-033`
  Acceptance criteria:
  - Connections page tests verify no Shopify detail-entry fields for agency connect.
  - Invite tests verify Shopify 3-step progression and completion callback.
  - Access-request detail tests verify Shopify submitted/pending states.

- [x] `SINV-042` Execute screenshot-polish verification across required shells.
  Dependency: `SINV-023`, `SINV-030`, `SINV-033`
  Acceptance criteria:
  - Capture desktop + mobile screenshots for:
    - Connections Shopify enablement state
    - Invite Shopify flow steps
    - Access-request detail Shopify submission panel
  - Save artifacts under `docs/images/shopify-flow-inversion/2026-03-05`.
  - Visual review confirms consistent tokenized UI patterns.

- [x] `SINV-043` Run quality gates + rollout checklist.
  Dependency: `SINV-040`, `SINV-041`, `SINV-042`
  Acceptance criteria:
  - `npm run test --workspace=apps/api` (or targeted suites with documented pre-existing failures).
  - `npm run test --workspace=apps/web` (or targeted suites with documented pre-existing failures).
  - `npm run typecheck` and `npm run lint` completed with outcomes documented.
  - Rollout notes include migration/backfill outcomes and operator guidance.

## Verification Strategy

1. API contract/security:
   - Route tests for agency Shopify enablement-only connect semantics.
   - Route tests for client Shopify submit and agency detail visibility authorization.
   - Audit log assertion tests for detail-view events.

2. Web behavior:
   - Connections tests to confirm no agency-side Shopify data entry.
   - Invite Shopify flow tests for 3-step behavior and completion callback continuity.
   - Access-request detail tests for pending/submitted Shopify data states.

3. Design-system quality:
   - Add/update design compliance tests for touched files.
   - Screenshot polish evidence for authenticated + invite shells.

4. Regression:
   - Validate non-Shopify manual platforms (Kit/Beehiiv/Pinterest/etc.) remain unaffected.
   - Validate `manualInviteTargets` behavior remains stable for other platforms.

## Risks and Mitigations

1. Risk: collaborator code storage design blocks agency retrieval.
   Mitigation: define canonical retrieval model in `SINV-012`/`SINV-031` first; test end-to-end with agency detail read before UI rollout.

2. Risk: agency confusion from changed Shopify connect semantics.
   Mitigation: explicit copy and state messaging in connections + request detail (`SINV-020`, `SINV-033`).

3. Risk: regression to other manual platform modal paths.
   Mitigation: isolate Shopify branch changes and add targeted regression tests for email/business-ID flows (`SINV-021`, `SINV-041`).

4. Risk: legacy hash-only Shopify entries from interim builds.
   Mitigation: add legacy fallback messaging and re-confirmation path in agency detail state (`SINV-033`, rollout notes in `SINV-043`).

5. Risk: unauthorized access to client-submitted Shopify details.
   Mitigation: strict request ownership checks + audit logging + tests (`SINV-012`, `SINV-034`, `SINV-040`).

## Rollout Notes (To Complete During Execution)

1. Confirmed: agency Shopify connect now creates enablement-only record and no longer requests client store/collaborator inputs on `/connections`.
2. Confirmed: client invite Shopify submission appears in agency request detail with explicit states (`pending_client`, `submitted`, `legacy_unreadable`).
3. Confirmed: operators can identify pending vs submitted Shopify requests from the new Shopify submission panel in request detail.
4. Legacy handling documented and implemented: hash-only submissions render “Client Re-confirmation Needed” guidance.
5. Screenshot evidence captured in `docs/images/shopify-flow-inversion/2026-03-05`:
   - `connections-shopify-enable-desktop.png`
   - `connections-shopify-enable-mobile.png`
   - `invite-shopify-step1-desktop.png`
   - `invite-shopify-step2-desktop.png`
   - `invite-shopify-step3-desktop.png`
   - `invite-shopify-step1-mobile.png`
   - `access-request-shopify-panel-desktop.png`
   - `access-request-shopify-panel-mobile.png`
6. Quality gates:
   - Targeted API suites passed (`45/45`).
   - Targeted web suites passed (`35/35`, plus 2 pre-existing skips).
   - `npm run lint` passed with warnings only (pre-existing warnings across API and web).
   - Root `npm run typecheck` fails due pre-existing workspace script gap: `design-os@0.0.0` missing `typecheck`; workspace-specific typechecks for `apps/api`, `apps/web`, and `packages/shared` passed.

## Review Findings Queue

1. `SINV-RF-001` (Resolved): Shopify invite flow now validates explicit 3-step semantics with regression coverage.
2. `SINV-RF-002` (Resolved): Screenshot evidence set captured and stored under `docs/images/shopify-flow-inversion/2026-03-05`.
