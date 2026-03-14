# Sprint: Progressive Platform Auth Flow

- Date: 2026-03-09
- Status: Completed
- Owners: Web
- Scope: Replace the stacked multi-platform connect experience in `/invite/[token]` with a progressive one-platform-at-a-time flow for OAuth and manual platforms, while preserving existing capability routing, callback handling, and completion semantics.
- Discovery input:
  - Completed invite refresh sprint: `docs/sprints/2026-03-09-client-invite-ui-ux-refresh.md`
  - User-provided reference screenshots from Leadsie and AgencyAccess showing progressive multi-platform request handling
  - Current rendered invite evidence under `docs/images/client-request-flow/2026-03-09`
  - Confirmed current issue: the connect phase still iterates `data.platforms.map(...)` and renders every incomplete platform as a full surface, which keeps Google/Meta stacked instead of sequenced
  - Active implementation points:
    - `apps/web/src/app/invite/[token]/page.tsx`
    - `apps/web/src/components/client-auth/PlatformAuthWizard.tsx`
    - `apps/web/src/components/flow/manual-checklist-wizard.tsx`
    - `apps/web/src/components/flow/invite-flow-shell.tsx`

## Architecture Baseline Validation

The default `workflow-plan` baseline does not apply directly to this repository:
- Not applicable: Rails, Phlex, Stimulus, Turbo/Hotwire Native.
- Applicable baseline used for this sprint:
  - Next.js App Router (web)
  - Fastify + Prisma backend contract remains unchanged unless additive client metadata is required
  - Shared TypeScript contracts via `@agency-platform/shared`
  - Tailwind classes only through existing semantic invite tokens and repo-owned UI primitives
  - Existing invite brand palette/type choices remain the baseline; this sprint changes interaction architecture, not brand identity

Adaptation note for planning requirements:
- “Reusable Phlex primitives/variants” is implemented here as reusable React invite primitives and variantized progressive flow components in `apps/web/src/components/flow` and `apps/web/src/components/client-auth`.
- Token-system work is required in this sprint, but should extend the current invite token vocabulary rather than introduce one-off stack/queue styling.

## External Research Decision

External web research is not required for this sprint.
- The relevant interaction references were already supplied directly by the user via Leadsie and AgencyAccess screenshots.
- Local evidence plus those references are sufficient to define the target pattern:
  - one active platform at a time
  - collapsed remaining-platform queue
  - explicit success handoff into the next platform

## Product Decision Log (Locked)

1. The connect phase becomes a sequential queue, not a stacked dashboard.
   - Only one platform is expanded and actionable at a time.
   - Remaining requested platforms are visible as collapsed queue items or chips, not full competing cards.
2. The active platform must always expose a single obvious primary action.
   - For OAuth platforms, that means a visible connect CTA on first paint.
   - For manual platforms, that means the current checklist step, not multiple adjacent platform tasks.
3. Platform completion hands the client to the next platform explicitly.
   - After Google completes, the client should see a clear `Continue to Meta`-style handoff when another platform remains.
   - Completed platforms collapse into compact completed rows instead of remaining as full-size cards.
4. This sprint adopts the progressive interaction model, not Leadsie’s skip policy.
   - No skip/defer affordance is added unless product policy changes in a later sprint.
   - Existing required-platform completion semantics remain intact.
5. Existing routing and capability truthfulness must be preserved.
   - Manual vs OAuth behavior continues to come from the canonical capability helper.
   - OAuth callbacks must restore the returning platform as the active platform in the queue.
6. The flow must remain action-first on mobile and calmer on desktop.
   - The queue can be collapsed or segmented, but only the active platform should compete for attention.

## Architecture Approach

1. Introduce a progressive queue helper for invite runtime state:
   - requested platform order
   - active platform
   - completed platforms
   - remaining queue
   - returning OAuth platform restore behavior
2. Replace the current `data.platforms.map(...)` stacked render pattern with a single active-platform stage plus compact queue rows:
   - active platform surface
   - completed summary row
   - upcoming platform row
   - success handoff state
3. Build reusable progressive flow primitives:
   - `InvitePlatformQueue` or equivalent queue container
   - `InvitePlatformQueueItem` or equivalent collapsed row
   - active-stage wrapper for OAuth/manual platform content
   - explicit next-platform handoff surface
4. Keep `PlatformAuthWizard` and `ManualChecklistWizard` as the content engines, but move sequencing responsibility upward into the invite page and queue primitives.
5. Preserve existing API response shapes and callback query-param semantics.
   - Prefer client-side derivation of queue order from the existing invite payload.
   - Only add backend metadata if a concrete sequencing blocker appears during execution.
6. Keep first-paint visibility stable for the active platform.
   - No initial hidden animation state on the active-stage shell.
   - Screenshot verification must prove that the primary CTA is visible in the rendered output, not just present in the DOM.

## Milestones

### Milestone 1: Progressive Queue Contract
- `PPAF-001`, `PPAF-002`, `PPAF-010`, `PPAF-011`

### Milestone 2: Core Platforms Phase Redesign
- `PPAF-020`, `PPAF-021`, `PPAF-022`, `PPAF-023`

### Milestone 3: Success Handoff + Manual Alignment
- `PPAF-030`, `PPAF-031`, `PPAF-032`

### Milestone 4: Verification, Evidence, and Rollout
- `PPAF-040`, `PPAF-041`, `PPAF-042`, `PPAF-043`

## Ordered Task Board

- [x] `PPAF-001` Create follow-on sprint artifact for the progressive single-platform invite flow.
  Dependency: none
  Acceptance criteria:
  - Sprint doc locks the one-active-platform model and no-skip policy for this iteration.
  - Architecture notes explicitly adapt the generic workflow-plan baseline to this Next.js repo.

- [x] `PPAF-002` Refresh `docs/sprints/mvp-requirement-mapping.md` for the progressive platform-auth flow.
  Dependency: `PPAF-001`
  Acceptance criteria:
  - Requirement mapping includes stable `PPAF-*` task IDs.
  - Mapping distinguishes this follow-on interaction redesign from the completed `CIUX-*` refresh sprint.

- [x] `PPAF-010` Create a reusable invite queue-state helper that derives active, completed, and remaining platforms from current invite payload and callback state.
  Dependency: `PPAF-001`
  Acceptance criteria:
  - One helper determines the active platform in the connect phase.
  - Returning OAuth callbacks restore the correct platform as active.
  - Completed platforms collapse correctly without re-rendering all platforms as full cards.

- [x] `PPAF-011` Define reusable progressive flow primitives for queue rows, active platform stage, and next-platform handoff.
  Dependency: `PPAF-001`
  Acceptance criteria:
  - New primitives are reusable across OAuth and manual platform states.
  - Styling uses existing semantic invite tokens and component patterns.
  - The active-stage primitive has no first-paint hidden state.

- [x] `PPAF-020` Redesign the invite connect phase around one active platform at a time.
  Dependency: `PPAF-010`, `PPAF-011`
  Acceptance criteria:
  - Only one platform is expanded and actionable at a time.
  - Remaining requested platforms render as collapsed queue items or chips.
  - The Google/Meta stack is replaced by a clearly sequenced flow.

- [x] `PPAF-021` Introduce a compact completed-platform representation and upcoming-platform queue.
  Dependency: `PPAF-020`
  Acceptance criteria:
  - Completed platforms no longer occupy full card height.
  - Upcoming platforms communicate order and count without competing with the active task.
  - Desktop and mobile both preserve the current platform as the primary visual focus.

- [x] `PPAF-022` Refactor `PlatformAuthWizard` integration so the active platform receives full stage focus and the connect CTA is visible on first paint.
  Dependency: `PPAF-011`, `PPAF-020`
  Acceptance criteria:
  - Active OAuth platform shows a visible primary CTA in real rendered screenshots.
  - The invite page does not rely on stacked wizard cards to represent multiple requested platforms.
  - Existing asset-selection and completion callbacks still work with the new queue model.

- [x] `PPAF-023` Reduce redundant top-level connect wrappers and progress scaffolding around the active stage.
  Dependency: `PPAF-020`
  Acceptance criteria:
  - The connect-phase wrapper adds useful orientation without duplicating the active platform’s own structure.
  - The user sees one primary task, one supporting progress model, and one next action.
  - The page reads as a guided workflow rather than an admin dashboard.

- [x] `PPAF-030` Redesign the post-platform success state into an explicit next-platform handoff.
  Dependency: `PPAF-020`, `PPAF-021`
  Acceptance criteria:
  - After completing one platform, the client sees an explicit `Continue to {NextPlatform}` handoff if more remain.
  - Final completion language remains distinct when no platforms remain.
  - Success states preserve trust context and do not dump the client back into a stacked list.

- [x] `PPAF-031` Align manual platform flows with the same progressive queue model.
  Dependency: `PPAF-010`, `PPAF-011`, `PPAF-030`
  Acceptance criteria:
  - Manual routes still use their own checklist engine but fit the same active-platform sequencing model.
  - Returning from a manual completion path moves the user into the next platform handoff cleanly.
  - Manual pages remain calmer than the previous stacked experience.
  Execution note:
  - Alignment for this slice happens at the invite runtime boundary: manual checklists still own their platform-native steps, and returning manual callbacks now re-enter the invite flow as a single active-platform queue instead of a stacked multi-platform list.

- [x] `PPAF-032` Tighten tokenized hierarchy and motion for progressive sequencing.
  Dependency: `PPAF-011`, `PPAF-023`, `PPAF-030`
  Acceptance criteria:
  - Queue rows, active stage, and handoff states are visually distinct through tokenized spacing, border, and emphasis.
  - Motion communicates progression without hiding first-paint content.
  - The flow feels progressive and intentional, not just conditionally hidden.
  Execution note:
  - The active-stage shell now carries the sequence hierarchy, queue rows use clearer “Then …” labeling, and layout motion uses `framer-motion` layout transitions with `initial={false}` so progression is visible without hiding first-paint content.

- [x] `PPAF-040` Add regression tests for queue state, visible active CTA, next-platform handoff, and callback resume behavior.
  Dependency: `PPAF-010`, `PPAF-020`, `PPAF-030`
  Acceptance criteria:
  - Tests assert only one active platform stage is rendered at a time.
  - Tests cover Google CTA visibility, handoff into the next platform, and OAuth callback restore behavior.
  - Manual-flow tests cover the queue transition back into the invite runtime.

- [x] `PPAF-041` Update focused design compliance coverage for the progressive flow primitives and affected invite files.
  Dependency: `PPAF-011`, `PPAF-032`
  Acceptance criteria:
  - Design compliance scope includes all new progressive invite primitives.
  - Coverage continues guarding against generic palette regressions in the affected invite surfaces.

- [x] `PPAF-042` Capture screenshot-polish evidence for the progressive multi-platform flow.
  Dependency: `PPAF-020`, `PPAF-030`, `PPAF-031`, `PPAF-032`
  Acceptance criteria:
  - Capture desktop/mobile evidence for review, active Google stage, active Meta stage, success handoff, active manual stage, invalid link, delayed load, and timeout.
  - Evidence proves only one platform is expanded at a time.
  - Evidence proves the primary CTA is visible in rendered output for active OAuth platforms.
  - Artifacts are stored under a new dated directory in `docs/images/client-request-flow/`.
  Execution note:
  - Active Meta and post-Google handoff are represented by the same evidence state because the new flow intentionally makes the handoff equal to “Meta is now the active platform and Google is compressed into completed state.”

- [x] `PPAF-043` Execute quality gates and document rollout notes.
  Dependency: `PPAF-040`, `PPAF-041`, `PPAF-042`
  Acceptance criteria:
  - Relevant web tests and web typecheck pass.
  - Sprint doc includes verification log, rollout notes, and residual risks.
  - Prior `CIUX-*` sprint is referenced as the completed baseline that this work supersedes for multi-platform sequencing.

## Verification Strategy

1. Queue-state correctness
   - Unit or page-level coverage for active/completed/remaining platform derivation.
   - Callback-return coverage proving the returning OAuth platform resumes as active.

2. UX regression coverage
   - Invite page tests asserting one active platform at a time.
   - Wizard tests asserting the active CTA is visible on first paint.
   - Success-handoff tests asserting `Continue to {NextPlatform}` behavior.

3. Design compliance
   - Scoped coverage for the new queue and handoff primitives.
   - Guardrails against reintroducing same-weight stacked platform cards via ad hoc styling.

4. Visual validation
   - Screenshot evidence for desktop/mobile queue progression and recovery states.
   - Compare against the current stacked-flow evidence to confirm calmer hierarchy and stronger progression.

5. Accessibility spot checks
   - Keyboard navigation through the active platform stage and collapsed queue rows.
   - Confirm collapsed queue items remain understandable at 200% zoom and on mobile widths.

## Risks and Mitigations

1. Progressive sequencing could break callback resume behavior.
   Mitigation: derive active-platform state from existing completion plus callback data before touching layout primitives.

2. Manual and OAuth stages could diverge visually if sequencing is only applied to the invite page.
   Mitigation: create shared queue/handoff primitives first, then integrate both stage types against the same model.

3. Over-animating the active stage could recreate the invisible CTA bug.
   Mitigation: no hidden first-paint animation on the active-stage shell; add a regression test for rendered visibility.

4. The new queue could obscure “what else is requested” if over-collapsed.
   Mitigation: preserve compact upcoming-platform rows and explicit remaining count near the active stage.

5. A skip affordance could be inferred from the references and accidentally expand scope.
   Mitigation: lock no-skip policy for this sprint and treat any defer/skip support as a separate product decision.

6. Browser evidence capture depends on automation path reliability.
   Mitigation: when the MCP browser path is blocked by local Chrome-session conflicts, use a headless shell-based Playwright capture path against the local app with API stubbing.

## Review Findings Queue

1. The current connect phase still reads like a stacked dashboard even after the broader UI/UX refresh.
   Evidence: `/invite/[token]` currently renders all incomplete platforms from `data.platforms.map(...)`, so Google, Meta, and other requested platforms compete at the same visual level.
2. Rendered screenshot evidence showed the Google CTA absent in pixels despite existing in the DOM, proving screenshot verification must validate visible first paint rather than DOM presence alone.
3. The active-platform wrapper and the top-level connect summary currently compete instead of reinforcing a linear sequence.
4. Completed platforms need to compress aggressively after success or the queue will drift back toward the current stacked-card pattern.

## Verification Log

- Planned: follow-on sprint created after the completed `CIUX-*` invite refresh surfaced a remaining interaction-architecture problem for multi-platform requests.
- Planned: planning scope tightened after confirming the live issue is not just visual polish, but the current `data.platforms.map(...)` structure itself.
- Planned: execution will require refreshed screenshot evidence because the current March 9 images document the stacked connect-phase baseline that this sprint is intended to replace.
- Implemented: introduced a queue-state helper and replaced the stacked multi-platform render with one active platform stage plus compact queue/completed rows.
- Implemented: active platform completion labels now hand off explicitly to the next requested platform when another platform remains.
- Implemented: the active-stage and queue surfaces now use stronger tokenized hierarchy plus non-blocking layout motion for progression.
- Verified:
  - `npm test --workspace=apps/web -- 'src/lib/__tests__/invite-platform-queue.test.ts'`
  - `npm test --workspace=apps/web -- 'src/app/invite/[token]/__tests__/page.test.tsx'`
  - `npm test --workspace=apps/web -- 'src/lib/__tests__/invite-platform-queue.test.ts' 'src/app/invite/[token]/__tests__/page.test.tsx' 'src/app/__tests__/client-request-flow.design.test.ts'`
  - `npm test --workspace=apps/web -- 'src/lib/__tests__/invite-platform-queue.test.ts' 'src/app/invite/[token]/__tests__/page.test.tsx' 'src/app/invite/[token]/__tests__/manual-flows.test.tsx' 'src/app/__tests__/client-request-flow.design.test.ts'`
  - `npm run typecheck --workspace=apps/web`
- Evidence captured:
  - `docs/images/client-request-flow/2026-03-09/desktop-progressive-review.png`
  - `docs/images/client-request-flow/2026-03-09/mobile-progressive-review.png`
  - `docs/images/client-request-flow/2026-03-09/desktop-progressive-google-active.png`
  - `docs/images/client-request-flow/2026-03-09/mobile-progressive-google-active.png`
  - `docs/images/client-request-flow/2026-03-09/desktop-progressive-meta-handoff.png`
  - `docs/images/client-request-flow/2026-03-09/mobile-progressive-meta-handoff.png`
  - `docs/images/client-request-flow/2026-03-09/desktop-progressive-mailchimp-manual.png`
  - `docs/images/client-request-flow/2026-03-09/mobile-progressive-mailchimp-manual.png`
  - `docs/images/client-request-flow/2026-03-09/desktop-progressive-invalid-link.png`
  - `docs/images/client-request-flow/2026-03-09/mobile-progressive-invalid-link.png`
  - `docs/images/client-request-flow/2026-03-09/desktop-progressive-delayed-load.png`
  - `docs/images/client-request-flow/2026-03-09/mobile-progressive-delayed-load.png`
  - `docs/images/client-request-flow/2026-03-09/desktop-progressive-timeout.png`
  - `docs/images/client-request-flow/2026-03-09/mobile-progressive-timeout.png`
- Capture note:
  - The MCP browser path remained blocked by a local Chrome-session conflict, so the final evidence set was generated through headless shell-based Playwright with invite-API stubbing against the running local app.

## Execution Update

- Completed.
- Completed this slice:
  - `PPAF-010`
  - `PPAF-011`
  - `PPAF-020`
  - `PPAF-021`
  - `PPAF-022`
  - `PPAF-023`
  - `PPAF-030`
  - `PPAF-031`
  - `PPAF-032`
  - `PPAF-040`
  - `PPAF-041`
  - `PPAF-042`
  - `PPAF-043`
- Remaining:
  - none

## Residual Risks

1. This sprint intentionally does not change skip/defer policy; if product later wants partial authorization with explicit skip actions, a follow-on plan will be needed.
2. Creator-surface platform ordering may still need separate cleanup if agencies need explicit control over request sequencing later.

## Rollout Notes

- This should ship as a direct interaction replacement on top of the completed `CIUX-*` refresh, not as an isolated redesign branch that reopens capability-truthfulness work.
- During execution, keep the current canonical platform helper and recovery-path behavior intact; the scope here is sequencing and hierarchy, not another platform-routing rewrite.
