# Connections Page — Design System Migration Plan

**Goal:** Migrate the entire Connections page (`/connections`) and its child components to match the Agency Access Platform design system (Acid Brutalism). Reference: `apps/web/DESIGN_SYSTEM.md` and `apps/web/src/app/globals.css`.

**Scope:** Main page, `PlatformCard`, Meta/Google settings modals, `ManualInvitationModal`, and any inline alerts/empty states on the page.

---

## Current State vs Design System

| Area | Current | Design system target |
|------|---------|----------------------|
| **Page background** | `bg-slate-50` | `bg-paper` or `bg-background` (tokens) |
| **Typography** | `text-slate-900`, `text-slate-600`, `text-2xl font-semibold` | `text-ink`, `text-muted-foreground`, `font-display` for headings; type scale (H1/H2/body) |
| **Cards** | `bg-white border border-slate-200 rounded-lg shadow-sm` | `clean-card` or `brutalist-card`; shadcn `Card` where structure fits |
| **Primary actions** | Raw `<button>` with `bg-slate-900` / indigo | `Button` component with `variant="primary"` (coral) or `brutalist-rounded` (one per view) |
| **Links / secondary actions** | `text-indigo-600`, `text-slate-500` | `text-coral` for primary links, `text-muted-foreground` for secondary |
| **Success/error/warning alerts** | `bg-green-50`, `bg-red-50`, `bg-yellow-50` + slate borders | Semantic tokens: teal for success, coral/error for errors, accent for warning; optional `border-2 border-black` + `shadow-brutalist-sm` for brutalist alerts |
| **Modals** | `bg-slate-900/50`, `shadow-2xl`, `border-slate-200` | Overlay: `bg-ink/50` or similar; panel: `shadow-brutalist-lg`, `border-2 border-black`, `rounded-lg`; header borders `border-border` |
| **Loading / empty** | `text-slate-400`, `text-indigo-600` (Suspense) | `text-muted-foreground`, coral for primary loading accent |
| **Animations** | Framer Motion only (modals) | Add optional `reveal-element reveal-up` + stagger for sections; keep Framer for modals if desired |
| **One brutalist hero** | None | One clear brutalist element per view (e.g. featured section or primary CTA) |

---

## Phase 1: Page Shell and Layout

**File:** `apps/web/src/app/(authenticated)/connections/page.tsx`

1. **Background and container**
   - Replace `bg-slate-50` with `bg-paper` or `bg-background` (align with dashboard: dashboard uses `bg-gray-100`; design system prefers token-based. Use `bg-paper` for consistency with DESIGN_SYSTEM.)
   - Keep `max-w-7xl mx-auto`; ensure padding uses design system spacing (`p-6 md:p-8`).

2. **Page header**
   - Replace `text-2xl font-semibold text-slate-900` with `text-2xl font-semibold text-ink font-display` (or `font-dela` for hero if desired; design system uses dela for hero, display for section headings).
   - Replace `text-sm text-slate-600 mt-1` with `text-sm text-muted-foreground mt-1`.

3. **Suspense fallback**
   - Replace `text-indigo-600` with `text-coral` for the loading spinner to match design system primary accent.

4. **Section structure**
   - Add optional reveal animations: wrap “Recommended” and “Other” sections in `reveal-element reveal-up` with `stagger-1` / `stagger-2` for cards (ensure `html.animations-ready` is used per globals.css).
   - Use consistent section spacing: e.g. `mb-10` for “Recommended”, keep `gap-4` or use `gap-6` for grid per design system.

**Deliverable:** Page shell and header use design tokens and typography; loading state uses coral; optional reveal classes in place.

---

## Phase 2: Alerts, Empty State, and Loading States

**File:** `apps/web/src/app/(authenticated)/connections/page.tsx`

1. **Loading agency**
   - Replace `text-slate-400` and `text-slate-600` with `text-muted-foreground`.
   - Spinner: keep `Loader2`; color `text-coral` for consistency with primary actions.

2. **Agency not found (onboarding CTA)**
   - Replace `bg-yellow-50 border border-yellow-200` with design-system warning: e.g. `bg-accent border-2 border-black shadow-brutalist-sm` and use `text-ink` for heading, `text-muted-foreground` for body.
   - Replace raw button with `<Button variant="primary">` or `brutalist-rounded` for single hero CTA; use coral.

3. **Success message**
   - Replace `bg-green-50 border border-green-200` with teal success: e.g. `bg-teal/10 border border-teal/30` or use semantic success token if defined; icon `text-teal`; text `text-ink` or `text-foreground`.

4. **Error messages (inline + query error)**
   - Replace `bg-red-50 border border-red-200` with error semantic: e.g. `bg-destructive/10 border border-destructive/30` or coral for brand consistency; icon and text use same semantic.

5. **Empty state (no platforms)**
   - Replace inline empty block with shared `<EmptyState>` component from `@/components/ui` (title, description, optional action).
   - If EmptyState still uses slate/indigo, migrate EmptyState in Phase 4 and use it here.

**Deliverable:** All alerts and empty/loading states use design tokens and, where applicable, shared `Button` and `EmptyState`.

---

## Phase 3: PlatformCard Component

**File:** `apps/web/src/components/ui/platform-card.tsx`

1. **Card container**
   - Replace `bg-white border border-slate-200 rounded-lg hover:shadow-md` with:
     - **Default variant:** `clean-card` (subtle shadow, hover lift) or keep `rounded-lg` and use `border-border` + `shadow-brutalist-sm` for a light brutalist touch.
     - **Featured variant:** Use `brutalist-card` or `border-2 border-black shadow-brutalist` so the “Recommended” section has one clear brutalist element per view (design system: one brutalist per view).
   - Ensure touch targets: buttons inside card use `min-h-[44px]` where applicable.

2. **Typography**
   - Replace `text-slate-900` with `text-ink` for platform name.
   - Replace `text-slate-600` with `text-muted-foreground` for connected email and secondary text.

3. **Status pill (expired/invalid/warning)**
   - Replace ad-hoc `bg-red-100 text-red-800` / `bg-yellow-100 text-yellow-800` with:
     - Use shared `StatusBadge` or `HealthBadge` from `@/components/ui` if status values map (e.g. expired → HealthBadge health="expired"); otherwise define small variant that uses design tokens (e.g. `bg-destructive/10 text-destructive`, `bg-warning/10 text-warning` or teal/coral tokens).

4. **Actions**
   - “Manage Assets”: replace `text-indigo-600 hover:text-indigo-800` with `text-coral hover:text-coral/90` (primary link).
   - “Edit Email” / “Disconnect”: use `text-muted-foreground hover:text-foreground`; danger on hover for Disconnect: `hover:text-destructive`.
   - “Connect” button: replace raw `<button>` with `<Button variant="primary" size="md">` (coral). If this is the single primary CTA on the card, keep one brutalist button for the whole page (e.g. only on the first recommended card) per design system guideline.

5. **Padding and spacing**
   - Keep `p-6` / `p-8` for featured; use `gap-4` for internal spacing per design system.

**Deliverable:** PlatformCard uses design tokens, clean-card/brutalist-card, shared Button and StatusBadge/HealthBadge where appropriate; link and button styles aligned with design system.

---

## Phase 4: Meta and Google Unified Settings Modals

**Files:** Inline modal markup in `apps/web/src/app/(authenticated)/connections/page.tsx` (Meta and Google modals).

1. **Overlay**
   - Replace `bg-slate-900/50 backdrop-blur-sm` with `bg-ink/50` or `bg-black/50` and keep `backdrop-blur-sm` if desired.

2. **Modal panel**
   - Replace `bg-white rounded-lg shadow-2xl` with `bg-white rounded-lg shadow-brutalist-lg border-2 border-black` (align with platform-connection-modal and schedule-demo-modal).

3. **Header**
   - Replace `border-slate-200 bg-slate-50` with `border-border bg-muted/10` or `bg-paper`; replace `text-slate-900` with `text-ink`; ensure `font-display` or `font-semibold` for title.

4. **Close button**
   - Replace `hover:bg-slate-200` and `text-slate-500` with `hover:bg-muted` and `text-muted-foreground`; ensure focus ring (`focus:ring-2 focus:ring-ring`) and `aria-label="Close modal"`.

5. **Content area**
   - Keep `p-6`; ensure `MetaUnifiedSettings` / `GoogleUnifiedSettings` children do not introduce slate/indigo (audit in Phase 5 if needed).

**Deliverable:** Both modals use design tokens, brutalist modal styling, and accessible close button.

---

## Phase 5: ManualInvitationModal

**File:** `apps/web/src/components/manual-invitation-modal.tsx`

1. **Modal container and overlay**
   - Apply same overlay and panel rules as Phase 4: `bg-ink/50`, panel `shadow-brutalist-lg border-2 border-black rounded-lg`.

2. **Internal typography and form**
   - Replace any `text-slate-*`, `bg-slate-*`, `border-slate-*` with `text-ink`, `text-muted-foreground`, `bg-paper`, `border-border`, etc.

3. **Buttons**
   - Primary submit: use `<Button variant="primary">` or `brutalist-rounded`. Cancel/close: use `Button variant="ghost"` or `secondary`.

4. **Inputs**
   - Use design system input styling: `border-border focus:ring-2 focus:ring-ring`; optional brutalist input for consistency: `border-2 border-black rounded-none shadow-brutalist-sm focus:shadow-brutalist`.

**Deliverable:** ManualInvitationModal matches modal and form patterns from design system.

---

## Phase 6: Shared Components Used on Connections (Optional but Recommended)

**Files:** `apps/web/src/components/ui/empty-state.tsx`, `apps/web/src/components/ui/health-badge.tsx` (and status-badge if needed).

1. **EmptyState**
   - Replace `bg-slate-100`, `text-slate-400`, `text-slate-900`, `text-slate-600`, `bg-indigo-600`, `hover:bg-indigo-700` with design tokens: `bg-muted/20`, `text-muted-foreground`, `text-ink`, `Button variant="primary"` (coral) for action.

2. **HealthBadge**
   - Replace `emerald-100`, `yellow-100`, `red-100`, `gray-100` with semantic or design-system tokens (e.g. teal for healthy, coral/destructive for expired, muted for unknown) so Connection page status pills and badges are consistent.

**Deliverable:** EmptyState and HealthBadge (and StatusBadge if touched) use design tokens; Connections page benefits from these updates wherever it uses them.

---

## Phase 7: Verification and Cleanup

1. **Visual pass**
   - Run app; review Connections page and all modals (Meta, Google, Manual Invitation) in light mode.
   - Confirm one brutalist element per view (e.g. recommended section or primary CTA), and that coral/teal/ink/paper usage matches design system.

2. **Accessibility**
   - Focus order, focus rings, and `aria-label` on icon-only buttons (e.g. modal close).
   - Color contrast: ensure text on coral/teal meets WCAG AA (design system specifies 4.5:1).

3. **Responsive and touch**
   - Confirm touch targets ≥ 44px; layout at breakpoints sm/md/lg.

4. **Tests**
   - Run existing Connections page tests: `apps/web/src/app/(authenticated)/connections/__tests__/page.test.tsx`.
   - If tests assert on class names (e.g. slate, indigo), update expectations to design-system classes.
   - Add or run design-system tests (e.g. no soft shadows, use of brutalist or clean-card) if the project has a design-system test pattern (see `apps/web/src/test/utils/design-system.ts`).

5. **Lint/typecheck**
   - `npm run lint` and `npm run typecheck` from repo root.

**Deliverable:** No regressions; tests and a11y pass; design system compliance documented or asserted.

---

## Implementation Order Summary

| Phase | Focus | Dependency |
|-------|--------|------------|
| 1 | Page shell, header, layout, Suspense | None |
| 2 | Alerts, empty state, loading states | None (EmptyState optional) |
| 3 | PlatformCard | None |
| 4 | Meta/Google modals (inline in page) | None |
| 5 | ManualInvitationModal | None |
| 6 | EmptyState, HealthBadge (shared) | Optional; improves Phase 2/3 |
| 7 | Verification, tests, a11y | All above |

Recommended sequence: **1 → 2 → 3 → 4 → 5 → 6 → 7**. Phase 6 can be done in parallel with 4/5 or after 3 if EmptyState/HealthBadge are used on Connections.

---

## Files to Touch (Checklist)

- [ ] `apps/web/src/app/(authenticated)/connections/page.tsx` (Phases 1, 2, 4)
- [ ] `apps/web/src/components/ui/platform-card.tsx` (Phase 3)
- [ ] `apps/web/src/components/manual-invitation-modal.tsx` (Phase 5)
- [ ] `apps/web/src/components/ui/empty-state.tsx` (Phase 6)
- [ ] `apps/web/src/components/ui/health-badge.tsx` (Phase 6)
- [ ] `apps/web/src/app/(authenticated)/connections/__tests__/page.test.tsx` (Phase 7)
- [ ] Optional: `MetaUnifiedSettings` / `GoogleUnifiedSettings` if they use slate/indigo (audit during Phase 4).

---

## Design System References

- **Tokens:** `apps/web/src/app/globals.css` (--ink, --paper, --coral, --teal, --acid, --electric; .brutalist-card, .clean-card, .shadow-brutalist*, .reveal-element).
- **Components:** `apps/web/src/components/ui/button.tsx`, `apps/web/src/components/ui/card.tsx`, `apps/web/DESIGN_SYSTEM.md`.
- **Patterns:** Dashboard page for authenticated layout and token usage; `platform-connection-modal.tsx` and `schedule-demo-modal.tsx` for modal styling.
