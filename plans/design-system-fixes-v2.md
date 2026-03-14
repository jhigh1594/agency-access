# Implementation Spec: Design System Token Migration (Revised)

> **Methodology:** TDD — all referenced tests already exist and are currently FAILING.
> Implementation makes them pass. Verify with `cd apps/web && npm test`.

---

## Pre-flight: What's Already Done (DO NOT RE-IMPLEMENT)

The following issues from the original spec are **already fixed** and their tests **already pass**.
Do not touch these files:

| Component | Status | Evidence |
|---|---|---|
| `upgrade-modal.tsx` | ✅ Done | Uses `m`, `bg-card`, `bg-paper`, no gray/white |
| `trial-banner.tsx` | ✅ Done | Uses `bg-coral` (expired), `bg-warning` (active) |
| `dashboard/page.tsx` "Agency Setup" block | ✅ Done | Uses `bg-warning/10`, `text-warning` |
| `stat-card.tsx` | ✅ Done | Uses `text-foreground`, `text-teal`, `text-coral` |
| `platform-icon.tsx` | ✅ Done | Uses `bg-muted/30`, `text-muted-foreground` |
| `clients/page.tsx` card hover | ✅ Done | No double-negative translate or rgb(var()) |

---

## Issue #1: Onboarding Files — Full Token Migration (CRITICAL)

### Scope & Actual Counts

All screen files live under `components/onboarding/screens/`, not `components/onboarding/`.

| File | gray-* | indigo-* | green-* | blue-* | red-* | amber-* | emerald-* |
|---|---|---|---|---|---|---|---|
| `unified-wizard.tsx` | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| `screens/welcome-screen.tsx` | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| `screens/agency-profile-screen.tsx` | 11 | 7 | 6 | 0 | 0 | 0 | 0 |
| `screens/client-selection-screen.tsx` | 12 | 11 | 3 | 0 | 0 | 0 | 0 |
| `screens/team-invite-screen.tsx` | 16 | 7 | 0 | 0 | 2 | 4 | 0 |
| `screens/final-success-screen.tsx` | 8 | 0 | 0 | 0 | 0 | 0 | 0 |
| `screens/success-link-screen.tsx` | 3 | 0 | 1 | 7 | 0 | 0 | 0 |
| `success-link-card.tsx` | 15 | 2 | 5 | 0 | 0 | 0 | 1 |
| `opinionated-input.tsx` | 7 | 4 | 4 | 0 | 5 | 0 | 0 |
| **TOTAL** | **78** | **31** | **19** | **7** | **7** | **4** | **1** |

### Tests (RED — already exist, currently failing)

File: `components/onboarding/screens/__tests__/onboarding-screens.design.test.tsx`

Lines 383-433 already contain failing tests:
- `"All Onboarding Screens - No Raw gray-* Colors"` — 6 screen files + success-link-card + opinionated-input
- Lines 424-433: `"UnifiedWizard - No Raw gray-* Colors"` (in `__tests__/unified-wizard.design.test.tsx`)

**New tests needed** (add to `onboarding-screens.design.test.tsx`):

```ts
describe('All Onboarding Screens - No Raw indigo-* Colors', () => {
  const screensWithIndigo = [
    'agency-profile-screen.tsx',
    'client-selection-screen.tsx',
    'team-invite-screen.tsx',
  ];

  for (const screen of screensWithIndigo) {
    it(`${screen} should not contain indigo- colors`, () => {
      const fs = require('fs');
      const code = fs.readFileSync(
        `/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/screens/${screen}`,
        'utf-8'
      );
      expect(code).not.toContain('indigo-');
    });
  }

  it('success-link-card.tsx should not contain indigo- colors', () => {
    const fs = require('fs');
    const code = fs.readFileSync(
      '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/success-link-card.tsx',
      'utf-8'
    );
    expect(code).not.toContain('indigo-');
  });
});

describe('All Onboarding Screens - No Other Raw Colors', () => {
  const rawColors = ['green-', 'blue-', 'red-', 'amber-', 'emerald-'];

  const fileMap: Record<string, string> = {
    'agency-profile-screen.tsx': 'screens/agency-profile-screen.tsx',
    'client-selection-screen.tsx': 'screens/client-selection-screen.tsx',
    'team-invite-screen.tsx': 'screens/team-invite-screen.tsx',
    'success-link-screen.tsx': 'screens/success-link-screen.tsx',
    'success-link-card.tsx': '../success-link-card.tsx',  // relative from screens/__tests__
    'opinionated-input.tsx': '../opinionated-input.tsx',
  };

  for (const [name, relPath] of Object.entries(fileMap)) {
    it(`${name} should not contain raw green/blue/red/amber/emerald colors`, () => {
      const fs = require('fs');
      const base = '/Users/jhigh/agency-access-platform/apps/web/src/components/onboarding/';
      const code = fs.readFileSync(base + relPath.replace('../', ''), 'utf-8');
      for (const color of rawColors) {
        expect(code).not.toContain(color);
      }
    });
  }
});
```

### Implementation (GREEN)

#### Gray replacement mapping

| Raw Tailwind | Design Token |
|---|---|
| `text-gray-900` | `text-ink` |
| `text-gray-700` | `text-foreground` |
| `text-gray-600` | `text-muted-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `text-gray-400` | `text-muted-foreground` |
| `bg-gray-50` | `bg-paper` |
| `bg-gray-100` | `bg-muted/20` |
| `bg-gray-200` | `bg-muted/30` |
| `border-gray-200` | `border-border` |
| `border-gray-300` | `border-border` |
| `hover:bg-gray-100` | `hover:bg-muted/10` |
| `hover:bg-gray-200` | `hover:bg-muted/20` |
| `hover:border-gray-300` | `hover:border-border` |
| `disabled:bg-gray-300` | `disabled:bg-muted/30` |
| `hover:text-gray-900` | `hover:text-ink` |

#### Indigo replacement mapping

| Raw Tailwind | Design Token |
|---|---|
| `bg-indigo-600` | `bg-coral` |
| `hover:bg-indigo-700` | `hover:bg-coral/90` |
| `bg-indigo-50` | `bg-coral/10` |
| `bg-indigo-100` | `bg-coral/15` |
| `text-indigo-900` | `text-ink` |
| `text-indigo-600` | `text-coral` |
| `border-indigo-600` | `border-coral` |
| `focus:border-indigo-500` | `focus:border-coral` |
| `focus:ring-indigo-200` | `focus:ring-coral/30` |
| `ring-indigo-500` | `ring-coral` |

#### Green/success replacement mapping

| Raw Tailwind | Design Token | Context |
|---|---|---|
| `bg-green-50` | `bg-teal/10` | Success callout bg |
| `border-green-200` | `border-teal/30` | Success callout border |
| `text-green-600` | `text-teal` | Success icon/step indicator |
| `text-green-700` | `text-teal` | Success detail text |
| `text-green-900` | `text-ink` | Success heading |
| `text-green-500` | `text-teal` | Checkmark icons |
| `bg-green-500` | `bg-teal` | Success circle bg |
| `border-green-300` | `border-teal/40` | Valid input border |
| `focus:border-green-500` | `focus:border-teal` | Valid input focus |
| `focus:ring-green-200` | `focus:ring-teal/30` | Valid input ring |
| `from-green-50` | `from-teal/10` | Gradient start |
| `to-emerald-50` | `to-teal/5` | Gradient end |

#### Blue replacement mapping (success-link-screen only)

| Raw Tailwind | Design Token |
|---|---|
| `bg-blue-50` | `bg-electric/10` |
| `border-blue-200` | `border-electric/30` |
| `text-blue-900` | `text-ink` |
| `text-blue-800` | `text-foreground` |
| `text-blue-600` | `text-electric` |

#### Red/error replacement mapping

| Raw Tailwind | Design Token |
|---|---|
| `text-red-500` | `text-coral` |
| `hover:text-red-500` | `hover:text-coral` |
| `hover:bg-red-50` | `hover:bg-coral/10` |
| `border-red-300` | `border-coral/40` |
| `focus:border-red-500` | `focus:border-coral` |
| `focus:ring-red-200` | `focus:ring-coral/30` |
| `text-red-600` | `text-coral` |

#### Amber/warning replacement mapping (team-invite-screen)

| Raw Tailwind | Design Token |
|---|---|
| `bg-amber-50` | `bg-warning/10` |
| `border-amber-200` | `border-warning/30` |
| `text-amber-600` | `text-warning` |
| `text-amber-900` | `text-ink` |

**Note:** `warning` is not a Tailwind config token — it's defined via utility classes in `globals.css` lines 243-251. `bg-warning/10` and opacity variants work because of the CSS custom property definition. No tailwind config change needed.

### Files Changed

9 files in `components/onboarding/` (8 component files + 1 test file)

---

## Issue #2: Dashboard Remaining Gray (LOW)

### Scope

`dashboard/page.tsx` line 514 — single `text-gray-500` instance.

### Tests (RED)

Add to existing `dashboard/__tests__/page.design.test.tsx`:

```ts
it('should not contain gray colors', () => {
  const fs = require('fs');
  const componentCode = fs.readFileSync(
    '/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/dashboard/page.tsx',
    'utf-8'
  );
  expect(componentCode).not.toContain('gray-');
});
```

### Implementation (GREEN)

Line 514: `text-gray-500` → `text-muted-foreground`

### Files Changed

1 file: `dashboard/page.tsx` (1 line), 1 test file

---

## Issue #3: Dashboard Inline Button (HIGH)

### Scope

`dashboard/page.tsx` line 423 — raw `<Link>` with hand-rolled coral button classes instead of `<Button>`.

### Tests (RED — already exist, currently failing)

`dashboard/__tests__/page.design.test.tsx` lines 62-74 already assert:
```ts
it('should not have inline coral button styles on raw Link/button elements')
```
This test currently **fails** because line 423 has `className="...bg-coral text-white...rounded-lg"`.

### Implementation (GREEN)

Replace raw `<Link className="inline-flex min-h-[40px] items-center rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral/90">` with:

```tsx
<Button variant="brutalist-rounded" size="md" asChild>
  <Link href="/access-requests/new">Create Request</Link>
</Button>
```

### Files Changed

1 file: `dashboard/page.tsx`

---

## Issue #4: Access Request New — Non-Standard Interactions (HIGH)

### Scope

`access-requests/new/page.tsx` — 4 buttons with `hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`

Lines: 335, 423, 662, 917

### Tests (RED)

Create `access-requests/new/__tests__/page.design.test.tsx`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const COMPONENT_PATH = resolve(__dirname, '../page.tsx');

function readComponent(): string {
  return readFileSync(COMPONENT_PATH, 'utf-8');
}

describe('Access Request New Page - Static Design Validation', () => {
  it('should not use hover:scale-105 (non-standard interaction)', () => {
    const code = readComponent();
    expect(code).not.toContain('hover:scale-105');
  });

  it('should not use shadow-sm or hover:shadow-md (non-brutalist shadows)', () => {
    const code = readComponent();
    expect(code).not.toMatch(/shadow-sm/);
    expect(code).not.toMatch(/hover:shadow-md/);
  });
});
```

### Implementation (GREEN)

Replace all 4 button patterns. Each currently looks like:
```
className="px-6 py-2.5 bg-coral text-white rounded-lg hover:bg-coral/90 transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
```

Replace with `<Button>` component:
```tsx
<Button variant="brutalist-rounded" size="md">
  Continue to Platforms
</Button>
```

Or if keeping raw styling, at minimum replace:
- `hover:scale-105` → remove (Button uses `hover:translate-y-[-2px]`)
- `active:scale-95` → `active:scale-95` (keep — matches Button)
- `shadow-sm hover:shadow-md` → `shadow-brutalist hover:shadow-brutalist-lg`

### Files Changed

1 file: `access-requests/new/page.tsx`, 1 new test file

---

## Execution Order (by risk/size)

| Order | Issue | Scope | Risk |
|---|---|---|---|
| 1 | #2 Dashboard gray | 1 line | Trivial |
| 2 | #3 Dashboard inline button | 1 element | Low |
| 3 | #4 Access request buttons | 4 elements | Medium (behavioral) |
| 4 | #1 Onboarding full migration | 9 files, ~147 replacements | High (largest scope) |

---

## Issue #5: GoogleUnifiedSettings — Full Token Migration (CRITICAL)

### Context

This is the Google platform account-selection panel (the "Manage Assets" UI on the Connections page). It was built with generic SaaS styling and has **zero** design system compliance — slate borders, indigo checkboxes, blue/orange/red icon colors, soft shadows, and raw `<input type="checkbox">` instead of custom checkbox styling.

### Scope & Violations

**File:** `components/google-unified-settings.tsx`

| Category | Count | Instances |
|---|---|---|
| `slate-*` | 17 | `text-slate-400` ×3, `text-slate-500` ×3, `text-slate-700` ×1, `text-slate-900` ×3, `border-slate-100` ×1, `border-slate-200` ×3, `border-slate-300` ×3, `bg-slate-50` ×1, `bg-slate-100` ×1, `bg-slate-900` ×1, `hover:bg-slate-100` ×1 |
| `indigo-*` | 4 | `text-indigo-600` ×2, `focus:ring-indigo-500` ×3 |
| `red-*` | 4 | `text-red-500` ×3, `hover:bg-red-50` ×1 |
| `blue-*` | 3 | `text-blue-600` ×1, `text-blue-500` ×1, `text-blue-400` ×1 |
| `orange-*` | 1 | `text-orange-500` ×1 |
| `shadow-xl` | 1 | tooltip uses `shadow-xl` (soft shadow) |
| **TOTAL** | **~30** | |

**Additional issues:**
- Raw `<input type="checkbox">` with browser-default styling (blue squares) — should use custom checkbox div pattern (like `hierarchical-platform-selector.tsx` does)
- Raw `<select>` with browser-default dropdown — no brutalist styling
- Tooltip uses `bg-slate-900` + `shadow-xl` instead of `bg-ink` + `shadow-brutalist`

### Tests (RED)

Create `components/__tests__/google-unified-settings.design.test.tsx`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const COMPONENT_PATH = resolve(__dirname, '../google-unified-settings.tsx');

function readComponent(): string {
  return readFileSync(COMPONENT_PATH, 'utf-8');
}

describe('GoogleUnifiedSettings - Static Design Validation', () => {
  it('should not contain slate colors', () => {
    const code = readComponent();
    expect(code).not.toContain('slate-');
  });

  it('should not contain indigo colors', () => {
    const code = readComponent();
    expect(code).not.toContain('indigo-');
  });

  it('should not contain raw red colors', () => {
    const code = readComponent();
    expect(code).not.toContain('red-');
  });

  it('should not contain raw blue colors (blue-400, blue-500, blue-600)', () => {
    const code = readComponent();
    expect(code).not.toMatch(/blue-[0-9]/);
  });

  it('should not contain raw orange colors', () => {
    const code = readComponent();
    expect(code).not.toContain('orange-');
  });

  it('should not contain soft shadows (shadow-xl)', () => {
    const code = readComponent();
    expect(code).not.toMatch(/shadow-(xl|2xl)(?!-brutalist)/);
  });

  it('should use design token colors', () => {
    const code = readComponent();
    expect(code).toMatch(/text-ink/);
    expect(code).toMatch(/text-foreground/);
    expect(code).toMatch(/text-muted-foreground/);
    expect(code).toMatch(/border-border/);
  });
});
```

### Implementation (GREEN)

#### Slate replacement

| Raw Tailwind | Design Token |
|---|---|
| `text-slate-900` | `text-ink` |
| `text-slate-700` | `text-foreground` |
| `text-slate-500` | `text-muted-foreground` |
| `text-slate-400` | `text-muted-foreground` |
| `border-slate-200` | `border-border` |
| `border-slate-300` | `border-border` |
| `border-slate-100` | `border-border` |
| `bg-slate-50` | `bg-muted/10` |
| `bg-slate-100` | `bg-muted/20` |
| `bg-slate-900` (tooltip) | `bg-ink` |
| `hover:bg-slate-100` | `hover:bg-muted/10` |

#### Indigo replacement (checkboxes + focus rings)

| Raw Tailwind | Design Token |
|---|---|
| `text-indigo-600` | `text-coral` |
| `focus:ring-indigo-500` | `focus:ring-coral` |

#### Icon color replacement (use `text-muted-foreground` uniformly — product identity comes from the icon shape/label, not color)

| Raw Tailwind | Design Token | Context |
|---|---|---|
| `text-blue-600` | `text-muted-foreground` | CircleDollarSign (Ads) |
| `text-orange-500` | `text-muted-foreground` | BarChart3 (Analytics) |
| `text-blue-500` | `text-muted-foreground` | MapPin (Business Profile) |
| `text-blue-400` | `text-muted-foreground` | Tags (Tag Manager) |
| `text-slate-500` | `text-muted-foreground` | Search (Search Console) |
| `text-red-500` (icon) | `text-muted-foreground` | ShoppingBag (Merchant Center) |

#### Red replacement (delete/error)

| Raw Tailwind | Design Token |
|---|---|
| `text-red-500` (error msg) | `text-coral` |
| `text-red-500` (trash icon) | `text-coral` |
| `hover:bg-red-50` | `hover:bg-coral/10` |

#### Shadow replacement

| Raw Tailwind | Design Token |
|---|---|
| `shadow-xl` (tooltip) | `shadow-brutalist` |

### Files Changed

1 component file, 1 new test file

---

## Issue #6: HierarchicalPlatformSelector — Verbose CSS-Variable Syntax + Soft Shadow (HIGH)

### Context

This component (the platform picker in the "Create Access Request" flow) is mostly design-system compliant but uses verbose `[rgb(var(--coral))]` arbitrary-value syntax (~15 instances) instead of the proper `coral` token, plus one `shadow-sm` soft shadow.

### Scope

**File:** `components/hierarchical-platform-selector.tsx`

| Pattern | Count |
|---|---|
| `[rgb(var(--coral))]` arbitrary values | ~15 |
| `shadow-sm` (soft shadow) | 1 |

### Tests (RED)

Create `components/__tests__/hierarchical-platform-selector.design.test.tsx`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const COMPONENT_PATH = resolve(__dirname, '../hierarchical-platform-selector.tsx');

function readComponent(): string {
  return readFileSync(COMPONENT_PATH, 'utf-8');
}

describe('HierarchicalPlatformSelector - Static Design Validation', () => {
  it('should not use verbose rgb(var()) syntax for tokens', () => {
    const code = readComponent();
    expect(code).not.toMatch(/\[rgb\(var\(/);
  });

  it('should not contain soft shadows (shadow-sm)', () => {
    const code = readComponent();
    expect(code).not.toMatch(/shadow-sm/);
  });

  it('should use coral token directly', () => {
    const code = readComponent();
    expect(code).toMatch(/text-coral/);
    expect(code).toMatch(/bg-coral/);
    expect(code).toMatch(/border-coral/);
  });
});
```

### Implementation (GREEN)

| Verbose Syntax | Clean Token |
|---|---|
| `bg-[rgb(var(--coral))]` | `bg-coral` |
| `border-[rgb(var(--coral))]` | `border-coral` |
| `text-[rgb(var(--coral))]` | `text-coral` |
| `bg-[rgb(var(--coral))]/15` | `bg-coral/15` |
| `bg-[rgb(var(--coral))]/10` | `bg-coral/10` |
| `bg-[rgb(var(--coral))]/[0.03]` | `bg-coral/[0.03]` |
| `border-[rgb(var(--coral))]/40` | `border-coral/40` |
| `hover:border-[rgb(var(--coral))]/50` | `hover:border-coral/50` |
| `shadow-sm` (line 272) | remove (or `shadow-brutalist` if elevation needed) |

### Files Changed

1 component file, 1 new test file

---

## Updated Execution Order

| Order | Issue | Scope | Risk |
|---|---|---|---|
| 1 | #2 Dashboard gray | 1 line | Trivial |
| 2 | #3 Dashboard inline button | 1 element | Low |
| 3 | #6 HierarchicalPlatformSelector syntax | 1 file, find-replace | Low |
| 4 | #4 Access request buttons | 4 elements | Medium |
| 5 | #5 GoogleUnifiedSettings | 1 file, ~30 replacements | Medium-High |
| 6 | #1 Onboarding full migration | 9 files, ~147 replacements | High |

---

## Verification

```bash
cd apps/web && npm test           # All design tests pass
npm run typecheck                  # No type errors
npm run lint                       # No lint errors
```

After #1, visually spot-check onboarding wizard flow in dev to confirm no broken styles.
After #5, visually spot-check Connections page → Google "Manage Assets" panel.
After #6, visually spot-check Access Request creation → platform selection step.

---

## Appendix: Token Quick Reference

| Token | Defined In | Value |
|---|---|---|
| `ink` | tailwind.config.ts | `rgb(var(--ink))` |
| `paper` | tailwind.config.ts | `rgb(var(--paper))` |
| `coral` | tailwind.config.ts | `rgb(var(--coral))` |
| `teal` | tailwind.config.ts | `rgb(var(--teal))` |
| `acid` | tailwind.config.ts | `rgb(var(--acid))` |
| `electric` | tailwind.config.ts | `rgb(var(--electric))` |
| `foreground` | tailwind.config.ts | `rgb(var(--foreground))` |
| `muted-foreground` | tailwind.config.ts | `rgb(var(--muted-foreground))` |
| `border` | tailwind.config.ts | `rgb(var(--border))` |
| `card` | tailwind.config.ts | `rgb(var(--card))` |
| `warning` | globals.css (utility only) | `rgb(var(--warning))` — **not** in tailwind config, opacity modifiers via CSS only |
| `shadow-brutalist` | tailwind.config.ts | `4px 4px 0px #000` |
| `shadow-brutalist-lg` | tailwind.config.ts | `6px 6px 0px #000` |
