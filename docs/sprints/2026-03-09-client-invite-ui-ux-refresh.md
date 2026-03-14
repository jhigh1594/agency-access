# Sprint: Client Invite UI/UX Refresh

- Date: 2026-03-09
- Status: Completed
- Owners: Web + Shared + API
- Scope: Client-facing invite flow (`/invite/[token]`), per-platform authorization cards, manual invite subflows, public support/recovery affordances, and platform capability alignment that affects client-facing UX truthfulness.
- Discovery input:
  - Client-facing workflow audit (completion blockers and flow inconsistencies)
  - UI/UX audit focused on hierarchy, trust, responsiveness, and visual polish
  - Existing screenshot evidence under `docs/images/client-request-flow/2026-02-27`
  - Existing sprint artifacts:
    - `docs/sprints/2026-02-27-client-request-flow-design-system.md`
    - `docs/sprints/2026-02-27-invite-flow-ux-conversion.md`

## Architecture Baseline Validation

The default `workflow-plan` baseline does not apply to this repository:
- Not applicable: Rails, Phlex, Stimulus, Turbo/Hotwire Native.
- Applicable baseline used for this sprint:
  - Next.js App Router (web)
  - Fastify + Prisma (api)
  - Shared TypeScript contracts via `@agency-platform/shared`
  - Tailwind tokenized UI patterns and shared React UI primitives
  - Clerk public-route gating for pre-auth invite/support entry points

Adaptation note for required planning items:
- “Reusable Phlex primitives/variants” is implemented here as reusable React invite-flow primitives and variantized client-facing layout components in `apps/web/src/components/flow` and `apps/web/src/components/client-auth`.
- Token-system work is required, but it should extend existing semantic invite tokens/components rather than introduce one-off page styling.

## External Research Decision

External research is not required for this sprint.
- Existing local evidence is sufficient:
  - current implementation review
  - saved desktop/mobile screenshots
  - focused UX findings already derived from the shipped flow
- Risk is implementation coherence and design execution, not missing market context.

## Product Decision Log (Locked)

1. The active task becomes the primary visual focus on every invite screen.
   - On mobile, the actionable content must render before secondary context.
   - On desktop, the rail remains secondary support, not equal-weight content.
2. Client-facing trust framing is a product requirement, not cosmetic polish.
   - Use agency branding and requester/recipient context prominently where available.
   - Do not present the client flow like an internal admin tool.
3. Security and capability copy must be truthful per platform.
   - No blanket “OAuth only” language on screens that include manual invite platforms.
   - Requested access levels and what is being approved should be visible before connection.
4. Platform capability taxonomy must be canonical across creator flow, runtime routing, and completion handling.
   - Mailchimp/Klaviyo mismatch is in scope because it directly affects client-facing UX and trust.
5. Recovery and support affordances must resolve to real public destinations.
   - If a new support/help route is introduced, it must ship with Clerk public-route coverage and focused proxy tests.
6. This sprint is a direct replace of the current invite UI.
   - No feature flag unless a blocker emerges during implementation.

## Architecture Approach

1. Introduce a canonical client-facing platform capability map shared by creator/runtime surfaces:
   - platform group
   - auth mode (`oauth`, `manual`, `hybrid`)
   - manual route availability
   - callback completion behavior
2. Refactor invite layout primitives into clearer role-based surfaces:
   - `InviteHeroHeader` or equivalent top summary block
   - compact contextual rail sections
   - mobile-first layout ordering with action-first stacking
3. Build a reusable trust and support layer for client-facing pages:
   - agency branding slot
   - requester/recipient context copy
   - truthful security note variant
   - support destination component with public-route-safe href
4. Redesign progress and CTA language as a reusable copy system:
   - explicit action labels by step/state
   - earned progress for manual checklists
   - final-step CTA text based on whether another platform remains
5. Keep API response envelopes unchanged unless platform capability alignment requires additive shared metadata.
6. Preserve existing manual checklist engine where it still fits, but adjust layout, footer behavior, and gating semantics rather than layering more cards.

## Milestones

### Milestone 1: Contract Truthfulness + Layout Direction
- `CIUX-001`, `CIUX-002`, `CIUX-010`, `CIUX-011`, `CIUX-012`

### Milestone 2: Core Invite Surface Redesign
- `CIUX-020`, `CIUX-021`, `CIUX-022`, `CIUX-023`

### Milestone 3: Platform and Manual Flow UX Polish
- `CIUX-030`, `CIUX-031`, `CIUX-032`, `CIUX-033`

### Milestone 4: Verification, Public Routing, and Evidence
- `CIUX-040`, `CIUX-041`, `CIUX-042`, `CIUX-043`

## Ordered Task Board

- [x] `CIUX-001` Create sprint artifact with locked decisions, architecture approach, risks, and verification strategy.
  Dependency: none
  Acceptance criteria:
  - Sprint doc includes architecture baseline validation and adaptation notes for this Next.js repo.
  - Decision log explicitly locks the action-first mobile policy, trust framing, and canonical platform capability requirement.

- [x] `CIUX-002` Refresh `docs/sprints/mvp-requirement-mapping.md` for the invite UI/UX refresh scope.
  Dependency: `CIUX-001`
  Acceptance criteria:
  - Requirement mapping includes the new client invite UI/UX workstream and stable `CIUX-*` task IDs.
  - Mapping distinguishes design/UX requirements from earlier invite reliability work.

- [x] `CIUX-010` Create a canonical client-facing platform capability helper used by creator flow, invite runtime, and callback completion logic.
  Dependency: `CIUX-001`
  Acceptance criteria:
  - One source of truth defines whether a platform is OAuth, manual, or hybrid.
  - Mailchimp/Klaviyo handling is explicitly resolved instead of inferred from multiple ad hoc sets.
  - Existing creator/runtime behavior no longer contradicts client-facing copy or routing.

- [x] `CIUX-011` Align client invite routing and completion behavior with the canonical capability map.
  Dependency: `CIUX-010`
  Acceptance criteria:
  - Manual-capable platforms route deterministically to their intended experience or are excluded until supported.
  - Callback completion logic uses the same canonical platform rules as the wizard/router.
  - Regression tests cover Mailchimp/Klaviyo decision paths and existing manual platforms.

- [x] `CIUX-012` Define reusable invite-surface variants for hierarchy and trust.
  Dependency: `CIUX-001`
  Acceptance criteria:
  - New or updated shared primitives exist for hero/header, secondary rail sections, trust note, and support card.
  - Variants consume existing semantic tokens; no one-off inline styles or ad hoc palette classes.
  - Component APIs are reusable across invite core and manual subflows.

- [x] `CIUX-020` Redesign the invite page top summary and review step around requester trust and clarity.
  Dependency: `CIUX-012`
  Acceptance criteria:
  - Top section clearly answers: who requested access, for whom, to what, and what happens next.
  - Review step shows requested platforms and requested access levels in plain language.
  - Agency branding is displayed when present; generic fallback still feels intentional.

- [x] `CIUX-021` Rework split-layout responsiveness so mobile shows the task before the rail.
  Dependency: `CIUX-012`
  Acceptance criteria:
  - On mobile, task content renders before contextual cards for invite core and manual flows.
  - Rail content is compacted, collapsible, or visually demoted on small screens.
  - Desktop retains a secondary sticky rail without competing with the main action area.

- [x] `CIUX-022` Replace current support/help affordances with a real public recovery path.
  Dependency: `CIUX-012`
  Acceptance criteria:
  - Support CTA resolves to an existing public route or a newly added public help route.
  - If a new route is added, `apps/web/src/proxy.ts` and `apps/web/src/__tests__/proxy.test.ts` are updated in the same change.
  - Timeout/error/manual pages expose a concrete support path and, where available, agency contact details.

- [x] `CIUX-023` Rewrite progress and CTA language for explicitness and trust.
  Dependency: `CIUX-020`, `CIUX-021`
  Acceptance criteria:
  - Generic labels like `Continue`, `Confirm selection`, and `Next platform` are replaced where ambiguity exists.
  - Security copy is platform-truthful and no longer overclaims “OAuth only” on mixed/manual surfaces.
  - Step/progress language feels earned and step-specific rather than generic percentage filler.
  Execution note:
  - Completed across the March 9 implementation slices via truthful security copy, explicit wizard/manual CTA labels, and earned-progress language on manual flows.

- [x] `CIUX-030` Refine `PlatformAuthWizard` step hierarchy and success states.
  Dependency: `CIUX-023`
  Acceptance criteria:
  - Step 1 help content is accurate and interpolated correctly.
  - Step 2/3 labels and CTA copy match the user’s mental model for each platform type.
  - Final CTA changes based on whether another platform remains or the request is fully complete.

- [x] `CIUX-031` Redesign manual checklist flows for calmer hierarchy and better completion semantics.
  Dependency: `CIUX-021`, `CIUX-023`
  Acceptance criteria:
  - Manual flows no longer show misleading starting progress like “1 of 4 complete” before action.
  - Completion-gated steps use clearer disabled/ready states instead of relying on post-click validation alone.
  - Mobile sticky action footer no longer visually interrupts primary reading order.

- [x] `CIUX-032` Integrate branding and trust surfaces consistently across manual pages.
  Dependency: `CIUX-012`, `CIUX-031`
  Acceptance criteria:
  - Manual pages use agency branding/logo when available through a shared surface.
  - Requester/recipient context and invite identity are shown consistently across Beehiiv, Kit, Pinterest, Shopify, and Snapchat.
  - The currently unused manual shell is either adopted, removed, or superseded explicitly.

- [x] `CIUX-033` Tighten visual hierarchy and tokenized polish across invite surfaces.
  Dependency: `CIUX-020`, `CIUX-021`, `CIUX-031`
  Acceptance criteria:
  - The number of same-weight boxed surfaces is reduced.
  - Primary, secondary, and tertiary information groups are visually distinct through tokenized type/spacing/elevation.
  - Desktop and mobile layouts feel intentionally client-facing rather than internal-tool styled.

- [x] `CIUX-040` Add regression tests for platform capability truthfulness, mobile layout ordering, copy states, and support routing.
  Dependency: `CIUX-011`, `CIUX-022`, `CIUX-023`
  Acceptance criteria:
  - Tests cover canonical platform capability usage in client-facing routing/completion.
  - Invite/manual tests assert the correct support destination and key CTA/copy states.
  - Proxy tests cover any new public help/support route behavior.
  Execution note:
  - No proxy change was required in this slice because support continued to use the existing public `/contact` route.

- [x] `CIUX-041` Add or update focused design compliance tests for new invite primitives and files.
  Dependency: `CIUX-012`, `CIUX-033`
  Acceptance criteria:
  - Scoped design compliance coverage includes any newly added invite layout primitives.
  - Tests continue guarding against generic palette regressions in targeted flow files.

- [x] `CIUX-042` Run screenshot-polish verification across required invite states.
  Dependency: `CIUX-020`, `CIUX-021`, `CIUX-031`, `CIUX-033`
  Acceptance criteria:
  - Capture desktop/mobile evidence for invite core, manual flows, invalid link, delayed load, and timeout.
  - Capture the resolved Mailchimp/Klaviyo manual states and any public support/recovery surface used by the invite flow.
  - Artifacts are stored under `docs/images/client-request-flow/2026-03-09`.
  - Evidence confirms action-first mobile ordering and stronger trust hierarchy.
  Execution note:
  - Completed on March 9 with refreshed desktop/mobile evidence for invite review/connect, Beehiiv/Kit/Mailchimp/Klaviyo/Pinterest/Shopify/Snapchat manual states, resolved Mailchimp/Klaviyo confirm states, and invalid/delayed/timeout recovery surfaces.

- [x] `CIUX-043` Execute quality gates and document rollout notes.
  Dependency: `CIUX-040`, `CIUX-041`, `CIUX-042`
  Acceptance criteria:
  - Relevant web tests, typecheck, and any affected API/shared tests pass.
  - Sprint doc includes verification log, rollout notes, and any residual risks after implementation.
  - Earlier invite sprint docs are cross-referenced if any previous recommendations are intentionally superseded.

## Verification Strategy

1. Contract and routing truthfulness
   - Unit coverage for canonical platform capability helper.
   - Invite runtime tests covering manual/OAuth/hybrid routing and callback completion.

2. UX regression coverage
   - Invite page tests for review-step clarity, truthful security copy, and final CTA behavior.
   - Manual-flow tests for progress semantics, disabled/ready gating, and support path rendering.

3. Public-route safety
   - Proxy tests for any new support/help route added for invite recovery.

4. Visual and responsive validation
   - Screenshot evidence for desktop/mobile invite core and manual flows.
   - Compare against existing `2026-02-27` evidence to confirm hierarchy improvements.

5. Accessibility spot checks
   - Keyboard navigation through manual flow footer actions and support links.
   - Visual review of focus states, color contrast on muted secondary text, and 200% zoom behavior on mobile layouts.

## Risks and Mitigations

1. Invite redesign could regress already-working reliability behavior.
   Mitigation: keep reliability state model unchanged unless required by support-path work; preserve existing delayed/timeout tests and evidence scenarios.

2. Canonical platform-capability cleanup could broaden scope into connector architecture.
   Mitigation: limit sprint changes to user-visible client-routing truthfulness and shared platform metadata used by creator/web runtime; avoid connector refactors unless they are directly required.

3. More branding/trust context could create clutter if layered on top of current card density.
   Mitigation: redesign hierarchy first, then insert branding into the hero surface instead of adding more standalone cards.

4. Public support route changes can accidentally trip Clerk redirects.
   Mitigation: treat support/help entry points as public-by-default and ship route allowlist plus proxy tests in the same PR.

5. Mobile action-bar changes could reduce completion speed if overcorrected.
   Mitigation: keep sticky actions where useful, but move them behind clearer content order and verify with screenshot evidence plus keyboard/touch review.

## Review Findings Queue

1. Current mobile split layout shows rail content before the active task, which should be treated as a blocker for client-facing polish.
2. Current support CTA defaults to `/help`, but no corresponding public route was found in the repo.
3. Current client-facing security copy overstates “OAuth only” despite manual platform flows.
4. Manual-flow progress semantics should be treated as design debt, not just copy debt.
5. Scope calls out Mailchimp/Klaviyo capability mismatch, but the execution board does not explicitly cover manual-page UX work for those platforms if the canonical decision keeps them manual; resolve that during `CIUX-010`/`CIUX-011` or add follow-up tasks before implementation starts.
6. Verification covers tests for support routing and capability truthfulness, but screenshot evidence does not yet explicitly require capturing the resolved Mailchimp/Klaviyo state or any new public support surface; tighten `CIUX-042` if those surfaces ship.

## Verification Log

- 2026-03-09: Added canonical client-invite capability helper in `apps/web/src/lib/client-invite-platforms.ts`.
- 2026-03-09: Aligned invite callback completion and wizard routing to the canonical helper for Beehiiv, Kit, Mailchimp, Klaviyo, Pinterest, Snapchat, and Shopify.
- 2026-03-09: Added Mailchimp and Klaviyo manual invite pages plus API `manual-connect` endpoints.
- 2026-03-09: Replaced default invite support destination from `/help` to existing public `/contact`.
- 2026-03-09: Ran `npm test --workspace=apps/web -- 'src/lib/__tests__/client-invite-platforms.test.ts' 'src/components/client-auth/__tests__/PlatformAuthWizard.test.tsx' 'src/app/invite/[token]/__tests__/page.test.tsx' 'src/app/invite/[token]/__tests__/manual-flows.test.tsx'`.
- 2026-03-09: Ran `npm test --workspace=apps/api -- src/routes/client-auth/__tests__/manual.routes.test.ts`.
- 2026-03-09: Ran `npm run typecheck --workspace=apps/web`.
- 2026-03-09: Ran `npm run typecheck --workspace=apps/api`.
- 2026-03-09: Added reusable invite UI primitives:
  - `apps/web/src/components/flow/invite-hero-header.tsx`
  - `apps/web/src/components/flow/invite-support-card.tsx`
  - `apps/web/src/components/flow/invite-trust-note.tsx`
- 2026-03-09: Updated `InviteFlowShell` so split layouts render the task before the rail on mobile and collapse rail content behind a secondary summary.
- 2026-03-09: Updated invite review header and requested-platform summary to show requester, recipient, requested platforms, and access levels in plain language.
- 2026-03-09: Added focused web regression coverage for the new shell ordering, review header, branding, and null `intakeFields` handling.
- 2026-03-09: Ran `npm test --workspace=apps/web -- 'src/components/flow/__tests__/invite-flow-shell.test.tsx' 'src/components/flow/__tests__/invite-sticky-rail.test.tsx' 'src/app/invite/[token]/__tests__/page.test.tsx' 'src/app/__tests__/client-request-flow.design.test.ts'`.
- 2026-03-09: Captured browser evidence:
  - `docs/images/client-request-flow/2026-03-09/desktop-invite-review-refresh.png`
  - `docs/images/client-request-flow/2026-03-09/mobile-invite-review-refresh.png`
  - `docs/images/client-request-flow/2026-03-09/desktop-invite-platforms-refresh.png`
  - `docs/images/client-request-flow/2026-03-09/mobile-invite-platforms-refresh.png`
- 2026-03-09: Screenshot verification exposed a live-data regression when `intakeFields` is `null`; fixed in the same slice and covered by test.
- 2026-03-09: Updated `PlatformAuthWizard` copy states to use explicit action labels, accurate interpolated help text, and a final CTA that changes to `Finish request` on the last incomplete platform.
- 2026-03-09: Updated `ManualChecklistWizard` to use earned progress counts, disabled completion-gated primary actions, and an inline mobile footer instead of a fixed interrupting action bar.
- 2026-03-09: Updated manual platform pages so final checklist actions use `Return to request` and rail progress reflects completed steps instead of the current step index.
- 2026-03-09: Ran `npm test --workspace=apps/web -- 'src/components/client-auth/__tests__/PlatformAuthWizard.test.tsx'`.
- 2026-03-09: Ran `npm test --workspace=apps/web -- 'src/components/flow/__tests__/manual-checklist-wizard.test.tsx'`.
- 2026-03-09: Ran `npm test --workspace=apps/web -- 'src/components/client-auth/__tests__/PlatformAuthWizard.test.tsx' 'src/components/flow/__tests__/manual-checklist-wizard.test.tsx' 'src/app/invite/[token]/__tests__/manual-flows.test.tsx' 'src/app/invite/[token]/__tests__/page.test.tsx'`.
- 2026-03-09: Re-ran `npm run typecheck --workspace=apps/web` after the copy and manual-flow polish slice.
- 2026-03-09: Captured browser evidence for refreshed Mailchimp manual states:
  - `docs/images/client-request-flow/2026-03-09/desktop-manual-mailchimp-refresh.png`
  - `docs/images/client-request-flow/2026-03-09/mobile-manual-mailchimp-refresh.png`
  - `docs/images/client-request-flow/2026-03-09/desktop-manual-mailchimp-confirm-refresh.png`
  - `docs/images/client-request-flow/2026-03-09/mobile-manual-mailchimp-confirm-refresh.png`
- 2026-03-09: Added `apps/web/src/components/flow/manual-invite-header.tsx` and threaded it through Beehiiv, Kit, Mailchimp, Klaviyo, Pinterest, Shopify, and Snapchat manual pages for shared branding, requester/recipient context, and manual trust framing.
- 2026-03-09: Reworked `apps/web/src/components/flow/invite-sticky-rail.tsx` into a single compact `Request details` surface and explicitly removed the unused `apps/web/src/components/flow/manual-invite-shell.tsx`.
- 2026-03-09: Expanded scoped design compliance coverage to the Mailchimp, Klaviyo, and Snapchat manual pages plus the new `manual-invite-header.tsx` primitive.
- 2026-03-09: Added timeout recovery coverage in `apps/web/src/components/flow/__tests__/invite-load-state-card.test.tsx`.
- 2026-03-09: Ran `npm test --workspace=apps/web -- 'src/components/client-auth/__tests__/PlatformAuthWizard.test.tsx' 'src/components/flow/__tests__/manual-checklist-wizard.test.tsx' 'src/components/flow/__tests__/invite-flow-shell.test.tsx' 'src/components/flow/__tests__/invite-sticky-rail.test.tsx' 'src/components/flow/__tests__/invite-load-state-card.test.tsx' 'src/app/invite/[token]/__tests__/manual-flows.test.tsx' 'src/app/invite/[token]/__tests__/page.test.tsx' 'src/app/__tests__/client-request-flow.design.test.ts'`.
- 2026-03-09: Re-ran `npm run typecheck --workspace=apps/web` after the manual-header and compact-rail refactor.
- 2026-03-09: Captured browser evidence for the completed screenshot matrix:
  - Invite core: `desktop-invite-review-refresh.png`, `mobile-invite-review-refresh.png`, `desktop-invite-platforms-refresh.png`, `mobile-invite-platforms-refresh.png`
  - Recovery states: `desktop-invite-invalid-refresh.png`, `mobile-invite-invalid-refresh.png`, `desktop-invite-delayed-refresh.png`, `mobile-invite-delayed-refresh.png`, `desktop-invite-timeout-refresh.png`, `mobile-invite-timeout-refresh.png`
  - Manual flows: `desktop-manual-beehiiv-refresh.png`, `mobile-manual-beehiiv-refresh.png`, `desktop-manual-kit-refresh.png`, `mobile-manual-kit-refresh.png`, `desktop-manual-pinterest-refresh.png`, `mobile-manual-pinterest-refresh.png`, `desktop-manual-shopify-refresh.png`, `mobile-manual-shopify-refresh.png`, `desktop-manual-snapchat-refresh.png`, `mobile-manual-snapchat-refresh.png`, `desktop-manual-klaviyo-refresh.png`, `mobile-manual-klaviyo-refresh.png`
  - Resolved manual confirm states: `desktop-manual-klaviyo-confirm-refresh.png`, `mobile-manual-klaviyo-confirm-refresh.png`, `desktop-manual-mailchimp-confirm-refresh.png`, `mobile-manual-mailchimp-confirm-refresh.png`

## Execution Update

- Completed in this slice:
  - `CIUX-010`
  - `CIUX-011`
  - `CIUX-012`
  - `CIUX-020`
  - `CIUX-021`
  - `CIUX-022`
  - `CIUX-023`
  - `CIUX-030`
  - `CIUX-031`
  - `CIUX-032`
  - `CIUX-033`
  - `CIUX-040`
  - `CIUX-041`
  - `CIUX-042`
  - `CIUX-043`
- Explicitly not addressed yet:
  - none within this sprint scope

## Residual Risks

1. The canonical helper currently covers the invite runtime, but creator/authenticated surfaces still contain separate manual-platform lists. That follow-on cleanup is outside this sprint’s client-facing invite scope.
2. `zapier` remains a manual platform elsewhere in the product but is not yet part of the invite runtime capability helper because this sprint only covered the implemented client invite flows.

## Rollout Notes

- Capability-map and support-path fixes are safe to ship with the manual-header and compact-rail redesign because they preserve the core invite state model while reducing UI noise and trust ambiguity.
- Any later creator-surface cleanup should build on `client-invite-platforms.ts` and the shared manual invite header rather than reintroducing per-page manual identity or rail variants.
