# Design System Delta Plan — Acid Brutalism v2.0

> **Date**: September 3, 2026
> **Evidence**: lazyweb.com design DNA kit (`~/Desktop/lazyweb.com-design-kit/`), extracted via Dembrandt + authored-CSS verification on 2026-09-03
> **Inputs**: `apps/web/DESIGN_SYSTEM.md` v1.3.0, `apps/web/src/app/globals.css`, `apps/web/src/app/layout.tsx`, `apps/web/src/components/ui/button.tsx`
> **Status**: Proposed — awaiting approval before implementation

---

## Thesis

Lazyweb is not a different aesthetic from ours. It is the same brutalist skeleton — ink on paper, hard borders, square buttons, hard offset shadows, mono accents — executed with discipline. What reads as "more refined" is subtraction, not different tokens:

| Dimension | AuthHub today | Lazyweb | Delta |
|---|---|---|---|
| Chromatic tokens | 5 (coral, teal, warning, acid, electric) + peach/warm-gray tints | 1 accent + semantic greens (2) | −3 chromatic tokens |
| Shadow scale | 6 brutalist sizes + 3 standard | ~4 authored instances, 2 sizes in practice | 6 → 3 sizes |
| Default border | 2–4px | 1px (2px only for emphasis) | heavier → hairline |
| Radius | 6-step spectrum, contradictory mappings | binary: 0 or pill | spectrum → binary |
| Continuous animations | 9 keyframe families (float, chaos, glitch, ticker, marquee, pulse…) | 0 decorative; 6 functional/narrative | −decorative motion |
| Type discipline | 4 families, no tracking spec, named weights | 3 families + alt, tracking spec, mid-weights 650/750 | +spec, −1 family |
| Data/mono layer | exists but underused (labels only for code) | second-most-used family; micro-label system | +mono layer |
| Contrast documentation | prose in DESIGN_SYSTEM.md | decisions documented in CSS comments next to tokens | +in-code docs |
| Status contrast | teal fails AA as text (~3.0:1 on white) | dual tokens per ground, AA-verified | fix required |

Our coral `#FF6B35` and their orange `#FF6B00` are nearly the same hue. The accent was never the problem. The problem is everything competing with it.

---

## Phase 1 — Subtract (low risk, immediate)

### 1.1 Kill `--electric` (purple)

- **Where**: `globals.css` lines 47, 101; any `electric` utility consumers.
- **Why**: A third-and-fourth accent that only serves hover states. Lazyweb's hovers are color swaps and 1px lifts — no extra hue. Purple-on-coral dilutes both.
- **Action**: Delete token; replace `electric` usages with coral darkening (`#E04E1F` — computed as a ~12% darker coral) or plain ink inversion.

### 1.2 Demote or retire `--acid`

- **Options** (decision needed from Jon):
  - **A. Retire** — delete token, replace the 2% of usages with coral or ink.
  - **B. Single-surface rule** (recommended) — acid survives only on the homepage hero moment (one element, one view, never again). Formally: `--acid` marked `hero-only` in token comments.
- **Why**: 1.4:1 contrast means it can never carry meaning. Lazyweb's equivalent restraint is having no decorative color at all. "Acid Brutalism" can keep its name while the acid itself becomes scarce — scarcity is the identity.

### 1.3 Collapse the shadow scale

- **Keep**: `shadow-brutalist-sm` (2px), `shadow-brutalist` (4px), `shadow-brutalist-lg` (6px).
- **Deprecate**: `shadow-brutalist-xl`, `-2xl`, `-3xl`, and `.shadow-hard-xl`.
- **Rule (port from lazyweb)**: default card has **no shadow and a 1px border**. Shadow is punctuation for interactive or hero elements, not a resting state. Target: ≤3 shadow applications per view.
- **Evidence**: lazyweb authored 8 box-shadow declarations total across 69KB of CSS; we author a 6-step ramp and apply `shadow-brutalist` to every standard button and card.

### 1.4 Hairline borders

- Default border: `1px solid rgb(var(--border-hard))` (black). Current `border-2` standard and `border-brutalist` (3px) / `border-brutalist-thick` (4px) utilities become emphasis-only.
- Port lazyweb's bottom-hairline pattern: `border-bottom: 1px solid #444` for meta rows, card footers, list dividers (221 uses on their site — it is their main separation device).

### 1.5 Cut decorative continuous animation

- **Kill**: `float-chaos`, `glitch-text`, `ticker-up`, `pulse-button`, `expand-reveal` (scale-1.3-rotate spin), `float-pillar` (unless a specific hero needs it).
- **Keep**: `marquee` (logo strips — functional social proof), one `float` (max, hero-only).
- **Replace entrance feel**: our reveals run 0.7–0.8s; lazyweb entrances run 0.3–0.55s with decel `cubic-bezier(0.2, 0.8, 0.3, 1)` and settle at `translateY(-8px) scale(0.985) → 0/1`. Port those values into `.reveal-element`.

### 1.6 Consolidate button variants

- Current: 10 variants (`primary…brutalist-ghost-rounded`). Target: 5 — `primary`, `secondary`, `ghost`, `danger`, `brutalist` (hero-only).
- Lazyweb's button grammar: black fill / orange fill / white with 1px border / ghost outline. Four treatments, all `border-radius: 0`.

---

## Phase 2 — Port (the refinement layer)

### 2.1 Mono micro-label system (highest visible ROI)

We already load JetBrains Mono (`layout.tsx` — note: DESIGN_SYSTEM.md v1.3.0 wrongly says IBM Plex Mono). Lazyweb's second-most-used family is their mono. Port the pattern:

```css
/* globals.css — new utilities */
.label-micro {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.32px;  /* +0.11em — tracking pushes OUT at micro sizes */
  text-transform: uppercase;
  color: rgb(var(--ink-secondary));
}
.label-nano {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 1px;
}
```

Apply to: StatusBadge text, card meta rows, section eyebrows, table headers, dashboard KPI labels, footer metadata.

### 2.2 Tracking spec for type (the invisible craft move)

- Display (dela, Outfit): `letter-spacing: -0.02em` at ≥2rem, `-0.04em` at ≥3.5rem.
- Body: no tracking.
- Mono micro: positive tracking (above).
- This inversion — tight at large, wide at tiny — is lazyweb's signature production move (verified authored: display `-.04em`, labels `+.11em`). Dela Gothic One is a fixed-weight display face; apply tracking to it regardless of weight axis.

### 2.3 Mid-weights on variable fonts

- Outfit, Fraunces, and JetBrains Mono are variable via `next/font`. Author weights 650 and 750 where 600 feels weak and 700 feels loud: buttons at 650, small mono labels at 650, emphasis body at 750.
- Dela Gothic One is not variable — leave at 400.
- **Action**: document usable weights per family in DESIGN_SYSTEM.md (this is where the doc currently misleads).

### 2.4 Two-ring focus system

Replace generic `ring-2 ring-ring ring-offset-2` with lazyweb's authored pattern, adapted to coral:

```css
:focus-visible {
  outline: 3px solid rgb(var(--primary) / 0.24);
  box-shadow: 0 0 0 6px rgb(var(--primary) / 0.08);
}
```

Inner stroke + outer halo, both derived from the accent. Apply via a `focus-brutalist` utility and to the input base styles in `globals.css`.

### 2.5 Fix status contrast — dual tokens per ground (required, not optional)

- **Problem found during extraction**: teal `#00A896` as text on white measures **~3.0:1 — fails WCAG AA** (4.5:1). Our success states (authorized/active/healthy badges, teal text) are likely non-compliant today.
- **Port lazyweb's documented pattern** (their CSS comment records replacing `#17a34a` at 3.29:1 with `#15803d` at 5.01:1):

```css
/* Success — two tokens by ground, AA-verified 2026-09-03:
   --success-ink on white 5.5:1; --success rides ink panels. */
--success-ink: 15 118 110;   /* #0F766E — stays in the teal family */
--success: 0 168 150;        /* #00A896 — fills and dark-panel text only */
```

- Rule: `--success` is fill-only on light ground; text uses `--success-ink`. White text on teal fill also fails (~3.0:1) — success buttons use ink text on success-ink fill, or teal fill with ink border and no small text.
- **Also**: coral `#FF6B35` text on white ≈ 2.9:1. Codify the rule both systems share: **coral is fill/border only, never body text on paper.**

### 2.6 Document decisions in CSS, next to tokens

Port the practice, not just values: lazyweb's `:root` carries comments recording what was rejected and why. Add the same to `globals.css` for the success-ink fix, the acid restriction, and the shadow-deprecation. The changelog belongs in DESIGN_SYSTEM.md; the *reason* belongs beside the token.

---

## Phase 3 — Systematize (bigger migration, phase it)

### 3.1 Binary radius

- Target: `0` for cards, buttons, inputs, modals; `999px` for chips, dots, indicators; `50%` for avatars. Nothing between.
- Current reality is contradictory: `--radius: 0.75rem`, inputs `rounded-md`, cards `rounded-lg`, and migration helpers literally map `.brutalist-rounded → rounded-lg` while the doc calls brutalist buttons `rounded-none`.
- Migration: flip `--radius` to `0.25rem` → `0` in a dedicated pass; sweep shadcn primitives; keep `rounded-full` for pills. Design-system showcase page (`/design-system`) updates in the same PR.

### 3.2 Elevate the ink panel

Lazyweb's terminal insets (`#111418` panels with green mono text, blinking cursor) are their one dark-surface move. We have `--ink` sections already — formalize an `.ink-panel` utility (ink ground, paper text, mono data, optional `blink` cursor keyframe) for exactly one surface per dashboard view. This is the "one brutalist element per view" rule given a concrete form.

### 3.3 DESIGN_SYSTEM.md v2.0.0

- Fix doc drift: Geist → Outfit, IBM Plex Mono → JetBrains Mono, Fraunces is loaded but undocumented (decide: keep or drop — if no consumer, drop the import).
- Add: tracking spec, weight table per family, focus pattern, success token rules, shadow budget ("≤3 per view"), radius binary, mono label utilities.
- Add a "Production Moves" section mirroring the lazyweb kit's format — decisions with evidence, so future contributors inherit the *why*.
- Clean the "MIGRATION HELPERS (Temporary)" block in `globals.css` (self-marked TODO) once 3.1 lands.

---

## What we deliberately do NOT adopt

- **Their fonts.** Space Grotesk/Inter/Plus Jakarta would erase identity. Dela Gothic One + Outfit + JetBrains Mono cover the same roles (display/body/data) with more personality. Refinement ≠ re-typing.
- **Their green signals.** We keep teal as the success hue; we fix its contrast instead of changing families.
- **Full monochrome pages.** Their restraint is tuned to a research-evidence product. Ours serves agencies choosing plans and granting access — coral CTAs stay loud.
- **No-gradient rule as law.** Our `bg-warm-mesh` is subtle and stays (lazyweb runs 3 functional gradients of their own).

---

## Execution order + acceptance criteria

| Step | Change | Acceptance |
|---|---|---|
| 1 | Delete `--electric`; resolve acid decision | Zero `electric` references; acid usages ≤1 view |
| 2 | Shadow deprecation + 1px default border | No `-xl/-2xl/-3xl` uses; new cards border-1 shadowless |
| 3 | Animation cut + reveal retiming | ≤2 continuous animations sitewide; reveals ≤0.55s |
| 4 | `.label-micro`/`.label-nano` + tracking spec | Applied to StatusBadge, card meta, table headers |
| 5 | Success tokens + contrast fix | All status text ≥4.5:1 on its ground (axe scan) |
| 6 | Focus system + button consolidation | 5 variants; two-ring focus everywhere |
| 7 | Radius binary + ink panel + doc v2.0.0 | `/design-system` showcases final state |

Steps 1–3 are pure subtraction — safe to ship together. Steps 4–5 are token-level and reversible. Step 7 is the only sweep-everything migration.

CSS/styling work is TDD-exempt per CLAUDE.md; steps 5–6 touching components get regression checks via the dev-browser skill against `/design-system`.

## Open decisions for Jon

1. **Acid**: retire (A) or hero-only (B)? I recommend B.
2. **Teal fix**: `#0F766E` success-ink (stays teal) vs adopting lazyweb's green `#15803d`? I recommend staying teal.
3. **Radius**: full binary migration now (step 7), or new-components-only with gradual sweep? I recommend full — half-migrated radius is how we got here.
4. **Fraunces**: loaded but undocumented. Find consumers or drop it.
