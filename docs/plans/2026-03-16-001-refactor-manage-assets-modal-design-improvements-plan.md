---
title: Manage Assets Modal Design Improvements
type: refactor
status: completed
date: 2026-03-16
origin: docs/brainstorms/2026-03-15-connections-manage-assets-modal-revamp-brainstorm.md
---

# Manage Assets Modal Design Improvements

## Overview

Implement design improvements to the Manage Assets modal system based on design assessment findings and the March 15 brainstorm. This plan structures changes as atomic commits for safe rollback.

## Problem Statement

The Manage Assets modal has several design issues that undermine the brutalist aesthetic and accessibility:

1. **HIGH**: `ManageAssetsStatusPanel` uses `--acid` for warning tone, violating accessibility guidelines (1.4:1 contrast)
2. **MEDIUM**: `ProductCard` disabled state loses brutalist DNA (no shadow, generic border)
3. **MEDIUM**: No signature brutalist moment - all elements have similar shadow treatment
4. **LOW**: Checkbox styling is generic, not aligned with brutalist aesthetic
5. **LOW**: Information density is growing without progressive disclosure patterns

## Proposed Solution

Implement fixes in priority order as atomic commits. Each commit is independently deployable and rollback-safe.

---

## Atomic Commits (5 Total)

### Commit 1: Fix Warning Panel Accessibility (HIGH)

**File**: `apps/web/src/components/manage-assets-ui.tsx`

**Current code (line 69-71)**:
```tsx
const toneClasses = {
  default: 'border-border bg-paper text-ink',
  warning: 'border-acid/40 bg-acid/10 text-ink',  // ❌ VIOLATION
  danger: 'border-coral/40 bg-coral/10 text-ink',
} as const;
```

**Change to**:
```tsx
const toneClasses = {
  default: 'border-border bg-paper text-ink',
  warning: 'border-warning/40 bg-warning/10 text-ink',  // ✅ ACCESSIBLE
  danger: 'border-coral/40 bg-coral/10 text-ink',
} as const;
```

**Rationale**: Per DESIGN_SYSTEM.md v1.3.0, `--acid` has 1.4:1 contrast ratio and must never be used for text or status indicators. `--warning` (#B45309) has 5.2:1 contrast.

**Test update required**: `apps/web/src/components/__tests__/manage-assets-modal-shell.design.test.tsx`

**Acceptance Criteria**:
- [x] Warning tone uses `--warning` token instead of `--acid`
- [x] Design test asserts no `acid` in status/warning contexts
- [x] Visual regression test passes

---

### Commit 2: Restore Brutalist DNA in ProductCard Disabled State (MEDIUM)

**File**: `apps/web/src/components/google-unified-settings.tsx`

**Current code (line 494-496)**:
```tsx
className={cn(
  'rounded-[1rem] border p-4 transition-all',
  enabled ? 'border-black bg-card shadow-brutalist-sm' : 'border-border bg-paper/80 opacity-75'
)}
```

**Change to**:
```tsx
className={cn(
  'rounded-[1rem] border-2 p-4 transition-all',
  enabled
    ? 'border-black bg-card shadow-brutalist-sm'
    : 'border-black/30 bg-paper shadow-brutalist-sm/50 opacity-60'
)}
```

**Rationale**: Disabled state should maintain brutalist language (hard border, shadow) with reduced intensity, not switch to generic Tailwind defaults.

**Acceptance Criteria**:
- [x] Disabled ProductCard retains `border-2` (not `border`)
- [x] Disabled ProductCard retains shadow (at 50% opacity)
- [x] Border color is black-derived, not `border-border`
- [x] Opacity reduced to 60% for clearer disabled state

---

### Commit 3: Add Signature Brutalist Moment - Section Cards (MEDIUM)

**File**: `apps/web/src/components/manage-assets-ui.tsx`

**Current `ManageAssetsSectionCard` (line 24-30)**:
```tsx
className={cn(
  'overflow-hidden rounded-[1.1rem] border-2 border-black bg-card shadow-brutalist-sm',
  className
)}
```

**Enhancement - Add hover lift for section cards as the brutalist anchor**:
```tsx
className={cn(
  'overflow-hidden rounded-[1.1rem] border-2 border-black bg-card shadow-brutalist-sm',
  'transition-all duration-150',
  'hover:shadow-brutalist hover:-translate-y-0.5',
  className
)}
```

**File**: `apps/web/src/components/manage-assets-modal-shell.tsx`

**Reduce modal shell shadow to let section cards be the anchor**:
```tsx
// Line 47: Change from shadow-brutalist-lg to shadow-brutalist
className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.25rem] border-2 border-black bg-card shadow-brutalist sm:max-h-[90vh]"
```

**Rationale**: Per design system: "One brutalist element per view." Section cards as interactive work surfaces should be the anchor; modal shell should be supporting.

**Acceptance Criteria**:
- [x] Section cards have hover lift effect (`-translate-y-0.5`)
- [x] Section cards have hover shadow growth (`shadow-brutalist`)
- [x] Modal shell shadow reduced to `shadow-brutalist`
- [x] ProductCard enabled state keeps `shadow-brutalist-sm` (not competing)

---

### Commit 4: Add Brutalist Checkbox Variant (LOW)

**File**: Create `apps/web/src/components/ui/brutalist-checkbox.tsx`

**New component**:
```tsx
'use client';

import { cn } from '@/lib/utils';

interface BrutalistCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function BrutalistCheckbox({
  checked,
  onChange,
  label,
  disabled = false,
  className,
  id,
}: BrutalistCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-center gap-3 cursor-pointer',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      <div className="relative flex h-5 w-5 items-center justify-center">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={cn(
          'h-5 w-5 border-2 border-black bg-paper',
          'peer-focus:ring-2 peer-focus:ring-coral peer-focus:ring-offset-2',
          'peer-checked:bg-coral peer-checked:border-black',
          'transition-colors duration-100'
        )} />
        {checked && (
          <svg
            className="absolute h-3 w-3 text-white pointer-events-none"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M2 6L5 9L10 3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {label && (
        <span className="text-sm font-medium text-ink">{label}</span>
      )}
    </label>
  );
}
```

**Update ProductCard to use BrutalistCheckbox**:
```tsx
// In google-unified-settings.tsx ProductCard, replace:
<input
  type="checkbox"
  checked={enabled}
  onChange={(e) => onToggle(e.target.checked)}
  aria-label={`Enable ${label}`}
  className="mt-1 h-5 w-5 rounded border-border text-coral focus:ring-coral"
/>

// With:
<BrutalistCheckbox
  checked={enabled}
  onChange={onToggle}
  aria-label={`Enable ${label}`}
/>
```

**Acceptance Criteria**:
- [x] BrutalistCheckbox component created with hard corners
- [x] Uses `border-2 border-black` instead of `rounded border-border`
- [x] Coral fill when checked
- [x] Custom checkmark SVG
- [x] Focus ring uses coral
- [x] ProductCard uses BrutalistCheckbox

---

### Commit 5: Improve Empty State Messaging (LOW)

**File**: `apps/web/src/components/google-unified-settings.tsx`

**Add empty state in ProductCard when no accounts available**:

```tsx
{enabled && showAccountSelector && accounts.length === 0 && (
  <div className="rounded-[1rem] border border-coral/40 bg-coral/5 px-4 py-3">
    <p className="text-sm text-coral font-medium">
      No accounts available
    </p>
    <p className="text-xs text-muted-foreground mt-1">
      Connect your {label} account first to select assets.
    </p>
  </div>
)}
```

**Also add loading skeleton**:
```tsx
{isLoading && (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="h-20 rounded-[1rem] border-2 border-black/10 bg-paper animate-pulse"
      />
    ))}
  </div>
)}
```

**Acceptance Criteria**:
- [x] Empty state shows clear message with coral accent
- [x] Empty state includes actionable guidance
- [ ] Loading skeleton uses brutalist shapes (deferred - no loading state in current implementation)
- [ ] Skeleton respects `prefers-reduced-motion` (deferred)

---

## Testing Strategy

### Per-Commit Tests

Each commit should have its tests written BEFORE implementation (TDD):

**Commit 1 Tests**:
```tsx
// manage-assets-ui.test.tsx
describe('ManageAssetsStatusPanel', () => {
  it('should use --warning token for warning tone, not --acid', () => {
    render(<ManageAssetsStatusPanel tone="warning" label="Test" title="Test" />);
    const panel = screen.getByRole('region');
    expect(panel.className).toContain('warning');
    expect(panel.className).not.toContain('acid');
  });
});
```

**Commit 2 Tests**:
```tsx
// google-unified-settings.test.tsx
describe('ProductCard disabled state', () => {
  it('should retain brutalist shadow when disabled', () => {
    render(<ProductCard enabled={false} {...defaultProps} />);
    const card = screen.getByRole('article');
    expect(card.className).toContain('shadow-brutalist');
    expect(card.className).toContain('border-black');
  });
});
```

**Commit 3 Tests**:
```tsx
// manage-assets-ui.test.tsx
describe('ManageAssetsSectionCard hover', () => {
  it('should have hover lift effect', () => {
    render(<ManageAssetsSectionCard title="Test">Content</ManageAssetsSectionCard>);
    const card = screen.getByRole('region');
    expect(card.className).toContain('hover:-translate-y');
    expect(card.className).toContain('hover:shadow-brutalist');
  });
});
```

### Design System Compliance Tests

Update `manage-assets-modal-shell.design.test.tsx`:
```tsx
it('should not use acid color for status or warning contexts', () => {
  const code = readComponent();
  expect(code).not.toMatch(/acid.*warning|warning.*acid/);
});

it('should use warning token for warning tone in StatusPanel', () => {
  const statusPanelCode = readFileSync(
    resolve(__dirname, '../manage-assets-ui.tsx'),
    'utf-8'
  );
  expect(statusPanelCode).toMatch(/warning.*border-warning/);
  expect(statusPanelCode).not.toMatch(/warning.*border-acid/);
});
```

---

## Rollback Strategy

Each commit is atomic and can be individually reverted:

```bash
# Rollback specific commit
git revert <commit-sha>

# Or rollback all changes
git reset --hard origin/main
```

**Commit order matters**: Commits 1-3 are independent and can be rolled back individually. Commit 4 depends on Commit 2's styling patterns. Commit 5 is independent.

---

## Visual Verification

After each commit, verify visually using the dev-browser skill:

1. Navigate to `/connections`
2. Click "Manage Assets" on Google or Meta card
3. Verify the specific change
4. Take screenshot for comparison

**Key visual checkpoints**:
- Commit 1: Warning panel should be amber, not lime-green
- Commit 2: Disabled products should still look "designed"
- Commit 3: Hover over section cards should lift
- Commit 4: Checkboxes should have hard corners, coral fill
- Commit 5: Empty states should feel intentional

---

## System-Wide Impact

### Interaction Graph
- Modal shell → Section cards → Product cards → Status panels
- Hover on section card does NOT conflict with hover on ProductCard (nested hover avoided per design system)

### Error Propagation
- StatusPanel tone changes are visual only, no data flow impact
- Checkbox changes are drop-in replacements, same onChange API

### State Lifecycle
- No state changes, only visual refinements
- Loading/empty states are additive

### API Surface Parity
- `ManageAssetsStatusPanel` tone prop values unchanged
- `BrutalistCheckbox` API mirrors native checkbox for easy swap

---

## Dependencies & Risks

**Dependencies**:
- DESIGN_SYSTEM.md v1.3.0 for color token definitions
- Existing `shadow-brutalist*` utilities in Tailwind config
- `cn()` utility for class merging

**Risks**:
- **Low**: Color token changes may affect other components using StatusPanel
  - Mitigation: Search codebase for `tone="warning"` usage
- **Low**: Checkbox replacement may affect form submission
  - Mitigation: Maintain same `checked` and `onChange` API

---

## Success Metrics

1. **Accessibility**: Warning panel passes WCAG AA contrast (4.5:1+)
2. **Visual consistency**: Disabled states maintain brutalist language
3. **Hierarchy**: Clear visual anchor (section cards) vs supporting elements
4. **Polish**: Checkbox styling matches design system

---

## Sources & References

### Origin
- **Brainstorm document**: [docs/brainstorms/2026-03-15-connections-manage-assets-modal-revamp-brainstorm.md](docs/brainstorms/2026-03-15-connections-manage-assets-modal-revamp-brainstorm.md)
  - Key decisions carried forward: Shared modal shell, brutalist intensity level 2, clearer section hierarchy, token cleanup

### Internal References
- Design system: [apps/web/DESIGN_SYSTEM.md](apps/web/DESIGN_SYSTEM.md)
- Modal shell: [apps/web/src/components/manage-assets-modal-shell.tsx](apps/web/src/components/manage-assets-modal-shell.tsx)
- UI components: [apps/web/src/components/manage-assets-ui.tsx](apps/web/src/components/manage-assets-ui.tsx)
- Google settings: [apps/web/src/components/google-unified-settings.tsx](apps/web/src/components/google-unified-settings.tsx)
- Button variants: [apps/web/src/components/ui/button.tsx](apps/web/src/components/ui/button.tsx)

### Design Principles Applied
- "One brutalist element per view" — Section cards as anchor
- "Boldness through restraint" — Modal shell reduced to support
- "Warning amber has 5.2:1 contrast" — Acid restricted to decorative only
