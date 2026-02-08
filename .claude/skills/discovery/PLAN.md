# Discovery Skill: Architecture & Design Plan

## Purpose
The discovery skill enables **sustained, multi-turn user research and problem validation** over days/weeks of research activities.

## How It's Different from /discover Command

| Aspect | /discover Command | discovery Skill |
|--------|------------------|-----------------|
| **Duration** | 15-30 min (single turn) | Days/weeks (multi-session) |
| **Scope** | Planning discovery process | Conducting and synthesizing research |
| **Activities** | Define what to research | Actually do the research work |
| **Iteration** | One-time framework | Ongoing synthesis and refinement |
| **Output** | Discovery plan | Research report with validated insights |
| **Use Case** | Plan discovery initiative | Execute ongoing research program |

## When to Use discovery Skill

**Use this skill when:**
- Conducting multi-week user research initiatives
- Synthesizing findings from multiple interview sessions
- Iterating on research questions based on learnings
- Building comprehensive understanding of customer problems
- Validating/invalidating hypotheses over time
- Creating research repositories and insight libraries

**Use /discover command when:**
- Planning a discovery initiative
- Need discovery framework quickly
- Scoping what to research

## Skill Architecture

### Phase 1: Research Design (Session 1, 30-45 min)
**Goal:** Design rigorous research study

**Activities:**
1. **Define Research Questions**
   - What are we trying to learn?
   - What decisions will this research inform?
   - What hypotheses are we testing?

2. **Choose Research Methods**
   - Customer interviews (exploratory vs. validation)
   - Observational research (contextual inquiry)
   - Survey research (quantitative validation)
   - Prototype testing (solution validation)
   - Data analysis (behavioral patterns)

3. **Design Study**
   - Participant criteria (who to talk to)
   - Sample size (how many)
   - Interview guide / Survey questions / Test protocol
   - Success criteria (what would validate/invalidate our hypotheses)

**Can leverage:**
- Read existing research files to avoid duplicating
- Access JTBD framework templates
- Reference product-management research best practices

**Output:** Research study design document

---

### Phase 2: Interview/Research Execution (Multiple sessions)
**Goal:** Conduct research and capture findings in real-time

**Activities:**
1. **Interview Support**
   - Help prepare for each interview (review guide, participant context)
   - Suggest follow-up questions during/after interviews
   - Help capture key quotes and observations
   - Identify patterns emerging across interviews

2. **Real-time Synthesis**
   - After each interview: "What did we learn?"
   - Pattern detection: "What themes are emerging?"
   - Hypothesis testing: "Did this validate or invalidate our assumptions?"
   - Next interview planning: "What should we ask next?"

3. **Research Repository**
   - Help organize interview notes
   - Tag insights by theme/pattern
   - Track hypothesis validation status
   - Build insight library

**Capabilities:**
- Can read/analyze interview transcripts or notes
- Can search for patterns across multiple interview files
- Can track evolving hypotheses
- Can suggest when you've reached saturation (diminishing returns from more interviews)

**Output:** Ongoing research notes, emerging patterns, hypothesis tracker

---

### Phase 3: Synthesis & Analysis (After research collection, 60-90 min)
**Goal:** Synthesize research into actionable insights

**Activities:**
1. **Pattern Identification**
   - What themes emerged across participants?
   - What surprised us?
   - Where was there consensus vs. disagreement?
   - What segments/personas emerged?

2. **Jobs to Be Done Analysis**
   - What jobs are customers trying to do?
   - What's the functional job? Social job? Emotional job?
   - What are current solutions and their limitations?
   - What would make them "hire" a new solution?

3. **Problem/Opportunity Sizing**
   - How many customers have this problem?
   - How painful is it? (frequency × intensity)
   - How much would they pay to solve it?
   - What's the total addressable opportunity?

4. **Hypothesis Validation**
   - Which hypotheses were validated?
   - Which were invalidated?
   - What new hypotheses emerged?
   - What still needs validation?

**Frameworks Applied:**
- JTBD (Jobs, Pains, Gains)
- Kano Model (Must-haves, Performance, Delighters)
- Value Proposition Canvas
- User journey mapping
- Persona development

**Output:** Research synthesis document with insights, patterns, JTBD analysis

---

### Phase 4: Insights & Recommendations (Final session, 30-45 min)
**Goal:** Translate insights into product recommendations

**Activities:**
1. **Key Insights** (What we learned)
   - Top 5-7 insights from research
   - Supporting evidence (quotes, data, patterns)
   - Implications for product strategy

2. **Problem Statement**
   - For [target customer]
   - Who [context/situation]
   - The problem is [specific pain point]
   - Which impacts them by [consequence]
   - A successful solution would [desired outcome]

3. **Opportunity Prioritization**
   - Which problems are most worth solving?
   - What's the impact × feasibility?
   - What aligns with strategy?

4. **Recommended Next Steps**
   - What should we build/test next?
   - What additional validation is needed?
   - What metrics should we track?

**Output:** Research report ready to share with stakeholders

---

## Reference Materials Included

The skill will have access to reference templates:

### 1. JTBD Interview Script Template
```markdown
## Jobs-to-be-Done Interview Guide

### Opening (5 min)
- Build rapport
- "I want to understand how you currently [do X]"
- Permission to record

### Timeline (20 min) - Focus on LAST TIME they did this job
"Tell me about the LAST TIME you [job to be done]"

**First Thought:**
- When did you first realize you needed to do this?
- What triggered this need?

**Passive Looking:**
- What did you do first to explore solutions?
- Where did you look for information?

**Active Looking:**
- What alternatives did you seriously consider?
- How did you evaluate them?
- What criteria mattered most?

**Deciding:**
- What made you choose [solution]?
- What almost stopped you?
- Who else was involved in the decision?

**First Use:**
- What was it like when you first used it?
- What surprised you?
- What was harder than expected?

**Ongoing Use:**
- How do you use it today?
- What do you love about it?
- What's frustrating?
- What workarounds have you created?

### Job Breakdown
- What are you REALLY trying to accomplish? (Functional job)
- How does this make you feel/look to others? (Social/emotional job)
- What would your ideal solution do?

### Closing (5 min)
- Anything else I should have asked?
- Anyone else I should talk to?
```

### 2. Research Synthesis Framework
```markdown
## Research Synthesis Template

### Executive Summary
- # of interviews conducted
- Date range
- Participant profile
- Key findings (3-5 bullet points)

### Methodology
- Research questions
- Methods used
- Participant criteria
- Sample size and composition

### Key Themes

**Theme 1: [Name]**
- Pattern: [What we observed]
- Evidence:
  - "[Quote from Participant A]"
  - "[Quote from Participant B]"
- Implications: [What this means for product]

**Theme 2: [Name]**
[Repeat structure]

### Jobs to Be Done

**Primary Job:**
When [situation], I want to [motivation], so I can [outcome].

**Supporting Jobs:**
- [Job 2]
- [Job 3]

**Pains:**
- [Current pain 1]
- [Current pain 2]

**Gains:**
- [Desired outcome 1]
- [Desired outcome 2]

### Segments/Personas
[If patterns suggest different user types]

**Persona 1: [Name]**
- Characteristics
- Primary job
- Key pain points
- Success criteria

### Hypothesis Validation

| Hypothesis | Status | Evidence |
|------------|--------|----------|
| [Hypothesis 1] | ✅ Validated | [Evidence] |
| [Hypothesis 2] | ❌ Invalidated | [Evidence] |
| [Hypothesis 3] | ⚠️ Uncertain | [More validation needed] |

### Opportunity Sizing
- How many customers have this problem?
- How painful is it? (1-10 scale)
- How often does it occur?
- What's the current cost/workaround?

### Recommendations
1. [Actionable recommendation 1]
2. [Actionable recommendation 2]
3. [Further research needed on...]
```

### 3. Four Risks Validation Framework
```markdown
## Four Risks Validation Tracker

### Value Risk (Will customers find this valuable?)
**Hypothesis:** [What we believe about customer value]
**Test:** [How we'll validate]
**Results:** [What we learned]
**Status:** ✅ Validated / ❌ Invalidated / ⚠️ Uncertain

### Usability Risk (Can customers figure out how to use it?)
**Hypothesis:** [What we believe about usability]
**Test:** [Prototype testing, task completion, etc.]
**Results:** [What we learned]
**Status:** ✅ / ❌ / ⚠️

### Feasibility Risk (Can we build this?)
**Hypothesis:** [What we believe about technical feasibility]
**Test:** [Technical spike, proof of concept]
**Results:** [What we learned]
**Status:** ✅ / ❌ / ⚠️

### Viability Risk (Does this work for our business?)
**Hypothesis:** [What we believe about business model]
**Test:** [Pricing research, unit economics, strategic fit]
**Results:** [What we learned]
**Status:** ✅ / ❌ / ⚠️
```

---

## Integration with AIPMOS Core Rules

- **PM Operating Principles:** Continuous discovery (talk to customers weekly), Four Risks validation, customer truth wins
- **Mental Models:** Confidence→Speed/Quality (low confidence = research before building), Expected Value, Diminishing Returns (know when to stop researching)
- **Frameworks as Tools:** JTBD, Four Risks, Kano Model, Value Proposition Canvas
- **Decision Framework:** Document what we learned, update decision logs with research insights

---

## Tools the Skill Can Use

- **Read:** Access interview transcripts, research notes, customer feedback files
- **Grep:** Search for patterns across interview files ("look for all mentions of 'pricing'")
- **Glob:** Find all research files from a specific time period or project
- **Write:** Help create interview guides, synthesis documents, research reports

---

## Deliverables

1. **Research Study Design** (Phase 1 output)
2. **Interview Notes & Emerging Patterns** (Phase 2, ongoing)
3. **Research Synthesis Document** (Phase 3 output)
4. **Research Report with Recommendations** (Phase 4 output - main deliverable)

---

## Success Criteria for This Skill

**A successful discovery session produces:**
- ✅ Clear research questions that inform decisions
- ✅ Rigorous study design with appropriate methods
- ✅ High-quality interview data with rich quotes and observations
- ✅ Pattern identification across multiple participants
- ✅ JTBD analysis revealing functional, social, and emotional jobs
- ✅ Hypothesis validation (what's confirmed, what's disproven, what's uncertain)
- ✅ Actionable recommendations grounded in customer evidence
- ✅ Research report ready to share with stakeholders

**Time investment:**
- Research design: 30-45 minutes
- Per interview support: 10-15 minutes pre/post
- Synthesis: 60-90 minutes
- Report: 30-45 minutes
- Total: Variable based on # of interviews (typically 5-20 hours over 2-4 weeks)

**ROI:** Validated insights that de-risk product decisions and ensure you build the right thing
