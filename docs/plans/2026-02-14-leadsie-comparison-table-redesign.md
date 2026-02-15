# Leadsie Comparison Page - Table Redesign & Token Fixes

**Date**: 2026-02-14
**Status**: Approved
**Scope**: Comparison table redesign + design token fixes

---

## Overview

Redesign the feature-by-feature comparison table on `/compare/leadsie-alternative` to use proper design system components with grouped sections, and fix all broken/outdated design tokens throughout the page.

---

## Scope

### In Scope
- Create new `ComparisonTable` component system with grouped sections
- Replace all `shadow-hard-xl` → `shadow-brutalist-xl`
- Replace all `gray-*` colors with design tokens
- Replace all `red-*` colors with `destructive` semantic tokens
- Unit tests for new components

### Out of Scope
- PricingCard, StepCard, FeatureBadge extraction (stay inline)
- Visual regression tests
- Mobile-specific table redesign (responsive scroll maintained)

---

## Architecture

### File Changes

| File | Action |
|------|--------|
| `components/ui/comparison-table.tsx` | Create |
| `components/ui/__tests__/comparison-table.test.tsx` | Create |
| `app/(marketing)/compare/leadsie-alternative/page.tsx` | Modify |

### Component Hierarchy

```
ComparisonTable (container)
├── ComparisonHeader (static header row)
├── ComparisonSection (grouped features)
│   └── ComparisonRow (individual feature comparison)
└── Badge (for "Only AuthHub" exclusive features)
```

---

## Component API

### ComparisonTable

```tsx
interface ComparisonTableProps {
  children: React.ReactNode;
}
```

Container component with sticky header support and responsive overflow handling.

### ComparisonHeader

```tsx
// No props - renders static header
// Columns: "Feature" | "Leadsie" | "AuthHub"
```

### ComparisonSection

```tsx
interface ComparisonSectionProps {
  title: string;        // Section header text
  children: React.ReactNode;
}
```

Groups related features with a subtle header row.

### ComparisonRow

```tsx
interface ComparisonRowProps {
  feature: string;                    // Feature name
  leadsie: boolean | string;          // Leadsie value (true/false or custom text)
  authhub: boolean | string;          // AuthHub value (true/false or custom text)
  exclusive?: boolean;                // Show "Only AuthHub" badge
}
```

Renders a single feature comparison row with appropriate icons and styling.

---

## Visual Specifications

### Header

| Element | Style |
|---------|-------|
| Background | `bg-ink` |
| Text | `text-white font-bold` |
| Borders | `border-white` between columns |
| Position | Sticky on scroll |

### Section Headers

| Element | Style |
|---------|-------|
| Background | `bg-muted/30` |
| Text | `font-bold text-foreground` |
| Padding | `px-4 py-2` |

### Rows

| Element | Style |
|---------|-------|
| Check icon | `text-teal` |
| X icon | `text-destructive` |
| AuthHub wins | `font-bold text-teal` |
| Exclusive badge | `bg-teal text-white text-xs font-bold uppercase` |
| Alternating rows | `bg-muted/50` on even rows |

---

## Token Fixes

### Shadow Classes

| Current | Fixed |
|---------|-------|
| `shadow-hard-xl` | `shadow-brutalist-xl` |

### Color Tokens

| Current | Fixed |
|---------|-------|
| `text-gray-700` | `text-foreground` |
| `text-gray-600` | `text-muted-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `text-gray-300` | `text-white/80` (dark sections) |
| `bg-gray-50` | `bg-muted/50` |
| `bg-red-100` | `bg-destructive/10` |
| `text-red-600` | `text-destructive` |
| `border-red-300` | `border-destructive/30` |

---

## Test Strategy

### Test File

`components/ui/__tests__/comparison-table.test.tsx`

### Test Cases

1. `ComparisonTable renders children`
2. `ComparisonHeader renders three columns`
3. `ComparisonSection renders title`
4. `ComparisonRow renders feature name`
5. `ComparisonRow shows Check for true values`
6. `ComparisonRow shows X for false values`
7. `ComparisonRow shows string values directly`
8. `ComparisonRow highlights AuthHub wins`
9. `ComparisonRow exclusive prop shows badge`
10. `Design tokens are applied correctly`

### TDD Flow

For each test: Write test → Run (RED) → Implement minimal code → Run (GREEN) → Refactor if needed

---

## Success Criteria

- [ ] All 10 tests pass
- [ ] No `shadow-hard-xl` in codebase
- [ ] No `gray-*` or `red-*` colors in comparison page
- [ ] Table has grouped sections (Platform Support, Core Features, Support & Pricing)
- [ ] Sticky header works on scroll
- [ ] Page builds without errors
- [ ] Visual appearance maintained or improved

---

## Implementation Order

1. Create test file with first test
2. Create ComparisonTable component (minimal)
3. Continue TDD cycle for all components
4. Update page to use new components
5. Fix remaining token issues
6. Verify build and visual appearance
