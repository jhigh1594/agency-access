# Mobile UX Optimization Plan - OAuth Marketing Platform

## Executive Summary

**Goal**: Transform the desktop-first marketing site into a mobile-first experience optimized for 375px-480px screens while maintaining desktop consistency and adding modern mobile aesthetics.

**Current State Analysis**:
- Desktop-first responsive approach with Tailwind breakpoints (sm:640px, md:768px, lg:1024px, xl:1280px)
- 12 marketing components identified across the landing page
- Hidden elements on mobile (features mockups in `features-section.tsx`)
- Complex dashboard mockup in hero with layered floating overlays
- Using Geist font (modern sans-serif) and Fraunces (display serif)
- Framer Motion animations throughout
- Primary color: #FF6B35 (Coral), Secondary: #00A896 (Teal)

**Key Issues Identified**:
1. No dedicated mobile breakpoint below 640px (sm)
2. Touch targets not optimized for 44x44px minimum
3. Typography scales too large for 375px screens
4. Dashboard mockup complex responsive behavior may break on small screens
5. Hidden mobile elements reduce visual engagement
6. No mobile-specific micro-interactions or gestures

---

## 1. Mobile-Specific Design System

### 1.1 Typography Scale for 375px-480px

**Current Issue**: Typography uses `sm:` breakpoints that start at 640px, leaving 375-480px devices with desktop-sized text.

**Solution**: Add dedicated mobile breakpoint utilities in `tailwind.config.ts`:

```typescript
// Add to tailwind.config.ts theme.extend
screens: {
  'xs': '475px',  // Between mobile and sm
  // Existing: sm (640px), md (768px), lg (1024px), xl (1280px)
}
```

**Typography Scale**:

```css
/* Add to apps/web/src/app/globals.css */

/* Mobile-specific typography utilities */
.text-mobile-hero {
  font-size: clamp(2.5rem, 8vw, 3.5rem); /* 40px - 56px */
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.text-mobile-h1 {
  font-size: clamp(2rem, 6vw, 2.5rem); /* 32px - 40px */
  line-height: 1.15;
}

.text-mobile-h2 {
  font-size: clamp(1.5rem, 5vw, 2rem); /* 24px - 32px */
  line-height: 1.2;
}

.text-mobile-body {
  font-size: clamp(1rem, 2.5vw, 1.125rem); /* 16px - 18px */
  line-height: 1.6;
}

.text-mobile-caption {
  font-size: clamp(0.75rem, 2vw, 0.875rem); /* 12px - 14px */
}
```

**Implementation Pattern**:
```tsx
{/* Example: hero-section.tsx headline */}
<h1 className="font-display text-mobile-hero sm:text-5xl lg:text-8xl tracking-tight">
  Client Access in <br />
  <span className="italic text-primary">5 Minutes.</span> Not 5 Days.
</h1>
```

### 1.2 Touch Target System

**Current Issue**: Button sizes use padding that may result in <44px touch targets on mobile.

**Solution**: Enforce minimum touch targets with mobile-specific overrides:

```css
/* Add to globals.css */
@layer utilities {
  .touch-target-min {
    min-height: 44px;
    min-width: 44px;
  }
  
  .touch-target-comfortable {
    min-height: 48px;
    min-width: 48px;
  }
  
  /* Mobile spacing system */
  .mobile-gap-2 { gap: clamp(0.5rem, 2vw, 1rem); }
  .mobile-gap-3 { gap: clamp(0.75rem, 3vw, 1.5rem); }
  .mobile-gap-4 { gap: clamp(1rem, 4vw, 2rem); }
  
  .mobile-p-4 { padding: clamp(1rem, 4vw, 2rem); }
  .mobile-p-6 { padding: clamp(1.5rem, 6vw, 2.5rem); }
}
```

**Button Component Updates** (`apps/web/src/components/ui/button.tsx`):

```typescript
// Update sizeStyles object to include mobile sizes
const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-4 py-2.5 text-sm rounded-lg touch-target-min', // Added min-height
  md: 'px-6 py-3 text-base rounded-xl touch-target-comfortable',
  lg: 'px-8 py-4 text-lg rounded-xl min-h-[52px]', // Explicit mobile size
  xl: 'px-10 py-4 text-xl rounded-2xl min-h-[56px] sm:py-5 sm:px-12', // Mobile smaller
  icon: 'p-0 w-11 h-11 rounded-full touch-target-min', // Increased from 40px
};
```

### 1.3 Spacing System for Mobile

**Pattern**: Use `clamp()` for fluid spacing that scales between 375px and 640px:

```tsx
{/* Instead of fixed spacing */}
<div className="gap-4 sm:gap-6 lg:gap-8">

{/* Use fluid spacing */}
<div className="gap-[clamp(1rem,4vw,2rem)]">
```

**Mobile Spacing Scale**:
- `mobile-space-1`: 4px - 8px (clamp(0.25rem, 1.5vw, 0.5rem))
- `mobile-space-2`: 8px - 16px (clamp(0.5rem, 2.5vw, 1rem))
- `mobile-space-3`: 12px - 24px (clamp(0.75rem, 3.5vw, 1.5rem))
- `mobile-space-4`: 16px - 32px (clamp(1rem, 4.5vw, 2rem))
- `mobile-space-6`: 24px - 40px (clamp(1.5rem, 6vw, 2.5rem))

### 1.4 Color/Theme Mobile Considerations

**Enhanced Contrast for Mobile**: Small screens need higher contrast for readability.

```css
/* Add to globals.css */
@media (max-width: 640px) {
  :root {
    --foreground: 5 5 5; /* Darker for better contrast */
    --muted-foreground: 75 75 75; /* More visible muted text */
  }
  
  /* Enhance primary button shadow for depth */
  .bg-primary {
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
  }
}
```

---

## 2. Component-by-Component Optimization Strategy

### 2.1 Hero Section (`hero-section.tsx`)

**Current Issues**:
- Complex dashboard mockup with floating overlay may break on mobile
- Typography too large for 375px screens
- Eyebrow badge may be too small to tap
- CTA buttons stack but could be more prominent

**Optimizations**:

```tsx
// 1. Typography updates
<motion.h1 variants={item} className="font-display text-mobile-hero sm:text-7xl lg:text-8xl tracking-tight text-foreground mb-6 sm:mb-8">
  Client Access in <br />
  <span className="italic text-primary">5 Minutes.</span> Not 5 Days.
</motion.h1>

// 2. Subheadline optimization
<motion.p variants={item} className="text-mobile-body sm:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
  The easy button for agency access to client accounts.
</motion.p>

// 3. Mobile-optimized eyebrow badge with larger touch area
<motion.div variants={item} className="mb-4 sm:mb-6 inline-flex items-center rounded-full border border-border bg-card/50 px-4 py-2 sm:py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground shadow-sm touch-target-min">
  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-primary mr-2 animate-pulse" />
  <span className="hidden sm:inline">Join 2,400+ marketing agencies</span>
  <span className="sm:hidden">2,400+ agencies</span>
</motion.div>

// 4. Dashboard mockup - simplify for mobile
<div className="relative bg-white border border-border rounded-2xl sm:rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] overflow-hidden aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9]">
  {/* On mobile: Simplified sidebar */}
  <div className="flex h-[calc(100%-48px)]">
    <div className="w-12 sm:w-16 md:w-56 border-r border-border bg-warm-gray/5 p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Hide sidebar labels on mobile, show icons only */}
      <div className="h-4 w-8 bg-border/40 rounded-full sm:hidden" />
      <div className="h-5 w-32 bg-border/40 rounded-full hidden sm:block" />
      
      {/* Mobile: Icon-only nav items */}
      <div className="space-y-3 pt-2 sm:pt-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex gap-2 sm:gap-4 items-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-border/20 flex-shrink-0" />
            <div className="h-2 w-20 bg-border/10 rounded hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
    
    {/* Main content - reduce padding on mobile */}
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-10">
      {/* Reduce number of visible items on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
        {/* Show only 2 cards on mobile, 3 on larger */}
        {[1, 2].map(i => (
          <div key={i} className="h-24 sm:h-32 bg-warm-gray/10 border border-border rounded-xl sm:rounded-2xl p-3 sm:p-6 space-y-2 sm:space-y-4">
            <div className="h-1.5 sm:h-2 w-12 sm:w-16 bg-border/20 rounded" />
            <div className="h-6 sm:h-8 w-16 sm:w-24 bg-border/30 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
  
  {/* Floating overlay - scale down on mobile */}
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] sm:w-full max-w-xs sm:max-w-sm bg-white/90 backdrop-blur-xl border border-border rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-[0_48px_96px_-12px_rgba(0,0,0,0.15)] scale-95 sm:scale-100">
    {/* Simplified mobile content */}
    <div className="flex justify-center mb-4 sm:mb-8">
      <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/30 relative">
        <GlobeIcon size={28} sm:size={40} />
        <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-secondary border-3 sm:border-4 border-white animate-bounce" />
      </div>
    </div>
    <h3 className="text-center font-display text-2xl sm:text-3xl mb-2 sm:mb-3">Connect Platforms</h3>
    <p className="text-center text-muted-foreground mb-6 sm:mb-10 text-sm sm:text-base font-medium px-2">
      AuthHub is requesting access to:
    </p>
    <div className="space-y-2.5 sm:space-y-4 mb-6 sm:mb-10">
      {['Meta Ads', 'Google Ads', 'GA4'].map(p => (
        <div key={p} className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-warm-gray/20 border border-border/50">
          <span className="text-xs sm:text-sm font-bold">{p}</span>
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-secondary/10 flex items-center justify-center">
            <ShieldCheckIcon size={14} sm:size={16} color="rgb(var(--secondary))" />
          </div>
        </div>
      ))}
    </div>
    <Button variant="primary" className="w-full rounded-xl sm:rounded-2xl h-12 sm:h-14 text-sm sm:text-base font-bold shadow-xl shadow-primary/20">
      Grant Access
    </Button>
  </div>
</div>

// 5. CTA buttons - full width on mobile
<motion.div variants={item} className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center w-full max-w-md mx-auto">
  <SignUpButton mode="modal">
    <Button variant="primary" size="xl" className="rounded-full shadow-2xl shadow-primary/20 flex-1 sm:flex-auto text-base sm:text-xl" rightIcon={<ArrowRightIcon size={18} />}>
      Start Free Trial
    </Button>
  </SignUpButton>
  <Button variant="ghost" size="xl" className="rounded-full font-bold uppercase tracking-widest text-[10px] sm:text-xs h-14 sm:h-auto">
    Watch Demo
  </Button>
</motion.div>
```

**Key Changes**:
1. Use `text-mobile-hero` for fluid typography
2. Simplify dashboard mockup on mobile (hide sidebar labels, reduce cards)
3. Scale down floating overlay to 90% width, reduce padding
4. Make CTAs full width on mobile for better touch targets
5. Hide "marketing agencies" text on small mobile, show abbreviations

### 2.2 Features Section (`features-section.tsx`)

**Current Issues**:
- Mockups hidden on mobile (`<div className="hidden sm:block">`)
- Grid goes to single column but cards aren't optimized
- Icon size too small for touch interaction

**Optimizations**:

```tsx
// 1. Replace hidden mockups with mobile-friendly visual indicators
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
  {features.map((feature, i) => (
    <motion.div
      key={feature.title}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.1 }}
      className="clean-card p-6 sm:p-8 flex gap-4 sm:gap-8 group"
    >
      <div className="flex-1 min-w-0">
        {/* Mobile: Larger, tappable icon area */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-0 -ml-3 sm:ml-0 w-16 h-16 sm:w-auto sm:h-auto rounded-2xl sm:rounded-none bg-primary/5 group-hover:bg-primary/10 transition-colors duration-300 touch-target-min">
          <feature.icon size={28} className="text-foreground sm:group-hover:scale-105 transition-transform duration-300" strokeWidth={1.5} />
        </div>
        <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3">{feature.title}</h3>
        <p className="text-muted-foreground leading-relaxed text-sm">{feature.description}</p>
      </div>
      
      {/* Mobile: Simplified badge instead of full mockup */}
      <div className="hidden sm:block w-32 h-32 flex-shrink-0">
        <div className="w-full h-full group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500">
          {feature.mockup}
        </div>
      </div>
      
      {/* Mobile: Show compact icon badge */}
      <div className="sm:hidden flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-warm-gray/30 flex items-center justify-center">
          <feature.icon size={20} className="text-muted-foreground" strokeWidth={1.5} />
        </div>
      </div>
    </motion.div>
  ))}
</div>
```

**Alternative**: Create mobile-specific mini-mockups:

```tsx
// Add mobile-specific simplified visual for each feature
const mobileVisuals = {
  'Single Branded Link': (
    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
      <Link2 size={20} className="text-primary" />
    </div>
  ),
  '5-Minute Setup': (
    <div className="flex gap-1">
      {[1, 2, 3].map(i => (
        <div key={i} className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-secondary' : 'bg-border'}`} />
      ))}
    </div>
  ),
  // ... etc
};
```

### 2.3 How It Works Section (`how-it-works-section.tsx`)

**Current Issues**:
- Steps card grid not optimized for mobile scroll
- Step badges too small
- CTA buttons need better mobile touch targets

**Optimizations**:

```tsx
// 1. Main card - reduce mobile padding
<div className="bg-card border border-border/60 rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-6 sm:p-8 md:p-12 lg:p-16">

// 2. Stack steps vertically on mobile with horizontal scroll hint
<div className="flex flex-col gap-4 sm:gap-6">
  {steps.map((step, index) => (
    <motion.div
      key={step.number}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 * index + 0.2 }}
      className="bg-white border border-border/60 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20"
    >
      {/* Step Badge - larger on mobile */}
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex-shrink-0">
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 sm:px-3 sm:py-1 touch-target-min">
            <span className="text-[10px] sm:text-xs font-bold text-primary">
              {step.number}
            </span>
          </div>
        </div>
        
        {/* Content - improve tap spacing */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-xl font-bold text-foreground mb-1.5 sm:mb-2">
            {step.title}
          </h3>
          <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
            {step.description}
          </p>
        </div>
      </div>
    </motion.div>
  ))}
</div>

// 3. CTA buttons - full width on mobile
<motion.div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
  <SignUpButton mode="modal">
    <Button 
      variant="primary" 
      size="lg" 
      className="rounded-xl shadow-lg shadow-primary/20 flex-1 sm:flex-auto touch-target-comfortable"
      rightIcon={<ArrowRightIcon size={16} />}
    >
      Get Started
    </Button>
  </SignUpButton>
  <Button 
    variant="secondary" 
    size="lg" 
    className="rounded-xl flex-1 sm:flex-auto touch-target-comfortable"
  >
    Learn More
  </Button>
</motion.div>
```

### 2.4 Pain Section (`pain-section.tsx`)

**Current Issues**:
- Chat bubbles have `max-w-[85%]` which may be too wide on 375px
- Message text could be larger for readability
- Illustration may need better mobile sizing

**Optimizations**:

```tsx
// 1. Chat bubbles - reduce max width on mobile, increase text size
{messages.map((msg, i) => (
  <motion.div
    key={i}
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay: i * 0.2 }}
    className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl max-w-[75%] sm:max-w-[85%] border ${
      msg.sender === 'Agency' 
        ? 'bg-white border-border shadow-sm' 
        : 'bg-primary/5 border-primary/10 ml-auto'
    }`}
  >
    <p className="font-medium text-foreground text-sm sm:text-sm sm:text-base leading-relaxed">
      {msg.text}
    </p>
    <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-1.5 sm:mt-2 block uppercase tracking-[0.15em] sm:tracking-[0.2em] font-bold opacity-60">
      {msg.sender}
    </span>
  </motion.div>
))}

// 2. Illustration container - better mobile sizing
<div className="flex-1 relative w-full aspect-[4/3] sm:aspect-auto sm:h-[400px]">
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8 }}
    className="relative p-4 sm:p-8 bg-white border border-border rounded-2xl sm:rounded-3xl shadow-xl h-full"
  >
    <Image 
      src="/illustrations/chaos-illustration.svg" 
      alt="Chaos Illustration" 
      width={600}
      height={400}
      className="w-full h-full object-contain opacity-80"
    />
    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none rounded-2xl sm:rounded-3xl" />
  </motion.div>
</div>
```

### 2.5 CTA Section (`cta-section.tsx`)

**Current Issues**:
- Large rounded corners (`rounded-[3rem]`) waste mobile space
- Text too large for mobile
- Check marks too small

**Optimizations**:

```tsx
// 1. Container - reduce rounded corners on mobile
<motion.div 
  initial={{ opacity: 0, scale: 0.98 }}
  whileInView={{ opacity: 1, scale: 1 }}
  viewport={{ once: true }}
  className="relative rounded-[2rem] sm:rounded-[3rem] bg-card border border-border/60 p-8 sm:p-12 lg:p-24 overflow-hidden text-center shadow-2xl"
>
  {/* Background Accents - scale down for mobile */}
  <div className="absolute top-0 right-0 w-48 h-48 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-[80px] sm:blur-[120px] translate-x-1/4 sm:translate-x-1/3 -translate-y-1/3" />
  <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-64 sm:h-64 bg-secondary/5 rounded-full blur-[60px] sm:blur-[100px] -translate-x-1/4 sm:-translate-x-1/3 translate-y-1/3" />

  <div className="relative z-10 max-w-2xl sm:max-w-3xl mx-auto px-2">
    {/* Headline - mobile fluid typography */}
    <h2 className="font-display text-3xl sm:text-4xl lg:text-6xl tracking-tight mb-6 sm:mb-8 leading-[1.15] sm:leading-[1.1] text-foreground">
      Stop chasing access. <br />
      <span className="text-primary italic">Start scaling.</span>
    </h2>
    
    {/* Subheadline */}
    <p className="text-lg sm:text-xl lg:text-2xl mb-8 sm:mb-12 text-muted-foreground leading-relaxed px-2">
      Join 2,400+ agencies saving hundreds of hours 
      every month with AuthHub.
    </p>

    {/* CTAs - full width on mobile */}
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-8 sm:mb-12">
      <SignUpButton mode="modal">
        <Button 
          variant="primary" 
          size="xl" 
          className="rounded-full w-full sm:w-auto px-8 sm:px-12 h-14 sm:h-auto touch-target-comfortable"
          rightIcon={<ArrowRightIcon size={18} />}
        >
          Start 14-Day Free Trial
        </Button>
      </SignUpButton>
      <Button 
        variant="secondary" 
        size="xl" 
        className="rounded-full font-bold uppercase tracking-widest text-[10px] sm:text-xs h-14 touch-target-comfortable"
      >
        Schedule a Demo
      </Button>
    </div>

    {/* Trust badges - stack on mobile */}
    <div className="flex flex-col sm:flex-wrap items-center justify-center gap-2 sm:gap-8 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <CheckIcon size={14} sm:size={16} color="rgb(var(--primary))" />
        <span>No credit card required</span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <CheckIcon size={14} sm:size={16} color="rgb(var(--primary))" />
        <span>Unlimited clients</span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <CheckIcon size={14} sm:size={16} color="rgb(var(--primary))" />
        <span>Cancel anytime</span>
      </div>
    </div>
  </div>
</motion.div>
```

### 2.6 Combined Featured Section (`combined-featured-section.tsx`)

**Current Issues**:
- Complex 2x2 grid doesn't work well on mobile
- Charts and activity feeds too small/detailed
- Multiple motion divs may impact mobile performance

**Optimizations**:

```tsx
// 1. Change to vertical stack on mobile
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-0">

// 2. Simplify cards for mobile
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6, delay: 0.1 }}
  className="clean-card p-5 sm:p-6 flex flex-col bg-card"
>
  {/* ... existing content ... */}
  
  {/* Stats grid - 2 columns on mobile instead of 3 */}
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-auto">
    {/* On mobile, show only 2 stats */}
    <div className="hidden sm:block text-center p-3 rounded-xl bg-warm-gray/20 border border-border/50">
      <div className="text-2xl font-bold text-foreground">100%</div>
      <div className="text-xs text-muted-foreground">Completion</div>
    </div>
  </div>
</motion.div>

// 3. Simplify chart for mobile (hide on very small screens)
<div className="hidden sm:block">
  <MonitoringChart />
</div>
<div className="sm:hidden p-4 bg-warm-gray/10 rounded-xl text-center">
  <div className="text-3xl font-bold text-primary mb-1">+127%</div>
  <div className="text-xs text-muted-foreground">OAuth Growth Rate</div>
</div>

// 4. Activity feed - simplified for mobile
const AgencyActivityFeed = () => {
  return (
    <div className="w-full max-w-xs sm:max-w-sm h-[240px] sm:h-[280px] bg-white p-2 sm:p-3 overflow-hidden font-sans relative border border-border/40 rounded-xl sm:rounded-2xl shadow-sm">
      {/* Show fewer messages on mobile */}
      {messages.slice(0, 4).map((msg, i) => (
        // ... existing message code with adjusted padding
        <div className="flex gap-2 sm:gap-3 items-start p-2 sm:p-3 border border-border/60 rounded-lg sm:rounded-xl">
          {/* ... */}
        </div>
      ))}
    </div>
  );
};
```

### 2.7 Integration Section (`integration-section.tsx`)

**Current Issues**:
- Platform icons (64px) may be too small/large depending on screen
- Two-row scroll animation may not work well on mobile
- Testimonial text too large

**Optimizations**:

```tsx
// In integration-hero.tsx

// 1. Responsive icon sizes
<div 
  key={`row1-${i}`} 
  className="h-12 sm:h-14 md:h-16 w-12 sm:w-14 md:w-16 flex-shrink-0 rounded-full shadow-md flex items-center justify-center border border-gray-100 overflow-hidden"
  style={{ backgroundColor: bgColor }}
>
  {item.image ? (
    <Image 
      src={item.image} 
      alt={item.name}
      width={32}
      height={32}
      className="object-contain w-6 h-6 sm:w-8 sm:h-8"
      unoptimized
    />
  ) : Icon ? (
    <Icon size={24} sm:size={28} md:size={32} style={{ color: item.color }} />
  ) : null}
</div>

// 2. Optimize carousel gap for mobile
<div className="flex gap-6 sm:gap-10 whitespace-nowrap animate-scroll-left">
  {/* Icons */}
</div>

// 3. Testimonial section - better mobile typography
<motion.div 
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ delay: 0.5 }}
  className="max-w-lg sm:max-w-xl mx-auto text-center py-8 sm:py-12 px-4"
>
  <p className="text-base sm:text-lg text-gray-700 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
    &ldquo;AuthHub has transformed how we work saving us 15+ hours per week. 
    The best automation tool! It connects everything seamlessly&rdquo;
  </p>
  <div className="flex items-center justify-center gap-2 sm:gap-3">
    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-600 overflow-hidden flex-shrink-0">
      <div className="w-full h-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
        JD
      </div>
    </div>
    <div className="text-left">
      <p className="font-bold text-gray-900 text-sm sm:text-base">John Drove</p>
      <p className="text-[10px] sm:text-xs text-gray-500">CEO, GrowthHub</p>
    </div>
  </div>
</motion.div>
```

### 2.8 Social Proof Section (`social-proof-section.tsx`)

**Current Issues**:
- Agency logos may be too large for mobile grid
- Gap spacing needs optimization
- Grayscale hover effect doesn't work on touch

**Optimizations**:

```tsx
// 1. Better responsive gap and sizing
<div className="flex flex-wrap justify-center items-center gap-x-6 sm:gap-x-12 md:gap-x-24 gap-y-6 sm:gap-y-8 md:gap-y-10 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700 ease-in-out">
  {agencies.map((name, i) => (
    <motion.div
      key={name}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.1 }}
      className="flex items-center gap-2 sm:gap-3 group cursor-default"
    >
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center justify-center font-black text-lg sm:text-xl text-foreground group-hover:border-foreground/30 group-hover:bg-foreground/10 transition-all duration-300">
        {name[0]}
      </div>
      <span className="font-display text-xl sm:text-2xl tracking-tighter font-bold text-foreground group-hover:text-primary transition-colors">
        {name}
      </span>
    </motion.div>
  ))}
</div>

// 2. On mobile, reduce to single row with horizontal scroll
<div className="hidden sm:flex flex-wrap justify-center items-center gap-x-12 md:gap-x-24 gap-y-8 md:gap-y-10 opacity-50 grayscale hover:opacity-100 hover:grayscale-0">
  {/* Desktop grid */}
</div>

<div className="sm:hidden overflow-x-auto -mx-4 px-4">
  <div className="flex items-center gap-8 opacity-50 min-w-max">
    {agencies.map((name, i) => (
      <motion.div
        key={name}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.1 }}
        className="flex items-center gap-2 group"
      >
        <div className="w-8 h-8 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center justify-center font-black text-lg text-foreground">
          {name[0]}
        </div>
        <span className="font-display text-xl tracking-tighter font-bold text-foreground">
          {name}
        </span>
      </motion.div>
    ))}
  </div>
</div>
```

### 2.9 Solution Section (`solution-section.tsx`)

**Current Issues**:
- Isometric layers may not render well on mobile
- Floating stat cards positioning needs mobile adjustment
- Two-column layout needs better mobile stack

**Optimizations**:

```tsx
// 1. Simplify isometric layers on mobile
<div className="flex-1 relative w-full h-[300px] sm:h-[400px] md:h-[500px]">
  <div className="absolute inset-0 flex items-center justify-center">
    {/* On mobile: Show single card */}
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="absolute w-48 h-64 sm:w-64 sm:h-80 bg-white border border-primary/20 rounded-2xl shadow-xl z-10 flex flex-col p-4 sm:p-6 gap-3 sm:gap-4"
    >
      {/* Simplified mobile content */}
      <div className="h-3 w-2/3 bg-warm-gray rounded" />
      <div className="h-24 w-full bg-warm-gray/50 rounded-xl" />
      <div className="space-y-1.5 sm:space-y-2">
        <div className="h-2 w-full bg-warm-gray rounded" />
        <div className="h-2 w-4/5 bg-warm-gray rounded" />
      </div>
      <div className="mt-auto h-8 w-full bg-primary/10 rounded-lg flex items-center justify-center">
        <div className="h-1.5 w-10 bg-primary/30 rounded" />
      </div>
    </motion.div>
    
    {/* Show layers only on larger screens */}
    <motion.div 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 0.3 }}
      viewport={{ once: true }}
      className="hidden sm:block absolute w-64 h-80 bg-warm-gray border border-border rounded-2xl shadow-sm translate-x-10"
    />
    <motion.div 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 0.6 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className="hidden sm:block absolute w-64 h-80 bg-white border border-border rounded-2xl shadow-md translate-x-5"
    />
    
    {/* Floating Stat Cards - adjust positions for mobile */}
    {stats.map((stat, i) => (
      <motion.div
        key={stat.label}
        initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20, y: 20 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 + stat.delay, duration: 0.6 }}
        className={`absolute p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-md border border-border shadow-lg flex items-center gap-2.5 sm:gap-4 z-20 ${
          i === 0 ? 'top-4 left-2 sm:top-10 sm:left-0' :
          i === 1 ? 'top-12 right-2 sm:top-20 sm:right-0' :
          i === 2 ? 'bottom-4 left-2 sm:bottom-10 sm:left-4' :
          'bottom-12 right-2 sm:bottom-20 sm:right-4'
        }`}
      >
        <div className="flex items-center justify-center">
          <stat.icon size={16} sm:size={20} className="text-foreground" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-bold text-foreground leading-none">{stat.value}</p>
          <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-0.5 sm:mt-1">{stat.label}</p>
        </div>
      </motion.div>
    ))}
  </div>
</div>

// 2. Content section - stack benefits on mobile
<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
  <div className="space-y-2 sm:space-y-3">
    <div className="flex items-center">
      <ShieldCheckIcon size={20} sm:size={24} className="text-foreground" />
    </div>
    <h3 className="font-bold text-base sm:text-lg">Secure by Design</h3>
    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
      Enterprise-grade encryption and automated secrets management.
    </p>
  </div>
  {/* ... other benefit card */}
</div>
```

### 2.10 Trust Section (`trust-section.tsx`)

**Current Issues**:
- Quote too large for mobile
- Security grid goes to 3 columns too quickly

**Optimizations**:

```tsx
// 1. Testimonial card
<div className="relative p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-[3rem] bg-warm-gray/20 border border-border/50">
  <blockquote className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl italic leading-tight text-foreground relative z-10">
    &ldquo;AuthHub literally saved our onboarding process. We went from 
    3-day delays to 5-minute setups. Our clients love the simplicity, 
    and we love having our time back.&rdquo;
  </blockquote>
  <div className="mt-6 sm:mt-10 flex items-center justify-center gap-3 sm:gap-4 relative z-10">
    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-foreground/5 border-2 border-foreground/10 flex items-center justify-center font-bold text-foreground text-sm sm:text-base">
      SJ
    </div>
    <div className="text-left">
      <p className="font-bold text-base sm:text-lg">Sarah Jenkins</p>
      <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-[0.15em] sm:tracking-[0.2em] font-bold">
        Founder, GrowthFlow Agency
      </p>
    </div>
  </div>
  
  {/* Quote Mark - hide on mobile */}
  <div className="hidden sm:block absolute top-8 left-12 text-primary/10 font-display text-[12rem] leading-none select-none">&ldquo;</div>
</div>

// 2. Security grid - single column on mobile
<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
  {[
    { icon: ShieldCheckIcon, title: "Enterprise Grade", desc: "Bank-level encryption for all OAuth tokens." },
    { icon: LockIcon, title: "Secure Storage", desc: "Tokens stored in Infisical vault with audit logs." },
    { icon: GlobeIcon, title: "Privacy First", desc: "GDPR and CCPA compliant architecture." },
  ].map((item, i) => (
    <motion.div
      key={i}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.1 }}
      className="clean-card p-6 sm:p-8 flex flex-col items-center text-center"
    >
      <div className="mb-4 sm:mb-6">
        <item.icon size={24} sm:size={28} className="text-foreground" />
      </div>
      <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3">{item.title}</h3>
      <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">{item.desc}</p>
    </motion.div>
  ))}
</div>
```

### 2.11 Navigation (`marketing-nav.tsx`)

**Current Issues**:
- Hidden navigation links on mobile (no mobile menu)
- Logo and buttons may crowd on small screens

**Optimizations**:

```tsx
// 1. Add mobile menu button
export function MarketingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 sm:h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo - slightly smaller on mobile */}
        <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-black text-lg sm:text-xl shadow-[0_8px_16px_-4px_rgba(255,107,53,0.4)] group-hover:rotate-6 group-hover:scale-110 transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent" />
            <span className="relative z-10 text-sm sm:text-base">AH</span>
          </div>
          <span className="font-display text-xl sm:text-2xl tracking-tight text-foreground font-bold group-hover:text-primary transition-colors">
            AuthHub
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-10">
          <Link href="#features" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
            How It Works
          </Link>
          <Link href="#pricing" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
            Pricing
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="h-6 w-px bg-border hidden sm:block" />
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex font-bold uppercase tracking-widest text-xs">
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="primary" size="sm" className="font-bold uppercase tracking-widest text-[10px] sm:text-xs px-4 sm:px-6">
              Get Started
            </Button>
          </SignUpButton>
          
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 -mr-2 touch-target-min"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-border bg-background"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
            <Link
              href="#features"
              className="block py-3 text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="block py-3 text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className="block py-3 text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <div className="pt-3 border-t border-border">
              <SignInButton mode="modal">
                <Button variant="ghost" size="md" className="w-full font-bold uppercase tracking-widest text-xs">
                  Sign In
                </Button>
              </SignInButton>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
```

---

## 3. Mobile Conversion Optimizations

### 3.1 Sticky CTA on Scroll

Add a sticky CTA bar that appears after scrolling past the hero:

```tsx
// Create new component: apps/web/src/components/marketing/sticky-cta.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from '@/components/ui/ui-icons';
import { useEffect, useState } from 'react';

export function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past 600px (hero section)
      setIsVisible(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-background/95 backdrop-blur-xl border-t border-border shadow-2xl"
        >
          <div className="container mx-auto flex items-center justify-between gap-3 max-w-lg">
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-foreground">Ready to get started?</p>
              <p className="text-[10px] text-muted-foreground">Start your 14-day free trial</p>
            </div>
            <SignUpButton mode="modal">
              <Button
                variant="primary"
                size="md"
                className="flex-1 sm:flex-auto rounded-full text-sm font-bold shadow-lg touch-target-comfortable"
                rightIcon={<ArrowRightIcon size={16} />}
              >
                Start Free Trial
              </Button>
            </SignUpButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Add to page.tsx
import { StickyCTA } from '@/components/marketing/sticky-cta';

export default async function MarketingPage() {
  // ...
  return (
    <main className="relative bg-background">
      <HeroSection />
      <StickyCTA /> {/* Add after hero */}
      {/* ... rest of sections */}
    </main>
  );
}
```

### 3.2 Mobile-Specific CTA Placement

**Pattern**: Add CTAs after each major section on mobile:

```tsx
// Add to each section component
<div className="block sm:hidden mt-8 mb-4 text-center">
  <SignUpButton mode="modal">
    <Button variant="primary" size="lg" className="rounded-full w-full max-w-xs touch-target-comfortable">
      Get Started Free
    </Button>
  </SignUpButton>
</div>
```

### 3.3 Form/Input Optimization (for future sign-up forms)

```css
/* Add to globals.css */
@layer utilities {
  /* Mobile input styling */
  .mobile-input {
    font-size: 16px; /* Prevents iOS zoom */
    padding: 12px 16px;
    min-height: 48px;
    border-radius: 12px;
  }
  
  /* Focus states for touch */
  .mobile-input:focus {
    outline: 2px solid rgb(var(--primary));
    outline-offset: 2px;
  }
}
```

### 3.4 Scroll Depth CTAs

Trigger different CTAs based on scroll position:

```tsx
'use client';

import { useEffect, useState } from 'react';

export function useScrollDepth() {
  const [depth, setDepth] = useState<'top' | 'middle' | 'bottom'>('top');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      
      if (scrollPercent > 0.75) {
        setDepth('bottom');
      } else if (scrollPercent > 0.25) {
        setDepth('middle');
      } else {
        setDepth('top');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return depth;
}

// Usage in sticky CTA
const depth = useScrollDepth();

const ctaText = {
  top: 'Start Free Trial',
  middle: 'Join 2,400+ Agencies',
  bottom: 'Ready to Scale? Start Now',
}[depth];
```

### 3.5 Loading Performance

**Optimize above-the-fold content**:

```tsx
// In hero-section.tsx and other critical components
import Image from 'next/image';

// Use priority loading for hero images
<Image
  src="/hero-dashboard.png"
  alt="Dashboard preview"
  priority
  width={1200}
  height={800}
  className="..."
/>

// Lazy load below-fold images
<Image
  src="/illustration.png"
  alt="Feature illustration"
  loading="lazy"
  width={600}
  height={400}
  className="..."
/>
```

---

## 4. Modern Mobile UX Enhancements

### 4.1 Touch Feedback & Micro-interactions

```css
/* Add to globals.css */
@layer utilities {
  /* Touch feedback */
  .touch-feedback {
    position: relative;
    overflow: hidden;
  }
  
  .touch-feedback::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at var(--touch-x, 50%) var(--touch-y, 50%), rgba(255, 255, 255, 0.3) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  }
  
  .touch-feedback:active::after {
    opacity: 1;
    transition: opacity 0s;
  }
}

// Add touch feedback to buttons
<Button className="touch-feedback touch-target-comfortable">
  Click Me
</Button>
```

### 4.2 Scroll-Triggered Animations

Optimize Framer Motion for mobile performance:

```tsx
// Reduce motion on mobile
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-50px' }} // Trigger earlier on mobile
  transition={{ 
    duration: reducedMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1]
  }}
>
  {/* Content */}
</motion.div>
```

### 4.3 Gesture Considerations

```tsx
// Add swipeable components for mobile galleries
'use client';

import { useSwipeable } from 'react-swipeable';

export function SwipeableFeatureCards({ features }: { features: Feature[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlers = useSwipeable({
    onSwipedLeft: () => setCurrentIndex((i) => Math.min(i + 1, features.length - 1)),
    onSwipedRight: () => setCurrentIndex((i) => Math.max(i - 1, 0)),
    trackMouse: true,
  });

  return (
    <div {...handlers} className="relative overflow-hidden touch-pan-x">
      <motion.div
        animate={{ x: `-${currentIndex * 100}%` }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="flex"
      >
        {features.map((feature) => (
          <div key={feature.title} className="w-full flex-shrink-0 p-4">
            {/* Feature card */}
          </div>
        ))}
      </motion.div>
      
      {/* Pagination dots */}
      <div className="flex justify-center gap-2 mt-4">
        {features.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentIndex ? 'bg-primary' : 'bg-border'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
```

### 4.4 Progressive Enhancement

```tsx
// Detect mobile capabilities
const isTouchDevice = 'ontouchstart' in window;
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Conditionally render enhanced mobile features
{isTouchDevice && (
  <SwipeableFeatureCards features={features} />
)}

{!isTouchDevice && (
  <HoverableFeatureGrid features={features} />
)}
```

### 4.5 Haptic Feedback (where supported)

```tsx
// Add subtle vibration feedback on button press
const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10); // 10ms subtle vibration
  }
};

<Button
  onTouchStart={triggerHaptic}
  className="touch-feedback"
>
  Tap Me
</Button>
```

---

## 5. Implementation Order

### Phase 1: Foundation (High Impact, Low Effort)
**Duration**: 1-2 days

1. **Add mobile breakpoint to Tailwind config**
   - File: `apps/web/tailwind.config.ts`
   - Add `xs` breakpoint at 475px
   - Impact: All components benefit

2. **Create mobile typography utilities**
   - File: `apps/web/src/app/globals.css`
   - Add `.text-mobile-*` classes with `clamp()`
   - Impact: Immediate readability improvement

3. **Update Button component touch targets**
   - File: `apps/web/src/components/ui/button.tsx`
   - Add `min-height` to all size variants
   - Impact: Better tappability across all buttons

4. **Add touch feedback styles**
   - File: `apps/web/src/app/globals.css`
   - Add `.touch-feedback` utility
   - Impact: Improved perceived responsiveness

**Quick Wins**:
- Hero section typography scaling (30 min)
- Button touch target enforcement (1 hour)
- CTA button full-width on mobile (1 hour)

### Phase 2: Critical Components (High Impact, Medium Effort)
**Duration**: 2-3 days

5. **Hero Section Mobile Optimization**
   - File: `apps/web/src/components/marketing/hero-section.tsx`
   - Simplify dashboard mockup on mobile
   - Scale floating overlay
   - Full-width CTAs
   - Impact: First impression, conversion rate

6. **Navigation Mobile Menu**
   - File: `apps/web/src/components/marketing/marketing-nav.tsx`
   - Add hamburger menu
   - Smooth slide-down animation
   - Impact: Usability, navigation completion

7. **Features Section Mobile Visuals**
   - File: `apps/web/src/components/marketing/features-section.tsx`
   - Replace hidden mockups with mobile-friendly badges
   - Larger icon touch areas
   - Impact: Engagement, feature understanding

8. **CTA Section Optimization**
   - File: `apps/web/src/components/marketing/cta-section.tsx`
   - Reduce rounded corners on mobile
   - Stack trust badges
   - Full-width buttons
   - Impact: Conversion rate

9. **Add Sticky CTA Component**
   - New file: `apps/web/src/components/marketing/sticky-cta.tsx`
   - Update: `apps/web/src/app/(marketing)/page.tsx`
   - Impact: Conversion rate (easy access to CTA)

### Phase 3: Supporting Components (Medium Impact, Medium Effort)
**Duration**: 2-3 days

10. **How It Works Section**
    - File: `apps/web/src/components/marketing/how-it-works-section.tsx`
    - Optimize step cards for mobile
    - Larger touch targets
    - Impact: User education

11. **Pain Section Chat Interface**
    - File: `apps/web/src/components/marketing/pain-section.tsx`
    - Reduce bubble width on mobile
    - Improve message readability
    - Impact: Emotional engagement

12. **Social Proof Section**
    - File: `apps/web/src/components/marketing/social-proof-section.tsx`
    - Horizontal scroll on mobile
    - Better logo sizing
    - Impact: Trust building

13. **Trust Section**
    - File: `apps/web/src/components/marketing/trust-section.tsx`
    - Single column security grid
    - Smaller quote on mobile
    - Impact: Credibility

### Phase 4: Complex Components (Medium Impact, High Effort)
**Duration**: 3-4 days

14. **Solution Section Isometric Layers**
    - File: `apps/web/src/components/marketing/solution-section.tsx`
    - Simplify to single card on mobile
    - Adjust stat card positioning
    - Impact: Visual storytelling

15. **Combined Featured Section**
    - File: `apps/web/src/components/ui/combined-featured-section.tsx`
    - Vertical stack on mobile
    - Simplify charts (hide or replace)
    - Reduce activity feed items
    - Impact: Feature depth

16. **Integration Section**
    - File: `apps/web/src/components/ui/integration-hero.tsx`
    - Responsive icon sizes
    - Optimize carousel gaps
    - Impact: Platform showcase

### Phase 5: Polish & Enhancement (Low Impact, Low-Medium Effort)
**Duration**: 1-2 days

17. **Add Mobile-Specific Micro-interactions**
    - Touch feedback on all interactive elements
    - Scroll-triggered animations (optimize for mobile)
    - Swipe gestures for galleries (if added)
    - Impact: Delight, perceived quality

18. **Performance Optimization**
    - Priority loading for above-fold images
    - Lazy loading below-fold content
    - Reduce animation complexity on mobile
    - Impact: Load time, Core Web Vitals

19. **Testing & Refinement**
    - Test on 375px, 390px, 414px, 480px widths
    - Touch target verification (44x44px minimum)
    - Accessibility audit with mobile screen readers
    - Impact: Quality assurance

---

## 6. Testing Checklist

### Mobile-Specific Tests

- [ ] **Touch Targets**: All interactive elements ≥44x44px
- [ ] **Typography Readability**: Text ≥16px without zooming
- [ ] **Horizontal Scrolling**: No unintended horizontal scroll
- [ ] **Viewport Scaling**: Content fits 375px without horizontal scroll
- [ ] **Tap Spacing**: Minimum 8px gap between tappable elements
- [ ] **Form Inputs**: 16px font size (prevents iOS zoom)
- [ ] **Loading Performance**: LCP <2.5s on 4G mobile
- [ ] **Animation Performance**: 60fps on mid-range mobile devices

### Device Testing Matrix

| Device | Width | Priority | Notes |
|--------|-------|----------|-------|
| iPhone SE | 375px | High | Smallest target |
| iPhone 12/13 | 390px | High | Common iOS |
| iPhone 14 Pro Max | 430px | Medium | Large iOS |
| Pixel 5 | 393px | High | Common Android |
| Samsung S21 | 360px | High | Small Android |
| iPad Mini | 768px | Low | Tablet (may use desktop UI) |

### Browser Testing

- [ ] Safari iOS (WebKit)
- [ ] Chrome Android (Blink)
- [ ] Firefox iOS (WebKit-based)
- [ ] Samsung Internet (Chromium-based)

---

## 7. Success Metrics

### Mobile-Specific KPIs

1. **Conversion Rate**
   - Baseline: Current mobile conversion rate
   - Target: +25% improvement
   - Tracking: Google Analytics events on CTA clicks

2. **Bounce Rate**
   - Baseline: Current mobile bounce rate
   - Target: -15% improvement
   - Tracking: GA bounce rate by device category

3. **Engagement**
   - Average scroll depth on mobile
   - Time on page
   - Section interaction rate

4. **Core Web Vitals (Mobile)**
   - LCP (Largest Contentful Paint): <2.5s
   - FID (First Input Delay): <100ms
   - CLS (Cumulative Layout Shift): <0.1

5. **Touch Interaction Success**
   - Failed tap rate (via heatmaps)
   - Accidental tap rate
   - Time to first successful tap

---

## 8. Critical Files Summary

### Core Configuration Files
1. **`/Users/jhigh/agency-access-platform/apps/web/tailwind.config.ts`**
   - Add `xs` breakpoint for 475px
   - Foundation for all responsive work

2. **`/Users/jhigh/agency-access-platform/apps/web/src/app/globals.css`**
   - Add mobile typography utilities
   - Touch feedback styles
   - Mobile spacing system

3. **`/Users/jhigh/agency-access-platform/apps/web/src/components/ui/button.tsx`**
   - Enforce touch target minimums
   - Used throughout site

### High-Impact Marketing Components
4. **`/Users/jhigh/agency-access-platform/apps/web/src/components/marketing/hero-section.tsx`**
   - First impression, most complex responsive behavior
   - Dashboard mockup needs mobile simplification

5. **`/Users/jhigh/agency-access-platform/apps/web/src/components/marketing/marketing-nav.tsx`**
   - Add mobile menu
   - Critical for navigation

6. **`/Users/jhigh/agency-access-platform/apps/web/src/components/marketing/cta-section.tsx`**
   - Primary conversion point
   - Needs full-width mobile CTAs

### Supporting Marketing Components
7. **`/Users/jhigh/agency-access-platform/apps/web/src/components/marketing/features-section.tsx`**
   - Replace hidden mockups
   - Icon touch targets

8. **`/Users/jhigh/agency-access-platform/apps/web/src/components/marketing/how-it-works-section.tsx`**
   - Step cards mobile optimization
   - CTA button spacing

9. **`/Users/jhigh/agency-access-platform/apps/web/src/components/marketing/pain-section.tsx`**
   - Chat bubble widths
   - Text sizing

10. **`/Users/jhigh/agency-access-platform/apps/web/src/components/ui/combined-featured-section.tsx`**
    - Complex grid layout
    - Charts and activity feeds

### New Components
11. **`/Users/jhigh/agency-access-platform/apps/web/src/components/marketing/sticky-cta.tsx`** (NEW)
    - Sticky conversion CTA
    - Scroll depth detection

---

## 9. Design Patterns to Follow

### Mobile-First Responsive Pattern

```tsx
// ❌ DON'T: Desktop-first thinking
<div className="text-5xl sm:text-4xl md:text-3xl">
  {/* Starts too big, gets smaller */}
</div>

// ✅ DO: Mobile-first fluid typography
<div className="text-mobile-hero sm:text-5xl lg:text-8xl">
  {/* Starts optimized for mobile, scales up */}
</div>
```

### Touch Target Pattern

```tsx
// ❌ DON'T: Insufficient touch target
<button className="px-3 py-1 text-xs">
  Tap {/* Only ~30px height */}
</button>

// ✅ DO: Guaranteed touch target
<button className="px-3 py-1 text-xs min-h-[44px]">
  Tap {/* At least 44px height */}
</button>
```

### Mobile Content Priority

```tsx
// ✅ DO: Progressive content display
<div className="block sm:hidden">
  <MobileSimplifiedVersion />
</div>
<div className="hidden sm:block lg:hidden">
  <TabletVersion />
</div>
<div className="hidden lg:block">
  <DesktopFullVersion />
</div>
```

---

## 10. Common Pitfalls to Avoid

1. **Don't hide content on mobile without replacement**
   - Instead: Simplify or reformat for mobile

2. **Don't use hover states as primary interaction**
   - Mobile users can't hover
   - Use tap/click states instead

3. **Don't make users pinch-zoom to read**
   - Ensure text is readable at 100% zoom

4. **Don't place CTAs too close together**
   - Minimum 8px gap between interactive elements

5. **Don't use fixed positioning without consideration**
   - Fixed elements can take too much screen space on mobile
   - Use min-height/max-height constraints

6. **Don't forget about safe areas**
   - iOS notches, home indicators
   - Use `env(safe-area-inset-*)` when needed

7. **Don't assume all mobile is portrait**
   - Test landscape orientations
   - Consider foldable devices

---

## Summary

This plan provides a comprehensive, phased approach to mobile UX optimization for the OAuth marketing platform. By following the implementation order and using the specific code examples provided, you can achieve:

- **Modern mobile aesthetics** that avoid generic AI design patterns
- **Optimized conversion paths** with strategic CTA placement
- **Improved accessibility** with proper touch targets and readable typography
- **Better performance** through progressive enhancement and lazy loading
- **Consistent experience** across 375px-480px mobile devices

The focus on practical, actionable steps with specific Tailwind classes and React patterns ensures this plan can be implemented efficiently while maintaining design consistency across all screen sizes.
