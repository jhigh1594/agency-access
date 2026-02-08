# Prioritization & Triage Framework

You are helping me make high-quality prioritization decisions using structured frameworks and strategic thinking. This command handles both **clean prioritization** (you have a list of items to sequence) and **triage** (you have raw customer feedback to process).

## Your Approach

**Great prioritization is about saying NO more than saying YES.** Every yes to one thing is saying no to 10 other things.

### Adaptive Workflow Detection

This command adapts based on what you provide:

```
┌─ RAW FEEDBACK MODE (Triage)
│  Input: Verbatim quotes, support tickets, interview notes,
│        sales requests, multiple sources
│  → Run full triage preprocessing
│  → Deduplicate by problem (not solution)
│  → Categorize and analyze patterns
│  → Then prioritize
│
└─ CLEAN LIST MODE (Prioritize)
   Input: Prepared list of items, features, initiatives
   → Skip to framework selection
   → Prioritize directly
```

## Step 1: Clarify the Request

I'll ask these questions to understand your situation:

1. **Input Type**: Are you starting with **raw feedback** (quotes, tickets, interviews, requests from multiple sources) or a **prepared list** of items to prioritize?

2. **What are you prioritizing?**
   - **Roadmap** (quarterly/annual): Themes and initiatives
   - **Sprint/Release** (weekly/monthly): Specific features and bugs
   - **Features** (within a project): Capabilities for V1 vs. later
   - **Bugs/Tech Debt** (ongoing): Which issues to fix
   - **Customer Requests** (reactive): Which requests to act on

3. **Time Horizon**: Short-term (this quarter) or Long-term (this year+)?

4. **What data do you have?** Usage numbers, effort estimates, customer segments, frequency of requests?

5. **What framework do you prefer?** (I'll recommend based on your data)
   - **RICE** - Have quantitative data (usage, revenue, effort)
   - **ICE** - Limited data, need quick scoring
   - **Value/Effort** - Stakeholder alignment discussions
   - **Three Buckets** - Roadmap portfolio balance
   - **Kano** - Understanding satisfaction vs. investment
   - **Cost of Delay/WSJF** - Time-to-market critical

6. **Include stakeholder communication?** (Optional) Add messaging templates for telling requesters YES or NO

---

## RAW FEEDBACK MODE (Triage)

*Use this section when input is raw customer feedback, tickets, interviews, or requests from multiple sources.*

### Step T1: Gather and Preserve

**Collect from multiple sources**:
- Customer interviews, support tickets, sales requests, internal teams
- **Preserve verbatim language** (don't paraphrase, quote directly)
- **Count frequency** ("one is noise, ten is signal")
- **Identify requesters** (customer segment, stakeholder role, influence level)

### Step T2: Summarize and Normalize

For each request:
- **One-sentence summary** capturing the essence
- **Map to underlying problem** (not solution - what job are they trying to do?)
- **Assess frequency** (how many times requested, by how many different people)
- **Estimate impact** (who benefits, how much value, business impact)

**Frequency Signal**:
- 1 request = Noise (anecdote, investigate if compelling)
- 3-5 requests = Weak signal (pattern emerging, worth exploring)
- 10+ requests = Strong signal (clear need, prioritize)

### Step T3: Deduplicate

Group related requests that are solving the same problem:

```
**Group 1: [Problem Theme]**
- [Request A] - "[Verbatim quote]"
- [Request B] - "[Verbatim quote]"
- [Request C] - "[Verbatim quote]"
**Consolidated Problem**: [One clear problem statement]
**Pattern**: [Insight about what customers really need]
```

**Identify conflicts**:
- Some customers want X, others want opposite Y
- Flag for stakeholder resolution

### Step T4: Categorize

**By Theme**: Analytics, collaboration, integration, performance, etc.

**By Requester Type**:
- ICP Customers (Enterprise, 500-10k employees)
- Non-ICP Customers (SMB, <500 employees)
- Internal (Sales/Support/Exec)
- Stakeholders

**By Strategic Fit**:
- Aligned with strategy
- Adjacent to strategy
- Off-strategy

**By Type of Work**:
- New feature, enhancement, bug fix, tech debt, infrastructure

### Step T5: Transition to Prioritization

After triage preprocessing, continue to **Step 2: Choose Framework** below.

---

## CLEAN LIST MODE (Prioritize)

*Use this section when you have a prepared list of items to sequence.*

Skip directly to **Step 2: Choose Framework** below.

---

## Step 2: Choose the Right Framework

### Framework Selection Guide

```
├─ Have quantitative data? (usage, revenue, effort estimates)
│  ├─ Yes → RICE (Reach × Impact × Confidence / Effort)
│  └─ No → ICE (Impact × Confidence × Ease) or Value/Effort
│
├─ Need to balance different types of work?
│  └─ Yes → Three Buckets (Adam Nash)
│
├─ Understanding customer satisfaction vs. investment?
│  └─ Yes → Kano Model
│
├─ Time sensitivity matters?
│  └─ Yes → Cost of Delay / Weighted Shortest Job First
│
└─ Strategic alignment unclear?
   └─ Yes → Strategy alignment matrix
```

### The Frameworks

#### 1. RICE (Reach × Impact × Confidence / Effort)

**When to use**: You have quantitative data on usage and effort.

| Dimension | Description | Scoring |
|-----------|-------------|---------|
| **Reach** | How many customers will this impact? (per quarter) | Number: 5,000 |
| **Impact** | How much will this impact each customer? | 0.25=Low, 0.5=Medium, 1.0=High, 2.0=Massive |
| **Confidence** | How confident are we? | 0.5=Low, 0.8=Medium, 1.0=High |
| **Effort** | How many person-months to build? | Number: 2 |

**Formula**: `(Reach × Impact × Confidence) / Effort = RICE Score`

**Example**: (5000 × 1.0 × 0.8) / 2 = **2,000**

---

#### 2. ICE (Impact × Confidence × Ease)

**When to use**: Early stage, limited data, need quick scoring.

Score each 1-10:
- **Impact**: How much will this move the needle?
- **Confidence**: How sure are we this will work?
- **Ease**: How easy is this to build? (10 = very easy, 1 = very hard)

**Formula**: `(Impact × Confidence × Ease) / 3 = ICE Score`

**Example**: (8 × 7 × 5) / 3 = **93**

---

#### 3. Value vs. Effort (2×2 Matrix)

**When to use**: Need visual alignment, stakeholder discussions.

```
        High Value
            │
  DO NEXT   │   DO NOW
  (Strategic)│  (Quick wins)
            │
────────────┼────────────
            │
  DON'T DO  │   DO LATER
  (Avoid)   │   (Fill time)
            │
        Low Value
      Low Effort    High Effort
```

**Prioritize**: Top-right quadrant first (high value, low effort).

---

#### 4. Three Buckets (Adam Nash)

**When to use**: Roadmap planning, balancing different types of work.

**Bucket 1: Metrics Movers** (30-50%)
- Work that directly moves key business metrics
- Example: Improve activation rate, increase retention

**Bucket 2: Customer Requests** (30-40%)
- Features customers are actively asking for
- Example: Integration with X, ability to export to Y

**Bucket 3: Delight / Innovation** (20-30%)
- Unexpected improvements, strategic bets
- Example: Delightful redesign, new capability no one asked for

**Typical Allocation**:
- **Growth stage**: 50% metrics, 30% requests, 20% delight
- **Mature stage**: 33% metrics, 34% requests, 33% delight
- **Early stage**: 40% metrics, 20% requests, 40% delight

---

#### 5. Kano Model

**When to use**: Understanding feature satisfaction vs. investment.

**Categories**:
- **Must-Haves (Basic Needs)**: If missing, customers won't use it. If present, doesn't increase satisfaction.
  - Example: Login, basic security, core functionality
- **Performance (Satisfiers)**: More is better. Linear satisfaction increase.
  - Example: Speed, ease of use, number of integrations
- **Delighters (Exciters)**: Unexpected features that wow customers.
  - Example: AI-powered suggestions, beautiful design, thoughtful micro-interactions

**Prioritize**: Must-haves first, then performance, then delighters.

---

#### 6. Cost of Delay / WSJF (Weighted Shortest Job First)

**When to use**: Time-to-market matters, opportunity cost is high.

**Formula**: `Cost of Delay per month / Duration (months) = WSJF Score`

**Example**:
- Feature A: $100k/month delay cost, 2 months to build → WSJF = **50**
- Feature B: $50k/month delay cost, 0.5 months to build → WSJF = **100**

**Prioritize**: Highest WSJF first.

---

## Step 3: Apply Strategic Filters

**Before finalizing priorities, validate against strategic criteria**:

### Strategic Alignment
- Does this align with company strategy and vision?
- Does this move us toward our North Star?
- Does this support our differentiation?

### Four Risks (validate critical assumptions first)
1. **Value Risk**: Will customers find this valuable? *(Highest priority)*
2. **Usability**: Can customers figure it out?
3. **Feasibility**: Can we build this?
4. **Viability**: Does this work for our business?

### Time Horizon
- Are we optimizing for short-term (quick wins) or long-term (strategic bets)?
- Does our mix balance both?

### Resource Constraints
- Do we have the right people/skills?
- Are there dependencies or blockers?
- What's the opportunity cost?

---

## Step 4: Force Ranking (Make the Hard Calls)

**After scoring, force rank everything**—no ties, no multiple #1 priorities:

```
1. [Item 1] - [Score: X] - [Rationale]
2. [Item 2] - [Score: Y] - [Rationale]
3. [Item 3] - [Score: Z] - [Rationale]
4. [Item 4] - [Score: A] - [Rationale]
5. [Item 5] - [Score: B] - [Rationale]
...
```

**Then draw the line**:

```
──── Above the line (DO NOW) ────
1. Item A
2. Item B
3. Item C
──────────────────────────────────
──── Below the line (NOT NOW) ────
4. Item D
5. Item E
```

**Remember**: Everything below the line is a **NO** for now. It's not "never"—it's "not now."

---

## Output Format

### For RAW FEEDBACK MODE (Triage)

**Location**: `memory-bank/triage/[YYYY-MM-DD]-[feature-area]-triage.md`

```markdown
# Feature Request Triage: [Feature Area]

**Date**: YYYY-MM-DD
**Time Horizon**: [Sprint Q1 YYYY / Annual Roadmap YYYY]
**Requests Analyzed**: [N]
**Framework Used**: [RICE / ICE / Value-Effort / Three Buckets]

## Input: Requests Gathered

| Request | Requester | Frequency | Source | Verbatim Quote |
|---------|-----------|----------|--------|----------------|
| [Request 1] | [Who asked] | [N times] | [Interview/Ticket] | "[Quote]" |
| [Request 2] | [Who asked] | [N times] | [Slack] | "[Quote]" |

## Step 1: Summarized and Normalized

| Original Request | Underlying Problem (JTBD) | Impact Assessment | Frequency Signal |
|------------------|---------------------------|-------------------|------------------|
| [Request 1] | [What problem?] | [Who, business impact] | [Signal strength] |
| [Request 2] | [What problem?] | [Who, business impact] | [Signal strength] |

## Step 2: Deduplicated

**By Underlying Problem**:

**Group 1: [Problem Theme]**
- [Request A] - "[Quote]"
- [Request B] - "[Quote]"
**Consolidated**: [One clear problem statement]
**Pattern**: [Insight]

**Group 2: [Problem Theme]**
- [Request C] - "[Quote]"
- [Request D] - "[Quote]"
**Consolidated**: [One clear problem statement]
**Pattern**: [Insight]

**Conflicting Requests**:
- [Conflict]: Some customers want X, others want opposite Y
**Resolution**: [How we're navigating this]

## Step 3: Categorized

**By Theme**: Analytics [N], Collaboration [N], Integration [N], Performance [N]

**By Requester Type**:
- ICP Customers: [N] requests
- Non-ICP: [N] requests
- Internal: [N] requests

**By Strategic Fit**:
- Aligned: [N] requests
- Adjacent: [N] requests
- Off-strategy: [N] requests

## Step 4: Prioritized

### Scored Items

| Item | Reach | Impact | Confidence | Effort | Score | Priority |
|------|-------|--------|------------|--------|-------|----------|
| [Item 1] | [N] | [0.25-2.0] | [%] | [months] | [Score] | 1 |
| [Item 2] | [N] | [0.25-2.0] | [%] | [months] | [Score] | 2 |
| [Item 3] | [N] | [0.25-2.0] | [%] | [months] | [Score] | 3 |

### Force Ranking: Above/Below the Line

**✅ ABOVE THE LINE (DO NOW)**:
1. **[Item 1]** - [Score: X] - [Rationale: Why this, why now]
2. **[Item 2]** - [Score: Y] - [Rationale: Why this, why now]
3. **[Item 3]** - [Score: Z] - [Rationale: Why this, why now]

**⏸️ BELOW THE LINE (NOT NOW)**:
4. **[Item 4]** - [Score: A] - [Why not now: Low impact, high effort, off-strategy]
5. **[Item 5]** - [Score: B] - [Why not now: Not validated, wrong timing]
```

### For CLEAN LIST MODE (Prioritize)

```markdown
# Prioritization Analysis

**Framework Used**: [Name]
**Context**: [What we're prioritizing and why]

### Scored Items

| Item | [Dimensions] | Total Score | Priority |
|------|-------------|-------------|----------|
| [Item 1] | [Scores] | [Total] | 1 |
| [Item 2] | [Scores] | [Total] | 2 |
| [Item 3] | [Scores] | [Total] | 3 |

### Prioritized Roadmap

**✅ DO NOW** (Above the line):
1. **[Item 1]** - [Score: X] - [Rationale]
2. **[Item 2]** - [Score: Y] - [Rationale]
3. **[Item 3]** - [Score: Z] - [Rationale]

**⏸️ NOT NOW** (Below the line):
4. **[Item 4]** - [Score: A] - [Why we're deferring]
5. **[Item 5]** - [Score: B] - [Why we're deferring]

### Strategic Validation

**Does this portfolio**:
- ✅ Align with company strategy?
- ✅ Balance short-term wins and long-term bets?
- ✅ Address high-value customer problems?
- ✅ Differentiate us vs. competitors?
- ⚠️ [Any concerns or trade-offs to flag]
```

---

## OPTIONAL: Stakeholder Communication

*Include this section when you request messaging support or I ask "Include stakeholder communication?"*

### What We're Saying YES To

**Priority 1: [Item 1]**
- **Why**: [Customer problem + business impact + strategic alignment]
- **Success criteria**: [How we'll measure success]
- **Timeline**: [When we'll ship]

**Priority 2: [Item 2]**
- **Why**: [Customer problem + business impact + strategic alignment]
- **Success criteria**: [How we'll measure success]
- **Timeline**: [When we'll ship]

### What We're Saying NO To

**Deferred: [Item 4]**
- **Why not now**: [Rationale - low impact, high effort, not validated]
- **Preserve relationship**: [How to communicate no without burning bridges]
- **Revisit trigger**: [What would change to bring this above the line]

### Communication Templates

#### For YES Items
```
Subject: Great news - we're building [Feature]!

Hi [Name],

Thank you for your request about [feature/request]. I'm excited to let you know that we're prioritizing this for [QX/YYYY].

We understand this is important because [underlying problem]. Our goal is to deliver this by [timeline].

I'll keep you updated as we progress. Feel free to reach out with any questions!

Best,
[Your name]
```

#### For NO Items (Preserving Relationships)
```
Subject: Update on your [Feature] request

Hi [Name],

Thank you for your suggestion about [feature/request]. I appreciate you taking the time to share this.

We're not able to prioritize this right now because [rationale - not aligned with current strategy, low demand relative to other priorities, etc.].

That said, I've captured your feedback and we'll reconsider if [trigger condition - e.g., we see more requests for this, our strategy shifts, etc.].

Thanks again for your input - it helps us understand what matters to you.

Best,
[Your name]
```

### Opportunity Cost Awareness

**By saying YES to [Item 1], we're saying NO to**:
- [Item A] - [Trade-off explanation]
- [Item B] - [Trade-off explanation]

**This is the right trade-off because**: [Strategic rationale]

---

## Completeness Check

- ✅ Requests summarized and normalized (raw feedback mode)
- ✅ Deduplicated by problem (raw feedback mode)
- ✅ Categorized by theme, requester, strategic fit (raw feedback mode)
- ✅ Framework applied with scoring
- ✅ Force ranked (no ties)
- ✅ Above/below the line drawn
- ✅ Strategic validation completed
- ✅ Communication plan (if requested)

---

## Common Challenges

### Challenge 1: Too Many #1 Priorities
**Problem**: Everything is "high priority," nothing gets done well
**Solution**: Force rank. Use CEO/exec to break ties if needed.

### Challenge 2: HiPPO (Highest Paid Person's Opinion)
**Problem**: Decisions driven by politics, not data
**Solution**: Use frameworks to create objectivity. Show data.

### Challenge 3: Shiny Object Syndrome
**Problem**: Constantly changing priorities based on latest idea
**Solution**: Revisit priorities quarterly, not weekly. Finish what you start.

### Challenge 4: Analysis Paralysis
**Problem**: Overthinking prioritization instead of shipping
**Solution**: Use simple framework (ICE or Value/Effort). Make decision, move forward.

### Challenge 5: Ignoring Customer Requests
**Problem**: Building what you want, not what customers need
**Solution**: Use Three Buckets to ensure 30-40% of roadmap is customer requests.

### Challenge 6: Burning Bridges When Saying No
**Problem**: Saying no without explanation damages relationships
**Solution**: Use communication templates. Explain why, not just no. Offer revisit triggers.

---

## Constraints

- Don't prioritize without understanding underlying problems (requests ≠ problems)
- Don't ignore frequency signals (one request = noise, ten = signal)
- Don't skip force ranking (ties and multiple #1 priorities indicate lack of rigor)
- Don't say no without preserving relationships (how you communicate no matters)
- Don't overlook opportunity cost (every yes is a no to 10 other things)
- Don't prioritize in isolation (involve team, stakeholders, customers)
- Don't change priorities too often (finish what you start, revisit quarterly)
- Don't let everything be above the line (ruthless prioritization means saying no)

---

## Mental Models Applied

- **Ruthless Prioritization**: Saying NO more than saying YES
- **Opportunity Cost**: Every yes to X is saying no to Y
- **Expected Value**: Reach × Impact × Confidence (account for uncertainty)
- **Time Horizon**: Different priorities for short-term vs. long-term
- **One is Noise, Ten is Signal**: Frequency counts for prioritization
- **ROI**: Maximize customer impact per unit of effort
- **Strong Opinions, Loosely Held**: Force rank, but re-prioritize as new data arrives
- **Diminishing Returns**: Don't over-optimize same area, balance portfolio

---

## Integration with Other Commands

- **/think** - Frame strategic context for prioritization
- **/discover** - Validate above-the-line items with customer research
- **/research** - Validate high-priority assumptions
- **/decide** - Document prioritization decisions with rationale
- **/align** - Get stakeholder buy-in on priorities
- **/spec** - Document top priority items as PRDs
- **/measure** - Define success metrics for prioritized items
- **/write** - Communicate prioritization decisions to stakeholders

---

**What do you need to prioritize or triage?**

Example requests:
- "Help me prioritize our Q2 roadmap" (clean list mode)
- "Triage these 15 customer feature requests" (raw feedback mode)
- "Score these 10 features using RICE" (clean list mode)
- "Our sales team has 20 requests from prospects - which should we build?" (raw feedback mode)
- "Prioritize these bugs - which are critical vs. can wait?" (clean list mode)
- "Use Three Buckets to balance our annual roadmap" (clean list mode)
