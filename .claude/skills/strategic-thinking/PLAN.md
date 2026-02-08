# Strategic-Thinking Skill: Architecture & Design Plan

## Purpose
The strategic-thinking skill enables **deep, multi-turn strategic exploration** for major decisions that require sustained thinking over 30-60+ minutes.

## How It's Different from /think Command

| Aspect | /think Command | strategic-thinking Skill |
|--------|----------------|-------------------------|
| **Duration** | 5-15 minutes (single turn) | 30-60+ minutes (multi-turn) |
| **Structure** | Highly structured template | Exploratory, iterative |
| **Depth** | Single-layer analysis | Multi-layer synthesis |
| **Sources** | Based on what you provide | Can pull from files, data, web |
| **Output** | Thinking framework, next steps | Comprehensive strategic brief |
| **Use Case** | Quick strategic framing | Major pivots, market entry, foundational decisions |

## When to Use strategic-thinking Skill

**Use this skill when:**
- Making major strategic decisions (market entry, pivots, multi-year bets)
- The problem is complex with many unknowns
- You need to synthesize across multiple sources (customer data, competitive intel, market research)
- The stakes are high (one-way door decisions)
- You want to iterate on strategic thinking over time

**Use /think command when:**
- You need quick strategic framing
- The question is well-defined
- You want a structured thinking session
- 15 minutes is enough

## Skill Architecture

### Expert Mode (Optional - Start of Session)
**Goal:** Let users opt into faster, less-interactive execution

**Default:** Interactive mode with dynamic probing questions
**Expert Mode:** Skip to analysis, minimal back-and-forth

### Phase 1: Strategic Context (10-15 min)
**Goal:** Understand the strategic question and current state

**Activities:**
1. Clarify the strategic question (what are we really trying to figure out?)
2. Map the current state (where are we today?)
3. Define success (what does winning look like?)
4. Identify key stakeholders and constraints
5. **DYNAMIC:** Ask 2-3 probing questions based on context:
   - "What would have to be true for this to work?"
   - "What's the question behind the question?"
   - "Who loses if you go this direction?"

**Output:** Strategic context document

### Phase 2: Deep Exploration (20-30 min)
**Goal:** Explore multiple perspectives and gather intelligence

**Activities:**
1. **Customer perspective:** What do customers need/want? (JTBD, value props)
2. **Competitive perspective:** How is the market evolving? What are competitors doing?
3. **Business perspective:** What's the economic model? Unit economics? Strategic fit?
4. **Technical perspective:** What's feasible? Platform implications?
5. **Market perspective:** Where is the market going? Trends, shifts, opportunities
6. **DYNAMIC:** Ask probing questions based on what's emerging:
   - "What's the most expensive assumption you're making?"
   - "What would have to change for this to be wrong?"
   - "Who would disagree with this framing?"

**Capabilities:**
- Can read existing research files (customer interviews, competitive analysis)
- Can search codebase for relevant context
- Can fetch market research from web
- Can analyze existing product/business data

**Frameworks Applied:**
- Strategy Kernel (Diagnosis, Guiding Policy, Coherent Actions)
- Working Backwards (from customer experience)
- Platform Thinking (ecosystem effects)
- Mental Models (ROI, Feedback Loops, Time Horizon, Local Maxima)

**Output:** Multi-perspective analysis document

### Phase 3: Hypothesis Development (10-15 min)
**Goal:** Formulate strategic hypotheses and test them

**Activities:**
1. Synthesize insights from exploration
2. Generate strategic options (at least 3 different approaches)
3. Apply mental models to evaluate options
4. Identify critical assumptions to validate
5. Define tests/experiments to validate hypotheses
6. **DYNAMIC:** Ask probing questions to test their thinking:
   - "Which option are you drawn to and why?"
   - "What would need to be true for Option Y to beat X?"
   - "What information would change your mind?"

**Output:** Strategic options with validation plan

### Phase 4: Strategic Recommendation (10-15 min)
**Goal:** Produce actionable strategic brief

**Activities:**
1. Recommendation (which strategic option to pursue)
2. Rationale (why this over alternatives)
3. Critical risks and mitigations
4. **DYNAMIC:** Final reflection questions:
   - "What's your gut telling you?"
   - "What's the downside if you're wrong?"
   - "What would make you regret this a year from now?"
5. Roadmap (phased approach)
6. Success metrics (how we'll know if this worked)

**Output:** Strategic brief (ready to share with leadership)

## Integration with AIPMOS Core Rules

- **PM Operating Principles:** Ruthless prioritization, solve problems not features, strong opinions loosely held
- **Decision Framework:** One-way vs two-way doors, 70% rule, disagree and commit
- **Mental Models:** Apply 3-5 relevant models per strategic question
- **Frameworks as Tools:** Strategy Kernel, Working Backwards, Gibson DHM
- **Product Sense:** Value over everything, build empathy through observation

## Tools the Skill Can Use

- **AskUserQuestion:** Dynamic probing questions based on context (skippable in Expert Mode)
- **Read:** Access research files, customer interviews, competitive docs
- **Grep:** Search for patterns across codebase
- **Glob:** Find relevant files (strategy docs, research, data)
- **WebFetch:** Pull market research, competitor info, industry trends
- **Bash:** Run analytics queries if needed

## Dynamic Questioning Philosophy

The skill asks **context-aware probing questions**—not preset checklists. Questions emerge from what the user shares:

### Question Patterns by Phase

| Phase | Question Patterns | Examples |
|-------|------------------|----------|
| **Start** | Execution mode preference | Interactive or Expert Mode? |
| **Phase 1** | Reframing, assumption exposure | "What would have to be true?" / "Who loses?" |
| **Phase 2** | Blind spot detection | "What's the most expensive assumption?" / "Who would disagree?" |
| **Phase 3** | Decision testing | "What would change your mind?" / "What feels risky?" |
| **Phase 4** | Regret minimization | "What would you regret a year from now?" / "What's the downside?" |

**Design Principles:**
- Questions probe, don't prescribe—multiple choice is the enemy of thinking
- Questions emerge from the specific strategic situation, not a template
- Questions expose blind spots and test assumptions
- Questions are skippable—user can say "I don't know" for collaborative exploration
- Expert Mode skips to analysis for users who want faster execution

## Deliverables

1. **Strategic Context Doc** (Phase 1 output)
2. **Multi-Perspective Analysis** (Phase 2 output)
3. **Strategic Options & Validation Plan** (Phase 3 output)
4. **Strategic Brief** (Phase 4 output - the main deliverable)

## Strategic Brief Template

```markdown
# Strategic Brief: [Decision/Opportunity]

## Executive Summary (BLUF)
[One paragraph: What we should do and why]

## Strategic Question
[What are we trying to figure out?]

## Current State
- Where we are today
- Key constraints
- What's changed / why now

## Strategic Analysis

### Customer Perspective
[What customers need, JTBD, value props]

### Competitive Perspective
[Market evolution, competitor moves, white space]

### Business Perspective
[Economics, strategic fit, resource requirements]

### Technical Perspective
[Feasibility, platform implications, build vs buy]

### Market Perspective
[Trends, opportunities, threats]

## Strategic Options

### Option 1: [Name]
- **Description:** [What we'd do]
- **Pros:** [Advantages]
- **Cons:** [Disadvantages]
- **Critical Assumptions:** [What must be true]

### Option 2: [Name]
[repeat structure]

### Option 3: [Name]
[repeat structure]

## Recommendation

**We should pursue Option [X]: [Name]**

**Rationale:**
1. [Reason 1 with evidence]
2. [Reason 2 with evidence]
3. [Reason 3 with evidence]

**Why not the alternatives:**
- Option Y: [Why we're not doing this]
- Option Z: [Why we're not doing this]

## Critical Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| [Risk 1] | H/M/L | H/M/L | [How we'll address] |
| [Risk 2] | H/M/L | H/M/L | [How we'll address] |

## Validation Plan

**Critical assumptions to test:**
1. [Assumption 1] - **Test:** [How we'll validate] - **Timeline:** [When]
2. [Assumption 2] - **Test:** [How we'll validate] - **Timeline:** [When]

## Phased Roadmap

**Phase 1 (Validation):** [0-3 months]
- [Milestone 1]
- [Milestone 2]

**Phase 2 (Launch):** [3-6 months]
- [Milestone 1]
- [Milestone 2]

**Phase 3 (Scale):** [6-12 months]
- [Milestone 1]
- [Milestone 2]

## Success Metrics

**Leading Indicators (3-6 months):**
- [Metric 1 with target]
- [Metric 2 with target]

**Lagging Indicators (12+ months):**
- [Metric 1 with target]
- [Metric 2 with target]

## Decision Rights
- **Recommender:** [PM/Strategy lead]
- **Decision Maker:** [Who approves this]
- **Timeline:** [When decision needed]

---

**Appendix:**
- [Link to customer research]
- [Link to competitive analysis]
- [Link to market research]
```

## Skill Invocation Pattern

**How to use:**
```
I need to think deeply about [strategic question].

This is a major decision involving [context: market entry / pivot / multi-year bet].

I have [X hours / until date] to make a recommendation.

What I know so far: [brief context]
What I'm uncertain about: [key unknowns]
```

**The skill will then:**
1. Guide you through the 4 phases
2. Ask clarifying questions
3. Pull in relevant data/research
4. Iterate on thinking with you
5. Produce the strategic brief

## Success Criteria for This Skill

**A successful strategic-thinking session produces:**
- ✅ Clear strategic recommendation backed by analysis
- ✅ 3+ strategic options evaluated rigorously
- ✅ Critical assumptions identified and validation plan defined
- ✅ Multi-perspective synthesis (customer, competitive, business, technical, market)
- ✅ Actionable roadmap with success metrics
- ✅ Strategic brief ready to present to leadership

**Time investment:**
- 30-60 minutes of active strategic thinking
- Output: 3-5 page strategic brief
- ROI: High-quality strategic decision vs. weeks of analysis paralysis
