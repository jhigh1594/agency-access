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

**When to use this command:**
- ✅ Quarterly synthesis of accumulated customer feedback
- ✅ Pattern analysis across multiple interviews (10+)
- ✅ Support ticket root cause analysis (50+ tickets)
- ✅ Enhancement request consolidation
- ✅ Cross-source synthesis (interviews + tickets + analytics)

**When NOT to use this command:**
- ❌ Planning future research (use `/discover` or `/research`)
- ❌ Single interview analysis (analyze as you go)
- ❌ Real-time triage of incoming requests (use `/prioritize`)

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

**Output Template: Phase 1**

```markdown
# Phase 1: Data Preparation & Organization

**Date**: YYYY-MM-DD
**Analyst**: [Your name]
**Synthesis Scope**: [Time range, sources included]

## Data Inventory

| Source Type | Volume | Time Range | Quality | Customer Segments |
|-------------|--------|------------|---------|------------------|
| Customer Interviews | [N] | [Start - End] | [High/Medium/Low] | [Segments covered] |
| Support Tickets | [N] | [Start - End] | [High/Medium/Low] | [Segments covered] |
| Enhancement Requests | [N] | [Start - End] | [High/Medium/Low] | [Segments covered] |
| User Analytics | [N events] | [Start - End] | [High/Medium/Low] | [Segments covered] |

**Total Data Points**: [N]
**ICP Coverage**: [% from ICP customers]
**Coverage Gaps**: [What's missing - segments, problem areas, time periods]

## Atomic Nuggets Extracted

**Sample Nuggets** (Top 10-15 most significant):

**INT-001**
- **Source**: Customer interview, VP Engineering, Financial Services (5,000 employees)
- **Date**: 2025-12-15
- **Quote**: "We spend 3-4 hours every week manually tracking dependencies across teams in spreadsheets. It's a complete time sink and we still miss things."
- **Context**: Asked about biggest pain point in current workflow
- **Tags**: Dependencies, manual work, time waste, high urgency

**TKT-042**
- **Source**: Support ticket, Agile Program Manager, Insurance (8,000 employees)
- **Date**: 2026-01-05
- **Quote**: "Is there a way to automatically flag when a dependency is at risk? We find out too late that blocked items are affecting downstream teams."
- **Context**: Feature request submitted after missed deadline
- **Tags**: Dependencies, automation, risk visibility, reactive problem

[Continue with additional nuggets...]

## Signal vs Noise - Initial Classification

**High Signal** (Frequent × Severe × Strategic Fit):
- Dependency visibility and tracking ([N] mentions across interviews, tickets)
- Cross-team coordination overhead ([N] mentions)
- Proactive risk alerting ([N] mentions)

**Medium Signal** (Worth tracking):
- [Theme]: [N] mentions
- [Theme]: [N] mentions

**Low Signal / Noise** (Single mentions, off-strategy):
- [Theme]: [1-2] mentions
- [Theme]: Non-ICP only

## Preliminary Themes Identified

Quick first-pass themes before deep analysis:
1. **[Theme 1]**: [Brief description, frequency]
2. **[Theme 2]**: [Brief description, frequency]
3. **[Theme 3]**: [Brief description, frequency]
```

---

### Phase 2: Pattern Identification & Analysis (30-45 min)

**Goal:** Identify themes, extract jobs-to-be-done, and classify signal strength using multiple frameworks.

This phase applies four complementary frameworks in sequence:

#### 2a. Thematic Analysis (Braun & Clarke 6-Phase Model)

**What it is:** Systematic method for identifying, analyzing, and reporting patterns (themes) across qualitative data.

**The 6 Phases:**

**Phase 1: Familiarization**
- Read through all atomic nuggets multiple times
- Note initial impressions and potential patterns
- Immerse yourself in the data before coding

**Phase 2: Initial Coding**
- Assign codes (labels) to interesting features of the data
- Code systematically across entire dataset
- Use descriptive codes (e.g., "manual-dependency-tracking", "missed-deadlines", "spreadsheet-workarounds")

**Phase 3: Theme Development**
- Collate codes into potential themes
- Look for patterns where multiple codes relate to same underlying issue
- Use visual mapping (affinity clusters) to group related codes

**Phase 4: Theme Review**
- Check themes work at level of coded extracts
- Check themes work in relation to entire dataset
- Refine, split, combine, or discard candidate themes

**Phase 5: Theme Definition**
- Define and name each theme
- Identify the "story" each theme tells
- Ensure themes don't overlap excessively
- Create clear theme descriptions with supporting evidence

**Phase 6: Analysis & Reporting**
- Select vivid, compelling extract examples
- Relate themes back to research questions
- Tell coherent story about the data

**Application to Customer Feedback:**
- Themes = recurring customer problems or needs
- Codes = specific feedback elements (pain points, workarounds, contexts)
- Analysis = evidence-based insight into what customers truly need

#### 2b. Affinity Mapping (Cluster by Meaning, Not Keywords)

**What it is:** Collaborative technique for organizing qualitative data into hierarchical groups based on natural relationships.

**Critical principle:** Cluster by **meaning**, not by **keyword matching**.

**How to apply:**

**Step 1: Write nuggets on virtual "sticky notes"**
- Each atomic nugget becomes one note
- Keep context visible (who said it, when)

**Step 2: Identify natural affinities**
- Look for nuggets describing similar **underlying problems**
- Don't group by surface-level keywords (avoid "all mentions of 'dependencies'")
- Ask: "Are these describing the same fundamental need or pain?"

**Step 3: Create hierarchical clusters**
- **Bottom level**: Individual nuggets
- **Mid level**: Problem clusters (5-10 nuggets per cluster)
- **Top level**: Themes (3-5 clusters per theme)

**Step 4: Name clusters descriptively**
- Use customer language where possible
- Describe the **problem**, not the solution
- Keep names concise but specific

**Example:**

**❌ Bad grouping (keyword matching):**
- Cluster: "Dependency mentions"
  - Contains any feedback mentioning "dependency"
  - Lumps together different underlying problems

**✅ Good grouping (meaning-based):**
- Cluster: "Reactive dependency problem detection"
  - Finding out too late that dependencies are broken
  - Discovering blockers after downstream teams are affected
  - Manual status checks that miss timing issues
  - (All describe same underlying problem: lack of proactive visibility)

#### 2c. Jobs-to-be-Done Synthesis

**What it is:** Framework for understanding customer motivations by focusing on the "job" they're trying to accomplish.

**The JTBD Structure:**

**Functional Job** (What task?)
- Objective, practical outcome customer wants to achieve
- Usually measurable and observable
- Example: "Track cross-team dependencies to avoid missed deadlines"

**Social Job** (How does it make them look?)
- How this impacts their professional reputation
- Status or identity implications
- Example: "Appear competent and reliable to executive leadership"

**Emotional Job** (How does it make them feel?)
- Emotional state customer wants to achieve
- Peace of mind, confidence, control
- Example: "Feel confident that our delivery commitments are realistic"

**Current Solutions & Limitations:**
- What do customers use today to accomplish this job?
- Why are current solutions inadequate?
- What workarounds have they created?
- Example: "Spreadsheets manually updated weekly - time-consuming, error-prone, reactive"

**Hiring Criteria** (What makes them switch?)
- **Push forces**: What's pushing them away from current solution?
  - Example: "Too many missed deadlines due to invisible dependencies"
- **Pull forces**: What's attracting them to new solution?
  - Example: "Automated tracking would save 3+ hours per week"
- **Anxiety forces**: What makes them hesitate to switch?
  - Example: "Concern about tool complexity, adoption resistance"
- **Habit forces**: What keeps them stuck with current solution?
  - Example: "Team is familiar with spreadsheet workflow"

**Synthesis Process:**

For each theme identified in 2a/2b:
1. State the functional job customers are trying to accomplish
2. Identify social and emotional dimensions
3. Document current solutions and why they fail
4. Map forces influencing solution adoption

#### 2d. Signal vs Noise Filtering (Prioritization Matrix)

**What it is:** Systematic method to distinguish high-value insights from outliers using three factors.

**The Formula:**

```
Signal Strength = Frequency × Severity × Strategic Fit
```

**Frequency** (How many times mentioned?)
- **Strong signal**: 10+ mentions across multiple customers
- **Weak signal**: 3-5 mentions
- **Noise**: 1-2 mentions (anecdotes)

**Severity** (How painful is the problem?)
- **Critical** (3 points): Blocks work, causes missed deadlines, significant business impact
- **High** (2 points): Major inefficiency, frequent frustration
- **Medium** (1 point): Annoyance, minor time waste
- **Low** (0.5 points): Nice-to-have improvement

**Strategic Fit** (Does it align with strategy?)
- **Core** (3 points): Directly advances strategic objectives, ICP problem
- **Adjacent** (2 points): Related to strategy, moderate ICP relevance
- **Tangential** (1 point): Loosely related, non-ICP segment
- **Off-strategy** (0 points): Doesn't fit product direction

**Classification:**

| Signal Strength Score | Classification | Action |
|----------------------|----------------|--------|
| 60+ | **Very Strong Signal** | High priority, validate and build |
| 30-59 | **Strong Signal** | Prioritize for roadmap consideration |
| 10-29 | **Medium Signal** | Track, may become stronger over time |
| <10 | **Weak Signal / Noise** | Log but don't prioritize |

**Output Template: Phase 2**

```markdown
# Phase 2: Pattern Identification & Analysis

## 2a. Thematic Analysis Results

**Themes Identified**: [N]

### Theme 1: [Theme Name]

**Description**: [What this theme represents - the core customer problem or need]

**Frequency**: [N] nuggets, [N] unique customers
**Customer Segments**: [Which segments experience this]
**Coded Elements**:
- [Code 1]: [Description]
- [Code 2]: [Description]
- [Code 3]: [Description]

**Supporting Evidence** (Key quotes):
1. "[Quote 1]" - [Customer segment, source]
2. "[Quote 2]" - [Customer segment, source]
3. "[Quote 3]" - [Customer segment, source]

**Analysis**: [What story does this theme tell? Why does this matter?]

### Theme 2: [Theme Name]
[Repeat structure...]

### Theme 3: [Theme Name]
[Repeat structure...]

---

## 2b. Affinity Map (Hierarchical Clustering)

**Visual Representation:**

```
LEVEL 1 (Themes)
├─ Theme 1: [Name]
│  ├─ Cluster 1a: [Name]
│  │  ├─ Nugget 1
│  │  ├─ Nugget 2
│  │  └─ Nugget 3
│  └─ Cluster 1b: [Name]
│     ├─ Nugget 4
│     └─ Nugget 5
│
├─ Theme 2: [Name]
│  ├─ Cluster 2a: [Name]
│  │  ├─ Nugget 6
│  │  └─ Nugget 7
│  └─ Cluster 2b: [Name]
│     ├─ Nugget 8
│     ├─ Nugget 9
│     └─ Nugget 10
│
└─ Theme 3: [Name]
   └─ Cluster 3a: [Name]
      ├─ Nugget 11
      └─ Nugget 12
```

**Clustering Rationale:**
- **Why grouped**: [Explain natural affinities between nuggets]
- **Meaning, not keywords**: [How did you avoid keyword traps?]
- **Hierarchy logic**: [Why these themes contain these clusters]

---

## 2c. Jobs-to-be-Done Analysis

### JTBD 1: [Job Statement]

**When**: [Context / Situation]
**I want to**: [Functional job]
**So I can**: [Desired outcome]

**Dimensions:**
- **Functional Job**: [Objective, practical task]
- **Social Job**: [How it affects professional reputation]
- **Emotional Job**: [Peace of mind, confidence, control]

**Current Solutions:**
- [Solution 1]: [Why inadequate]
- [Solution 2]: [Why inadequate]
- Workarounds: [What customers have created]

**Hiring Criteria** (Forces at play):

**Push Forces** (Away from current solution):
- [Force 1]: [Specific pain with current approach]
- [Force 2]: [Another pain point]

**Pull Forces** (Toward new solution):
- [Force 1]: [Benefit that attracts them]
- [Force 2]: [Another benefit]

**Anxiety Forces** (Hesitation):
- [Force 1]: [Concern about switching]
- [Force 2]: [Another barrier]

**Habit Forces** (Inertia):
- [Force 1]: [Why they stick with current solution]

### JTBD 2: [Job Statement]
[Repeat structure...]

---

## 2d. Signal vs Noise Classification

**Scoring Framework Applied:**
Signal Strength = Frequency (1-10+) × Severity (0.5-3) × Strategic Fit (0-3)

| Theme | Frequency | Severity | Strategic Fit | Score | Classification |
|-------|-----------|----------|---------------|-------|----------------|
| [Theme 1] | [N mentions] | [Critical/High/Med/Low] | [Core/Adjacent/Tangent/Off] | [Score] | [Very Strong / Strong / Medium / Weak] |
| [Theme 2] | [N mentions] | [Critical/High/Med/Low] | [Core/Adjacent/Tangent/Off] | [Score] | [Very Strong / Strong / Medium / Weak] |
| [Theme 3] | [N mentions] | [Critical/High/Med/Low] | [Core/Adjacent/Tangent/Off] | [Score] | [Very Strong / Strong / Medium / Weak] |

**Very Strong Signals** (60+ score):
- [Theme]: [Why this is very strong - frequency, severity, fit evidence]

**Strong Signals** (30-59 score):
- [Theme]: [Why this is strong]

**Medium Signals** (10-29 score):
- [Theme]: [Why tracking but not prioritizing yet]

**Weak Signals / Noise** (<10 score):
- [Theme]: [Why classified as noise]

**Surprises & Outliers:**
- [Unexpected finding 1]: [Why surprising, what it means]
- [Unexpected finding 2]: [Why surprising, what it means]
```

---

### Phase 3: Insight Extraction & Recommendations (20-30 min)

**Goal:** Convert pattern analysis into actionable insights, opportunity statements, and prioritized recommendations.

This phase synthesizes all previous analysis into executive-ready outputs.

#### 3a. Insight Statement Generation

**What is an Insight Statement?**
An insight reveals a non-obvious truth about customers that has product implications. It's not just a data point - it's an *interpretation* that drives action.

**Insight Statement Template:**

```
[Customer Segment] struggle with [Specific Problem] because [Root Cause].
This matters because [Business Impact].
We learned [Unique Finding that others might miss].
```

**How to craft strong insights:**

**✅ Good Insight:**
"Enterprise Agile teams struggle with proactive dependency management because current tools only show static relationships, not timing or health status. This matters because 60% of missed delivery commitments trace back to invisible dependency issues. We learned that teams already track this manually in spreadsheets, spending 3+ hours per week, which signals high willingness to adopt a better solution."

**❌ Weak Insight (just restating data):**
"Customers want better dependency tracking."

**Quality checklist:**
- [ ] Specific customer segment named
- [ ] Root cause identified (not just symptom)
- [ ] Business impact quantified or described
- [ ] Non-obvious learning included
- [ ] Actionable (points toward solution direction)

#### 3b. Opportunity Statement Creation

**What is an Opportunity Statement?**
Opportunity statements bridge insights to product decisions. They describe the problem space without prescribing the solution.

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

**Example:**

```
For Enterprise Agile Program Managers
Who coordinate delivery across 5-20+ teams
The problem is invisible dependencies that break without warning
Which impacts them by causing missed commitments, emergency escalations, and eroded stakeholder trust
A solution would proactively surface dependency risks before they affect downstream teams
Unlike static relationship diagrams or manual spreadsheet tracking
Our approach could integrate real-time health signals with intelligent risk scoring
```

**Prioritization criteria for opportunities:**
- **Impact**: How many customers? How severe is pain?
- **Strategic Fit**: Does it advance our North Star?
- **Confidence**: How validated is this opportunity?
- **Feasibility**: Can we build this? What's the effort?

#### 3c. Assumption Documentation & Validation Tracking

**What are assumptions?**
Beliefs we're operating on that need validation before committing to build.

**Assumption Categories:**

**Value Assumptions** (HIGHEST PRIORITY):
- [ ] Customers will find this solution valuable
- [ ] Customers will switch from current workarounds
- [ ] Customers will pay for this capability
- [ ] The problem is frequent/severe enough to solve

**Usability Assumptions:**
- [ ] Customers can adopt this without extensive training
- [ ] The workflow fits their existing processes
- [ ] Cognitive load is manageable

**Feasibility Assumptions:**
- [ ] We can build this with current tech stack
- [ ] Performance/scale requirements are achievable
- [ ] Integration with existing systems is viable

**Viability Assumptions:**
- [ ] This aligns with business model
- [ ] Go-to-market strategy is clear
- [ ] Competitive differentiation is sustainable

**Validation Tracker Template:**

| Assumption | Risk Level | Validation Method | Status | Evidence |
|------------|-----------|-------------------|--------|----------|
| [Assumption 1] | [Critical/High/Medium/Low] | [Interview/Prototype/Analytics/Spike] | [✅ Validated / ⚠️ Uncertain / ❌ Invalidated / 🔄 In Progress] | [Evidence summary] |
| [Assumption 2] | [Risk level] | [Method] | [Status] | [Evidence] |

#### 3d. Opportunity Prioritization

**Framework:** Impact × Strategic Fit × Confidence

**Impact Score** (1-10):
- How many customers affected?
- How severe is the pain?
- What's the business value?

**Strategic Fit Score** (1-10):
- Does this advance our North Star?
- Is this our ICP?
- Does it build competitive moat?

**Confidence Score** (1-10):
- How validated is the opportunity?
- How much evidence do we have?
- What's our certainty level?

**Priority Score** = Impact × Strategic Fit × Confidence

**Output Template: Phase 3**

```markdown
# Phase 3: Insight Extraction & Recommendations

## 3a. Insight Statements

### Insight 1: [Descriptive Title]

**Statement:**
[Customer Segment] struggle with [Specific Problem] because [Root Cause].
This matters because [Business Impact].
We learned [Unique Finding].

**Supporting Evidence:**
- [Data point 1]
- [Data point 2]
- [Quote or metric]

**Implications:**
[What this means for product strategy, roadmap, positioning]

---

### Insight 2: [Descriptive Title]
[Repeat structure...]

---

### Insight 3: [Descriptive Title]
[Repeat structure...]

---

## 3b. Opportunity Statements

### Opportunity 1: [Descriptive Title]

**For**: [Target Customer]
**Who**: [Context/Situation]
**The problem is**: [Specific Pain Point]
**Which impacts them by**: [Consequence/Cost]
**A solution would**: [Desired Outcome]
**Unlike**: [Current Alternatives]
**Our approach could**: [Strategic Differentiation]

**Evidence Base:**
- Frequency: [N] customers, [N] mentions
- Severity: [Quantified impact - time, money, risk]
- ICP Alignment: [% from ICP segment]

**Success Metrics:**
- Leading: [Adoption/usage metric]
- Lagging: [Business outcome metric]

---

### Opportunity 2: [Descriptive Title]
[Repeat structure...]

---

## 3c. Assumption Validation Tracker

**Critical Value Assumptions** (Must validate FIRST):

| Assumption | Risk Level | Validation Method | Status | Evidence |
|------------|-----------|-------------------|--------|----------|
| Customers will find proactive dependency alerts more valuable than manual tracking | Critical | Prototype testing with 5 customers | ⚠️ Uncertain | Need to test prototype |
| Enterprise teams are willing to adopt new dependency workflow | High | Customer interviews | ✅ Validated | 12/15 interviews mentioned frustration with current process |
| [Assumption 3] | [Risk level] | [Method] | [Status] | [Evidence] |

**Usability Assumptions:**

| Assumption | Risk Level | Validation Method | Status | Evidence |
|------------|-----------|-------------------|--------|----------|
| [Assumption 1] | [Risk level] | [Method] | [Status] | [Evidence] |

**Feasibility Assumptions:**

| Assumption | Risk Level | Validation Method | Status | Evidence |
|------------|-----------|-------------------|--------|----------|
| [Assumption 1] | [Risk level] | [Method] | [Status] | [Evidence] |

**Viability Assumptions:**

| Assumption | Risk Level | Validation Method | Status | Evidence |
|------------|-----------|-------------------|--------|----------|
| [Assumption 1] | [Risk level] | [Method] | [Status] | [Evidence] |

---

## 3d. Prioritized Opportunities

**Prioritization Framework:**
Priority Score = Impact (1-10) × Strategic Fit (1-10) × Confidence (1-10)

| Opportunity | Impact | Strategic Fit | Confidence | Priority Score | Rank |
|-------------|--------|---------------|------------|----------------|------|
| [Opportunity 1] | [Score] | [Score] | [Score] | [Total] | 1 |
| [Opportunity 2] | [Score] | [Score] | [Score] | [Total] | 2 |
| [Opportunity 3] | [Score] | [Score] | [Score] | [Total] | 3 |

**Top 3 Opportunities:**

**#1: [Opportunity Name]** (Score: [X])
- **Why prioritized**: [Impact, fit, and confidence rationale]
- **Next steps**: [What to do next - prototype? Spec? More validation?]
- **Timeline**: [Suggested timeframe]

**#2: [Opportunity Name]** (Score: [X])
- **Why prioritized**: [Rationale]
- **Next steps**: [Actions]
- **Timeline**: [Timeframe]

**#3: [Opportunity Name]** (Score: [X])
- **Why prioritized**: [Rationale]
- **Next steps**: [Actions]
- **Timeline**: [Timeframe]

---

## Recommended Next Steps

**Immediate Actions** (Next 1-2 weeks):
1. [Action 1]
2. [Action 2]
3. [Action 3]

**Validation Needed Before Committing** (Value Risk):
- [Validation activity 1]
- [Validation activity 2]

**Downstream Command Suggestions:**
- `/prioritize` - Use these insights to rank Q[X] roadmap
- `/spec` - Create PRD for top opportunity: [Name]
- `/think` - Strategic analysis of [specific finding]
- `/decide` - Go/no-go decision on [opportunity]

**Memory Bank Updates:**
- `memory-bank/synthesis/[YYYY-MM-DD]-[topic]-synthesis.md` - Store this synthesis report
- `activeContext.md` - Update with current synthesis focus
- `value-thesis.md` - Add validated beliefs from insights
- `progress.md` - Track synthesis milestones

**Integration Points:**
- **Granola MCP**: Fetch additional meeting transcripts for deeper synthesis
- **Notion MCP**: Store synthesis reports in research database
- **AgilePlace MCP**: Create opportunity cards from top insights
```

---

## Output Format

I'll start by asking clarifying questions:

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

Then I'll guide you through all 3 phases, producing:

### Synthesis Report
**Location**: `memory-bank/synthesis/[YYYY-MM-DD]-[topic]-synthesis.md`
**Naming**: ISO date, topic area, "synthesis"

The report will contain all outputs from Phases 1-3 as detailed above.

---

## Frameworks Applied (Deep Dives)

This section provides detailed guidance on when and how to apply each of the 7 synthesis frameworks.

### 1. Thematic Analysis Framework

**When to use:**
- **Data type**: Qualitative data (interviews, open-ended survey responses, support ticket descriptions)
- **Volume**: Medium to large datasets (10+ interviews, 50+ tickets)
- **Goal**: Identify recurring patterns and themes across data
- **Best for**: Understanding what customers care about most

**How to apply:**

Follow the Braun & Clarke 6-phase model:

**Phase 1: Familiarization** (15-20 min)
- Read all atomic nuggets at least twice
- Immerse yourself in the data without analyzing yet
- Note initial impressions in separate document
- Resist urge to code prematurely

**Phase 2: Initial Coding** (30-45 min)
- Create codes that capture interesting features
- Code systematically - don't cherry-pick
- Use descriptive labels: "manual-workaround", "time-waste-spreadsheets"
- One nugget can have multiple codes
- Keep codes close to the data (not overly abstract)

**Phase 3: Theme Development** (20-30 min)
- Group related codes into candidate themes
- Look for patterns: What codes frequently appear together?
- Use visual clustering (affinity mapping works well here)
- Themes should be broader than codes but specific enough to be meaningful

**Phase 4: Theme Review** (15-20 min)
- Check: Do the coded extracts support this theme?
- Check: Does theme work across the entire dataset?
- Refine boundaries between themes
- Split themes that are too broad
- Combine themes that overlap excessively

**Phase 5: Theme Definition** (15-20 min)
- Write clear definition for each theme
- Identify the "essence" of what the theme captures
- Name themes using customer language when possible
- Ensure themes tell a coherent story together

**Phase 6: Analysis & Reporting** (20-30 min)
- Select best quotes to illustrate each theme
- Explain how themes answer research questions
- Connect themes to product strategy

**Common pitfalls:**
- ❌ **Keyword matching**: Grouping all mentions of "dependencies" together without understanding context
- ❌ **Vague themes**: "Customer frustration" is too broad - frustration about what specifically?
- ❌ **Over-abstracting too early**: Jumping to high-level themes before understanding nuances
- ❌ **Ignoring disconfirming evidence**: Cherry-picking data that fits preconceptions

**Example application:**

*Data: 15 customer interviews about cross-team coordination*

**Codes identified:**
- manual-dependency-tracking (12 mentions)
- spreadsheet-workarounds (8 mentions)
- missed-deadlines (10 mentions)
- reactive-problem-detection (14 mentions)
- status-update-overhead (9 mentions)
- lack-of-visibility (11 mentions)

**Themes developed:**
1. **Reactive vs. Proactive Coordination** (combines: reactive-problem-detection, missed-deadlines, lack-of-visibility)
   - Customers find out about problems too late
   - Current tools only show static state, not health/risk

2. **Manual Overhead & Tool Inadequacy** (combines: manual-dependency-tracking, spreadsheet-workarounds, status-update-overhead)
   - Customers resort to manual processes because tools don't help
   - Time waste is significant (3+ hours weekly)

---

### 2. Affinity Mapping

**When to use:**
- **Data type**: Mixed qualitative data from multiple sources
- **Volume**: Medium datasets where hierarchical organization helps (20-100 nuggets)
- **Goal**: Organize data by natural relationships and meaning
- **Best for**: Finding structure in messy, multi-source feedback

**How to apply:**

**Step 1: Externalize all nuggets** (10 min)
- Write each atomic nugget on virtual sticky note
- Include just enough context (who, when, source)
- Keep nuggets concise (1-2 sentences max)

**Step 2: Silent individual clustering** (15-20 min)
- If working with team: each person clusters independently first
- Look for nuggets that describe similar underlying problems
- Don't force structure - let patterns emerge naturally
- Create spatial groupings (physically or virtually)

**Step 3: Identify affinities** (20-30 min)
- Ask: "Why did I put these together?"
- Name the relationship: What's the common thread?
- Avoid surface-level connections (keywords, source type)
- Focus on meaning: What underlying need/problem connects these?

**Step 4: Build hierarchy** (15-20 min)
- **Bottom level**: Individual nuggets (observations)
- **Middle level**: Problem clusters (5-10 nuggets describing same core issue)
- **Top level**: Themes (3-5 clusters that relate to broader pattern)

**Step 5: Label clusters** (10-15 min)
- Use customer language for labels
- Describe the problem, not the solution
- Keep labels specific enough to be actionable
- Test label: Does it capture the essence of all nuggets beneath it?

**Common pitfalls:**
- ❌ **Keyword clustering**: "All feedback mentioning 'reporting'" grouped together
- ❌ **Source-based grouping**: "All support tickets" or "All interview feedback"
- ❌ **Solution-based grouping**: "Dashboard improvements" instead of underlying problem
- ❌ **Forcing predetermined categories**: Let structure emerge from data

**Example application:**

*Clustering feedback about dependency management:*

**❌ Bad clustering (keyword-based):**
```
Group: "Dependency mentions"
├─ "We need better dependency tracking"
├─ "Dependencies are hard to see"
├─ "I want to track dependencies in one place"
└─ "Dependency alerts would help"
```
Problem: Lumps together different underlying needs (visibility vs. alerts vs. tracking)

**✅ Good clustering (meaning-based):**
```
Theme: Proactive Dependency Risk Management
├─ Cluster: Reactive Problem Detection
│  ├─ "We find out too late that dependencies broke"
│  ├─ "Blockers surprise downstream teams"
│  └─ "No early warning when risks emerge"
│
└─ Cluster: Manual Status Verification Overhead
   ├─ "We spend hours checking dependency health manually"
   ├─ "Spreadsheets don't scale for tracking"
   └─ "Status meetings consume too much time"
```
Why better: Captures distinct underlying problems (reactivity vs. manual overhead) that may require different solutions

---

### 3. Jobs-to-be-Done Synthesis

**When to use:**
- **Data type**: Interview transcripts, contextual inquiry notes
- **Volume**: Any size, but especially powerful with 5+ interviews
- **Goal**: Understand customer motivations and context
- **Best for**: Moving from surface-level requests to deeper needs

**How to apply:**

**Step 1: Identify the job** (15-20 min)
- Look beyond stated features: What's the underlying task?
- Ask: "What are they trying to accomplish?"
- Frame as verb + object: "Track delivery progress", "Coordinate cross-team work"

**Step 2: Map the three dimensions** (20-30 min)

**Functional Dimension:**
- Objective, measurable outcome
- What gets done? What changes state?
- Example: "Ensure all team dependencies are identified before sprint planning"

**Social Dimension:**
- How does this affect their professional reputation?
- What do they want others to think?
- Example: "Appear competent and reliable to executive leadership"

**Emotional Dimension:**
- How do they want to feel?
- What peace of mind are they seeking?
- Example: "Feel confident that commitments are realistic and achievable"

**Step 3: Document current solutions** (10-15 min)
- What do they use today?
- Why is it inadequate? (specific pain points)
- What workarounds have they created? (signals of unmet need)

**Step 4: Map forces diagram** (15-20 min)

```
         Current Solution ←→ New Solution
                 ↑              ↑
                 |              |
          ANXIETY FORCES   PULL FORCES
         (hesitation)     (attraction)
                 |              |
                 ↓              ↓
          HABIT FORCES     PUSH FORCES
         (inertia)      (away from current)
```

**Push Forces** (Why leave current solution?):
- Specific pains with status quo
- Problems getting worse over time
- Competitive pressure

**Pull Forces** (Why switch to new solution?):
- Promised benefits
- Novel capabilities
- Efficiency gains

**Anxiety Forces** (Why hesitate?):
- Learning curve concerns
- Change management risk
- Cost/effort to switch

**Habit Forces** (Why stay put?):
- Familiarity with current approach
- Sunk cost in existing tools
- "Good enough" mindset

**Common pitfalls:**
- ❌ **Confusing job with solution**: "The job is to use our dashboard" - NO, job is underlying task
- ❌ **Too broad**: "The job is to be productive" - too vague to be actionable
- ❌ **Missing emotional/social**: Only focusing on functional job ignores full motivation
- ❌ **Ignoring forces**: Not understanding what prevents adoption

**Example application:**

*Customer: Enterprise Agile Program Manager*

**Job Statement:**
"When coordinating delivery across 8 teams, I want to proactively identify dependency risks before they impact downstream work, so I can maintain predictable delivery and stakeholder trust."

**Dimensions:**
- **Functional**: Identify and resolve cross-team blockers before they cause delays
- **Social**: Be seen as reliable program leader who delivers on commitments
- **Emotional**: Feel confident and in control, not reactive and stressed

**Current Solutions:**
- Weekly status meetings (time-consuming, reactive)
- Manual spreadsheet tracking (error-prone, stale data)
- Slack messages for updates (scattered, easy to miss)

**Forces:**
- **Push**: Missed deadlines eroding stakeholder trust, manual overhead unsustainable
- **Pull**: Automated visibility would save 4+ hours weekly, proactive alerts prevent fires
- **Anxiety**: Team adoption resistance, learning curve for new tool
- **Habit**: Teams know current workflow, "better the devil you know"

---

### 4. Atomic Research Nuggets

**When to use:**
- **Data type**: Any qualitative feedback (interviews, tickets, requests, observations)
- **Volume**: Any size, but especially valuable for large, ongoing research
- **Goal**: Create modular, reusable research assets
- **Best for**: Building searchable knowledge base over time

**How to apply:**

**Step 1: Define nugget granularity** (5 min)
- One nugget = one discrete observation or insight
- Too granular: "Customer said 'yes'" (no context)
- Too broad: Entire interview summary (not atomic)
- Just right: Single insight with context

**Step 2: Extract nuggets from sources** (varies)
- Read source material (interview, ticket, etc.)
- Identify discrete, meaningful units
- Capture verbatim quotes when possible
- Preserve context (who, when, what situation)

**Step 3: Structure each nugget** (2-3 min per nugget)

**Required fields:**
- **ID**: Unique identifier (e.g., INT-005, TKT-142)
- **Source**: Type and reference (Interview #5, Ticket #142)
- **Customer**: Segment, role, company size
- **Date**: When this was captured
- **Observation/Quote**: The actual insight or quote
- **Context**: Situation that triggered this

**Optional metadata (tagging):**
- Theme/category
- Problem area
- Feature reference
- Urgency/severity
- ICP alignment

**Step 4: Store in searchable system** (ongoing)
- Use consistent naming and structure
- Enable search by tags, customer segment, date, theme
- Cross-reference related nuggets
- Update tags as themes emerge

**Common pitfalls:**
- ❌ **Paraphrasing instead of quoting**: Lose customer's voice and nuance
- ❌ **Mixing multiple insights**: One nugget should capture one thing
- ❌ **Stripping context**: "Customer wants X" without explaining why or when
- ❌ **Inconsistent tagging**: Makes searching and synthesis difficult

**Example application:**

**Good Nugget:**
```markdown
**ID**: INT-012
**Source**: Customer interview, Q1 2026 research initiative
**Customer**: VP Engineering, Insurance, 8,000 employees, ICP segment
**Date**: 2026-01-08
**Quote**: "Every Monday I spend 2-3 hours updating our dependency spreadsheet by pinging teams on Slack. Half the time I get stale information, and we still miss blockers until it's too late."
**Context**: Discussing weekly coordination rituals and pain points
**Tags**: dependencies, manual-overhead, reactive-detection, time-waste, ICP
```

**Why this is good:**
- ✅ Captures specific, quantified pain ("2-3 hours")
- ✅ Preserves exact customer language
- ✅ Includes context (when this happens, what triggers it)
- ✅ Rich metadata for future synthesis
- ✅ Can be reused in multiple analyses (manual overhead theme, dependency theme, etc.)

---

### 5. Signal vs Noise Filtering

**When to use:**
- **Data type**: Any feedback source, especially mixed-quality data
- **Volume**: Medium to large datasets where prioritization is critical
- **Goal**: Distinguish high-value insights from outliers
- **Best for**: Deciding what to investigate further vs. what to ignore

**How to apply:**

**Step 1: Define signal criteria** (10 min)

Establish thresholds for your context:
- **Frequency threshold**: How many mentions = signal? (typically 3-5 minimum)
- **Severity threshold**: What level of pain matters? (critical, high, medium)
- **Strategic fit**: Does it align with ICP and product direction?

**Step 2: Score each theme/pattern** (20-30 min)

**Frequency Scoring (1-10+):**
- 1-2 mentions: Anecdote (noise)
- 3-5 mentions: Weak signal (investigate)
- 6-9 mentions: Moderate signal
- 10+ mentions: Strong signal

**Severity Scoring (0.5-3):**
- **Critical (3)**: Blocks work, causes business impact (missed revenue, lost customers)
- **High (2)**: Major inefficiency, frequent frustration, significant time waste
- **Medium (1)**: Moderate annoyance, occasional problem
- **Low (0.5)**: Minor inconvenience, edge case

**Strategic Fit Scoring (0-3):**
- **Core (3)**: Directly advances strategy, ICP segment, builds competitive moat
- **Adjacent (2)**: Related to strategy, moderate ICP relevance
- **Tangential (1)**: Loosely related, some value
- **Off-strategy (0)**: Doesn't fit product direction, non-ICP only

**Step 3: Calculate signal strength**
```
Signal Strength = Frequency × Severity × Strategic Fit
```

**Step 4: Classify**

| Score Range | Classification | Action |
|-------------|----------------|--------|
| 60+ | Very Strong Signal | Prioritize immediately, high confidence |
| 30-59 | Strong Signal | Include in roadmap planning |
| 10-29 | Medium Signal | Track, revisit quarterly |
| <10 | Weak Signal / Noise | Log but don't act on |

**Common pitfalls:**
- ❌ **Recency bias**: Weighting recent feedback more than older patterns
- ❌ **Volume bias**: Assuming "many mentions" always means important (could be same customer)
- ❌ **HiPPO bias**: Over-weighting executive requests vs. ICP customer feedback
- ❌ **Ignoring strategic fit**: Pursuing high-frequency non-ICP problems

**Example application:**

*Analyzing dependency management feedback:*

**Theme: Proactive Dependency Risk Alerts**
- Frequency: 14 mentions across 12 customers
- Severity: Critical (3) - causes missed deadlines, emergency escalations
- Strategic Fit: Core (3) - ICP problem, aligns with coordination strategy
- **Signal Strength**: 14 × 3 × 3 = **126 (Very Strong Signal)**
- **Action**: High priority for roadmap

**Theme: Customizable Card Colors**
- Frequency: 2 mentions from 2 customers
- Severity: Low (0.5) - aesthetic preference
- Strategic Fit: Tangential (1) - minor UX improvement
- **Signal Strength**: 2 × 0.5 × 1 = **1 (Noise)**
- **Action**: Log but don't prioritize

---

### 6. Insight & Opportunity Statements

**When to use:**
- **Data type**: Synthesized patterns and themes (output from previous frameworks)
- **Volume**: After analyzing sufficient data to identify patterns
- **Goal**: Convert analysis into actionable product decisions
- **Best for**: Communicating findings to stakeholders and guiding roadmap

**How to apply:**

**Insight Statements:**

**Step 1: Identify non-obvious truths** (15-20 min)
- Review themes and patterns
- Ask: "What did we learn that we didn't know before?"
- Look for surprises, contradictions to assumptions
- Find the "aha" moments in the data

**Step 2: Structure insights** (10-15 min per insight)

**Template:**
```
[Customer Segment] struggle with [Specific Problem] because [Root Cause].
This matters because [Business Impact].
We learned [Unique Finding].
```

**Quality checklist:**
- [ ] Specific customer segment (not "users" or "customers")
- [ ] Root cause identified (the "why" beneath the symptom)
- [ ] Business impact quantified or described
- [ ] Non-obvious learning (not just restating feedback)
- [ ] Actionable (points toward solution direction)

**Opportunity Statements:**

**Step 3: Translate insights to opportunities** (15-20 min per opportunity)

**Template:**
```
For [Target Customer]
Who [Context/Situation]
The problem is [Specific Pain Point]
Which impacts them by [Consequence/Cost]
A solution would [Desired Outcome]
Unlike [Current Alternatives]
Our approach could [Strategic Differentiation]
```

**Step 4: Prioritize opportunities** (20-30 min)
- Score by Impact × Strategic Fit × Confidence
- Force rank (no ties)
- Identify top 3-5 for roadmap consideration

**Common pitfalls:**
- ❌ **Insight = data restatement**: "Customers want better tracking" (just restating request)
- ❌ **Opportunity = solution**: "Build a dashboard" (prescribes solution, not problem)
- ❌ **Vague segments**: "Users" instead of specific ICP persona
- ❌ **Missing strategic lens**: Not connecting to company objectives

**Example application:**

**Insight Statement:**
"Enterprise Agile teams managing 10+ teams struggle with proactive dependency coordination because current tools only show static relationships, not real-time health or risk signals. This matters because 60% of missed delivery commitments trace back to invisible dependency issues, eroding stakeholder trust. We learned that teams already invest 3+ hours weekly in manual tracking via spreadsheets, signaling high willingness to adopt a better solution."

**Why this is strong:**
- ✅ Specific segment (Enterprise Agile teams, 10+ teams)
- ✅ Root cause (static vs. real-time visibility)
- ✅ Quantified impact (60% of missed commitments, 3+ hours/week)
- ✅ Non-obvious finding (manual effort signals adoption willingness)

**Opportunity Statement:**
"For Enterprise Agile Program Managers who coordinate delivery across 10-20+ teams, the problem is reactive dependency problem detection that only surfaces blockers after downstream teams are impacted, which causes missed commitments, emergency escalations, and eroded stakeholder trust. A solution would proactively surface dependency risks before they affect work, unlike static relationship diagrams or manual spreadsheet tracking. Our approach could combine real-time work status with intelligent risk scoring to predict and prevent coordination breakdowns."

---

### 7. Continuous Discovery Pattern Mapping

**When to use:**
- **Data type**: Longitudinal feedback over time (quarterly, annual tracking)
- **Volume**: Multiple synthesis cycles to identify trends
- **Goal**: Track how patterns evolve over time
- **Best for**: Strategic planning, validating product direction

**How to apply:**

**Step 1: Establish baseline** (first synthesis)
- Document current themes and signal strengths
- Capture date and synthesis scope
- Create tracking structure for future comparison

**Step 2: Subsequent syntheses** (quarterly or after major initiatives)
- Repeat synthesis using same frameworks
- Compare to previous periods
- Look for changes in frequency, severity, strategic fit

**Step 3: Identify trend patterns**

**Emerging patterns** (🟢 New or growing):
- Themes that didn't exist in previous synthesis
- Frequency increasing period-over-period
- New customer segments experiencing problem

**Stable patterns** (🔵 Consistent):
- Themes with steady frequency
- Ongoing customer pain not yet addressed
- May indicate chronic, unresolved need

**Declining patterns** (🟡 Weakening):
- Frequency decreasing
- Severity lessening
- May indicate solution is working or problem is resolving naturally

**Resolved patterns** (✅ Solved):
- Themes no longer appearing
- Validation that product changes addressed need

**Step 4: Strategic implications**
- Which bets are paying off? (declining patterns after feature launch)
- What's still unaddressed? (stable patterns over multiple quarters)
- What's new? (emerging patterns requiring investigation)
- Where should we double down? (emerging + high signal)

**Common pitfalls:**
- ❌ **Inconsistent methodology**: Changing frameworks between cycles makes comparison difficult
- ❌ **Ignoring stable patterns**: Assuming "we already knew that" means it's addressed
- ❌ **Chasing emerging noise**: Reacting to every new pattern before validating
- ❌ **Not connecting to outcomes**: Failing to validate if product changes actually moved patterns

**Example application:**

*Dependency management synthesis - 3 quarters tracked:*

**Q4 2025 Synthesis:**
- Theme: Manual dependency tracking overhead
- Signal Strength: 126 (Very Strong)
- Frequency: 14 mentions

**Q1 2026 Synthesis (after launching dependency alerts):**
- Theme: Manual dependency tracking overhead
- Signal Strength: 45 (Strong, declining)
- Frequency: 5 mentions
- **Trend**: 🟡 Declining (feature is working!)

**Q1 2026 Synthesis (new pattern):**
- Theme: Cross-workspace dependency visibility
- Signal Strength: 72 (Very Strong, emerging)
- Frequency: 12 mentions
- **Trend**: 🟢 Emerging (new need from expanded usage)

**Strategic Implications:**
- Dependency alerts successfully reduced manual overhead (validated)
- New need emerging: customers using product across multiple workspaces
- Consider: Multi-workspace architecture as next investment

---

## Framework Application Matrix

This matrix guides which framework(s) to apply based on your data type and goal:

| Data Type | Volume | Primary Framework | Supporting Frameworks | Expected Output |
|-----------|--------|------------------|----------------------|-----------------|
| **Customer Interviews** | 5-10 | JTBD Synthesis | Thematic Analysis, Affinity Mapping | Jobs, motivations, forces |
| **Customer Interviews** | 10-20+ | Thematic Analysis | JTBD, Affinity Mapping, Atomic Nuggets | Themes, patterns, jobs |
| **Support Tickets** | 50-200 | Signal vs Noise | Affinity Mapping, Atomic Nuggets | Prioritized issues, root causes |
| **Enhancement Requests** | 20-100 | Affinity Mapping | Atomic Nuggets, Insight Statements | Consolidated needs, opportunities |
| **Mixed Sources** (interviews + tickets + requests) | 100+ | All orchestrated | Start with Atomic Nuggets, then Thematic Analysis, Affinity, Signal/Noise, conclude with Insights/Opportunities | Comprehensive synthesis |
| **Longitudinal tracking** | Multiple periods | Continuous Discovery | All other frameworks consistently applied | Trend analysis, strategic validation |

**Decision tree:**

```
Start
  ↓
Do you have data from multiple sources?
  ├─ YES → Use Atomic Research Nuggets first to normalize
  └─ NO → Proceed to primary framework
        ↓
What's your data type?
  ├─ Interviews (rich qualitative) → JTBD Synthesis or Thematic Analysis
  ├─ Tickets/Requests (structured) → Signal vs Noise + Affinity Mapping
  └─ Mixed → Thematic Analysis + Affinity + Signal/Noise
        ↓
Apply supporting frameworks to enrich analysis
        ↓
Convert to Insights + Opportunity Statements
        ↓
Track over time with Continuous Discovery Pattern Mapping
```

---

## Integration with Other Commands

### Upstream: Commands that Feed INTO /synthesize

**From /research**
```bash
# /research generates interview data or research findings
/research "Customer interviews on cross-team coordination"
# (Conduct research, save interview notes)
# Then synthesize the accumulated research:
/synthesize "Analyze 15 Q1 customer interviews on coordination"
```

**From /discover**
```bash
# /discover plans and conducts discovery research
/discover "Dependency management problem space"
# (Multi-session discovery work over weeks)
# After discovery phase completes:
/synthesize "Synthesize discovery findings from dependency research"
```

**From /prioritize**
```bash
# /prioritize processes and prioritizes feature requests
/prioritize "50 enhancement requests from Q1 sales calls"
# After prioritization, synthesize patterns:
/synthesize "Find patterns in Q1 prioritized requests"
```

**From Granola MCP** (meeting transcripts)
```bash
# Fetch meeting data via MCP, then synthesize
/synthesize "Analyze all Granola customer meetings from January 2026"
# Tool will use: mcp__granola__search_meetings() to fetch transcripts
```

### Downstream: Commands that CONSUME /synthesize Outputs

**To /prioritize**
```bash
# Synthesis identifies top insights
/synthesize "Q1 customer feedback synthesis"
# (Output: Top 5 insights with evidence)

# Use insights to inform roadmap prioritization
/prioritize "Q2 roadmap priorities using synthesis insights"
# Reference: memory-bank/synthesis/2026-01-21-q1-feedback-synthesis.md
```

**To /spec**
```bash
# Synthesis identifies opportunity
/synthesize "Support ticket analysis - performance issues"
# (Output: "Slow query performance" is top opportunity)

# Create PRD for top opportunity
/spec "Query performance optimization feature"
# Reference synthesis report for customer evidence and requirements
```

**To /think**
```bash
# Synthesis reveals strategic finding
/synthesize "Annual customer interview synthesis - 2025"
# (Finding: Market shifting from team-level to portfolio-level coordination)

# Deep strategic analysis of finding
/think "Strategic implications of portfolio-level coordination trend"
```

**To /decide**
```bash
# Synthesis presents conflicting signals
/synthesize "Enterprise vs SMB customer feedback comparison"
# (Finding: Different segments want opposite things)

# Make go/no-go decision
/decide "Should we build enterprise-first or SMB-first features?"
# Use synthesis evidence to weigh options
```

**To /write**
```bash
# Synthesis generates insights for exec communication
/synthesize "Customer advisory board feedback synthesis"
# (Output: 3 key insights, 5 top opportunities)

# Create executive brief
/write "CAB Insights Executive Summary for CEO"
# Format synthesis findings for exec audience
```

---

## MCP Integration Examples

### Granola MCP: Meeting Data

**Fetch meetings for synthesis:**
```javascript
// The /synthesize command can invoke:
mcp__granola__search_meetings({
  query: "customer interviews",
  limit: 20
})

// Returns meeting IDs, then fetch details:
mcp__granola__get_meeting_details({
  meeting_id: "meeting-id-123"
})

// Get transcript for synthesis:
mcp__granola__get_meeting_transcript({
  meeting_id: "meeting-id-123"
})
```

**Usage pattern:**
```bash
/synthesize "Analyze January 2026 customer meetings from Granola"
# AI will:
# 1. Search Granola for relevant meetings
# 2. Fetch transcripts
# 3. Extract atomic nuggets
# 4. Apply synthesis frameworks
# 5. Generate insights and opportunities
```

### Notion MCP: Research Repository

**Store synthesis reports:**
```javascript
// After synthesis completes, store in Notion:
mcp__notion__notion-create-pages({
  parent: {data_source_id: "research-database-id"},
  pages: [{
    properties: {
      "Title": "Q1 2026 Customer Feedback Synthesis",
      "Type": "Synthesis Report",
      "Date": "2026-01-21",
      "Status": "Complete"
    },
    content: "[Full synthesis report in Notion Markdown]"
  }]
})
```

**Search historical syntheses:**
```javascript
// Find previous synthesis for comparison:
mcp__notion__notion-search({
  query: "dependency management synthesis",
  query_type: "internal",
  data_source_url: "collection://research-database-id"
})
```

### AgilePlace MCP: Opportunity Tracking

**Create opportunity cards from top insights:**
```javascript
// After identifying top 3 opportunities:
mcp__agileplace__create_card({
  board_id: "roadmap-board-id",
  lane_id: "opportunities-lane-id",
  title: "Proactive Dependency Risk Alerts",
  description: "**Insight:** Enterprise teams spend 3+ hrs/week manually tracking...\n\n**Evidence:** 14 mentions across 12 ICP customers...\n\n**Opportunity:** Build intelligent risk scoring...",
  priority: "high",
  tags_json: JSON.stringify(["synthesis", "q1-2026", "dependencies"])
})
```

---

## Memory Bank Updates

### Files to Update After Synthesis

**memory-bank/synthesis/[YYYY-MM-DD]-[topic]-synthesis.md**
- Primary synthesis report output
- Full Phase 1-3 outputs
- Insights, opportunities, validation tracker
- Naming convention: ISO date, topic area, "synthesis"

**memory-bank/activeContext.md**
- Update "Current Focus" section with synthesis findings
- Add "Recent Insights" from synthesis
- Reference synthesis report for details

**memory-bank/value-thesis.md**
- Add validated beliefs from synthesis insights
- Update "What We Believe" based on evidence
- Track belief evolution over time

**memory-bank/progress.md**
- Log synthesis milestone completion
- Track synthesis cadence (quarterly, annual)
- Note decision impacts from synthesis

**Example update pattern:**

```markdown
<!-- In activeContext.md -->

## Current Focus

**Synthesis Completed**: Q1 2026 Customer Feedback (Jan 21, 2026)
- Analyzed 15 interviews, 142 tickets, 48 enhancement requests
- Top insight: Proactive dependency risk management (Signal: 126)
- See: memory-bank/synthesis/2026-01-21-q1-feedback-synthesis.md

## Recent Insights

1. **Dependency Visibility Gap** (Q1 2026)
   - 60% of missed commitments trace to invisible dependencies
   - Teams spend 3+ hrs/week on manual tracking
   - High willingness to adopt automated solution

---

<!-- In value-thesis.md -->

## What We Believe (Validated)

**Dependencies are coordination problem, not just technical issue** (Validated: Q1 2026 Synthesis)
- Evidence: 14/15 interviewed teams described dependency tracking as "coordination overhead"
- Implication: Solution needs workflow integration, not just static visualization
- Confidence: High (strong signal, ICP segment, quantified impact)
```

---

## Constraints (What NOT to Do)

### Anti-Patterns to Avoid

**1. Don't confuse customer requests with customer problems**
- ❌ BAD: "Customers want a dashboard" (solution request)
- ✅ GOOD: "Customers struggle to track cross-team progress, currently using spreadsheets" (underlying problem)
- **Why it matters**: Solutions change, problems stay constant. Build for the problem.

**2. Don't rely on single data points**
- ❌ BAD: One customer mentioned X, so it's high priority
- ✅ GOOD: 10+ customers described similar pain, quantified impact, ICP alignment
- **Rule**: "One is noise, ten is signal"

**3. Don't keyword-match in affinity mapping**
- ❌ BAD: Group all feedback containing "dependency" together
- ✅ GOOD: Group by underlying meaning (reactive detection vs. manual overhead vs. visualization)
- **Why it matters**: Keyword matching misses nuance and creates overly broad themes

**4. Don't skip assumption tracking**
- ❌ BAD: "Customers will love this" without validation plan
- ✅ GOOD: "We assume customers will switch from spreadsheets → Test with prototype"
- **Why it matters**: Assumptions = risks. Track them explicitly.

**5. Don't synthesize forever (diminishing returns)**
- ❌ BAD: "Let's do 50 more interviews before deciding"
- ✅ GOOD: "After 15 interviews, themes are repeating → Synthesize and validate top opportunity"
- **Rule**: When you hear the same patterns 3+ times, it's time to synthesize and test

**6. Don't ignore disconfirming evidence**
- ❌ BAD: Cherry-picking quotes that support preferred solution
- ✅ GOOD: "12/15 said X, but 3/15 had opposite view → Investigate segment difference"
- **Why it matters**: Outliers reveal segment differences or edge cases

**7. Don't synthesize without action plan**
- ❌ BAD: Beautiful synthesis report that sits in a document
- ✅ GOOD: Synthesis → Prioritized opportunities → Validation plan → Roadmap decision
- **Why it matters**: Synthesis is input to decisions, not the end goal

**8. Don't lose customer voice**
- ❌ BAD: Paraphrasing everything in your own words
- ✅ GOOD: Preserving verbatim quotes, customer language, specific examples
- **Why it matters**: Customer language reveals framing, emotion, and context

---

## Mental Models Applied

### Four Risks (Marty Cagan)

**Value Risk is ALWAYS highest priority.**

When synthesis reveals opportunities, validate in this order:
1. **Value Risk** (Will customers use/buy this?) → Test FIRST
2. **Usability Risk** (Can they figure it out?) → Test second
3. **Feasibility Risk** (Can we build it?) → Spike if uncertain
4. **Viability Risk** (Does it fit our business?) → Strategic analysis

**Why**: No point building something usable, feasible, and viable if customers don't want it.

**Application to synthesis:**
- Assumption tracker must prioritize value assumptions
- Validation plan starts with value testing (prototypes, interviews)
- Don't spend weeks on technical feasibility before confirming value

---

### Jobs-to-be-Done (Clayton Christensen)

**Customers "hire" products to make progress in their lives.**

**Key principles:**
- Focus on context and motivation, not demographics
- Understand functional, social, and emotional dimensions
- Map forces diagram (push, pull, anxiety, habit)
- Current solutions reveal job importance (workarounds = strong signal)

**Application to synthesis:**
- Don't stop at feature requests - dig into underlying job
- Ask: "What progress are they trying to make?"
- Identify forces preventing adoption (anxiety, habit)
- Use JTBD framework in Phase 2c

---

### Confidence → Speed/Quality (Inspired by Shreyas Doshi)

**Low confidence demands validation before building.**

```
High Confidence → Move fast, build MVPs, iterate
Medium Confidence → Prototype, test, then build
Low Confidence → Research, validate, test assumptions
```

**Application to synthesis:**
- Opportunities with high evidence (10+ customers, quantified impact) → Higher confidence
- Opportunities with weak signal (2-3 mentions, vague) → Lower confidence, validate first
- Use confidence score in prioritization (Impact × Fit × **Confidence**)

---

### Signal vs Noise (Nate Silver)

**Distinguish pattern from randomness.**

**Principles:**
- Frequency matters: 1 is noise, 10 is signal
- Severity amplifies: 10 minor mentions < 3 critical mentions
- Strategic fit filters: High-frequency non-ICP problem = still low priority
- Longitudinal tracking reveals true patterns vs. temporary spikes

**Application to synthesis:**
- Apply signal/noise framework in Phase 2d
- Don't react to every new pattern
- Track trends over time (Continuous Discovery)
- Distinguish "vocal minority" from "silent majority"

---

### Time Value of Shipping (Shreyas Doshi)

**Shipping sooner is valuable if the product creates value.**

**Don't research forever:**
- Synthesis reveals opportunities
- Validate assumptions quickly (not exhaustively)
- Build, ship, learn from real usage
- Perfect data never comes - make informed bets

**Application to synthesis:**
- Set time-box for synthesis (1-2 hours)
- Identify top 3-5 opportunities (not 20)
- Move to validation/roadmap quickly
- Use synthesis to inform decisions, not delay them

---

## Example Usage Scenarios

### Scenario 1: Quarterly Interview Synthesis

**Context**: Product team conducted 15 customer interviews in Q1 about cross-team coordination. Need to synthesize findings for Q2 roadmap planning.

**Command**:
```bash
/synthesize "Analyze 15 Q1 customer interviews on cross-team coordination"
```

**Execution Flow**:

**Clarifying questions asked:**
1. What feedback are you synthesizing?
   - **Answer**: 15 customer interviews (transcripts in memory-bank/interviews/)
   - Time range: January 1 - March 15, 2026
   - Sources: Zoom transcripts, Granola meeting notes

2. What customer segments?
   - **Answer**: 100% ICP (Enterprise, 500-10k employees, Financial Services, Insurance, Logistics)
   - Roles: Agile Program Managers (8), Engineering Directors (4), Product Owners (3)

3. What are you trying to learn?
   - **Answer**: Top coordination pain points for Q2 roadmap prioritization
   - Validate: Do customers care about dependency management?
   - Decide: Proactive alerts vs. better visualization?

4. Timeline?
   - **Answer**: Need synthesis by EOW for roadmap review meeting

**Phase 1 Output**:

```markdown
## Data Inventory

| Source Type | Volume | Time Range | Quality | Customer Segments |
|-------------|--------|------------|---------|------------------|
| Customer Interviews | 15 | Jan 1 - Mar 15, 2026 | High (full transcripts) | 100% ICP Enterprise |

**Total Data Points**: 237 atomic nuggets extracted
**ICP Coverage**: 100% (15/15 Enterprise, 500-10k employees)
**Coverage Gaps**: None - good representation across industries and roles

## Atomic Nuggets Extracted (Top 15)

**INT-001**
- Source: Interview #1, VP Engineering, Financial Services (5,000 employees)
- Date: 2026-01-08
- Quote: "We spend 3-4 hours every week manually tracking dependencies across teams in spreadsheets. It's a complete time sink and we still miss things."
- Context: Asked about biggest pain point in current workflow
- Tags: dependencies, manual-work, time-waste, high-urgency

[...continue with additional nuggets...]

## Signal vs Noise - Initial Classification

**High Signal**:
- Dependency visibility and tracking (14/15 interviews, strong severity)
- Proactive risk alerting (12/15 interviews)
- Cross-team coordination overhead (10/15 interviews)

**Medium Signal**:
- Reporting and metrics (5/15 interviews)
- Integration with Jira (4/15 interviews)

**Low Signal / Noise**:
- Customization requests (2/15 interviews, non-ICP)
```

**Phase 2 Output**:

```markdown
## Themes Identified: 3

### Theme 1: Reactive vs. Proactive Dependency Management

**Frequency**: 14/15 customers (93%), 47 coded nuggets
**Supporting Evidence**:
1. "We find out too late that dependencies broke" (8 customers)
2. "Blockers surprise downstream teams" (6 customers)
3. "No early warning when risks emerge" (9 customers)

**Jobs-to-be-Done**:
- **Functional**: Identify cross-team blockers before they cause delays
- **Social**: Appear reliable and competent to executive leadership
- **Emotional**: Feel confident and in control, not reactive

**Current Solutions & Limitations**:
- Manual spreadsheet tracking (12/15) - time-consuming, stale data
- Weekly status meetings (10/15) - reactive, not preventive
- Slack check-ins (8/15) - scattered, easy to miss

## Signal Classification

| Theme | Frequency | Severity | Strategic Fit | Score | Classification |
|-------|-----------|----------|---------------|-------|----------------|
| Reactive → Proactive Dependency Mgmt | 14 | Critical (3) | Core (3) | 126 | Very Strong |
| Manual Coordination Overhead | 10 | High (2) | Core (3) | 60 | Very Strong |
| Cross-team Reporting Gaps | 5 | Medium (1) | Adjacent (2) | 10 | Medium |
```

**Phase 3 Output**:

```markdown
## Top 3 Insights

### Insight 1: Dependency Visibility Gap

Enterprise Agile teams managing 10+ teams struggle with proactive dependency coordination because current tools only show static relationships, not real-time health or risk signals. This matters because 60% of missed delivery commitments trace back to invisible dependency issues, eroding stakeholder trust. We learned that teams already invest 3+ hours weekly in manual tracking via spreadsheets, signaling high willingness to adopt a better solution.

**Supporting Evidence**:
- 14/15 interviews (93%) mentioned dependency problems
- Quantified impact: 3-4 hrs/week per team (8 teams quantified)
- 60% of missed deadlines attributed to dependencies (3 customers shared metrics)

**Implications**:
- High-value opportunity for AgilePlace (core ICP problem)
- Clear competitive differentiation vs. Jira (reactive only)
- Strong signal for proactive alerts feature

---

## Top 3 Opportunities (Prioritized)

### #1: Proactive Dependency Risk Alerts (Score: 378)

**For**: Enterprise Agile Program Managers
**Who**: Coordinate delivery across 10-20+ teams
**The problem is**: Reactive dependency problem detection that only surfaces blockers after downstream teams are impacted
**Which impacts them by**: Missed commitments, emergency escalations, eroded stakeholder trust
**A solution would**: Proactively surface dependency risks before they affect work
**Unlike**: Static relationship diagrams or manual spreadsheet tracking
**Our approach could**: Combine real-time work status with intelligent risk scoring

**Prioritization Scores**:
- Impact: 9/10 (14 customers, high severity, quantified time waste)
- Strategic Fit: 10/10 (100% ICP, core coordination problem, competitive differentiation)
- Confidence: 9/10 (strong evidence, quantified impact, validated pain)
- **Total**: 810 / 1000

**Next Steps**:
1. Create prototype of dependency risk alert workflow
2. Test with 5 customers (value risk validation)
3. If validated: Write PRD for Q2 roadmap
```

**Recommended Next Actions**:
```bash
# Create PRD for top opportunity
/spec "Proactive Dependency Risk Alert System"

# Validate assumption before building
/research "Prototype test: Dependency risk alerts with 5 customers"

# Update roadmap priorities
/prioritize "Q2 roadmap using synthesis insights"
```

---

### Scenario 2: Support Ticket Pattern Analysis

**Context**: Customer success team escalated concern about performance complaints. Need to analyze Q1 support tickets (200 tickets) to identify root causes and prioritize fixes.

**Command**:
```bash
/synthesize "Find patterns in 200 Q1 support tickets - performance category"
```

**Execution Flow**:

**Phase 1**: Extract atomic nuggets from ticket descriptions, group by problem type

**Phase 2**: Apply affinity mapping and signal/noise filtering

**Output**:
- **Root Cause #1**: Slow board loading with 1000+ cards (Signal: 120, 45 tickets)
- **Root Cause #2**: Search timeout on large datasets (Signal: 90, 32 tickets)
- **Root Cause #3**: Export lag for large boards (Signal: 60, 28 tickets)

**Phase 3**: Create prioritized fix recommendations

**Recommended Next Actions**:
```bash
# Create technical spike for top root cause
/spec "Technical Spike: Board Loading Performance Optimization"

# Communicate fix plan to customer success
/write "Q1 Performance Issues - Root Cause Analysis and Fix Plan"
```

---

### Scenario 3: Enhancement Request Consolidation

**Context**: Sales team submitted 50 enhancement requests from customer calls in Q1. Many seem duplicative. Need to consolidate into underlying needs for roadmap consideration.

**Command**:
```bash
/synthesize "Consolidate 50 Q1 enhancement requests from sales calls"
```

**Execution Flow**:

**Phase 1**: Extract atomic nuggets, identify surface-level requests

**Phase 2**:
- Apply affinity mapping to group by underlying need (not keyword matching)
- Use JTBD synthesis to understand motivation
- Apply signal/noise to distinguish high-value vs. one-off requests

**Output**:
- **50 requests consolidated into 8 underlying needs**
- **3 high-signal opportunities** (10+ customers requesting similar capability)
- **5 medium-signal** (3-5 customers, worth tracking)
- **12 low-signal / noise** (1-2 customers, log but don't prioritize)

**Phase 3**: Create opportunity statements for top 3

**Recommended Next Actions**:
```bash
# Share consolidated view with sales
/write "Q1 Enhancement Requests - Consolidated Roadmap View"

# Prioritize top opportunities for roadmap
/prioritize "Q2 roadmap including top 3 enhancement opportunities"

# Create spec for #1 opportunity
/spec "[Top opportunity name] PRD"
```

---

**End of /synthesize command**
