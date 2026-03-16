# 2026-03-15 Connections Manage Assets Modal Revamp Brainstorm

## Objective
Revamp the `Manage Assets` modals on the Connections page so they feel more intentional, more aligned with the product's brutalist design system, and easier to use for high-frequency configuration tasks without changing the underlying modal interaction model.

The target outcome is a stronger visual system and a few lightweight UX upgrades:
- clearer section hierarchy
- better loading and empty states
- stronger warnings and guidance
- more stable footer actions
- improved scanability for Meta and Google configuration flows

## Repo Context (Observed)
- The Connections page launches the current asset-management modals from [`apps/web/src/app/(authenticated)/connections/page.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/connections/page.tsx).
- The modal wrappers already exist inline in that page and currently render centered overlay dialogs for both Meta and Google.
- Meta modal content is implemented in [`apps/web/src/components/meta-unified-settings.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/meta-unified-settings.tsx).
- Google modal content is implemented in [`apps/web/src/components/google-unified-settings.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/google-unified-settings.tsx).
- Meta page-level permission refinement already uses a nested modal in [`apps/web/src/components/meta-page-permissions-modal.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/meta-page-permissions-modal.tsx).
- Existing tests already assert behavioral and design constraints:
  - [`apps/web/src/components/__tests__/meta-unified-settings.test.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/__tests__/meta-unified-settings.test.tsx)
  - [`apps/web/src/components/__tests__/google-unified-settings.test.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/__tests__/google-unified-settings.test.tsx)
  - [`apps/web/src/components/__tests__/google-unified-settings.design.test.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/__tests__/google-unified-settings.design.test.tsx)
  - [`apps/web/src/components/__tests__/meta-page-permissions-modal.design.test.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/__tests__/meta-page-permissions-modal.design.test.tsx)

## Default Architecture Baseline Check
The default `workflow-discovery` Rails/Phlex baseline does not apply.

Applicable baseline for this repository:
- Next.js App Router frontend in `apps/web`
- Tailwind CSS with project-owned semantic tokens
- Existing brutalist-flavored primitives such as `shadow-brutalist`, `bg-paper`, `text-ink`, `bg-coral`, `bg-acid`
- Existing `Button` variants in [`apps/web/src/components/ui/button.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/components/ui/button.tsx)
- Design-system compliance tests that already reject several hardcoded Tailwind color families
- Screenshot-driven polish loop is still recommended for final implementation because this is a user-facing modal surface

## Discovery Inputs Confirmed
- Keep the interaction model as modal dialogs for now.
- Include lightweight UX improvements, not just a cosmetic repaint.
- Aim for brutalist intensity level `2`:
  - stronger hierarchy and sharper structure
  - still compatible with the current product shell
  - avoid turning the modal into a loud one-off art piece
- Recommended structural direction: a shared modal shell with platform-specific accents and internal modules.

## Current Behavior Gaps
1. The outer modal shell is mostly generic and does not fully commit to the product's more distinctive brutalist language.
2. Meta and Google feel visually inconsistent with each other because the shell is shared only loosely while the internals mix token-based styling with older `slate` / `indigo` / generic gray usage.
3. There is limited hierarchy between summary information, primary configuration controls, warnings, and destructive actions.
4. Footer actions are not especially stable or communicative for longer modal content.
5. Loading, refresh-failure, and no-selection states are functional but not visually intentional.
6. The Meta nested permissions modal also uses softer, older styling patterns and should not look disconnected from the parent modal.

## Design Goals
- Make the modals feel unmistakably part of the product's brutalist system.
- Increase scanability so users can understand the current connection state in seconds.
- Keep configuration work fast for returning users.
- Preserve current data flows and endpoint behavior unless a small UI-driven refactor meaningfully improves maintainability.
- Reduce visual drift between Meta and Google while respecting their workflow differences.

## Non-Goals
- Replace modals with drawers, side panels, or route-based settings pages.
- Redesign the full Connections page grid around the modals.
- Change backend asset-setting semantics.
- Add heavyweight workflow steps, wizardization, or multistep state machines.
- Expand scope into unrelated connector settings outside Meta and Google.

## Approaches
### 1) Cosmetic Refresh Only
Scope:
- Restyle borders, colors, spacing, and typography in the existing structures.
- Remove stale token violations and tighten brutalist consistency.

Pros:
- Lowest risk.
- Fastest implementation.
- Minimal test churn.

Cons:
- Leaves the current information hierarchy mostly intact.
- Misses the opportunity to improve scanning and decision speed.
- Would likely feel like cleanup, not a real revamp.

### 2) Shared Brutalist Shell + Lightweight UX Upgrades (Recommended)
Scope:
- Create a common modal shell for Meta and Google.
- Rebuild header, content framing, and footer rhythm around a stronger brutalist hierarchy.
- Keep platform-specific content flows, but reorganize them into clearer content modules.
- Add lightweight UX improvements such as sticky actions, summary bars, clearer warnings, improved empty/loading states, and more legible grouped controls.

Pros:
- Best balance of cohesion, usability, and scope control.
- Makes both modals feel designed together.
- Preserves current workflows while materially improving quality.
- Sets up a reusable pattern for future settings modals.

Cons:
- Requires touching multiple related components, not just class cleanup.
- Will require coordinated updates to behavioral and design tests.

### 3) Distinct Per-Platform Editorial Modals
Scope:
- Give Meta and Google more independent compositions and stronger personality differences.
- Use a common token language but allow substantial divergence in layout and hierarchy.

Pros:
- Strongest platform-specific expression.
- Can better match the differences between portfolio selection and product/account selection.

Cons:
- More maintenance overhead.
- Higher risk of visual fragmentation on the Connections page.
- Easier to overshoot the requested brutality level and create inconsistency.

## Recommendation
Adopt **Approach 2: Shared Brutalist Shell + Lightweight UX Upgrades**.

This is the strongest fit for the request and the current codebase:
- It respects the decision to keep modal dialogs.
- It improves usability without inventing new workflows.
- It produces a more cohesive product language across Meta and Google.
- It can cleanly absorb existing design-system debt already visible in `meta-unified-settings.tsx` and `meta-page-permissions-modal.tsx`.

## Proposed Experience
### Shared modal shell
Both Meta and Google should use the same structural frame:
1. **Stronger header block**
   - platform mark + title + one-sentence utility framing
   - compact status chip or summary strip
   - close action aligned with the brutalist button/icon language
2. **Summary rail near the top**
   - small, high-contrast summary cards or badges showing what is currently selected/enabled
   - this gives immediate orientation before the user scrolls into controls
3. **Scrollable content body**
   - grouped into distinct sections with visible labels and spacing rhythm
   - each section should read like a work surface, not a generic form list
4. **Sticky footer**
   - persistent close / disconnect / supportive action area
   - keeps destructive action visible but separated from primary configuration controls

### Visual direction
- Hard borders, visible shadows, and sharper contrast, but still rounded enough to match the current product.
- `font-display` and uppercase micro-labels should be used selectively for section framing and summary chips, not everywhere.
- Use platform accents as a secondary cue:
  - Meta can lean on coral + ink + paper with portfolio/status emphasis.
  - Google can lean on paper + ink + product-icon accents with more structured selection blocks.
- Avoid raw `slate`, `indigo`, and similar legacy utility classes on changed surfaces.

### Motion direction
- Keep motion short and spatially clear.
- Modal entry should stay scale + rise, but feel slightly crisper.
- Sticky bars and alerts should animate with subtle opacity/translate changes only.
- No decorative motion that slows down frequent settings work.

## Platform-Specific UX Recommendations
### Meta
- Treat Business Portfolio selection as the first-class control block, not just another field.
- Give the stored/active portfolio state a stronger visual treatment so users can see what is driving asset management.
- Reframe individual asset types as compact brutalist cards with clearer enabled/disabled contrast.
- Move permission-limit actions and warnings into dedicated inline sub-panels so they read as controlled options, not loose links.
- Bring the nested page-permissions modal into the same system so it looks like a child surface of the parent modal rather than a stylistic outlier.

### Google
- Preserve the product matrix mental model, but present each product as a more deliberate selection block.
- Make the account selector area feel distinct from the enable toggle area.
- Keep `Select all` / `Deselect all`, but visually upgrade them into utility controls that feel native to the shell.
- Promote stale-account warnings and permission escalation toggles so they are easy to see without visually drowning the card.
- Use clearer empty states for products with no available accounts.

## Shared Content Modules
These are the reusable building blocks the implementation should likely aim for:
- `ManageAssetsModalShell`
  - backdrop
  - header
  - optional summary strip
  - scroll container
  - sticky footer
- `SettingsSectionCard`
  - title
  - microcopy / helper text
  - content body
- `SelectionRowCard`
  - enabled state
  - icon
  - label
  - main control area
  - warning or helper slot
- `InlineWarningPanel`
  - destructive, caution, or informational variants using design tokens

These do not need to become universally exported primitives immediately, but implementation should avoid duplicating the shell structure twice.

## Accessibility and Usability Requirements
- Preserve keyboard focus trapping and escape-to-close behavior already implied by the modal structure.
- Keep labels visible for all inputs and toggles.
- Maintain strong contrast for status, warning, and selected states.
- Sticky footer and header must not reduce usable content area excessively on smaller screens.
- Mobile layouts should stack cleanly and avoid clipped selectors or hidden warnings.

## Testing and Verification Implications
### Test updates likely required
- Existing behavior tests for Meta and Google settings components will need updates if markup and labels shift.
- The nested Meta page permissions modal should get the same token cleanup as the parent modal.
- Design tests should continue enforcing token use and may need expansion for newly introduced shell components.

### Verification expectations
- Run focused component tests for:
  - Meta settings
  - Google settings
  - page permissions modal
- Use browser-based QA on the Connections page to verify:
  - modal open/close behavior
  - scroll behavior
  - sticky header/footer behavior
  - mobile and desktop layout quality

## Scope Boundaries
### In scope
- Connections-page Meta and Google `Manage Assets` modal shell redesign
- Lightweight UX improvements inside those modals
- Token and styling cleanup on touched modal surfaces
- Nested Meta permissions modal alignment if required for visual consistency
- Small component extraction if it reduces duplication

### Out of scope
- New platform settings modals outside Meta and Google
- Backend contract changes
- Full redesign of the page card grid or platform connection cards
- Heavy workflow redesign such as step-based settings flows

## Open Questions
1. Should the sticky footer include only `Done` and `Disconnect`, or also reflect save/sync state explicitly when autosave is running?
2. Should the summary strip show only enabled counts, or also selected account names for the most important configured items?
3. Do we want the nested Meta permissions modal to inherit the exact shared shell or remain a smaller related variant?

## Validation Checklist
- Recommendation matches the confirmed decision to keep modal dialogs.
- The proposed direction is stronger than a cosmetic repaint but remains lightweight in UX scope.
- Meta and Google stay distinct in content while sharing one system-level shell.
- The plan addresses current design-token drift and not just layout preference.
- Open questions are small enough to resolve during planning rather than blocking discovery.

## Handoff to Workflow Plan
Next skill: `workflow-plan`

Planning should focus on:
- shared shell extraction versus local composition strategy
- TDD-first changes for modal shell and affected settings components
- design-system cleanup on Meta, Google, and nested permissions modal surfaces
- responsive behavior and sticky-region implementation details
- browser QA and screenshot-based polish criteria for the changed modals
