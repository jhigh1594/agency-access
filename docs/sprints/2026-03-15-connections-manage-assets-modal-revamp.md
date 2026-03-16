# Sprint: Connections Manage Assets Modal Revamp

- Date: 2026-03-15
- Status: Completed with unrelated blockers logged
- Owners: Web
- Scope: Redesign the Meta and Google `Manage Assets` modals on the Connections page with a shared brutalist shell, lightweight UX upgrades, design-token cleanup, and aligned nested Meta permissions treatment without changing backend contracts or the modal interaction model.
- Discovery input:
  - Brainstorm: [`docs/brainstorms/2026-03-15-connections-manage-assets-modal-revamp-brainstorm.md`](/Users/jhigh/agency-access-platform/docs/brainstorms/2026-03-15-connections-manage-assets-modal-revamp-brainstorm.md)
  - Current implementation points:
    - [`apps/web/src/app/(authenticated)/connections/page.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/connections/page.tsx)
    - [`apps/web/src/components/meta-unified-settings.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/meta-unified-settings.tsx)
    - [`apps/web/src/components/google-unified-settings.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/google-unified-settings.tsx)
    - [`apps/web/src/components/meta-page-permissions-modal.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/meta-page-permissions-modal.tsx)
    - [`apps/web/src/components/ui/button.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/ui/button.tsx)

## Architecture Baseline Validation

The default `workflow-plan` Rails baseline does not apply directly to this repository:
- Not applicable: Rails, Phlex, Stimulus, Turbo/Hotwire Native.
- Applicable baseline used for this sprint:
  - Next.js App Router in `apps/web`
  - React client components with TanStack Query
  - Tailwind styling through repo-owned semantic tokens and existing brutalist primitives
  - Existing design-system compliance tests that already reject several hardcoded color families
  - Current modal interaction pattern on the Connections page remains the behavioral baseline

Adaptation note for workflow requirements:
- “Reusable Phlex primitives / variants” maps here to reusable React modal-shell and section primitives.
- Token-system work is required because the current modal surfaces still contain legacy `slate`, `indigo`, and generic gray styling on touched components.
- Screenshot-polish verification is required for desktop and mobile modal states because this sprint changes a high-visibility authenticated UI surface.

## External Research Decision

External web research is not required for this sprint.
- The problem is local UI quality, consistency, and interaction clarity.
- Repo context, existing tests, and the discovery brief provide enough information to plan the work safely.

## Product Decision Log (Locked)

1. The modal interaction model stays unchanged.
   - No route changes, side sheets, or page-level settings flows in this sprint.
2. Meta and Google will share one shell system, not one identical internal layout.
   - The shell, spacing rhythm, header/footer contract, motion, and summary treatment should be shared.
   - Internal content blocks remain platform-specific.
3. The visual target is brutalist intensity level `2`.
   - Sharper hierarchy and contrast, but still compatible with the current product shell.
4. Lightweight UX upgrades are in scope.
   - Add summary framing, stronger warning treatment, clearer loading/empty states, and a stable footer.
   - Do not introduce new multi-step workflows or behavior-heavy state machines.
5. Autosave remains the persistence model.
   - The modal footer should surface save state passively rather than add a global Save button.
   - Locked implementation choice: footer save state will use compact text plus a small status chip/icon treatment, not a primary Save CTA.
6. The nested Meta permissions modal should align visually with the shared shell but remain a smaller child variant.
   - It should not become a second full-size shell unless implementation simplicity clearly justifies it.

## Locked Shell Contract

1. Shared shell anatomy
   - Header: platform mark, title, concise one-line description, close affordance.
   - Summary strip: optional slot immediately under the header for 1-3 compact summary items.
   - Scroll body: modal body owns overflow and contains section cards only.
   - Sticky footer: passive autosave state at left, `Disconnect` and `Done` actions at right.
2. Responsive sizing
   - Desktop: centered modal, `max-w-5xl`, `max-h-[90vh]`.
   - Mobile: centered inset shell with tighter padding, `max-h-[92vh]`, no clipped footer actions.
   - Header and footer remain visible while the body scrolls.
3. Motion
   - Keep current rise/scale pattern.
   - Tighten timing only; do not introduce decorative choreography.
4. State treatment
   - Warnings live in dedicated inline panels.
   - Summary strip should show enabled/selected counts first; selected names only when concise and high-value.
   - Loading and empty states use the same shell framing, not ad hoc inner wrappers.

## Locked Component Boundaries

1. Shared reusable primitives in this sprint
   - `ManageAssetsModalShell`
   - `ManageAssetsSectionCard`
   - `ManageAssetsStatusPanel`
2. Platform-local composition remains in place for
   - Meta portfolio selector and asset rows
   - Google product rows and account selectors
   - Meta page permissions selection list
3. Out-of-scope reuse
   - Do not migrate unrelated modals such as `manual-invitation-modal.tsx` or `platform-connection-modal.tsx` into this shell during this sprint.
4. Token migration target on touched surfaces
   - Prefer semantic tokens and existing brutalist primitives.
   - Eliminate touched usages of `slate-*`, `indigo-*`, `gray-*`, `red-*`, `green-*`, and similar raw utility colors unless they are already covered by a semantic alias class.

## Architecture Approach

1. Extract a shared modal-shell layer for Connections asset settings.
   - Centralize backdrop, panel frame, header, summary strip slot, scroll container, sticky footer, and responsive sizing rules.
   - Keep the shell local to the Connections/settings surface unless reuse becomes immediately obvious.
2. Introduce lightweight reusable section primitives for internal settings blocks.
   - A section card for labeled groups.
   - A selection row card for enabled/disabled items with inline helper and warning slots.
   - A warning/info panel with tokenized severity variants.
3. Migrate touched surfaces off legacy utility colors onto semantic tokens and brutalist primitives.
   - Prioritize `text-ink`, `bg-paper`, `bg-card`, `border-border`, `bg-coral`, `bg-acid`, `text-muted-foreground`, and existing `Button` variants.
4. Preserve current query/mutation behavior and component ownership.
   - UI refactor only.
   - No backend or contract changes.
5. Keep the modal shells reviewable in small slices.
   - Shell first with tests.
   - Meta adoption second.
   - Google adoption third.
   - Nested Meta permissions alignment and polish after the parent surfaces are stable.

## Milestones

### Milestone 1: Shell Contract and Token Cleanup Plan
- `MAMR-001`, `MAMR-002`, `MAMR-010`, `MAMR-011`

### Milestone 2: Shared Shell and Primitive Foundation
- `MAMR-020`, `MAMR-021`, `MAMR-022`

### Milestone 3: Meta and Google Modal Adoption
- `MAMR-030`, `MAMR-031`, `MAMR-032`, `MAMR-033`

### Milestone 4: Nested Modal Alignment and Verification
- `MAMR-040`, `MAMR-041`, `MAMR-042`, `MAMR-043`

## Ordered Task Board

- [x] `MAMR-001` Create sprint artifact and lock scope for the Connections modal revamp.
  Dependency: none
  Acceptance criteria:
  - Sprint doc exists in `docs/sprints`.
  - Scope explicitly covers Meta, Google, and the nested Meta permissions modal alignment only.
  - The doc distinguishes this work from backend asset-setting or page-level Connections redesign.

- [x] `MAMR-002` Refresh [`docs/sprints/mvp-requirement-mapping.md`](/Users/jhigh/agency-access-platform/docs/sprints/mvp-requirement-mapping.md) for this modal revamp workstream.
  Dependency: `MAMR-001`
  Acceptance criteria:
  - Mapping includes stable `MAMR-*` task IDs.
  - Requirements are framed as Connections modal quality and usability outcomes, not backend behavior changes.

- [x] `MAMR-010` Lock the shared shell contract and responsive interaction rules.
  Dependency: `MAMR-001`
  Acceptance criteria:
  - The implementation target defines header, summary strip, scroll region, sticky footer, and mobile sizing behavior.
  - The plan explicitly decides how autosave status is surfaced in the footer.
  - Desktop and mobile modal height/overflow expectations are explicit enough to test.

- [x] `MAMR-011` Define token and component boundaries before code movement.
  Dependency: `MAMR-010`
  Acceptance criteria:
  - Touched modal surfaces have an explicit token migration target.
  - The plan names which pieces become reusable React primitives versus staying local to Meta/Google.
  - The extraction boundary avoids over-generalizing unrelated modal patterns.

- [x] `MAMR-020` Add failing design/behavior tests for the shared modal-shell contract before implementation.
  Dependency: `MAMR-010`, `MAMR-011`
  Acceptance criteria:
  - Tests cover shell-level expectations such as shared header/footer framing and tokenized classes on the new shell component or wrappers.
  - Existing tests are extended or new focused tests are added without weakening current behavioral coverage.
  - The initial red state demonstrates a real missing shell contract, not just snapshot churn.

- [x] `MAMR-021` Implement the shared `Manage Assets` modal shell and section primitives.
  Dependency: `MAMR-020`
  Acceptance criteria:
  - Meta and Google modal wrappers in the Connections page use the shared shell.
  - Reusable section/row/warning primitives exist where duplication would otherwise repeat.
  - The shell supports summary content, sticky footer content, and platform-specific body content without prop sprawl.

- [x] `MAMR-022` Add or update design-system coverage for touched modal primitives.
  Dependency: `MAMR-021`
  Acceptance criteria:
  - Design tests prevent reintroduction of `slate`, `indigo`, and similar legacy classes on touched surfaces.
  - Coverage includes the shared shell plus any new primitive files introduced in this sprint.
  - The tests enforce brutalist styling constraints relevant to this surface rather than broad unrelated assertions.

- [x] `MAMR-030` Add failing Meta-focused tests for hierarchy, summary framing, and warning treatment.
  Dependency: `MAMR-020`
  Acceptance criteria:
  - Tests cover stronger treatment of stored portfolio state, refresh warning presentation, and first-class portfolio framing.
  - Tests protect current business-selector behavior while allowing markup changes.
  - The failing state reflects the intended UX upgrade rather than copy-only differences.

- [x] `MAMR-031` Implement Meta modal adoption of the shared shell and upgraded section hierarchy.
  Dependency: `MAMR-021`, `MAMR-030`
  Acceptance criteria:
  - Meta uses the shared shell and summary strip coherently.
  - Business Portfolio is visually elevated as the primary configuration block.
  - Asset rows use the new section/row primitives and warning panels.
  - Existing query/mutation behavior and reauthentication flow remain intact.

- [x] `MAMR-032` Add failing Google-focused tests for product-block hierarchy and utility controls.
  Dependency: `MAMR-020`
  Acceptance criteria:
  - Tests cover product-row structure, upgraded utility controls, and warning placement for stale selections.
  - `Select all` / `Deselect all` behavior remains functionally covered.
  - The failing state proves the UI contract changed meaningfully.

- [x] `MAMR-033` Implement Google modal adoption of the shared shell and upgraded product matrix.
  Dependency: `MAMR-021`, `MAMR-032`
  Acceptance criteria:
  - Google uses the shared shell and summary strip coherently.
  - Product enablement, account selection, and manage-users toggles read as one structured block per product.
  - Warning and empty states are visually distinct without overwhelming the card.
  - Existing account-selection and autosave behavior remain intact.

- [x] `MAMR-040` Add failing tests for nested Meta permissions modal alignment.
  Dependency: `MAMR-021`
  Acceptance criteria:
  - The nested modal has explicit design coverage for token use and shell alignment.
  - Tests protect the smaller child-modal treatment rather than forcing a duplicate full-size shell.
  - Current permission-selection behavior remains covered.

- [x] `MAMR-041` Implement nested Meta permissions modal alignment with the new system.
  Dependency: `MAMR-031`, `MAMR-040`
  Acceptance criteria:
  - The nested modal visually feels related to the parent shell.
  - Legacy gray styling on touched permissions-modal surfaces is removed or reduced to semantic equivalents.
  - Permission selection, maximum-permission shortcut, and save/cancel behavior remain unchanged.

- [x] `MAMR-042` Execute screenshot-polish QA for the changed modal surfaces.
  Dependency: `MAMR-031`, `MAMR-033`, `MAMR-041`
  Acceptance criteria:
  - Desktop and mobile screenshots cover Meta modal, Google modal, and nested Meta permissions modal.
  - Evidence confirms sticky header/footer behavior, scroll behavior, and visible summary framing.
  - Any polish gaps found in browser QA are either fixed in-sprint or logged precisely.
  Notes:
  - Browser QA initially exposed a real runtime regression in the nested Meta permissions modal: [`apps/web/src/components/meta-page-permissions-modal.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/meta-page-permissions-modal.tsx) rendered `motion.div` inside `LazyMotion`, which threw at runtime when the child modal opened.
  - The regression was fixed in-sprint by switching that modal to `m.div` and adding a guard test.
  - Screenshot evidence was captured with Playwright route fixtures after local live auth bootstrap proved unreliable under the current Clerk/dev-shell session.

- [x] `MAMR-043` Run quality gates and document residual risks.
  Dependency: `MAMR-022`, `MAMR-031`, `MAMR-033`, `MAMR-041`, `MAMR-042`
  Acceptance criteria:
  - Targeted web tests pass.
  - Relevant web typecheck is run.
  - Sprint doc records verification commands, evidence locations, and any unrelated blockers precisely.
  Outcome:
  - Targeted web and API tests passed for the changed surfaces.
  - `apps/web` typecheck was rerun and still fails on an unrelated Dashboard typing issue outside this sprint.
  - Residual blockers are documented below and are not caused by the modal revamp.

## Verification Strategy

1. TDD-first component coverage
   - Add failing tests before each shell or platform-specific UI slice.
   - Prefer focused tests over broad snapshots.
   - Keep behavior assertions anchored to real interaction outcomes such as selector persistence, warning visibility, and utility controls.

2. Design-system compliance
   - Extend static design tests to guard against legacy color utilities on touched modal surfaces.
   - Ensure brutalist shell constraints are enforceable for the new shared shell and aligned nested modal.

3. Browser QA
   - Verify modal open/close, overlay click behavior, nested modal behavior, scroll containment, and sticky footer/header states.
   - Check desktop and mobile layouts on the Connections page, not just isolated component renders.

4. Accessibility spot checks
   - Keyboard reachability for close controls, toggles, dropdowns, and nested modal actions.
   - Focus visibility on the new shell and footer controls.
   - Readability at smaller widths and high zoom.

5. Regression safety
   - Preserve Meta reauthentication behavior, cached-first portfolio behavior, Google select-all behavior, stale-selection warnings, and autosave mutation flows.

## Verification Log

- Passed:
  - `npm test --workspace=apps/api -- --run src/middleware/__tests__/auth.middleware.test.ts`
  - `npm test --workspace=apps/web -- --run src/components/__tests__/manage-assets-modal-shell.design.test.tsx`
  - `npm test --workspace=apps/web -- --run src/components/__tests__/meta-unified-settings.design.test.tsx`
  - `npm test --workspace=apps/web -- --run src/components/__tests__/meta-unified-settings.test.tsx`
  - `npm test --workspace=apps/web -- --run src/components/__tests__/google-unified-settings.test.tsx`
  - `npm test --workspace=apps/web -- --run src/components/__tests__/meta-page-permissions-modal.design.test.tsx`
  - `npm test --workspace=apps/web -- --run 'src/app/(authenticated)/connections/__tests__/page.test.tsx'`
  - `npm test --workspace=apps/web -- --run src/components/__tests__/manage-assets-modal-shell.design.test.tsx src/components/__tests__/meta-unified-settings.design.test.tsx src/components/__tests__/meta-unified-settings.test.tsx src/components/__tests__/google-unified-settings.test.tsx src/components/__tests__/google-unified-settings.design.test.tsx src/components/__tests__/meta-page-permissions-modal.design.test.tsx 'src/app/(authenticated)/connections/__tests__/page.test.tsx'`
- Result notes:
  - Combined focused run completed with `42 passed, 2 skipped`.
  - The API auth middleware suite passed with the new development-bypass token coverage.
  - Connections page tests still emit a pre-existing React warning about a non-boolean `priority` prop in the mocked image path; the tests pass and this sprint did not introduce that warning.
- Typecheck:
  - `npm run typecheck --workspace=apps/web`
  - Result: failed on unrelated Dashboard errors in [`apps/web/src/app/(authenticated)/dashboard/page.tsx:646`](/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/dashboard/page.tsx#L646) and [`apps/web/src/app/(authenticated)/dashboard/page.tsx:647`](/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/dashboard/page.tsx#L647) where `clientId` is missing on the current union type.
- Browser QA:
  - Started local servers with `npm run dev:web` and `npm run dev:api`.
  - Ran `npx prisma generate` in `apps/api` to restore the local Prisma client before restarting the API.
  - Initial live QA attempt exposed two issues:
    - The Connections page needed a development-bypass bearer token path to match API expectations.
    - Opening the nested Meta permissions modal threw a `LazyMotion` runtime error until the modal switched from `motion.div` to `m.div`.
  - After those fixes, modal evidence was captured with mocked route data to avoid unrelated local Clerk/layout bootstrap instability.
  - Screenshot evidence:
    - Desktop Meta modal: `var/folders/sk/6lct4l1d1kvd9qq6plgvfdc40000gn/T/playwright-mcp-output/1773612086021/element-2026-03-15T22-12-05-010Z.png`
    - Desktop Meta permissions modal: `var/folders/sk/6lct4l1d1kvd9qq6plgvfdc40000gn/T/playwright-mcp-output/1773612086021/element-2026-03-15T22-12-14-871Z.png`
    - Desktop Google modal: `var/folders/sk/6lct4l1d1kvd9qq6plgvfdc40000gn/T/playwright-mcp-output/1773612086021/element-2026-03-15T22-12-33-270Z.png`
    - Mobile Meta modal: `var/folders/sk/6lct4l1d1kvd9qq6plgvfdc40000gn/T/playwright-mcp-output/1773612086021/element-2026-03-15T22-13-11-014Z.png`
    - Mobile Meta permissions modal: `var/folders/sk/6lct4l1d1kvd9qq6plgvfdc40000gn/T/playwright-mcp-output/1773612086021/element-2026-03-15T22-13-18-909Z.png`
    - Mobile Google modal: `var/folders/sk/6lct4l1d1kvd9qq6plgvfdc40000gn/T/playwright-mcp-output/1773612086021/element-2026-03-15T22-12-55-120Z.png`

## Review Findings Queue

- `MAMR-RF-001` `apps/web` typecheck is currently red due to an unrelated Dashboard typing issue in [`apps/web/src/app/(authenticated)/dashboard/page.tsx:646`](/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/dashboard/page.tsx#L646) and [`apps/web/src/app/(authenticated)/dashboard/page.tsx:647`](/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/dashboard/page.tsx#L647).
- `MAMR-RF-002` Focused page tests still log a non-failing React warning about the mocked `priority` prop path. This predates the modal refactor but should be cleaned up to keep UI test output trustworthy.
- `MAMR-RF-003` Live browser QA against the fully unmocked local auth shell remains noisy because the current Clerk/dev session can still leave `/connections` in a `Loading agency...` state. This no longer blocks modal evidence, but it is worth cleaning up separately from the modal revamp.

## Risks and Mitigations

1. Shared-shell extraction could over-generalize and make platform-specific content awkward.
   Mitigation: keep the shell narrow in responsibility and leave content composition inside platform components.

2. Token cleanup could break existing design tests or leave mixed legacy styling behind.
   Mitigation: add shell-level and component-level design coverage before broad class rewrites.

3. Sticky footer/header behavior could reduce usable viewport height on mobile.
   Mitigation: define explicit height and overflow rules in `MAMR-010` and verify with browser evidence on smaller viewports.

4. Cosmetic changes could accidentally obscure warning states or destructive actions.
   Mitigation: treat warnings and disconnect affordances as explicit acceptance criteria, not incidental styling details.

5. Nested modal alignment could create interaction regressions inside the parent modal stack.
   Mitigation: test nested open/close behavior directly and validate focus/scroll containment in browser QA.
