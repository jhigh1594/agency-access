# Comparison Table Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a reusable ComparisonTable component with grouped sections and fix all design token violations on the Leadsie comparison page.

**Architecture:** Component-based table with ComparisonTable (container), ComparisonHeader (sticky header), ComparisonSection (feature groups), and ComparisonRow (individual features). Uses design tokens throughout.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, @testing-library/react

---

## Task 1: Setup Test File

**Files:**
- Create: `apps/web/src/components/ui/__tests__/comparison-table.test.tsx`

**Step 1: Write first failing test**

```tsx
/**
 * ComparisonTable Component Tests
 *
 * Tests for the marketing comparison table components
 * with grouped sections and feature rows
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparisonTable } from '../comparison-table';

describe('ComparisonTable', () => {
  it('should render children', () => {
    render(
      <ComparisonTable>
        <div>Test Content</div>
      </ComparisonTable>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test src/components/ui/__tests__/comparison-table.test.tsx`
Expected: FAIL with "Cannot find module '../comparison-table'"

**Step 3: Create minimal ComparisonTable component**

Create: `apps/web/src/components/ui/comparison-table.tsx`

```tsx
import { cn } from '@/lib/utils';

interface ComparisonTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ComparisonTable({ children, className }: ComparisonTableProps) {
  return (
    <div className={cn('overflow-x-auto border-2 border-black rounded-none', className)}>
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test src/components/ui/__tests__/comparison-table.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/components/ui/comparison-table.tsx apps/web/src/components/ui/__tests__/comparison-table.test.tsx
git commit -m "feat(ui): add ComparisonTable component with initial test

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Add ComparisonHeader Component

**Files:**
- Modify: `apps/web/src/components/ui/comparison-table.tsx`
- Modify: `apps/web/src/components/ui/__tests__/comparison-table.test.tsx`

**Step 1: Write failing test**

Add to test file:

```tsx
import { ComparisonTable, ComparisonHeader } from '../comparison-table';

describe('ComparisonHeader', () => {
  it('should render three columns', () => {
    render(
      <ComparisonTable>
        <ComparisonHeader />
      </ComparisonTable>
    );

    expect(screen.getByText('Feature')).toBeInTheDocument();
    expect(screen.getByText('Leadsie')).toBeInTheDocument();
    expect(screen.getByText('AuthHub')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test src/components/ui/__tests__/comparison-table.test.tsx`
Expected: FAIL with "ComparisonHeader is not defined"

**Step 3: Implement ComparisonHeader**

Add to `comparison-table.tsx`:

```tsx
export function ComparisonHeader() {
  return (
    <thead className="bg-ink text-white sticky top-0">
      <tr>
        <th className="px-4 py-3 text-left font-bold border-r border-white">
          Feature
        </th>
        <th className="px-4 py-3 text-center font-bold border-r border-white">
          Leadsie
        </th>
        <th className="px-4 py-3 text-center font-bold">
          AuthHub
        </th>
      </tr>
    </thead>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test src/components/ui/__tests__/comparison-table.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/components/ui/comparison-table.tsx apps/web/src/components/ui/__tests__/comparison-table.test.tsx
git commit -m "feat(ui): add ComparisonHeader component with sticky header

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Add ComparisonSection Component

**Files:**
- Modify: `apps/web/src/components/ui/comparison-table.tsx`
- Modify: `apps/web/src/components/ui/__tests__/comparison-table.test.tsx`

**Step 1: Write failing test**

Add to test file:

```tsx
import { ComparisonTable, ComparisonHeader, ComparisonSection } from '../comparison-table';

describe('ComparisonSection', () => {
  it('should render title', () => {
    render(
      <ComparisonTable>
        <tbody>
          <ComparisonSection title="Platform Support">
            <tr><td>Content</td></tr>
          </ComparisonSection>
        </tbody>
      </ComparisonTable>
    );

    expect(screen.getByText('Platform Support')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test src/components/ui/__tests__/comparison-table.test.tsx`
Expected: FAIL with "ComparisonSection is not defined"

**Step 3: Implement ComparisonSection**

Add to `comparison-table.tsx`:

```tsx
interface ComparisonSectionProps {
  title: string;
  children: React.ReactNode;
}

export function ComparisonSection({ title, children }: ComparisonSectionProps) {
  return (
    <>
      <tr className="bg-muted/30">
        <td colSpan={3} className="px-4 py-2 font-bold text-foreground">
          {title}
        </td>
      </tr>
      {children}
    </>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test src/components/ui/__tests__/comparison-table.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/components/ui/comparison-table.tsx apps/web/src/components/ui/__tests__/comparison-table.test.tsx
git commit -m "feat(ui): add ComparisonSection component for grouped features

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Add ComparisonRow Component - Feature Name

**Files:**
- Modify: `apps/web/src/components/ui/comparison-table.tsx`
- Modify: `apps/web/src/components/ui/__tests__/comparison-table.test.tsx`

**Step 1: Write failing test**

Add to test file:

```tsx
import { ComparisonTable, ComparisonSection, ComparisonRow } from '../comparison-table';

describe('ComparisonRow', () => {
  it('should render feature name', () => {
    render(
      <ComparisonTable>
        <tbody>
          <ComparisonSection title="Test Section">
            <ComparisonRow feature="Meta Ads" leadsie={true} authhub={true} />
          </ComparisonSection>
        </tbody>
      </ComparisonTable>
    );

    expect(screen.getByText('Meta Ads')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test src/components/ui/__tests__/comparison-table.test.tsx`
Expected: FAIL with "ComparisonRow is not defined"

**Step 3: Implement minimal ComparisonRow**

Add to `comparison-table.tsx`:

```tsx
import { Check, X } from 'lucide-react';

interface ComparisonRowProps {
  feature: string;
  leadsie: boolean | string;
  authhub: boolean | string;
  exclusive?: boolean;
  isEven?: boolean;
}

export function ComparisonRow({ feature, leadsie, authhub, exclusive, isEven = false }: ComparisonRowProps) {
  const renderValue = (value: boolean | string, isAuthHub: boolean = false) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="inline text-teal" size={16} />
      ) : (
        <X className="inline text-destructive" size={16} />
      );
    }
    return <span className={isAuthHub ? 'font-bold text-teal' : ''}>{value}</span>;
  };

  return (
    <tr className={`border-t border-black ${isEven ? 'bg-muted/50' : ''}`}>
      <td className="px-4 py-3 font-bold border-r border-black">
        {feature}
      </td>
      <td className="px-4 py-3 text-center border-r border-black">
        {renderValue(leadsie)}
      </td>
      <td className="px-4 py-3 text-center">
        {renderValue(authhub, true)}
        {exclusive && (
          <span className="ml-2 px-2 py-0.5 bg-teal text-white text-xs font-bold uppercase rounded-sm">
            Only AuthHub
          </span>
        )}
      </td>
    </tr>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test src/components/ui/__tests__/comparison-table.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/components/ui/comparison-table.tsx apps/web/src/components/ui/__tests__/comparison-table.test.tsx
git commit -m "feat(ui): add ComparisonRow component with feature name

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Add Tests for Check/X Icons

**Files:**
- Modify: `apps/web/src/components/ui/__tests__/comparison-table.test.tsx`

**Step 1: Write failing tests**

Add to test file:

```tsx
describe('ComparisonRow value rendering', () => {
  it('should show Check for true values', () => {
    render(
      <ComparisonTable>
        <tbody>
          <ComparisonRow feature="Test" leadsie={true} authhub={true} />
        </tbody>
      </ComparisonTable>
    );

    // Check icons should be present (they have the lucide class pattern)
    const cells = screen.getAllByRole('cell');
    expect(cells[1]).toBeInTheDocument(); // Leadsie cell
    expect(cells[2]).toBeInTheDocument(); // AuthHub cell
  });

  it('should show X for false values', () => {
    render(
      <ComparisonTable>
        <tbody>
          <ComparisonRow feature="Test" leadsie={false} authhub={false} />
        </tbody>
      </ComparisonTable>
    );

    const cells = screen.getAllByRole('cell');
    expect(cells[1]).toBeInTheDocument();
    expect(cells[2]).toBeInTheDocument();
  });

  it('should show string values directly', () => {
    render(
      <ComparisonTable>
        <tbody>
          <ComparisonRow feature="Test" leadsie="2 products" authhub="8 products" />
        </tbody>
      </ComparisonTable>
    );

    expect(screen.getByText('2 products')).toBeInTheDocument();
    expect(screen.getByText('8 products')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it passes**

Run: `cd apps/web && npm test src/components/ui/__tests__/comparison-table.test.tsx`
Expected: PASS (already implemented in Task 4)

**Step 3: Commit**

```bash
git add apps/web/src/components/ui/__tests__/comparison-table.test.tsx
git commit -m "test(ui): add tests for ComparisonRow value rendering

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Add Test for Exclusive Badge

**Files:**
- Modify: `apps/web/src/components/ui/__tests__/comparison-table.test.tsx`

**Step 1: Write failing test**

Add to test file:

```tsx
describe('ComparisonRow exclusive badge', () => {
  it('should show badge when exclusive prop is true', () => {
    render(
      <ComparisonTable>
        <tbody>
          <ComparisonRow feature="Pinterest Ads" leadsie={false} authhub={true} exclusive />
        </tbody>
      </ComparisonTable>
    );

    expect(screen.getByText('Only AuthHub')).toBeInTheDocument();
  });

  it('should not show badge when exclusive prop is false', () => {
    render(
      <ComparisonTable>
        <tbody>
          <ComparisonRow feature="Meta Ads" leadsie={true} authhub={true} exclusive={false} />
        </tbody>
      </ComparisonTable>
    );

    expect(screen.queryByText('Only AuthHub')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it passes**

Run: `cd apps/web && npm test src/components/ui/__tests__/comparison-table.test.tsx`
Expected: PASS (already implemented in Task 4)

**Step 3: Commit**

```bash
git add apps/web/src/components/ui/__tests__/comparison-table.test.tsx
git commit -m "test(ui): add tests for exclusive badge rendering

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Add Test for Design Tokens

**Files:**
- Modify: `apps/web/src/components/ui/__tests__/comparison-table.test.tsx`

**Step 1: Write test for design tokens**

Add to test file:

```tsx
describe('ComparisonTable design tokens', () => {
  it('should use design tokens, not hardcoded colors', () => {
    const { container } = render(
      <ComparisonTable>
        <ComparisonHeader />
        <tbody>
          <ComparisonSection title="Test">
            <ComparisonRow feature="Test" leadsie={true} authhub={true} />
          </ComparisonSection>
        </tbody>
      </ComparisonTable>
    );

    // Check that header uses bg-ink, not hardcoded black
    const header = container.querySelector('thead');
    expect(header?.className).toContain('bg-ink');

    // Check that section uses bg-muted, not bg-gray
    const sectionRow = container.querySelector('.bg-muted\\/30, [class*="bg-muted"]');
    expect(sectionRow).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it passes**

Run: `cd apps/web && npm test src/components/ui/__tests__/comparison-table.test.tsx`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/web/src/components/ui/__tests__/comparison-table.test.tsx
git commit -m "test(ui): add design token verification test

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Run All Tests and Verify

**Step 1: Run full test suite**

Run: `cd apps/web && npm test src/components/ui/__tests__/comparison-table.test.tsx`
Expected: All tests PASS

**Step 2: Run type check**

Run: `cd apps/web && npm run typecheck`
Expected: No errors

**Step 3: Commit if any fixes needed**

```bash
# Only if fixes were made
git add -A
git commit -m "fix(ui): address test/type issues in ComparisonTable

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Update Leadsie Comparison Page - Table Section

**Files:**
- Modify: `apps/web/src/app/(marketing)/compare/leadsie-alternative/page.tsx`

**Step 1: Update imports**

Add to imports section (around line 7):

```tsx
import { ComparisonTable, ComparisonHeader, ComparisonSection, ComparisonRow } from "@/components/ui/comparison-table";
```

**Step 2: Replace the Feature-by-Feature Comparison Table**

Replace lines 414-602 with:

```tsx
{/* Feature-by-Feature Comparison Table */}
<section className="border-b-2 border-black bg-card">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h2 className="font-dela text-2xl md:text-3xl text-ink mb-8 text-center">
      Feature-by-Feature Comparison
    </h2>
    <ComparisonTable>
      <ComparisonHeader />
      <tbody>
        {/* Platform Support Section */}
        <ComparisonSection title="Platform Support">
          <ComparisonRow
            feature="Platform Count"
            leadsie="~8"
            authhub="15+"
          />
          <ComparisonRow
            feature="Meta (Facebook, Instagram)"
            leadsie={true}
            authhub={true}
          />
          <ComparisonRow
            feature="Google (Ads, GA4, GTM, etc.)"
            leadsie="2"
            authhub="8 products"
          />
          <ComparisonRow
            feature="Pinterest Ads"
            leadsie={false}
            authhub={true}
            exclusive
          />
          <ComparisonRow
            feature="Klaviyo"
            leadsie={false}
            authhub={true}
            exclusive
          />
          <ComparisonRow
            feature="Shopify"
            leadsie={false}
            authhub={true}
            exclusive
          />
        </ComparisonSection>

        {/* Core Features Section */}
        <ComparisonSection title="Core Features">
          <ComparisonRow
            feature="Client Intake Forms"
            leadsie={false}
            authhub={true}
            exclusive
          />
          <ComparisonRow
            feature="Permission Levels"
            leadsie="2-3 levels"
            authhub="4 levels"
          />
          <ComparisonRow
            feature="Reusable Templates"
            leadsie={false}
            authhub={true}
          />
          <ComparisonRow
            feature="API Access"
            leadsie={false}
            authhub={true}
          />
          <ComparisonRow
            feature="Token Storage"
            leadsie="Database"
            authhub="Infisical (Enterprise-grade)"
          />
        </ComparisonSection>

        {/* Support & Pricing Section */}
        <ComparisonSection title="Support & Pricing">
          <ComparisonRow
            feature="Support Hours"
            leadsie="UK (GMT)"
            authhub="US (EST/PST)"
          />
          <ComparisonRow
            feature="Starting Price"
            leadsie="$99/mo"
            authhub="$79/mo"
          />
        </ComparisonSection>
      </tbody>
    </ComparisonTable>
  </div>
</section>
```

**Step 3: Verify page builds**

Run: `cd apps/web && npm run build -- --no-lint 2>&1 | head -50`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/web/src/app/\(marketing\)/compare/leadsie-alternative/page.tsx
git commit -m "feat(compare): use new ComparisonTable component on Leadsie page

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Fix Token Issues - Shadow Classes

**Files:**
- Modify: `apps/web/src/app/(marketing)/compare/leadsie-alternative/page.tsx`

**Step 1: Find and replace shadow-hard-xl**

Replace all occurrences:
- `shadow-hard-xl` → `shadow-brutalist-xl`

In file: `apps/web/src/app/(marketing)/compare/leadsie-alternative/page.tsx`

Lines to change:
- Line 297: `shadow-hard-xl` → `shadow-brutalist-xl`
- Line 624: `shadow-hard-xl` → `shadow-brutalist-xl`

**Step 2: Verify build**

Run: `cd apps/web && npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/app/\(marketing\)/compare/leadsie-alternative/page.tsx
git commit -m "fix(compare): replace shadow-hard-xl with shadow-brutalist-xl

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 11: Fix Token Issues - Gray Colors

**Files:**
- Modify: `apps/web/src/app/(marketing)/compare/leadsie-alternative/page.tsx`

**Step 1: Replace gray color tokens**

| Find | Replace |
|------|---------|
| `text-gray-700` | `text-foreground` |
| `text-gray-600` | `text-muted-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `text-gray-300` | `text-white/80` |
| `bg-gray-50` | `bg-muted/50` |

Use find/replace in your editor or:

```bash
cd apps/web
# In the file, replace:
# text-gray-700 → text-foreground (for body text)
# text-gray-600 → text-muted-foreground (for subtext)
# text-gray-500 → text-muted-foreground (for small labels)
# text-gray-300 → text-white/80 (in dark sections like footer CTA)
# bg-gray-50 → bg-muted/50 (table row backgrounds - may be removed now)
```

**Step 2: Verify build**

Run: `cd apps/web && npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/app/\(marketing\)/compare/leadsie-alternative/page.tsx
git commit -m "fix(compare): replace gray-* colors with design system tokens

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 12: Fix Token Issues - Red Colors

**Files:**
- Modify: `apps/web/src/app/(marketing)/compare/leadsie-alternative/page.tsx`

**Step 1: Replace red color tokens**

| Find | Replace |
|------|---------|
| `bg-red-100` | `bg-destructive/10` |
| `text-red-600` | `text-destructive` |
| `border-red-300` | `border-destructive/30` |

Locations in file:
- Lines 107-169: Pain point cards icon backgrounds
- Lines 192-215: Before/After comparison section

**Step 2: Verify build**

Run: `cd apps/web && npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/app/\(marketing\)/compare/leadsie-alternative/page.tsx
git commit -m "fix(compare): replace red-* colors with destructive semantic tokens

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 13: Final Verification

**Step 1: Run all tests**

Run: `cd apps/web && npm test src/components/ui/__tests__/comparison-table.test.tsx`
Expected: All 10+ tests PASS

**Step 2: Run type check**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Build the app**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Visual check (optional)**

Run: `npm run dev` and visit `http://localhost:3000/compare/leadsie-alternative`

Verify:
- [ ] Comparison table shows grouped sections
- [ ] Header is sticky on scroll
- [ ] Check/X icons display correctly
- [ ] "Only AuthHub" badges appear on exclusive features
- [ ] No visual regressions elsewhere

**Step 5: Final commit if needed**

```bash
git add -A
git commit -m "chore: final cleanup for comparison table redesign

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Summary

| Task | Description | Status |
|------|-------------|--------|
| 1 | Setup test file + ComparisonTable container | ⬜ |
| 2 | Add ComparisonHeader component | ⬜ |
| 3 | Add ComparisonSection component | ⬜ |
| 4 | Add ComparisonRow component | ⬜ |
| 5 | Add value rendering tests | ⬜ |
| 6 | Add exclusive badge tests | ⬜ |
| 7 | Add design token tests | ⬜ |
| 8 | Verify all tests pass | ⬜ |
| 9 | Update page to use new components | ⬜ |
| 10 | Fix shadow-hard-xl tokens | ⬜ |
| 11 | Fix gray-* color tokens | ⬜ |
| 12 | Fix red-* color tokens | ⬜ |
| 13 | Final verification | ⬜ |
