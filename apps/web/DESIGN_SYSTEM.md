# Agency Access Platform — Design System

> **Version**: 1.2.1
> **Last Updated**: February 11, 2026
> **Aesthetic**: Acid Brutalism

---

## Overview

The Agency Access Platform uses a **hybrid design system** combining:
- **shadcn/ui** as the foundational component library
- **Custom "Acid Brutalism" aesthetic** for brand differentiation
- **Atomic design principles** for component composition

### Core Philosophy

**Be bold, be memorable, be intentional.**

Our design rejects generic SaaS aesthetics in favor of a distinctive brutalist approach that:
- Uses hard shadows and bold borders for visual impact
- Employs kinetic accent colors (acid green, electric purple) sparingly
- Maintains readability with high-contrast ink/paper surfaces
- Animates with purpose — one orchestrated reveal beats scattered effects

---

## Design Tokens

### Color Palette

Our color system uses CSS custom properties defined in `globals.css`. All colors support light/dark mode via RGB values.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRIMARY SURFACES                            │
├─────────────────────────────────────────────────────────────────────┤
│  --ink      #09090B  │ Deep black for backgrounds                  │
│  --paper    #FAFAFA  │ Off-white for surfaces                     │
├─────────────────────────────────────────────────────────────────────┤
│                          BRAND COLORS                               │
├─────────────────────────────────────────────────────────────────────┤
│  --coral    #FF6B35  │ AuthHub Coral — primary accent (10% use)   │
│  --teal     #00A896  │ AuthHub Teal — secondary accent (5% use)   │
├─────────────────────────────────────────────────────────────────────┤
│                        BRUTALIST ACCENTS                            │
├─────────────────────────────────────────────────────────────────────┤
│  --acid     #CCFF00  │ Acid green — kinetic elements (2% use)     │
│  --electric  #8B5CF6  │ Electric purple — hover states             │
└─────────────────────────────────────────────────────────────────────┘
```

#### Usage Guidelines

| Color | When to Use | Examples |
|-------|-------------|----------|
| `--ink` | Page backgrounds, footer, heavy sections | Hero background, dashboard sidebar |
| `--paper` | Cards, modals, content areas | Form containers, data tables |
| `--coral` | Primary CTAs, key actions | "Create Access Request" button |
| `--teal` | Success states, completion | "Connected successfully" badge |
| `--acid` | Animation highlights, attention-grabbing elements | Loading spinners, reveal animations |
| `--electric` | Hover states, interactive feedback | Button hover borders |

#### Semantic Colors (Tailwind Integration)

```css
/* Mapped in tailwind.config.ts */
background: rgb(var(--background) / <alpha-value>)
foreground: rgb(var(--foreground) / <alpha-value>)
primary: rgb(var(--primary) / <alpha-value>)
secondary: rgb(var(--secondary) / <alpha-value>)
muted: rgb(var(--muted) / <alpha-value>)
accent: rgb(var(--accent) / <alpha-value>)
border: rgb(var(--border) / <alpha-value>)
ring: rgb(var(--ring) / <alpha-value>)
```

### Typography

We use a **three-font system** for hierarchy and personality:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Font Family    │ Source        │ Usage                            │
├─────────────────────────────────────────────────────────────────────┤
│  dela           │ Custom        │ Display headlines, hero text     │
│                 │ (var(--font-dela))                                │
├─────────────────────────────────────────────────────────────────────┤
│  display        │ Geist         │ Section headings, subheadings    │
│                 │ (var(--font-display))                             │
├─────────────────────────────────────────────────────────────────────┤
│  sans           │ System UI      │ Body text, UI elements           │
│                 │ (var(--font-sans))                                │
├─────────────────────────────────────────────────────────────────────┤
│  mono           │ IBM Plex Mono │ Code, data, technical content    │
│                 │ (var(--font-mono))                                │
└─────────────────────────────────────────────────────────────────────┘
```

#### Type Scale

| Element | Size | Weight | Font Family | Line Height |
|---------|------|--------|-------------|-------------|
| Hero (fluid) | clamp(2rem, 8vw, 4.5rem) | Bold | dela | 1.05 |
| H1 | 4.5rem | Bold | dela | 1.1 |
| H2 | 3rem | Semibold | display | 1.2 |
| H3 | 2rem | Semibold | display | 1.3 |
| Body | 1rem | Regular | sans | 1.6 |
| Small | 0.875rem | Regular | sans | 1.5 |
| Label | 0.8125rem | Medium | sans | 1.4 |

### Spacing

Our spacing system follows Tailwind's defaults with brutalist hard edges:

```
0 → 0px      4 → 1rem      8 → 2rem
1 → 0.25rem  5 → 1.25rem   10 → 2.5rem
2 → 0.5rem   6 → 1.5rem    12 → 3rem
3 → 0.75rem  7 → 1.75rem    16 → 4rem
```

**Key spacing patterns:**
- **Card padding**: `p-6` (1.5rem) for standard cards
- **Section spacing**: `py-16` (4rem) between major sections
- **Component gaps**: `gap-4` (1rem) for related elements
- **Touch targets**: `min-h-[44px]` minimum for all interactive elements

### Border Radius

Brutalist design uses **minimal rounding** for hard edges:

```
sm: calc(var(--radius) - 4px)  → ~0.25rem
md: calc(var(--radius) - 2px)  → ~0.5rem
lg: var(--radius)              → 0.75rem
xl: 1rem
2xl: 1.5rem
full: 9999px
```

**Usage:**
- `rounded-none` — Brutalist buttons, hard-edge cards
- `rounded-lg` (0.75rem) — Standard cards, modals
- `rounded-xl` — Form inputs, softer containers
- `rounded-full` — Icon buttons, avatars

### Shadows

**Hard shadows** define our brutalist aesthetic — no blur, pure offset:

```css
/* Defined in globals.css */
--shadow-hard: 0 0 0; /* Pure black */

/* Brutalist shadow utilities */
.shadow-brutalist-sm     → 2px 2px 0px #000
.shadow-brutalist        → 4px 4px 0px #000
.shadow-brutalist-lg     → 6px 6px 0px #000
.shadow-brutalist-xl     → 8px 8px 0px #000
.shadow-brutalist-2xl    → 12px 12px 0px #000
.shadow-brutalist-3xl    → 16px 16px 0px #000
```

**When to use:**
- `shadow-brutalist` (4px) — Default brutalist cards, buttons
- `shadow-brutalist-lg` (6px) — Hover states
- `shadow-brutalist-xl` (8px+) — Special emphasis, featured elements

**Standard shadows** for non-brutalist components:
- `shadow-sm` → Subtle elevation (tooltips, dropdowns)
- `shadow-md` → Standard elevation (modals)
- `shadow-lg` → Prominent elevation (popovers)

---

## Component System

### shadcn/ui Foundation

We use **shadcn/ui patterns** as our base component architecture:

```
src/components/ui/
├── card.tsx              # shadcn/ui base
├── button.tsx            # Extended with brutalist variants
├── status-badge.tsx      # Custom, follows shadcn patterns
├── platform-icon.tsx     # Custom
└── [components]          # Custom components using cn() utility
```

#### shadcn Utilities

```typescript
import { cn } from "@/lib/utils"

// Use cn() for conditional className merging
<div className={cn(
  "base-styles",
  isActive && "active-styles",
  className
)} />
```

### Button Component

Our button extends shadcn patterns with brutalist variants:

```typescript
variant: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'
        | 'brutalist' | 'brutalist-ghost'
        | 'brutalist-rounded' | 'brutalist-ghost-rounded'

size: 'sm' | 'md' | 'lg' | 'xl' | 'icon'
```

#### Button Hover Behavior

**Standard buttons** (primary, success, warning, danger):
- Always visible brutalist shadow (`shadow-brutalist`)
- Hover lifts button 2px up (`hover:translate-y-[-2px]`)
- Shadow does NOT change on hover — consistent elevation
- Clear, refined feedback without overwhelming

**Brutalist buttons**:
- Hard shadow with diagonal shift effect
- Hover removes shadow, translates diagonally
- Used sparingly for hero CTAs

```tsx
// Standard button: shadow + lift on hover
<Button variant="primary">
  {/* Always has shadow-brutalist, lifts 2px on hover */}
</Button>
```

### Button Shadows & Hover

**Consistent brutalist shadows with refined hover**:

| Variant | Shadow (Always Visible) | Hover Effect |
|---------|---------------------|-------------|
| primary | `shadow-brutalist` | Lifts 2px up (`hover:translate-y-[-2px]`) |
| success | `shadow-brutalist` | Lifts 2px up (`hover:translate-y-[-2px]`) |
| warning | `shadow-brutalist` | Lifts 2px up (`hover:translate-y-[-2px]`) |
| danger | `shadow-brutalist` | Lifts 2px up (`hover:translate-y-[-2px]`) |

```tsx
// Button: visible shadow + subtle lift on hover
<Button variant="primary">
  {/* Always shows shadow-brutalist, lifts 2px on hover */}
</Button>
```

**Design rationale:**
- Brutalist shadow (`shadow-brutalist`) provides consistent presence
- Subtle 2px lift (`-translate-y-[-2px]`) gives clear feedback
- Shadow does NOT grow — stable, refined elevation
- Reserve brutalist hard shadows for hero CTAs and marketing moments

#### Variant Guidelines

| Variant | When to Use |
|---------|-------------|
| `primary` | Main CTAs, primary actions in flow |
| `secondary` | Alternative actions, "Cancel" buttons |
| `success` | Completion, confirmation states |
| `danger` | Destructive actions, "Delete", "Disconnect" |
| `ghost` | Tertiary actions, icon-only buttons |
| `brutalist` | Hero CTAs, marketing pages — **use sparingly** |
| `brutalist-ghost` | Outlined brutalist style for less emphasis |
| `brutalist-rounded` | Softer brutalist for card CTAs |
| `brutalist-ghost-rounded` | Rounded outlined variant |

**Golden rule**: One brutalist button per view. Let it stand out.

### Card Component

Uses pure shadcn/ui Card composition:

```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

#### Card Patterns

**Standard Card** (shadcn base):
```tsx
<div className="rounded-lg border bg-card text-card-foreground shadow-sm">
```

**Brutalist Card** (custom utility):
```tsx
<div className="brutalist-card">
  {/* Applies: border-2, border-black, shadow-[4px_4px_0px_#000] */}
</div>
```

**Clean Card** (static, no hover):
```tsx
<div className="clean-card">
  {/* Applies: subtle shadow, no hover lift */}
</div>
```

**Why static:** Settings and content cards should remain static to avoid "nested hover" confusion when containing interactive elements (buttons, links). The `clean-card` pattern provides subtle elevation without competing with interactive children.

### Badge Components

#### StatusBadge

```typescript
type: 'connected' | 'pending' | 'error' | 'warning' | 'info'
```

#### HealthBadge

```typescript
status: 'healthy' | 'expiring' | 'expired' | 'unknown'
```

**Usage**: Display connection status, token health, platform states.

---

## Animation System

### Philosophy

**One orchestrated reveal > scattered micro-interactions.**

Focus animation effort on:
1. **Page load** — Staggered reveal sequence
2. **Scroll triggers** — Elements reveal as user scrolls
3. **Hover states** — Instant feedback for interaction

### Animation Utilities

#### Reveal Animations

```tsx
// Add to elements that should animate in
<div className="reveal-element reveal-up">
  Content reveals upward on scroll
</div>

<div className="reveal-element reveal-down stagger-1">
  Content reveals downward with 100ms delay
</div>
```

**Available reveal classes:**
- `reveal-up` — Fade in + translate Y (3rem → 0)
- `reveal-down` — Fade in + translate Y (-3rem → 0)
- `reveal-left` — Fade in + translate X (3rem → 0)
- `reveal-right` — Fade in + translate X (-3rem → 0)

**Stagger delays:**
- `stagger-1` through `stagger-5` — 100ms to 500ms delays

#### Hover Effects

```tsx
// Brutalist hover lift
<div className="hover-lift-brutalist">
  {/* Lifts 2px, shadow grows on hover */}
</div>

// Brutalist button hover
<button className="brutalist-btn">
  {/* Hard shadow grows, element shifts on hover */}
</button>
```

#### Continuous Animations

```tsx
// Floating elements
<div className="animate-float-pillar">
  {/* Gentle up/down float, 5s duration */}
</div>

// Marquee / scrolling
<div className="animate-marquee">
  {/* Continuous horizontal scroll, 30s loop */}
</div>
```

### Animation Best Practices

1. **Respect `prefers-reduced-motion`** — All animations respect this automatically
2. **Wait for `animations-ready`** — Animations only fire after hydration to prevent SSR mismatch
3. **Use CSS over JS** — Prefer CSS animations for performance
4. **One hero animation per page** — Don't compete with yourself

### Animation Anti-Patterns (Learned February 2026)

❌ **DON'T use raw `reveal-element` classes directly** — Causes blank pages without Intersection Observer
```tsx
// WRONG — Element stays hidden because no Intersection Observer adds `visible` class
<div className="reveal-element reveal-up">
  <Content />
</div>
```

✅ **DO use the `Reveal` component** — Properly handles Intersection Observer
```tsx
// CORRECT — Component adds `visible` class when element enters viewport
import { Reveal } from '@/components/marketing/reveal';

<Reveal direction="up">
  <Content />
</Reveal>
```

❌ **DON'T apply hover to containers with interactive elements inside** — Creates confusing "double hover"
```tsx
// WRONG — Both card AND button have hover effects
<div className="clean-card hover:shadow-xl">  {/* Card hover */}
  <Button>Save</Button>  {/* Button ALSO has hover */}
</div>
```

✅ **DO keep containers static when containing interactive elements** — Clear, single hover target
```tsx
// CORRECT — Only button has hover effect
<div className="clean-card">  {/* Static container */}
  <Button>Save</Button>  {/* Clear hover target */}
</div>
```

**Why this matters:**
- **Clarity over density** — Users should immediately know which element is interactive
- **Feedback is immediate** — Single, clear hover states prevent confusion
- **Consistency creates confidence** — Predictable patterns reduce cognitive load

---

## Layout Patterns

### Container Widths

```tsx
// Standard content container
<div className="container mx-auto px-4 max-w-7xl">
  {/* Content */}
</div>

// Narrow content (forms, focused reading)
<div className="container mx-auto px-4 max-w-2xl">
  {/* Content */}
</div>

// Wide content (dashboards, data tables)
<div className="container mx-auto px-4 max-w-full">
  {/* Content */}
</div>
```

### Section Spacing

```tsx
// Standard vertical rhythm
<section className="py-16 md:py-24">
  {/* Section content */}
</section>
```

### Grid Systems

```tsx
// Responsive card grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>

// Sidebar + content
<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
  <aside className="lg:col-span-1">{/* Sidebar */}</aside>
  <main className="lg:col-span-3">{/* Content */}</main>
</div>
```

---

## Icon System

### Icon Libraries

| Library | Usage | Examples |
|---------|-------|----------|
| `lucide-react` | UI icons | Menu, search, close, chevron |
| `simple-icons` | Platform logos | Meta, Google, LinkedIn, TikTok |
| Custom SVGs | Brand elements | AuthHub logo, custom graphics |

### PlatformIcon Component

```tsx
<PlatformIcon platform="meta" size={32} />
<PlatformIcon platform="google_ads" size={24} variant="square" />
```

### Icon Sizing

```
16px → Inline icons, small badges
20px → Standard UI icons
24px → Large UI icons, list items
32px → Card headers, featured icons
48px → Hero section icons
```

---

## Forms & Inputs

### Input Styling

```tsx
// Standard input
<input className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />

// Brutalist input
<input className="w-full px-4 py-3 border-2 border-black rounded-none shadow-brutalist-sm focus:shadow-brutalist focus:outline-none" />
```

### Form Patterns

1. **Always use labels** — Never rely on placeholder-only
2. **Group related fields** — Use fieldset/legend when appropriate
3. **Show validation state** — Green for success, red for error
4. **Keyboard navigation** — Ensure proper tab order

---

## Responsive Design

### Breakpoints

```
xs: 480px   // Small mobile (custom)
sm: 640px   // Mobile landscape
md: 768px   // Tablet
lg: 1024px  // Laptop
xl: 1280px  // Desktop
```

### Mobile-First Approach

Write mobile styles first, use `md:` and up for larger screens:

```tsx
<div className="text-base md:text-lg lg:text-xl">
  {/* Scales up with screen size */}
</div>
```

### Touch Targets

**Minimum 44×44px** for all interactive elements (iOS HIG):

```tsx
<button className="min-h-[44px] px-6">
  {/* Meets touch target minimum */}
</button>
```

### Safe Areas

Handle notched devices (iPhone X+):

```tsx
<div className="pb-safe pt-safe">
  {/* Respects safe area insets */}
</div>
```

---

## Accessibility

### Color Contrast

- **WCAG AA minimum** — 4.5:1 for normal text
- **WCAG AAA target** — 7:1 for important text
- Our ink/paper combination exceeds both standards

### Focus States

All interactive elements must show focus:

```tsx
<button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
  {/* Visible keyboard focus */}
</button>
```

### Screen Readers

- Use semantic HTML (`<nav>`, `<main>`, `<article>`)
- Provide `aria-label` for icon-only buttons
- Use `aria-live` for dynamic content updates

### Motion Preferences

Respect `prefers-reduced-motion` — built into all our animations:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Dark Mode

### Implementation

Dark mode uses CSS custom properties that swap values based on `class="dark"` on `<html>`.

**Note**: Our brutalist aesthetic is **light-first**. Dark mode support is planned but not yet implemented.

### Future Pattern

```tsx
// When dark mode is added, use dark: prefix
<div className="bg-background dark:bg-[#09090B]">
  {/* Light: white, Dark: ink */}
</div>
```

---

## Extending the Design System

### Adding a New Component

1. **Follow shadcn patterns** — Use `cn()`, forwardRef, proper types
2. **Use design tokens** — Reference CSS variables, not hard-coded values
3. **Support variants** — Use class-variance-authority (CVA) if needed
4. **Document usage** — Add examples to this file
5. **Test accessibility** — Keyboard, screen reader, contrast

### Adding a New Color

1. Define CSS variable in `globals.css`
2. Add to `tailwind.config.ts` if needed as utility
3. Document usage in this file
4. Check contrast ratios

### Creating a New Animation

1. Add `@keyframes` to `globals.css`
2. Create utility class if reusable
3. Add to this file's animation section
4. Test with `prefers-reduced-motion`

---

## Resources

### Files Reference

| File | Purpose |
|------|---------|
| `globals.css` | CSS custom properties, utility classes |
| `tailwind.config.ts` | Tailwind configuration, custom theme |
| `src/lib/utils.ts` | `cn()` utility function |
| `src/components/ui/` | Component library |

### External Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Radix UI Primitives](https://www.radix-ui.com)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Changelog

### v1.2.1 (February 11, 2026)
- **Fixed button shadow behavior** — Shadow now always visible (`shadow-brutalist`)
- **Refined hover to lift-only** — 2px lift (`-translate-y-[-2px]`), no shadow growth
- **Updated documentation** — Clarified shadow + lift behavior

### v1.2.0 (February 11, 2026)
- **Refined button hover behavior** — Subtle shadows with lift effect (`-translate-y-px`)
- **Reduced visual weight** — Less aggressive elevation for settings and forms
- **Updated documentation** — Button shadow consistency section revised

### v1.1.0 (February 11, 2026)
- **Added Animation Anti-Patterns section** — Documented reveal animation and nested hover learnings
- **Updated Button shadow consistency** — All action buttons now use brutalist hard shadows
- **Fixed Settings page reveal issue** — Documented proper use of `Reveal` component
- **Fixed nested hover anti-pattern** — Removed `.clean-card:hover` to prevent double hover effects
- **Updated `clean-card` pattern** — Now static (no hover) for clearer interaction feedback

### v1.0.0 (February 10, 2026)
- Initial design system documentation
- Centralized Acid Brutalism tokens
- Documented shadcn/ui integration
- Established animation system guidelines
- Defined component usage patterns
