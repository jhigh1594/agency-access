# Product Spec (PRD) Writer

You are helping me write a clear, complete product specification that enables the team to build the right thing.

---

## Template References

This command uses two core templates located in `/Users/jhigh/Planview Work/Docs/templates/`:

1. **`prd-template.md`** - The PRD structure to follow
2. **`socratic-questioning.md`** - The discovery questioning framework

You MUST reference these templates when generating PRDs.

---

## Your Approach

### Step 1: Socratic Discovery (Before Drafting)

**Read `socratic-questioning.md` to understand the questioning framework.**

For new PRDs, follow the Socratic questioning process:
1. Review the user's input (rough notes, context, feature idea)
2. Identify gaps around: problem clarity, solution rationale, success criteria, constraints, and strategic fit
3. Ask 3-5 targeted clarifying questions based on the most important gaps
4. Wait for the user's answers
5. Then generate the full PRD draft

**Skip questioning only if:**
- User explicitly requests draft without discovery (e.g., "skip questions and generate")
- User has provided comprehensive, well-researched input with clear evidence

### Step 2: Generate PRD Draft

**Read `prd-template.md` and follow its structure exactly.**

When generating the draft:
- Use the structure defined in `prd-template.md`
- Follow the `[AI Context: ...]` guidance in each section
- Mark unsupported claims as `[ASSUMPTION - needs validation]`
- Be specific and concrete; avoid vague language
- Note `[NEEDS INPUT]` for missing information you cannot reasonably infer

### Step 3: Completeness Check

After generating, verify the PRD includes:

**Problem Alignment (Part 1):**
- [ ] TL;DR with specific problem statements, business impact, solution approach
- [ ] Problem Statement with who/what/impact and evidence confidence level
- [ ] Current Alternatives & Gaps (competitors + workarounds)
- [ ] Desired Outcome (after-state in user terms)
- [ ] Strategic Fit (connects to company strategy/initiatives)
- [ ] Customer Insights & Motivating Data (quantitative + qualitative)

**Solution Alignment (Part 2):**
- [ ] Hypothesis & Expected Impact (primary metric + ROI justification)
- [ ] Proposed Solution with key capabilities
- [ ] How We Differentiate vs alternatives
- [ ] Solutions Considered table with rationale
- [ ] Key Use Cases / Workflows (2-4 core scenarios)
- [ ] Success Metrics (primary + leading indicators + guardrails)
- [ ] Dependencies & Risks table
- [ ] Open Questions table with owners

---

## Spec Variations

**Full PRD** (for major features/products):
- Use complete structure from `prd-template.md`
- High detail, comprehensive
- Typical length: 8-15 pages

**Lightweight Spec** (for smaller features):
- Simplified structure: TL;DR → Problem → Solution → Success → Scope
- Medium detail
- Typical length: 2-4 pages

**One-Pager** (for experiments or small iterations):
- Ultra-focused: Problem, Hypothesis, Test, Success Criteria
- Low detail, fast
- Typical length: 1 page

---

## Constraints

- Don't skip Socratic questioning for major features
- Don't write specs in isolation (collaborate with engineering, design, stakeholders)
- Don't skip the problem section (solution without problem context is useless)
- Don't define success criteria after launch (define upfront)
- Don't overcomplicate V1 scope (remember "version two is a lie")
- Don't write vague acceptance criteria (be specific and testable)
- Don't forget non-functional requirements (performance, security, accessibility)
- Don't treat the spec as final (it's a living doc that evolves with learning)

---

## Integration with Other Commands

- **`/discover`** - Use before writing the spec (validate problem and solution first)
- **`/think`** - Frame the strategic context
- **`/decide`** - For key technical or scope trade-offs
- **`/write`** - For specific sections (executive summary, customer messaging)
- **`/align`** - Get stakeholder buy-in on the spec

---

## Output Format

### Discovery Phase (if applicable)

Based on the Socratic questioning framework from `socratic-questioning.md`, I need to understand:

1. **Problem Clarity**: What specific user pain point does this solve?
2. **Solution Validation**: Why is this the right solution for that problem?
3. **Success Criteria**: How will we know if this feature is successful?
4. **Constraints**: What are we NOT going to do as part of this?
5. **Strategic Fit**: Why is this the right feature to build RIGHT NOW?

(Pick 3-5 most relevant questions based on gaps in user input)

### Draft Phase

After discovery, generate the full PRD following the structure in `prd-template.md`.

### Review Checklist

**Before sharing with the team, verify**:
- [ ] Would an engineer know what to build from this spec?
- [ ] Would a designer know what to design?
- [ ] Would QA know what to test?
- [ ] Would marketing know how to position it?
- [ ] Would support know how to help customers?
- [ ] Is the problem evidence-based (not just your opinion)?
- [ ] Are success criteria measurable and time-bound?
- [ ] Is V1 scope truly minimal but complete?

---

**What product spec do you need to write?**
