# Aesthetic Selector

For every frontend request, explicitly select ONE distinct aesthetic and commit to it fully. Do not mix incompatible styles. State the chosen aesthetic before coding.

## How to Choose

Consider the context:
- **Purpose**: What does the interface do?
- **Audience**: Who uses it?
- **Tone**: What feeling should it evoke?
- **Constraints**: Technical or brand requirements?

Then pick the aesthetic that either:
1. **Fits naturally**: Matches the context perfectly
2. **Subverts expectations**: Creates unexpected contrast for effect

---

## Category A: Modern & Clean

### Glassmorphism
**Essence**: Frosted glass panels, premium and airy

- Heavy blur effects (`backdrop-filter: blur(12px)`)
- Light refraction and translucency
- Vivid background blobs or gradients showing through
- Subtle borders with `rgba(255,255,255,0.2)`
- Premium, Apple-inspired feel

**Best for**: Dashboards, modern apps, portfolio sites

```css
.glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Swiss / International
**Essence**: Grid-driven precision, authoritative typography

- Strict grid systems with mathematical ratios
- Massive typography (80px+ headlines)
- Generous negative space
- Minimal color (black, white, one accent)
- Helvetica-esque feel (use Archivo, Chivo, or Bricolage Grotesque)

**Best for**: Corporate sites, portfolios, editorial

### Material You / Android Expressive
**Essence**: Bold color extraction, playful organization

- Dynamic color palettes extracted from imagery
- Pill shapes and rounded corners
- Motion-driven interactions
- Adaptive and responsive
- Playful but organized

**Best for**: Mobile-first apps, productivity tools

### Editorial / Magazine
**Essence**: Serif elegance, luxury publication feel

- Serif headings (Playfair Display, Fraunces, Crimson Pro)
- Big, dramatic imagery
- Strong typographic hierarchy
- Decorative borders and rules
- Ample whitespace

**Best for**: Blogs, luxury brands, content platforms

---

## Category B: Retro & Nostalgic

### Retro Computing (80s–90s)
**Essence**: Pixel grids, CRT nostalgia

- Pixel-perfect layouts
- CRT scanlines and phosphor glow
- Bitmap or pixel fonts (VT323, Press Start 2P)
- Beige plastics palette
- High-contrast terminal greens/ambers
- Dithering effects

**Best for**: Developer tools, gaming, tech nostalgia

```css
.crt-effect {
  background: linear-gradient(
    transparent 50%,
    rgba(0, 0, 0, 0.1) 50%
  );
  background-size: 100% 4px;
  animation: scanline 8s linear infinite;
}
```

### Y2K / Early Web
**Essence**: Chrome gradients, bubbly chaos

- Chrome and metallic gradients
- Bubbly, inflated typography
- Bright pinks, blues, silvers
- Shiny 3D buttons
- Chaotic sticker-like decorations
- Marquee elements (sparingly)

**Best for**: Fashion, music, experimental projects

### Terminal / Hacker CLI
**Essence**: Monospace strictly, command-line aesthetic

- Black background only
- Green, amber, or cyan text
- Blinking cursor animations
- Command-line style inputs
- Monospace fonts (JetBrains Mono, Fira Code)
- No rounded corners

**Best for**: Developer tools, technical products, cybersecurity

```css
.terminal {
  background: #0a0a0a;
  color: #00ff41;
  font-family: 'JetBrains Mono', monospace;
  padding: 2rem;
  border: 1px solid #00ff41;
}
.cursor {
  animation: blink 1s step-end infinite;
}
```

---

## Category C: Avant-Garde & Niche

### Neobrutalism
**Essence**: Hard outlines, raw functionality, anti-design

- Hard black outlines (3-4px)
- Clashing, bold colors
- No shadows, no gradients
- Unstyled HTML feel, but intentionally designed
- Raw, functional aesthetic
- High contrast, no subtlety

**Best for**: Startups, creative agencies, bold statements

```css
.neo-button {
  background: #FFE135;
  color: #000;
  border: 3px solid #000;
  padding: 1rem 2rem;
  font-weight: 900;
  box-shadow: 4px 4px 0 #000;
  transition: transform 0.1s, box-shadow 0.1s;
}
.neo-button:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #000;
}
```

### Claymorphism (Soft UI)
**Essence**: Puffy, tactile, toy-like

- Extruded, pillowy surfaces
- Inner shadows for depth
- Rounded corners (16-24px)
- Soft, muted color palette
- Friendly and approachable
- Tactile, touchable feel

**Best for**: Lifestyle apps, wellness, children's products

### Cyberpunk / Neon Noir
**Essence**: High-contrast dark mode, glowing accents

- Dark backgrounds (#0a0a0f)
- Neon accent colors (cyan, magenta, hot pink)
- Glowing effects (`box-shadow` bloom)
- Holographic glitches
- Angular UI elements
- Tech-noir atmosphere

**Best for**: Gaming, entertainment, futuristic products

```css
.neon-text {
  color: #0ff;
  text-shadow: 
    0 0 5px #0ff,
    0 0 10px #0ff,
    0 0 20px #0ff,
    0 0 40px #0ff;
}
.glow-border {
  border: 1px solid #f0f;
  box-shadow: 
    0 0 5px #f0f,
    inset 0 0 5px rgba(255, 0, 255, 0.3);
}
```

### Industrial Minimalism
**Essence**: Monochrome, technical precision

- Pure black and white (with grays)
- Hard edges, no rounded corners
- Exposed structural lines
- Technical/mono fonts (IBM Plex Mono, Space Mono)
- CAD software aesthetic
- Blueprint-like precision

**Best for**: Architecture, engineering, technical products

### Organic / Nature
**Essence**: Soft gradients, biomorphic shapes

- Earthy tones (moss, clay, sky, terracotta)
- Biomorphic, fluid shapes
- Paper textures
- Natural photography
- Flowing curves
- Sustainable, grounded feel

**Best for**: Wellness, sustainability, outdoor brands

### Hand-Drawn / Indie
**Essence**: Imperfect charm, sketch aesthetic

- Imperfect, wobbly borders (SVG filters)
- Sketch-like illustrations
- Doodle icons
- Warm, handmade color palette
- Indie/craft feel
- Paper or cardboard textures

**Best for**: Personal sites, indie products, creative portfolios

### Anime / Pop
**Essence**: High energy, dramatic flair

- High energy compositions
- Speed lines and motion effects
- Mascot integration
- Vibrant, saturated colors
- Angular, dynamic shapes
- Dramatic typography with effects

**Best for**: Gaming, entertainment, youth-focused brands

---

## Execution Principle

**Match implementation complexity to aesthetic vision:**

- **Maximalist aesthetics** (Y2K, Cyberpunk, Anime): Elaborate code with extensive animations, layered effects, multiple gradients
- **Minimalist aesthetics** (Swiss, Industrial): Restraint and precision—careful spacing, perfect typography, subtle details

Elegance comes from executing the vision well, not from the number of effects applied.

