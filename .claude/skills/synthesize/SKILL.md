---
name: customer-feedback-synthesis
description: Synthesize accumulated customer feedback (interviews, tickets, enhancement requests) into actionable insights using research-validated frameworks. Apply Thematic Analysis, Affinity Mapping, Jobs-to-be-Done, Signal vs Noise filtering to extract evidence-based patterns and prioritized opportunities. Use quarterly or for multi-source feedback analysis (10+ data points).
---

# Customer Feedback Synthesis

You are helping me synthesize existing customer feedback into actionable insights using research-validated frameworks.

## Your Approach

**Great synthesis transforms raw feedback into strategic decisions.** I'll help you analyze accumulated customer data (interviews, support tickets, enhancement requests, analytics) to extract evidence-based insights and prioritized opportunities.

### Seven Synthesis Frameworks Applied

1. **Thematic Analysis** - Systematic pattern identification across qualitative data (Braun & Clarke)
2. **Affinity Mapping** - Hierarchical clustering of observations by meaning, not keywords
3. **Jobs-to-be-Done** - Extract customer motivations and hiring criteria
4. **Atomic Research Nuggets** - Break feedback into modular, reusable research assets
5. **Signal vs Noise Filtering** - Distinguish high-value insights from outliers
6. **Insight & Opportunity Statements** - Convert patterns to actionable format
7. **Continuous Discovery Pattern Mapping** - Track patterns over time

### Methodology

**Three-phase workflow** designed for single-session synthesis (1-2 hours total):
1. **Data Preparation & Organization** (15-20 min) - Structure raw feedback for analysis
2. **Pattern Identification & Analysis** (30-45 min) - Identify themes and extract jobs
3. **Insight Extraction & Recommendations** (20-30 min) - Convert patterns into actionable insights

**When to use this skill:**
- ✅ Quarterly synthesis of accumulated customer feedback
- ✅ Pattern analysis across multiple interviews (10+)
- ✅ Support ticket root cause analysis (50+ tickets)
- ✅ Enhancement request consolidation
- ✅ Cross-source synthesis (interviews + tickets + analytics)

**When NOT to use this skill:**
- ❌ Planning future research (use `/discover` or `/research`)
- ❌ Single interview analysis (analyze as you go)
- ❌ Real-time triage of incoming requests (use `/prioritize`)

---

## Clarifying Questions

Start by asking these questions to understand the synthesis scope:

1. **What feedback are you synthesizing?**
   - Sources: (Interviews, tickets, requests, analytics, etc.)
   - Volume: (How many data points?)
   - Time range: (Dates covered)

2. **What customer segments are represented?**
   - ICP vs. non-ICP split?
   - Company sizes, industries, roles?

3. **What are you trying to learn?**
   - Specific research questions?
   - Decisions this will inform?
   - Hypotheses to validate?

4. **What's your timeline?**
   - When do you need synthesis completed?
   - How much time can you dedicate today?

---

## The Synthesis Process

### Phase 1: Data Preparation & Organization (15-20 min)

**Goal:** Transform raw feedback into structured, analyzable format.

**Activities:**

#### 1.1 Data Inventory
Create comprehensive inventory of all feedback sources:
- **Source types**: Customer interviews, support tickets, enhancement requests, user analytics, sales calls, user testing
- **Volume**: Total count per source type
- **Quality**: Richness of data (verbatim quotes vs. summaries)
- **Time range**: Date coverage
- **Customer segments**: ICP vs. non-ICP, company size, industry
- **Coverage gaps**: What segments/problems are missing?

#### 1.2 Atomic Nugget Extraction
Break raw feedback into discrete, analyzable units:
- **One observation per nugget**: Each nugget captures single insight, quote, or data point
- **Preserve context**: Who said it, when, in what situation
- **Tag metadata**: Customer segment, source type, date, topic
- **Extract verbatim quotes**: Don't paraphrase - capture exact language

**Atomic Nugget Template:**
```markdown
**Nugget ID**: [Source]-[Number] (e.g., INT-005, TKT-142)
**Source**: [Interview transcript / Support ticket / Enhancement request / Analytics]
**Customer**: [Segment, company size, role]
**Date**: YYYY-MM-DD
**Quote/Observation**: "[Exact verbatim quote or specific observation]"
**Context**: [What triggered this? What were they trying to do?]
**Tags**: [Problem area, feature category, urgency level]
```

#### 1.3 Initial Signal/Noise Filtering
Apply quick filter to focus on high-signal data:

**Signal indicators:**
- Repeated across multiple sources (frequency)
- High severity/impact (customer explicitly states pain level)
- Aligns with strategic direction
- ICP customers experiencing the problem
- Workarounds exist (evidence of unmet need)

**Noise indicators:**
- Single mention (anecdote, not pattern)
- Off-strategy or edge case
- Non-ICP segment only
- Feature request without underlying problem stated
- Vague or unclear feedback

See `output-templates.md` for the complete Phase 1 output template.

---

### Phase 2: Pattern Identification & Analysis (30-45 min)

**Goal:** Identify themes, extract jobs-to-be-done, and classify signal strength using multiple frameworks.

This phase applies four complementary frameworks. See `frameworks.md` for detailed guidance on each:

- **2a. Thematic Analysis** (Braun & Clarke 6-Phase Model)
- **2b. Affinity Mapping** (Cluster by Meaning, Not Keywords)
- **2c. Jobs-to-be-Done Synthesis**
- **2d. Signal vs Noise Filtering** (Prioritization Matrix)

**Signal Strength Formula:**
```
Signal Strength = Frequency × Severity × Strategic Fit
```

**Classification:**

| Signal Strength Score | Classification | Action |
|----------------------|----------------|--------|
| 60+ | **Very Strong Signal** | High priority, validate and build |
| 30-59 | **Strong Signal** | Prioritize for roadmap consideration |
| 10-29 | **Medium Signal** | Track, may become stronger over time |
| <10 | **Weak Signal / Noise** | Log but don't prioritize |

See `output-templates.md` for the complete Phase 2 output template.

---

### Phase 3: Insight Extraction & Recommendations (20-30 min)

**Goal:** Convert pattern analysis into actionable insights, opportunity statements, and prioritized recommendations.

#### 3a. Insight Statement Generation

**Insight Statement Template:**
```
[Customer Segment] struggle with [Specific Problem] because [Root Cause].
This matters because [Business Impact].
We learned [Unique Finding that others might miss].
```

**Quality checklist:**
- [ ] Specific customer segment named
- [ ] Root cause identified (not just symptom)
- [ ] Business impact quantified or described
- [ ] Non-obvious learning included
- [ ] Actionable (points toward solution direction)

#### 3b. Opportunity Statement Creation

**Opportunity Statement Template:**
```
For [Target Customer]
Who [Context/Situation]
The problem is [Specific Pain Point]
Which impacts them by [Consequence/Cost]
A solution would [Desired Outcome]
Unlike [Current Alternatives]
Our approach could [Strategic Differentiation]
```

#### 3c. Assumption Documentation & Validation Tracking

Track assumptions that need validation before committing to build:

| Assumption | Risk Level | Validation Method | Status | Evidence |
|------------|-----------|-------------------|--------|----------|
| [Assumption 1] | [Critical/High/Medium/Low] | [Interview/Prototype/Analytics/Spike] | [✅ Validated / ⚠️ Uncertain / ❌ Invalidated / 🔄 In Progress] | [Evidence summary] |

#### 3d. Opportunity Prioritization

**Priority Score** = Impact (1-10) × Strategic Fit (1-10) × Confidence (1-10)

See `output-templates.md` for the complete Phase 3 output template.

---

## Output Format

### Synthesis Report
**Location**: `memory-bank/synthesis/[YYYY-MM-DD]-[topic]-synthesis.md`
**Naming**: ISO date, topic area, "synthesis"

The report will contain all outputs from Phases 1-3.

---

## Additional Resources

### Deep-Dive Frameworks
See `frameworks.md` for detailed guidance on:
- Thematic Analysis Framework
- Affinity Mapping
- Jobs-to-be-Done Synthesis
- Atomic Research Nuggets
- Signal vs Noise Filtering
- Insight & Opportunity Statements
- Continuous Discovery Pattern Mapping
- Framework Application Matrix (decision tree)

### Output Templates
See `output-templates.md` for:
- Complete Phase 1 output template
- Complete Phase 2 output template
- Complete Phase 3 output template

### Command Integration
See `integration.md` for:
- Upstream commands that feed into synthesis (`/research`, `/discover`, `/prioritize`)
- Downstream commands that consume synthesis outputs (`/spec`, `/think`, `/decide`)
- When to chain commands vs. use standalone

### MCP Integration
See `mcp-integration.md` for:
- Granola MCP (meeting data)
- Notion MCP (research repository)
- AgilePlace MCP (opportunity tracking)
- Code examples for each MCP

### Constraints & Anti-Patterns
See `constraints.md` for:
- 8 anti-patterns to avoid
- Why each anti-pattern matters
- Examples of bad vs. good practice

### Usage Examples
See `examples.md` for:
- Quarterly interview synthesis scenario
- Support ticket pattern analysis scenario
- Enhancement request consolidation scenario

### Underlying Mental Models
See `mental-models.md` for:
- Four Risks (Marty Cagan) - Value risk first
- Jobs-to-be-Done (Clayton Christensen)
- Confidence → Speed/Quality (Shreyas Doshi)
- Signal vs Noise (Nate Silver)
- Time Value of Shipping (Shreyas Doshi)

---

## Memory Bank Updates

After synthesis completes, update:

**memory-bank/synthesis/[YYYY-MM-DD]-[topic]-synthesis.md**
- Primary synthesis report output
- Full Phase 1-3 outputs

**memory-bank/activeContext.md**
- Update "Current Focus" section with synthesis findings
- Add "Recent Insights" from synthesis

**memory-bank/value-thesis.md**
- Add validated beliefs from synthesis insights
- Update "What We Believe" based on evidence

**memory-bank/progress.md**
- Log synthesis milestone completion
- Track synthesis cadence (quarterly, annual)
