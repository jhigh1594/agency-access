---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Generates creative, polished code that avoids generic AI aesthetics—fighting "model collapse" with bold, intentional design choices.
---

# Frontend Design

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

## When to Use This Skill

Use this skill when:
- Building web components, pages, or full applications
- Creating landing pages, dashboards, or interactive UIs
- User requests a frontend with distinctive or custom design
- Any frontend work where design quality matters

## Core Philosophy

**Fight Model Collapse.** Claude tends toward generic, safe design choices. This skill combats that tendency by forcing bold aesthetic commitments and avoiding overused patterns.

**Intentionality Over Intensity.** Bold maximalism and refined minimalism both work—the key is making deliberate choices and executing them with precision.

**Context-Specific Design.** Every interface should feel genuinely designed for its context. No cookie-cutter solutions.

## Quick Design Workflow

1. **Understand Context**: Purpose, audience, constraints
2. **Commit to Aesthetic**: Pick ONE bold direction from `aesthetics.md`
3. **Apply Anti-Patterns**: Review `anti-patterns.md` to avoid generic choices
4. **Design with Intent**: Use guidelines from `typography.md` and `aesthetics.md`
5. **Implement**: Build production-grade, functional code

See `workflow.md` for the complete step-by-step process.

## Mandatory Requirements

ALL frontend outputs MUST implement:

1. **Light/Dark Mode Toggle**: Use CSS variables (`:root` vs `[data-theme="dark"]`) for all color tokens
2. **Responsive Design**: Works equally well on mobile and desktop
3. **Moments of Delight**: Include subtle animations, creative typography, or visual surprises
4. **OpenGraph Tags**: Proper meta tags for social sharing
5. **Accessibility**: Keyboard navigable, proper contrast, semantic HTML

## Reference Files

- **`aesthetics.md`**: Aesthetic selector with 12+ distinct style directions
- **`anti-patterns.md`**: "Anti-Slop Protocol"—forbidden patterns and generic choices to avoid
- **`typography.md`**: Font selection guidance and pairing strategies
- **`workflow.md`**: Complete design-to-implementation workflow
- **`examples.md`**: Code patterns, CSS techniques, and implementation details

## Design Thinking Before Code

Before writing any code, answer these questions:

**Purpose**: What problem does this interface solve? Who uses it?

**Tone**: Pick an extreme aesthetic direction:
- Brutally minimal
- Maximalist chaos
- Retro-futuristic
- Organic/natural
- Luxury/refined
- Playful/toy-like
- Editorial/magazine
- Brutalist/raw
- Art deco/geometric
- Soft/pastel
- Industrial/utilitarian

**Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

## Implementation Standards

Every frontend should be:

- **Production-grade**: Functional, not just a mockup
- **Visually striking**: Memorable and distinctive
- **Cohesive**: Clear aesthetic point-of-view throughout
- **Refined**: Meticulous attention to every detail

## Critical Reminders

- **NEVER use**: Inter, Roboto, Arial, Open Sans, system-ui, sans-serif defaults
- **NEVER use**: Purple gradients on white backgrounds (the AI cliché)
- **NEVER use**: Generic Bootstrap-style grids or Material Design cards
- **ALWAYS**: Match implementation complexity to aesthetic vision
- **ALWAYS**: Include at least one moment of visual delight

For complete guidelines, see the referenced files above.

