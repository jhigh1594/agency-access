# Sprint: Invite Action-First Hierarchy

- Date: 2026-03-10
- Status: Completed
- Owners: Web
- Scope: Reduce above-the-fold noise in `/invite/[token]` so setup and connect phases present the primary action immediately, with progressive disclosure for secondary context and trust details.
- Discovery input:
  - Completed invite refresh sprint: `docs/sprints/2026-03-09-client-invite-ui-ux-refresh.md`
  - Completed progressive sequencing sprint: `docs/sprints/2026-03-09-progressive-platform-auth-flow.md`
  - User-provided desktop screenshots of setup and connect states showing excessive preamble before the primary CTA
  - Current implementation points:
    - `apps/web/src/app/invite/[token]/page.tsx`
    - `apps/web/src/components/flow/invite-flow-shell.tsx`
    - `apps/web/src/components/flow/invite-hero-header.tsx`
    - `apps/web/src/components/flow/invite-sticky-rail.tsx`
    - `apps/web/src/components/flow/invite-platform-stage.tsx`
    - `apps/web/src/components/client-auth/PlatformAuthWizard.tsx`

## Architecture Baseline Validation

The default `workflow-plan` baseline does not apply directly to this repository:
- Not applicable: Rails, Phlex, Stimulus, Turbo/Hotwire Native.
- Applicable baseline used for this sprint:
  - Next.js App Router (web)
  - Fastify + Prisma backend contracts remain unchanged; this sprint is UI hierarchy and copy architecture only
  - Shared TypeScript contracts via `@agency-platform/shared`
  - Tailwind styling through existing semantic invite tokens and repo-owned UI primitives
  - Existing invite brand palette/type system remains the base; this sprint changes information architecture, density, and stage hierarchy

Adaptation note for planning requirements:
- “Reusable Phlex primitives/variants” is implemented here as reusable React invite primitives and variantized layout wrappers in `apps/web/src/components/flow`.
- Token-system work is required for hierarchy reduction so the new design uses consistent spacing, emphasis, and disclosure states instead of one-off card treatments.

## External Research Decision

External web research is not required for this sprint.
- The user already provided the key evaluation criteria and screenshots showing the failure mode.
- Local implementation and the completed invite/progressive-flow sprints provide enough context to plan the redesign.

## Product Decision Log (Locked)

1. The primary action must be visible without scrolling on the initial setup and connect views.
   - Setup phase must show the continue CTA in the first viewport on desktop.
   - Connect phase must show the active platform connect CTA in the first viewport on desktop and standard mobile sizes.
2. Progressive disclosure is the governing interaction rule.
   - Trust, security, request metadata, and remaining-platform context stay available, but they no longer compete equally with the primary task.
3. One orientation layer per page.
   - The page may have a hero/header and a progress model, but not multiple stacked orientation cards that restate the same context.
4. The active platform is the hero in connect phase.
   - The platform stage is the dominant surface.
   - Queue context and request details are secondary and collapsible/compact.
5. Setup phase remains explicit about what will be shared, but the review block must compress.
   - Requested platforms and access levels remain visible.
   - Secondary reassurance is shortened and moved closer to the CTA.
6. This sprint does not change business rules or sequencing logic.
   - No changes to capability mapping, callback handling, completion semantics, or required-platform policy.

## Problem Statement

The invite flow now sequences platforms progressively, but it still behaves like an admin-heavy interface above the fold:
- setup phase presents a large hero, metadata strip, progress strip, oversized review card, trust note, and footer before the CTA
- connect phase presents hero, metadata strip, progress strip, left rail, queue summary card, active stage summary card, and only then the actual platform action

This causes the client to scan before acting. The flow feels heavier and more complex than the job requires.

## Architecture Approach

1. Refactor page hierarchy around an action-first shell:
   - compact hero/header
   - compact progress model
   - primary task surface immediately below
   - secondary context disclosed inline or in a compact rail
2. Reduce repeated orientation surfaces in connect phase:
   - merge or remove duplicate queue summary / stage summary wrappers
   - ensure the active platform module sits above the fold
3. Convert request-detail context into compact patterns:
   - short summary chips or inline rows
   - collapsible details on mobile
   - inline identity details only where operationally needed
4. Introduce reusable hierarchy variants for invite surfaces:
   - dense hero variant
   - compact progress/header variant
   - secondary details panel variant
   - active-stage-first layout variant
5. Preserve current trust and security messaging, but move it to lower-noise placements:
   - one trust note near the CTA
   - one compact security/support surface
   - no repeated top-level reminders unless they change the user’s decision

## Milestones

### Milestone 1: Hierarchy Contract and Primitives
- `IAFH-001`, `IAFH-002`, `IAFH-010`, `IAFH-011`

### Milestone 2: Setup Phase Compression
- `IAFH-020`, `IAFH-021`

### Milestone 3: Connect Phase Above-the-Fold Fix
- `IAFH-030`, `IAFH-031`, `IAFH-032`

### Milestone 4: Verification, Evidence, and Rollout
- `IAFH-040`, `IAFH-041`, `IAFH-042`, `IAFH-043`

## Ordered Task Board

- [x] `IAFH-001` Create follow-on sprint artifact for invite action-first hierarchy.
  Dependency: none
  Acceptance criteria:
  - Sprint doc explicitly targets above-the-fold hierarchy and progressive disclosure.
  - Plan distinguishes this work from the completed `CIUX-*` and `PPAF-*` sprints.

- [x] `IAFH-002` Refresh `docs/sprints/mvp-requirement-mapping.md` for the hierarchy reduction workstream.
  Dependency: `IAFH-001`
  Acceptance criteria:
  - Requirement mapping includes stable `IAFH-*` task IDs.
  - Mapping clearly ties the work to setup/connect hierarchy rather than platform capability or sequencing.

- [x] `IAFH-010` Lock an action-first hierarchy contract for setup and connect phases.
  Dependency: `IAFH-001`
  Acceptance criteria:
  - The plan defines which information must remain above the fold, which can be collapsed, and which must move below the primary task.
  - Desktop and mobile first-paint requirements are explicit.
  - The contract covers hero, progress, request details, trust copy, and queue context.

- [x] `IAFH-011` Create reusable compact invite hierarchy variants and tokenized disclosure patterns.
  Dependency: `IAFH-010`
  Acceptance criteria:
  - Shared primitives/variants exist for compact hero, compact progress, secondary details panel, and action-first stage framing.
  - Styling uses existing semantic invite tokens rather than ad hoc layout classes.
  - Mobile disclosure patterns remain keyboard/tap accessible.

- [x] `IAFH-020` Compress the setup phase so the review CTA appears in the initial viewport.
  Dependency: `IAFH-010`, `IAFH-011`
  Acceptance criteria:
  - Setup phase keeps requested platforms and access levels, but shortens surrounding chrome.
  - `Continue to connect` is visible without scroll on the target desktop viewport.
  - Trust/support messaging is still present but does not occupy equal visual weight with the review content.

- [x] `IAFH-021` Simplify setup-phase review density without hiding requested access scope.
  Dependency: `IAFH-020`
  Acceptance criteria:
  - Requested platforms and access levels remain easy to audit.
  - The review section no longer reads like a large dashboard card nested inside another page-level frame.
  - The page preserves trust while reducing scanning effort.

- [x] `IAFH-030` Rebuild the connect phase so the active platform action is visible above the fold.
  Dependency: `IAFH-010`, `IAFH-011`
  Acceptance criteria:
  - On first paint, the active platform card and primary CTA are visible on common desktop and mobile viewports.
  - The connect phase no longer requires the user to scroll past queue summaries and rail details before reaching the CTA.
  - The active platform remains the dominant visual surface.
  Execution note:
  - This slice removed the extra connect summary wrapper above the active stage, tightened the stage header, and reordered the active stage on mobile so the platform action renders before the queue banner.

- [x] `IAFH-031` Remove or merge redundant connect-phase orientation layers.
  Dependency: `IAFH-030`
  Acceptance criteria:
  - Duplicate wrappers such as queue-summary + active-stage-summary are reduced to one coherent orientation model.
  - The page presents one clear “now / next” framing, not multiple stacked summaries.
  - Remaining-platform context stays understandable without dominating the screen.
  Execution note:
  - The standalone `Connect X more platforms` wrapper was removed and the active-stage banner now owns the top-level connect framing.

- [x] `IAFH-032` Demote request details, identity fields, and support content into compact secondary surfaces.
  Dependency: `IAFH-011`, `IAFH-030`
  Acceptance criteria:
  - Left-rail/request-detail content becomes materially quieter than the primary action.
  - Identity details appear only when operationally useful, or inside compact/collapsible containers.
  - Support remains available but does not compete with the CTA in normal states.
  Execution note:
  - The request rail now uses a compact summary + security card, moves identities into a disclosure, and reduces support to a quiet footer link row.

- [x] `IAFH-040` Add regression coverage for above-the-fold hierarchy and action visibility.
  Dependency: `IAFH-020`, `IAFH-030`
  Acceptance criteria:
  - Tests cover compact setup rendering and connect-phase active-stage-first rendering.
  - Tests assert the active connect CTA remains rendered in the primary stage and key duplicate wrappers are removed.
  - Existing invite sequencing/completion behavior remains covered.

- [x] `IAFH-041` Refresh design compliance coverage for the affected invite hierarchy primitives.
  Dependency: `IAFH-011`, `IAFH-031`, `IAFH-032`
  Acceptance criteria:
  - Design compliance scope includes hero/header, progress, stage, and secondary-details variants touched by this sprint.
  - Coverage guards against reintroducing multi-card preamble above the active task.

- [x] `IAFH-042` Capture screenshot-polish evidence for the compressed setup and connect hierarchy.
  Dependency: `IAFH-020`, `IAFH-030`, `IAFH-031`, `IAFH-032`
  Acceptance criteria:
  - Capture desktop/mobile screenshots for setup first paint and connect first paint.
  - Evidence proves `Continue to connect` and the active platform connect CTA are visible without scrolling.
  - Evidence covers at least one manual-platform connect state to confirm the hierarchy remains consistent across flow types.

- [x] `IAFH-043` Execute quality gates and document rollout notes.
  Dependency: `IAFH-040`, `IAFH-041`, `IAFH-042`
  Acceptance criteria:
  - Relevant web tests and web typecheck pass.
  - Sprint doc records verification commands, evidence paths, rollout notes, and residual risks.
  - Rollout notes explicitly reference the completed `PPAF-*` sprint as the sequencing baseline that this sprint is refining.

## Verification Strategy

1. Hierarchy regression coverage
   - Page/component tests for setup compression and active-stage-first connect rendering.
   - Coverage that prevents reintroduction of duplicate queue summary wrappers.

2. Visual validation
   - Desktop/mobile screenshots for setup and connect first paint.
   - Confirm CTA visibility without scrolling on target viewports.
   - Confirm secondary details are present but visually demoted.

3. Design compliance
   - Scoped invite design tests for compact hero/progress/details patterns.
   - Guardrails against equal-weight card stacks above the primary task.

4. Accessibility spot checks
   - Keyboard access to collapsible details and support surfaces.
   - Readability at 200% zoom and mobile widths after compression.

5. Functional regression
   - Ensure sequencing, callback resume, manual routing, and completion behavior remain intact while hierarchy changes.

## Verification Log

- Completed:
  - `npm test --workspace=apps/web -- 'src/components/flow/__tests__/invite-hero-header.test.tsx' 'src/components/flow/__tests__/invite-sticky-rail.test.tsx' 'src/components/flow/__tests__/invite-flow-shell.test.tsx' 'src/app/invite/[token]/__tests__/page.test.tsx'`
  - `npm test --workspace=apps/web -- 'src/app/__tests__/client-request-flow.design.test.ts'`
  - `npm run typecheck --workspace=apps/web`
  - `npm test --workspace=apps/web -- 'src/components/flow/__tests__/invite-hero-header.test.tsx' 'src/components/flow/__tests__/invite-flow-shell.test.tsx' 'src/components/client-auth/__tests__/PlatformAuthWizard.test.tsx' 'src/app/invite/[token]/__tests__/page.test.tsx'`
  - `npm test --workspace=apps/web -- 'src/components/flow/__tests__/invite-platform-stage.test.tsx' 'src/components/flow/__tests__/invite-hero-header.test.tsx' 'src/components/flow/__tests__/invite-flow-shell.test.tsx' 'src/components/client-auth/__tests__/PlatformAuthWizard.test.tsx' 'src/app/invite/[token]/__tests__/page.test.tsx'`
  - `npm test --workspace=apps/web -- 'src/components/flow/__tests__/manual-invite-header.test.tsx' 'src/app/invite/[token]/__tests__/manual-flows.test.tsx'`
  - `npm run typecheck --workspace=apps/web`
- Evidence captured:
  - `docs/images/client-request-flow/2026-03-10/desktop-invite-setup-first-paint.png`
  - `docs/images/client-request-flow/2026-03-10/desktop-invite-connect-first-paint.png`
  - `docs/images/client-request-flow/2026-03-10/mobile-invite-setup-first-paint.png`
  - `docs/images/client-request-flow/2026-03-10/mobile-invite-connect-first-paint.png`
  - `docs/images/client-request-flow/2026-03-10/desktop-manual-beehiiv-first-paint.png`
  - `docs/images/client-request-flow/2026-03-10/mobile-manual-beehiiv-first-paint.png`
- Browser findings:
  - Setup phase: `Continue to connect` is visible in first paint on desktop and mobile via the primary action dock.
  - Connect phase: active Google connect CTA is visible in first paint on desktop and mobile after mobile-only chrome reduction and stage reordering.
  - Manual Beehiiv flow: the shared manual header and checklist header are compact enough that the first-step action is visible in the initial mobile viewport.

## Rollout Notes

- This sprint refines the completed progressive sequencing baseline in `docs/sprints/2026-03-09-progressive-platform-auth-flow.md`; it does not change sequencing logic or callback behavior.
- The key implementation changes are mobile-only hierarchy reductions: hiding inline hero stats, hiding step chips in compact mode, and rendering the active platform action before the queue banner on mobile.
- Manual invite flows now reuse the compact hero treatment so they no longer ship the older full stat-grid header on first paint.
- Manual follow-on polish also tightened the checklist header and mobile spacing so the first-step action is visible without scroll on the Beehiiv manual path.

## Risks and Mitigations

1. Compressing context could reduce trust if done too aggressively.
   Mitigation: keep one strong trust note near the primary CTA and preserve explicit requested access visibility in setup.

2. Above-the-fold optimization could be tuned only for desktop and regress mobile.
   Mitigation: lock mobile first-paint CTA visibility and capture paired mobile evidence in the sprint gate.

3. Collapsing request details could hide operational identities needed for manual platforms.
   Mitigation: keep those identities accessible via compact inline disclosures and verify at least one manual-platform state.

4. Removing wrappers could accidentally weaken queue comprehension.
   Mitigation: preserve a single “now / next / remaining count” model in the active-stage shell.

5. Tokenized hierarchy changes could drift into ad hoc one-off spacing overrides.
   Mitigation: require reusable hierarchy variants and design-compliance coverage for the touched invite primitives.

## Review Findings Queue

1. The shared compact hero pattern now does more work across both OAuth and manual paths, so future invite-header changes should be regression-checked on both surfaces together.
2. If manual flows add longer instructional content on step 1, re-check mobile first paint so the step action does not slip below the fold again.
