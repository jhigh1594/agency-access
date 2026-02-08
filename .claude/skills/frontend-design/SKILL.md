---
name: frontend-design
description: Production-grade frontend design patterns. Use when building UI components, designing layouts, implementing design systems, or improving visual quality.
---

# Frontend Design Excellence

## Design System Foundation

### Color Tokens
```typescript
const colors = {
  brand: {
    50: '#f0f9ff',
    500: '#0ea5e9',
    900: '#0c4a6e'
  },
  semantic: {
    success: 'var(--color-green-500)',
    error: 'var(--color-red-500)',
    warning: 'var(--color-amber-500)',
    info: 'var(--color-blue-500)'
  }
};
```

### Spacing (8px Grid)
```typescript
const spacing = {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem'   // 48px
};
```

### Typography Scale
```css
/* Perfect Fourth (1.333) */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

## Component Patterns

### Card Component
```tsx
<Card className="p-6 space-y-4">
  <CardHeader>
    <CardTitle className="text-lg font-semibold">
      {title}
    </CardTitle>
    <CardDescription className="text-muted-foreground">
      {description}
    </CardDescription>
  </CardHeader>
  <CardContent>
    {children}
  </CardContent>
  <CardFooter className="flex justify-end gap-2">
    <Button variant="outline">Cancel</Button>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

### Form Layout
```tsx
<form className="space-y-6">
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input 
      id="email" 
      type="email" 
      placeholder="you@example.com"
      className="w-full"
    />
    {error && (
      <p className="text-sm text-destructive">{error}</p>
    )}
  </div>
  
  <Button type="submit" className="w-full">
    Continue
  </Button>
</form>
```

### Data Table
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map((item) => (
      <TableRow key={item.id}>
        <TableCell className="font-medium">{item.name}</TableCell>
        <TableCell>
          <Badge variant={item.status}>{item.status}</Badge>
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>...</DropdownMenu>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## Layout Patterns

### Dashboard Layout
```tsx
<div className="min-h-screen bg-background">
  <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
    <nav className="container flex h-16 items-center">
      {/* Logo, nav items, user menu */}
    </nav>
  </header>
  
  <div className="container flex gap-6 py-6">
    <aside className="hidden w-64 shrink-0 lg:block">
      {/* Sidebar navigation */}
    </aside>
    
    <main className="flex-1 space-y-6">
      {children}
    </main>
  </div>
</div>
```

### Responsive Grid
```tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {items.map((item) => (
    <Card key={item.id}>{/* ... */}</Card>
  ))}
</div>
```

## Animation & Micro-interactions

### Hover States
```css
.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

### Loading States
```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Processing...
    </>
  ) : (
    'Submit'
  )}
</Button>
```

### Skeleton Loading
```tsx
<div className="space-y-4">
  <Skeleton className="h-8 w-1/3" />
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-2/3" />
</div>
```

## Visual Hierarchy

### Emphasis Levels
1. **Primary**: Brand color, larger size, prominent position
2. **Secondary**: Muted color, standard size
3. **Tertiary**: Subtle color, smaller size, supporting role

### Whitespace
- Use generous padding inside containers
- Consistent gaps between related elements
- Larger gaps between sections
- Let content breathe

## Dark Mode

```tsx
// Use CSS variables that adapt
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">Secondary text</p>
  <div className="border-border">Bordered element</div>
</div>
```

## Performance

- Use `next/image` for optimized images
- Lazy load below-fold content
- Prefer CSS animations over JS
- Use `will-change` sparingly
- Avoid layout shifts (reserve space)
