# /brainstorm - Persona-Based Thinking Partner

**Purpose**: Tactical/pre-PRD brainstorming with expert personas to explore product ideas through distinct lenses.

---

## Command Syntax

```bash
/brainstorm [--as <persona>] [--save] [<idea>]
```

**Arguments**:
- `--as <persona>`: Select persona (`pm`, `designer`, `engineer`, or `all`)
- `--save`: Save brainstorm summary to file
- `<idea>`: Initial idea or problem statement (optional—can provide interactively)

**Examples**:
```bash
/brainstorm                                    # Interactive mode
/brainstorm --as pm "OKRs in Roadmaps"         # PM persona with idea
/brainstorm --as designer --save "card UI"     # Designer persona, save output
/brainstorm --as engineer "API design"         # Engineer persona
/brainstorm --as all "mobile app"              # All three personas
```

---

## Workflow

### Step 1: Parse Arguments
Extract `--as` persona selection, `--save` flag, and initial idea text.

**If no idea provided**: Ask "What would you like to brainstorm?"

**If no `--as` specified**: Ask "Which perspective would you like? (`pm`, `designer`, `engineer`, or `all`)"

### Step 2: Gather Context (2-4 questions max)
Ask probing questions to understand:
- What problem are you solving?
- Who is this for? (customer/segment)
- What's the current situation or alternative?
- What makes you think this is worth exploring?

**Practice**: Use reflective listening ("So what I'm hearing is...") before each follow-up.

### Step 3: Load Persona(s)
Read persona definition from `/Users/jhigh/Planview Work/Docs/brainstormers/<persona>.md`:
- `--as pm` → `pm-principal.md`
- `--as designer` → `designer-senior.md`
- `--as engineer` → `engineer-10x.md`
- `--as all` → All three (sequence them)

### Step 4: Persona Exploration
For each selected persona:
1. **Reflective Listening**: "So what I'm hearing is [summary]. Let me explore this from the [Persona] perspective..."
2. **Ask 3-5 Probing Questions**: Use persona's question bank
3. **Offer Insights**: Provide persona-specific observations and angles
4. **Probe Deeper**: Follow up on interesting threads

**If `--as all`**: Sequence personas (PM → Designer → Engineer) with brief transitions.

### Step 5: Structured Summary
Generate a summary with:
- **Problem Statement**: JTBD-framed customer problem
- **Key Angles**: 2-3 insights per persona (if multiple)
- **Open Questions**: Unknowns to validate
- **Next Steps**: Concrete actions to move forward

**Format**:
```markdown
# Brainstorm Summary: [Idea]

## Problem Statement
[JTBD-framed customer problem]

## Key Angles

### Principal PM Perspective
- [Insight 1]
- [Insight 2]
- [Insight 3]

### Designer Perspective
- [Insight 1]
- [Insight 2]
- [Insight 3]

### Engineer Perspective
- [Insight 1]
- [Insight 2]
- [Insight 3]

## Open Questions
- [Unknown 1]
- [Unknown 2]
- [Unknown 3]

## Next Steps
1. [Action 1]
2. [Action 2]
3. [Action 3]
```

### Step 6: Save (if `--save` flag)
Write summary to `/Users/jhigh/Planview Work/Product-Management/brainstorms/YYYY-MM-DD-brainstorm-[topic].md`

**Filename pattern**: `YYYY-MM-DD-brainstorm-[slugified-topic].md`

---

## Persona Quick Reference

| Persona | Focus | Key Questions |
|---------|-------|---------------|
| **PM** | Customer outcomes, value props, ROI, market fit | What problem? For whom? Why now? What's the $ outcome? |
| **Designer** | User experience, workflows, cognitive load, delight | What's the flow? What's the mental model? Where's the friction? |
| **Engineer** | Technical feasibility, architecture, simplicity, leverage | What's the data flow? What's the simplest solution? How do we test it? |

---

## Integration Points

**Entry from**:
- `/think` → After strategic validation, explore tactical approaches
- `/discover` → After customer research, brainstorm solutions

**Exit to**:
- `/discover` → Validate assumptions with customer research
- `/think` → Re-evaluate strategic fit after exploration
- `/spec` → Convert validated angles into PRD

**Command stack context**:
- `/think` → Strategic ("Should we do this?")
- `/brainstorm` → Tactical ("How might we do this?")
- `/spec` → Formal ("Here's the PRD")

---

## Testing Checklist

After implementation, verify:

| Test | Command | Expected |
|------|---------|----------|
| Interactive mode | `/brainstorm` | Asks persona selection, gathers context |
| PM persona | `/brainstorm --as pm "OKRs in Roadmaps"` | PM voice, customer/ROI questions |
| Designer persona | `/brainstorm --as designer "card UI"` | UX focus, workflow questions |
| Engineer persona | `/brainstorm --as engineer "API design"` | Technical approach, simplicity |
| All personas | `/brainstorm --as all "mobile app"` | All three perspectives, sequenced |
| Save to file | `/brainstorm --as pm --save "idea"` | Summary saved to brainstorm directory |

---

## Success Criteria

1. **Distinct voices** - Each persona feels different in questioning and insights
2. **Conversational flow** - Feels like thinking partnership, not Q&A template
3. **Actionable output** - Summary provides clear angles and next steps
4. **Clean integration** - Connects logically to `/think`, `/discover`, `/spec`
