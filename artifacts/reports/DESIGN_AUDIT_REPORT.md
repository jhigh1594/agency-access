# Design Audit Report
## Agency Access Platform - Acid Brutalism Design System

**Date**: February 11, 2026
**Audited By**: Claude Code
**Design System Version**: 1.0.0

---

## Executive Summary

This audit identified **widespread design system inconsistencies** across the codebase. The most critical issues are:

1. **Heavy use of generic Tailwind colors** (slate, indigo, purple, green, red) instead of brand colors (--coral, --teal, --acid, --electric)
2. **Non-brutalist shadows** (shadow-xl, shadow-2xl) instead of hard brutalist shadows
3. **Overly rounded corners** (rounded-2xl, rounded-3xl) conflicting with brutalist aesthetic
4. **Hardcoded color values** bypassing CSS variables

**Estimated Impact**: ~60-70% of components have some design system deviation.

---

## Critical Issues (High Priority)

### 1. Generic Color Usage Instead of Brand Colors

**Problem**: Extensive use of Tailwind's default color palette (slate, indigo, purple, green, red, blue, yellow) instead of the defined brand colors.

**Design System Says**:
```css
/* Should use these CSS variables */
--coral: #FF6B35   /* Primary accent (10% use) */
--teal: #00A896    /* Secondary accent (5% use) */
--acid: #CCFF00    /* Kinetic elements (2% use) */
--electric: #8B5CF6  /* Hover states */
--ink: #09090B     /* Backgrounds */
--paper: #FAFAFA    /* Surfaces */
```

**Found In**: 200+ instances across components

#### Affected Files:
| File | Issue | Count |
|------|-------|-------|
| `auth-model-selector.tsx` | `text-indigo-700`, `bg-green-50`, `text-slate-900` | 12 |
| `platform-connection-modal.tsx` | `bg-slate-50`, `text-green-700`, `border-red-200` | 15+ |
| `onboarding/screens/*` | `bg-indigo-600`, `bg-purple-600`, `bg-gradient-to-r` | 20+ |
| `access-requests/*` | `bg-indigo-600`, `text-slate-900` | 10+ |
| `client-detail/*` | `border-slate-200`, `text-slate-600` | 8+ |
| `settings/billing/*` | `text-indigo-600`, `border-indigo-100` | 5+ |

#### Examples:

```tsx
// ❌ WRONG - Generic indigo color
<div className="bg-indigo-600 text-white">

// ✅ CORRECT - Brand coral color
<div className="bg-coral text-white">

// ❌ WRONG - Generic slate color
<h3 className="text-slate-900">Title</h3>

// ✅ CORRECT - Design system ink color
<h3 className="text-ink font-display">Title</h3>

// ❌ WRONG - Generic green for success
<div className="bg-green-50 border-green-200 text-green-700">

// ✅ CORRECT - Brand teal for success
<div className="bg-teal/10 border-teal text-teal">
```

---

### 2. Non-Brutalist Shadows

**Problem**: Using soft Tailwind shadows (shadow-md, shadow-lg, shadow-xl, shadow-2xl) instead of hard brutalist shadows.

**Design System Says**:
```css
.shadow-brutalist-sm → 2px 2px 0px #000
.shadow-brutalist → 4px 4px 0px #000
.shadow-brutalist-lg → 6px 6px 0px #000
```

**Found In**: 80+ instances

#### Affected Files:
| File | Issue | Count |
|------|-------|-------|
| `platform-connection-modal.tsx` | `shadow-2xl`, `shadow-lg` | 4 |
| `manual-invitation-modal.tsx` | `shadow-2xl` | 2 |
| `unified-wizard.tsx` | `shadow-2xl`, `shadow-lg` | 3 |
| `schedule-demo-modal.tsx` | `shadow-2xl` | 2 |
| `onboarding/screens/*` | `shadow-xl`, `shadow-2xl` | 15+ |
| `client-detail/EditClientModal.tsx` | `shadow-xl` | 1 |
| `client-detail/DeleteClientModal.tsx` | `shadow-xl` | 1 |
| `meta-page-permissions-modal.tsx` | `shadow-2xl` | 2 |

#### Examples:

```tsx
// ❌ WRONG - Soft Tailwind shadow
<div className="bg-white rounded-xl shadow-xl">

// ✅ CORRECT - Brutalist hard shadow
<div className="bg-white rounded-none border-2 border-black shadow-brutalist">

// ❌ WRONG - Extra large soft shadow
<div className="shadow-2xl">

// ✅ CORRECT - Large brutalist shadow
<div className="shadow-brutalist-2xl">
```

---

### 3. Over-Rounded Borders

**Problem**: Heavy use of `rounded-2xl`, `rounded-3xl` which conflicts with brutalist "hard edges" philosophy.

**Design System Says**:
```
rounded-none — Brutalist buttons, hard-edge cards
rounded-lg (0.75rem) — Standard cards, modals
rounded-xl — Form inputs, softer containers
rounded-full — Icon buttons, avatars
```

**Found In**: 40+ instances of `rounded-2xl` or higher

#### Affected Files:
| File | Issue |
|------|-------|
| `platform-connection-modal.tsx` | `rounded-xl` throughout |
| `invite/oauth-callback/page.tsx` | `rounded-2xl` |
| `onboarding/screens/welcome-screen.tsx` | `rounded-2xl` |
| `onboarding/screens/final-success-screen.tsx` | `rounded-full` with gradient |
| `success-link-card.tsx` | `rounded-2xl` |
| `unified-wizard.tsx` | `rounded-2xl` |
| `meta-page-permissions-modal.tsx` | `rounded-xl` |
| `ui/multi-select-combobox.tsx` | `rounded-xl` |

#### Examples:

```tsx
// ❌ WRONG - Too rounded for brutalist
<div className="rounded-2xl shadow-xl">

// ✅ CORRECT - Brutalist appropriate
<div className="rounded-lg border-2 border-black shadow-brutalist">

// ❌ WRONG - Fully rounded loses brutalist edge
<div className="rounded-full shadow-xl">

// ✅ CORRECT - Hard edges with brutalist shadow
<div className="rounded-none shadow-brutalist border-2 border-black">
```

---

## Medium Priority Issues

### 4. Hardcoded Color Values

**Problem**: Direct hex/rgb values instead of CSS variables.

**Found In**:
- `solution-section-new.tsx`: `text-[#FF6B35]` (should use `text-coral`)
- `integration-hero.tsx`: `bg-acid` (correct usage)
- `pricing-tier-card.tsx`: `bg-ink`, `border-teal` (correct usage)

#### Examples:

```tsx
// ❌ WRONG - Hardcoded hex
<span className="text-[#FF6B35]">Coral Text</span>

// ✅ CORRECT - CSS variable
<span className="text-coral">Coral Text</span>

// ❌ WRONG - Hardcoded background
<div className="bg-[#09090B]">

// ✅ CORRECT - CSS variable
<div className="bg-ink">
```

---

### 5. Inconsistent Button Usage

**Problem**: Buttons not using defined variants or using inline styles.

**Design System Button Variants**:
```typescript
variant: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'
       | 'brutalist' | 'brutalist-ghost'
       | 'brutalist-rounded' | 'brutalist-ghost-rounded'
```

**Found In**: Many components use `bg-indigo-600` directly instead of Button component with proper variant.

#### Affected Files:
- `access-requests/new/page.tsx`: Inline button styles
- `onboarding/agency/page.tsx`: `bg-indigo-600` inline
- `invite/oauth-callback/page.tsx`: Inline button styles

#### Examples:

```tsx
// ❌ WRONG - Inline button styling
<button className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg">
  Submit
</button>

// ✅ CORRECT - Using Button component
<Button variant="brutalist" size="lg">
  Submit
</Button>
```

---

### 6. Typography Inconsistencies

**Problem**: Not using the defined font families correctly.

**Design System Typography**:
```
font-dela — Display headlines, hero text
font-display — Section headings, subheadings
font-sans — Body text, UI elements
font-mono — Code, data, technical content
```

**Found In**:
- Heavy use of `font-bold` instead of semantic font classes
- Missing `font-dela` for hero text in some components
- Inconsistent heading hierarchy

#### Examples:

```tsx
// ❌ WRONG - Generic bold
<h1 className="text-3xl font-bold">Title</h1>

// ✅ CORRECT - Design system font
<h1 className="text-3xl font-dela">Title</h1>

// ❌ WRONG - Not using display font for subheadings
<h2 className="text-2xl font-semibold">Subheading</h2>

// ✅ CORRECT - Using display font
<h2 className="text-2xl font-display">Subheading</h2>
```

---

## Low Priority Issues

### 7. Missing Animation Utilities

**Design System Has**:
- `reveal-element reveal-up/down/left/right`
- `stagger-1` through `stagger-5`
- `hover-lift-brutalist`

**Issue**: Some components don't use reveal animations for entrance.

**Recommendation**: Add reveal animations to marketing/onboarding pages for more polished feel.

---

### 8. Inconsistent Spacing Patterns

**Design System Says**:
- Card padding: `p-6` (1.5rem) for standard cards
- Section spacing: `py-16` (4rem) between major sections
- Component gaps: `gap-4` (1rem) for related elements

**Found In**:
- Mix of `p-4`, `p-6`, `p-8` for similar components
- Inconsistent gap values

---

### 9. Missing Touch Target Sizes

**Design System Requirement**: Minimum 44×44px for all interactive elements.

**Found In**: Some buttons and interactive elements may fall below this threshold on mobile.

---

## Positive Findings

### What's Working Well ✅

1. **`pricing-tier-card.tsx`** - Excellent use of design tokens:
   - Uses `bg-ink`, `border-teal`, `text-paper`
   - Proper brutalist shadow application
   - Correct use of `font-dela` and `font-mono`

2. **`integration-hero.tsx`** - Correct usage:
   - `bg-acid` for kinetic elements
   - `shadow-brutalist` applied
   - Proper border usage

3. **Design system utilities are well-defined** in `globals.css`:
   - All brutalist shadows present
   - Color variables properly defined
   - Animation utilities complete

4. **Brutalist card utility** (`.brutalist-card`) is defined and used in some places

---

## Recommended Action Plan

### Phase 1: Critical Color Migration (Week 1-2)

1. **Create CSS variable mappings** for commonly used generic colors:
   ```css
   /* Temporary migration helpers */
   .bg-success { @apply bg-teal; }
   .bg-warning { @apply bg-acid; }
   .text-body { @apply text-ink; }
   .text-muted { @apply text-slate-600; }
   ```

2. **Audit and replace in priority order**:
   - Marketing/onboarding pages (highest visibility)
   - Modals and overlays
   - Settings pages
   - Dashboard components

### Phase 2: Shadow & Border Radius Updates (Week 2-3)

1. Replace `shadow-xl`, `shadow-2xl` with `shadow-brutalist-lg`, `shadow-brutalist-xl`
2. Audit `rounded-2xl`, `rounded-3xl` usage and replace with `rounded-lg` or `rounded-none`
3. Update modal components to use brutalist styling

### Phase 3: Component Standardization (Week 3-4)

1. Ensure all buttons use the `Button` component with proper variants
2. Standardize card styling across the app
3. Audit and fix typography hierarchy

### Phase 4: Polish & Details (Week 4)

1. Add reveal animations where missing
2. Ensure consistent spacing patterns
3. Verify touch target sizes
4. Run accessibility audit

---

## File-by-File Action List

### High Priority Files (Top 20)

| File | Priority | Main Issues |
|------|-----------|--------------|
| `auth-model-selector.tsx` | High | Generic colors (slate, indigo, green) |
| `platform-connection-modal.tsx` | High | Generic colors, soft shadows, over-rounded |
| `onboarding/screens/welcome-screen.tsx` | High | Gradients, over-rounded, generic colors |
| `onboarding/screens/final-success-screen.tsx` | High | Gradients, over-rounded, generic colors |
| `manual-invitation-modal.tsx` | High | Soft shadows |
| `unified-wizard.tsx` | High | Over-rounded, soft shadows |
| `schedule-demo-modal.tsx` | High | Soft shadows |
| `meta-page-permissions-modal.tsx` | High | Over-rounded, soft shadows |
| `ui/multi-select-combobox.tsx` | High | Over-rounded, soft shadows |
| `success-link-card.tsx` | High | Over-rounded, generic green |
| `access-requests/new/page.tsx` | Medium | Inline button styles |
| `access-requests/[id]/success/page.tsx` | Medium | Generic colors, gradients |
| `invite/oauth-callback/page.tsx` | Medium | Over-rounded, generic colors |
| `platforms/callback/page.tsx` | Medium | Generic colors |
| `client-detail/EditClientModal.tsx` | Medium | Soft shadows |
| `client-detail/DeleteClientModal.tsx` | Medium | Soft shadows |
| `client-detail/CreateClientModal.tsx` | Medium | Soft shadows |
| `settings/billing/cancel-subscription-modal.tsx` | Medium | Soft shadows |
| `CreateRequestModal.tsx` | Medium | Soft shadows |
| `solution-section-new.tsx` | Medium | Hardcoded colors |

---

## Design System Compliance Scorecard

| Category | Score | Notes |
|----------|-------|-------|
| Color Usage | 3/10 | Heavy reliance on generic Tailwind colors |
| Shadows | 4/10 | Soft shadows prevalent, brutalist shadows underutilized |
| Border Radius | 5/10 | Some over-rounding, but moderate compliance |
| Typography | 6/10 | Generally good, some inconsistencies |
| Button Variants | 5/10 | Many inline styles instead of component |
| Spacing | 7/10 | Fairly consistent |
| Animations | 6/10 | Some reveal usage, could be more widespread |
| **Overall** | **5.1/10** | **Significant deviation from design system** |

---

## Conclusion

The codebase has a **well-defined design system** but **poor adherence** to it in practice. The brutalist aesthetic is being undermined by:

1. Generic color usage (slate, indigo, purple) instead of brand colors
2. Soft shadows instead of hard brutalist shadows
3. Overly rounded borders conflicting with brutalist philosophy

**Recommendation**: A dedicated 2-3 week sprint to migrate components to the design system, starting with highest-visibility pages (marketing, onboarding, modals).

**Quick Win**: Update the most commonly used generic color classes to use CSS variables, which would immediately improve visual consistency.

---

**Next Steps**:
1. Review this audit with design/product team
2. Prioritize which components to update first
3. Create pull requests with before/after screenshots
4. Update documentation if design system needs clarification
