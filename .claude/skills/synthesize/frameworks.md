# Synthesis Frameworks - Deep Dives

This file provides detailed guidance on when and how to apply each of the 7 synthesis frameworks.

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

## 1. Thematic Analysis Framework

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

## 2. Affinity Mapping

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

## 3. Jobs-to-be-Done Synthesis

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

## 4. Atomic Research Nuggets

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

## 5. Signal vs Noise Filtering

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

## 6. Insight & Opportunity Statements

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

## 7. Continuous Discovery Pattern Mapping

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
