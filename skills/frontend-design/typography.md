# Typography Guidelines

Typography instantly signals quality. The font choice is often the first indicator of whether a design feels generic or intentional.

## The Fundamental Rule

**Never use the boring defaults.** See `anti-patterns.md` for the complete forbidden list.

---

## Distinctive Font Library

### Display / Headlines

Use these for headings, hero text, and statements:

| Font | Character | Best For |
|------|-----------|----------|
| **Clash Display** | Bold, geometric, modern | Tech, startups, statements |
| **Syne** | Quirky, distinctive, contemporary | Creative, experimental |
| **Archivo Black** | Strong, heavy, impactful | Headlines, brutalist |
| **Bricolage Grotesque** | Warm, characterful, friendly | Startups, approachable brands |
| **Fraunces** | Playful serif, baroque | Editorial, luxury, expressive |
| **Playfair Display** | Elegant serif, high contrast | Editorial, luxury, fashion |
| **Cabinet Grotesk** | Clean but distinctive | Modern, sophisticated |
| **Obviously** | Wide, geometric | Bold statements |
| **Chivo** | Clean sans, Swiss-inspired | Corporate, professional |
| **Satoshi** | Geometric, modern | Tech, minimal |

### Body / Reading Text

Pair with display fonts for readable body content:

| Font | Character | Best For |
|------|-----------|----------|
| **Crimson Pro** | Readable serif | Long-form content, editorial |
| **Newsreader** | Contemporary serif | Articles, blogs |
| **Source Serif 4** | Neutral but refined | Documentation, reading |
| **Outfit** | Geometric sans | Modern apps, clean UI |
| **Libre Franklin** | Neutral, flexible | All-purpose body text |
| **Work Sans** | Friendly, readable | UI, apps, websites |
| **Manrope** | Geometric, legible | Modern interfaces |

### Monospace / Code

For technical content and terminal aesthetics:

| Font | Character | Best For |
|------|-----------|----------|
| **JetBrains Mono** | Developer-focused, ligatures | Code, terminals |
| **Fira Code** | Ligatures, readable | Code blocks |
| **Space Mono** | Quirky, distinctive | Retro tech, creative |
| **IBM Plex Mono** | Technical, IBM heritage | Documentation |
| **Geist Mono** | Modern, Vercel | Next.js projects |

### Specialty / Experimental

For unique contexts:

| Font | Character | Best For |
|------|-----------|----------|
| **VT323** | Pixel, retro computing | 80s aesthetic, gaming |
| **Press Start 2P** | 8-bit pixel font | Retro gaming |
| **Shrikhand** | Bold display, playful | Headlines, Indian design |
| **Unbounded** | Variable, geometric | Experimental, variable text |

---

## Font Pairing Strategies

### High Contrast = Interesting

The key to memorable typography is contrast. Pair opposites:

**Display + Monospace**
```css
h1 { font-family: 'Clash Display', sans-serif; }
body { font-family: 'JetBrains Mono', monospace; }
```

**Serif + Geometric Sans**
```css
h1 { font-family: 'Fraunces', serif; }
body { font-family: 'Outfit', sans-serif; }
```

**Variable Weights Across Headlines**
```css
h1 { font-family: 'Syne', sans-serif; font-weight: 800; }
h2 { font-family: 'Syne', sans-serif; font-weight: 400; }
```

### Classic Pairings

| Display | Body | Vibe |
|---------|------|------|
| Playfair Display | Source Serif 4 | Editorial luxury |
| Clash Display | Outfit | Modern tech |
| Fraunces | Crimson Pro | Playful editorial |
| Archivo Black | Work Sans | Bold but readable |
| Space Mono | Manrope | Tech-forward |

---

## Size and Scale

### Use Extremes

Timid size differences create boring hierarchy. Use dramatic contrasts:

| Level | Timid Approach | Bold Approach |
|-------|---------------|---------------|
| h1 | 32px | 72-120px |
| h2 | 24px | 36-48px |
| body | 16px | 16-18px |
| caption | 14px | 11-12px |

**The ratio should be 3x+ between levels, not 1.5x.**

### Scale Examples

```css
/* TIMID - AVOID */
:root {
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
}

/* BOLD - PREFERRED */
:root {
  --text-xs: 11px;
  --text-sm: 14px;
  --text-base: 17px;
  --text-lg: 24px;
  --text-xl: 40px;
  --text-2xl: 72px;
  --text-hero: 120px;
}
```

---

## Weight Contrasts

Use extremes in weight too:

```css
/* Use 100/200 vs 800/900, not 400 vs 600 */

h1 {
  font-weight: 900; /* Black */
}

.subtitle {
  font-weight: 200; /* Extra Light */
  letter-spacing: 0.2em;
}
```

### Weight Pairing Examples

| Use Case | Weight Combination |
|----------|-------------------|
| Modern hero | 900 headline + 300 subhead |
| Elegant editorial | 700 headline + 400 body |
| Technical | 500 headlines + 400 mono body |
| Luxurious | 300 headlines (caps + tracking) |

---

## Letter Spacing & Line Height

### Letter Spacing (Tracking)

| Context | Tracking |
|---------|----------|
| Large headlines (60px+) | -0.02em to -0.04em (tighter) |
| All-caps text | 0.1em to 0.3em (wider) |
| Body text | Default (0) |
| Small labels | 0.05em to 0.1em |

```css
.headline {
  font-size: 96px;
  letter-spacing: -0.03em;
}

.label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
}
```

### Line Height

| Context | Line Height |
|---------|-------------|
| Headlines | 0.9 to 1.1 (tight) |
| Body text | 1.5 to 1.7 (comfortable) |
| Long-form | 1.7 to 1.9 (spacious) |
| Single lines | 1 (none) |

---

## Loading Fonts Properly

### Google Fonts (Recommended)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Outfit:wght@300;400;500;700&display=swap" rel="stylesheet">
```

### Variable Fonts for Flexibility

```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400..800&display=swap');

.headline {
  font-family: 'Syne', sans-serif;
  font-variation-settings: 'wght' 700;
}
```

---

## The Decision Process

1. **Pick ONE distinctive display font** based on the aesthetic
2. **Pair with a readable body font** that contrasts
3. **Use extreme size ratios** (3x+ between levels)
4. **Apply weight contrasts** (light vs black)
5. **Adjust tracking for size** (tighter at large sizes)

**State your font choices explicitly before generating code.**

