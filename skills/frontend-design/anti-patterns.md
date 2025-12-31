# Anti-Slop Protocol

This file documents **forbidden patterns**—the generic, overused choices that create "AI slop" aesthetics. Violating these patterns results in design failure.

## The Core Problem

AI models converge toward safe, average outputs. In frontend design, this creates:
- Sameness across all generated interfaces
- Predictable, forgettable designs
- The unmistakable "this was made by AI" feel

**The antidote**: Bold, intentional choices that commit fully to a specific aesthetic.

---

## Forbidden Fonts

**NEVER use these fonts:**

| Font | Why It's Forbidden |
|------|-------------------|
| Inter | Overused default, screams "AI generated" |
| Roboto | Google's default, ubiquitous and boring |
| Open Sans | Safe corporate choice, no character |
| Arial | Windows default, the epitome of generic |
| Helvetica | Overused to death (unless Swiss aesthetic) |
| Lato | Another safe, forgettable choice |
| system-ui | Lazy default |
| sans-serif | Not even trying |
| Montserrat | Every startup circa 2015 |
| Poppins | Overexposed on Canva templates |

**Also avoid Claude's common fallbacks:**
- Space Grotesk (Claude's favorite, becomes repetitive)
- DM Sans (too commonly selected)
- Source Sans Pro (safe and boring)

**Instead use**: See `typography.md` for distinctive alternatives.

---

## Forbidden Colors

### The "Startup Purple" Gradient
**THE cardinal sin of AI-generated design:**

```css
/* NEVER DO THIS */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
background: linear-gradient(to right, #6366f1, #8b5cf6);
```

This purple-to-violet gradient on white backgrounds is the universal marker of AI-generated content.

### Other Forbidden Color Patterns

| Pattern | Why It's Forbidden |
|---------|-------------------|
| Low-contrast pastels without borders | Unreadable, wishy-washy |
| Pure #000000 or #FFFFFF | Harsh, use off-blacks/off-whites |
| Evenly-distributed color palettes | Timid, lacks hierarchy |
| Blue-to-teal gradients | Another AI cliché |
| Rainbow gradients | Screams "made by algorithm" |
| Indigo accent color | Default choice, too common |

**Instead**: 
- Commit to a dominant color with ONE sharp accent
- Use off-blacks (`#0a0a0a`, `#121212`) and off-whites (`#fafafa`, `#f5f5f5`)
- Draw from specific aesthetic traditions (see `aesthetics.md`)

---

## Forbidden Layouts

### Bootstrap-Style Grids
The 12-column grid that every generic website uses:
```html
<!-- NEVER -->
<div class="row">
  <div class="col-md-4">Card 1</div>
  <div class="col-md-4">Card 2</div>
  <div class="col-md-4">Card 3</div>
</div>
```

### Generic Hero Sections
The predictable pattern:
- Big headline centered
- Subheadline in gray
- Two buttons (Primary + Secondary)
- Maybe a gradient background
- Stock illustration on the right

```html
<!-- AVOID THIS EXACT PATTERN -->
<section class="hero">
  <h1>Revolutionize Your Workflow</h1>
  <p class="text-gray-500">The all-in-one solution for...</p>
  <div class="flex gap-4">
    <button class="bg-primary">Get Started</button>
    <button class="bg-secondary">Learn More</button>
  </div>
</section>
```

### Material Design Cards
Rounded corners + subtle shadow + padding = every app since 2014.

```css
/* TOO GENERIC */
.card {
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 24px;
  background: white;
}
```

---

## Forbidden Vibes

### Corporate Memphis
- Flat, geometric characters with disproportionate bodies
- Purple, teal, and peach color schemes
- "Friendly" blob shapes
- Ubiquitous in 2019-2021 tech marketing

**Never recreate this style.**

### Generic SaaS Landing Page
The formula:
1. Hero with product screenshot floating at angle
2. "Trusted by" logo strip
3. Three-column feature grid with icons
4. Testimonial cards with headshots
5. Pricing table with three tiers
6. FAQ accordion
7. Footer with newsletter signup

**If you're building a SaaS page, break this formula.**

### "Professional" Dark Mode
- Dark gray background (#1f1f1f)
- Bright blue accent (#3b82f6)
- White text
- No personality

---

## Forbidden Component Patterns

### The Standard Button Set
```css
/* TOO PREDICTABLE */
.btn-primary { background: blue; }
.btn-secondary { background: gray; }
.btn-outline { border: 1px solid; background: transparent; }
```

### The Safe Input Field
```css
/* BORING */
input {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px 12px;
}
input:focus {
  border-color: blue;
  outline: none;
}
```

### Cookie-Cutter Navigation
```html
<!-- GENERIC -->
<nav class="flex justify-between items-center">
  <logo />
  <ul class="flex gap-4">
    <li>Features</li>
    <li>Pricing</li>
    <li>About</li>
  </ul>
  <button>Sign Up</button>
</nav>
```

---

## How to Break the Patterns

### Instead of Generic Grids
- Use asymmetric layouts
- Let elements overlap
- Create diagonal flow
- Break the grid intentionally
- Use CSS Grid with named areas

### Instead of Generic Heroes
- Split screen compositions
- Full-bleed imagery
- Text wrapped around shapes
- Staggered entry animations
- Unexpected scroll behavior

### Instead of Generic Cards
- Neobrutalist cards with hard shadows
- Glassmorphic floating panels
- Terminal-style containers
- Hand-drawn border effects
- Overlapping card arrangements

### Instead of Generic Colors
- Commit to ONE dominant color
- Use high-contrast combinations
- Draw from specific cultural aesthetics
- Create custom color systems with CSS variables

---

## The Annoyance Test

While avoiding generic patterns, also avoid the opposite extreme:

**NEVER create interfaces that:**
- Constantly animate to the point of distraction
- Have flashing or strobing effects
- Use challenging contrast that strains the eyes
- Move content unexpectedly
- Play sounds without consent
- Have text that's hard to read for style points

**The experience should never take away from the content.**

---

## The Variation Mandate

Across multiple generations, you MUST vary:
- Light vs dark themes (don't default to one)
- Font families (rotate through options)
- Aesthetic categories (try different directions)
- Color palettes (explore the full spectrum)
- Layout approaches (never repeat the same structure)

**Each design should feel like it was created for its specific context, not generated from a template.**

