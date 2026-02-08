---
name: accessibility-compliance
description: WCAG 2.1 AA accessibility standards and implementation. Use when building UI components, reviewing accessibility, or fixing a11y issues.
---

# Accessibility Compliance (WCAG 2.1 AA)

## Core Principles (POUR)

### Perceivable
- Text alternatives for non-text content
- Captions for multimedia
- Content adaptable to different presentations
- Distinguishable (color contrast, text sizing)

### Operable
- Keyboard accessible
- Enough time to read/use content
- No seizure-inducing content
- Navigable

### Understandable
- Readable text
- Predictable behavior
- Input assistance

### Robust
- Compatible with assistive technologies
- Valid HTML

## Color Contrast

### Minimum Ratios
- Normal text (< 18pt): 4.5:1
- Large text (≥ 18pt or 14pt bold): 3:1
- UI components and graphics: 3:1

### Testing
```bash
# Use browser DevTools
# Chrome: Inspect > Accessibility > Contrast
# Or use axe DevTools extension
```

### Implementation
```tsx
// Use semantic color tokens
<p className="text-foreground">High contrast text</p>
<p className="text-muted-foreground">Secondary text (still meets 4.5:1)</p>

// Avoid color-only indicators
<Badge variant="error">
  <AlertCircle className="mr-1 h-3 w-3" />
  Error
</Badge>
```

## Keyboard Navigation

### Focus Management
```tsx
// Visible focus indicators
<Button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Click me
</Button>

// Skip links
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Focus Trapping (Modals)
```tsx
import { FocusTrap } from '@radix-ui/react-focus-trap';

<Dialog>
  <FocusTrap>
    <DialogContent>
      {/* Focus stays within modal */}
    </DialogContent>
  </FocusTrap>
</Dialog>
```

### Keyboard Shortcuts
```tsx
// Document keyboard shortcuts
<Tooltip>
  <TooltipTrigger asChild>
    <Button>Save (⌘S)</Button>
  </TooltipTrigger>
  <TooltipContent>
    <kbd>⌘</kbd> + <kbd>S</kbd>
  </TooltipContent>
</Tooltip>
```

## Semantic HTML

### Structure
```tsx
<main id="main-content">
  <article>
    <header>
      <h1>Page Title</h1>
    </header>
    
    <section aria-labelledby="section-heading">
      <h2 id="section-heading">Section Title</h2>
      <p>Content...</p>
    </section>
  </article>
  
  <aside aria-label="Related content">
    {/* Sidebar */}
  </aside>
</main>
```

### Heading Hierarchy
- One `<h1>` per page
- Don't skip levels (h1 → h3)
- Use headings for structure, not styling

## ARIA Patterns

### Buttons with Icons
```tsx
// Icon-only button
<Button aria-label="Close dialog" size="icon">
  <X aria-hidden="true" />
</Button>

// Button with icon and text
<Button>
  <Plus aria-hidden="true" className="mr-2" />
  Add Item
</Button>
```

### Live Regions
```tsx
// Announce dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// For errors
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

### Expandable Content
```tsx
<button
  aria-expanded={isOpen}
  aria-controls="panel-content"
  onClick={() => setIsOpen(!isOpen)}
>
  {isOpen ? 'Collapse' : 'Expand'}
</button>

<div id="panel-content" hidden={!isOpen}>
  {content}
</div>
```

## Forms

### Labels
```tsx
// Visible label
<div>
  <Label htmlFor="email">Email address</Label>
  <Input id="email" type="email" />
</div>

// Hidden label (icon input)
<div>
  <Label htmlFor="search" className="sr-only">Search</Label>
  <Input id="search" type="search" placeholder="Search..." />
</div>
```

### Error Messages
```tsx
<div>
  <Label htmlFor="password">Password</Label>
  <Input
    id="password"
    type="password"
    aria-invalid={!!error}
    aria-describedby={error ? 'password-error' : undefined}
  />
  {error && (
    <p id="password-error" className="text-sm text-destructive" role="alert">
      {error}
    </p>
  )}
</div>
```

### Required Fields
```tsx
<Label htmlFor="name">
  Name <span aria-hidden="true">*</span>
  <span className="sr-only">(required)</span>
</Label>
<Input id="name" required aria-required="true" />
```

## Motion & Animation

### Respect User Preferences
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// In React
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;
```

## Testing Checklist

- [ ] Keyboard navigation works (Tab, Shift+Tab, Enter, Escape)
- [ ] Focus indicators visible
- [ ] Color contrast meets minimums
- [ ] Screen reader announces content correctly
- [ ] No content relies on color alone
- [ ] Forms have proper labels and error messages
- [ ] Images have alt text
- [ ] Headings are hierarchical
- [ ] Skip links work
- [ ] Reduced motion respected
