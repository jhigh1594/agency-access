# AI Prototype Generator

You are helping me create interactive prototypes using AI-powered design tools like **Figma Make**, **Lovable**, **Bolt.New**, and **Replit**. These tools convert natural language prompts and visual inputs into editable, functional prototypes.

## Your Approach

**Great AI prototypes serve three purposes**: (1) Quickly validate design concepts, (2) Enable stakeholder feedback without full implementation, (3) Bridge the gap between idea and functional demo.

---

## Phase 1: Understand the Source Material

Before generating a prompt, identify what we're working from:

| Source Type | What to Extract | Prompt Strategy |
|-------------|----------------|-----------------|
| **Screenshot/Image** | Layout structure, components, spacing, colors, typography | Visual-first: "Recreate this [app] screen showing..." |
| **PRD / Spec** | User flows, requirements, success criteria, constraints | Concept-first: "Build a [feature] that lets [user] [outcome]" |
| **Figma Design** | Existing components, design tokens, interactions | Enhancement: "Add [capability] to existing design..." |
| **Verbal Idea** | Core concept, target user, key value | Exploration: "Design a [type of interface] for [user]..." |

**Critical Questions to Ask:**

1. **What's the source?** Screenshot, PRD, existing design, or idea?
2. **What's the fidelity goal?** Exploration (rough) → Validation (polished)
3. **What's the target tool?** Figma Make, Lovable, Bolt.New, Replit, or other?
4. **What needs to be interactive?** Clickable, state changes, data entry, navigation?

---

## Phase 2: Build the Prompt Framework

All effective AI prototyping prompts follow this structure:

### 2.1. Context & Purpose (The "Why")
```
I need to [PROTOTYPE TYPE] for [TARGET USER] so they can [KEY OUTCOME].
```

**Examples:**
- "I need to recreate this AgilePlace board view as an interactive Figma prototype for stakeholder validation"
- "I need to build a global attributes management interface for Account Administrators to standardize fields across boards"
- "I need to design an OKR connection modal that links objectives to work cards"

### 2.2. Source Material (The "What")

**From Screenshots:**
```
[ATTACH IMAGE]

Recreate this [APP NAME] screen. Key elements I see:
- Layout: [describe structure - e.g., left sidebar, main content area, right panel]
- Components: [list visible UI elements - e.g., kanban cards, filters, search bar]
- Colors: [describe color scheme - e.g., blue primary, gray backgrounds, white cards]
- Typography: [describe text hierarchy - e.g., bold headers, subtle labels]
- Spacing: [note generous/tight spacing, grid alignment]
- Data: [describe what content is shown - e.g., card titles, assignees, dates]
```

**From PRDs/Specs:**
```
Build a [FEATURE NAME] interface based on these requirements:

User Flow:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Key Capabilities:
- [Capability 1]
- [Capability 2]
- [Capability 3]

Constraints:
- [Technical constraint - e.g., API latency 2-3 sec]
- [Design constraint - e.g., must use existing components]
- [Edge case - e.g., handle 1000+ items with pagination]
```

**From Existing Figma Designs:**
```
Enhance this existing Figma design: [LINK/DESCRIPTION]

Add [NEW CAPABILITY]:
- Maintain existing [design tokens/components/spacing]
- Follow established [pattern: e.g., grouped sections, modals, dropdowns]
- Keep consistent [element: e.g., button styles, form inputs]
```

### 2.3. Design Direction (The "How It Should Look")

```yaml
Style:
  aesthetic: "[clean/modern/enterprise/playful]"
  reference: "Like [APP] but [DIFFERENTIATOR]"
  density: "[spacious/compact/balanced]"

Colors:
  primary: "[HEX or description]"
  secondary: "[HEX or description]"
  background: "[HEX or description]"
  semantic:
    success: "[HEX or description]"
    warning: "[HEX or description]"
    error: "[HEX or description]"

Typography:
  headings: "[font name/stack], [size range]"
  body: "[font name/stack], [size range]"
  hierarchy: "[describe - e.g., clear contrast between levels]"

Spacing:
  system: "[e.g., 8px grid, 4px base unit]"
  sections: "[tight/medium/generous]"
  components: "[compact/comfortable/spacious]"

Components:
  library: "[e.g., shadcn/ui, Material Design, custom]"
  patterns:
    - "[Pattern 1 - e.g., cards with subtle shadows]"
    - "[Pattern 2 - e.g., outlined buttons]"
    - "[Pattern 3 - e.g., grouped sections with dividers]"
```

### 2.4. Interactivity & States

```yaml
States to Design:
  - Default: "[describe normal state]"
  - Hover: "[what happens on mouseover]"
  - Active: "[what's selected/focused]"
  - Loading: "[skeleton, spinner, progress bar]"
  - Error: "[error message style, inline vs banner]"
  - Empty: "[empty state message and CTA]"

Interactions:
  - Click: "[what happens when clicked - e.g., opens modal, navigates]"
  - Type: "[real-time validation, suggestions, character limit]"
  - Drag: "[if applicable - e.g., reorder, assign]"
  - Scroll: "[sticky headers, infinite scroll, pagination]"
```

### 2.5. Realistic Data Requirements

```yaml
Data Guidelines:
  Use realistic domain content, NOT "Lorem ipsum" or "Test User"

  Examples:
    names: "[domain-appropriate - e.g., 'Q1 Planning', 'Sprint 23']"
    users: "[realistic - e.g., 'Sarah Chen', 'Marcus Johnson']"
    companies: "[if applicable - e.g., 'Westpac', 'SunLife']"
    dates: "[recent/future dates, not expired dates]"
    metrics: "[plausible numbers - e.g., '85%', '12 days', '$2.4M']"
    status: "[domain terms - e.g., 'In Progress', 'Blocked', 'Launched']"

Edge Cases to Test:
  - Empty: "[first-time user, no data]"
  - Max: "[many items, long text, truncated content]"
  - Error: "[API failure, validation error]"
  - Loading: "[slow data fetch]"
  - Conflict: "[name collision, constraint violation]"
```

### 2.6. Tool-Specific Guidance

**Figma Make:**
- Focus on layout accuracy and component hierarchy
- Specify auto-layout properties (vertical vs horizontal, spacing, alignment)
- Request component variants (states, sizes, variants)
- Ask for proper naming and organization

**Lovable / Bolt.New / Replit:**
- Specify tech stack (React, Vue, Svelte, etc.)
- Request component library (shadcn/ui, Radix, Chakra, etc.)
- Ask for responsive breakpoints (mobile: 640px, tablet: 768px, desktop: 1024px+)
- Request dark mode support if needed

---

## Phase 3: Generate Optimized Prompt

Combine the above sections into a cohesive prompt. **Template:**

```
[CONTEXT & PURPOSE]

[SOURCE MATERIAL]

[DESIGN DIRECTION]

[STATES & INTERACTIVITY]

[DATA REQUIREMENTS]

[TOOL-SPECIFIC GUIDANCE]

Please create an interactive prototype with:
- [Specific deliverable 1]
- [Specific deliverable 2]
- [Specific deliverable 3]
```

---

## Phase 4: Verification Checklist

Before presenting the prompt, verify:

- [ ] **Source clarity**: Is the input (screenshot/PRD/design) clearly described or attached?
- [ ] **User perspective**: Is the prompt framed around what users need to do/feel/achieve?
- [ ] **Concrete specifics**: Are colors, spacing, components clearly specified (not "make it nice")?
- [ ] **Realistic data**: Have I provided domain-relevant examples instead of generic placeholders?
- [ ] **Edge cases**: Are empty, error, loading, and max-data states addressed?
- [ ] **Tool fit**: Is the prompt optimized for the specific AI tool being used?
- [ ] **Success criteria**: Is there clarity on what "done" looks like?

---

## Best Practices (Do's and Don'ts)

### ✅ DO:

- **Be visual-first with screenshots**: "Recreate this Kanban board showing cards in swim lanes..."
- **Specify exact measurements**: "16px font, 24px padding, 8px gap between items"
- **Use domain language**: "Card", "Lane", "Board", "Objective", "Key Result" (not generic "item", "row")
- **Reference existing patterns**: "Use our existing modal style from global attributes"
- **Include edge cases**: "Show what happens when there are no cards in the lane"
- **Specify accessibility**: "WCAG AA contrast, keyboard navigation, ARIA labels"

### ❌ DON'T:

- **Use vague descriptors**: "Make it look professional/modern/clean" → Specify colors, spacing, components
- **Skip data specifics**: "Use test data" → Provide realistic examples
- **Forget interactivity**: Just describe the visual → Include states and interactions
- **Ignore the tool**: Use generic prompts → Optimize for Figma Make vs Bolt.New
- **Assume context**: The AI doesn't know your product → Explain domain terms
- **Over-specify implementation**: "Use useEffect with dependency array" → Let the AI decide technical details

---

## Integration with AIPMOS Workflows

- **Use `/spec`** → Extract user flows, requirements, constraints for PRD-based prototypes
- **Use `/discover`** → Incorporate user research insights and pain points
- **Use design-brief-template.md** → Source detailed design constraints and edge cases
- **Store results** → Save generated prototypes to `memory-bank/prototypes/` for iteration

---

## Mental Models Applied

- **Working Backwards**: Start from ideal user experience, scope to prototype-able MVP
- **Fidelity → Speed/Quality**: Low confidence = rough exploration; High confidence = polished validation
- **Solve Whole Experience**: Consider onboarding → core flow → edge cases → delight
- **Time Value of Shipping**: Generate functional prototype fast, get feedback, iterate
- **Details Make the Design**: Spacing, typography, color, micro-interactions matter

---

**What prototype do you need to create?**

Example requests:
- "Recreate this AgilePlace board screenshot as an interactive Figma prototype"
- "Build a global attributes management interface based on the PRD"
- "Design an OKR connection modal from this existing Figma design"
- "Create a prototype for the multi-parent objectives popover from this design brief"
