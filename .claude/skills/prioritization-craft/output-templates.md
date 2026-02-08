# Prioritization Output Templates

This file provides copy-paste templates for deliverables from the prioritization process.

---

## Output Format for RAW FEEDBACK MODE

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

## Step 2: Deduplicated

**By Underlying Problem:**

**Group 1: [Problem Theme]**
- [Request A] - "[Quote]"
- [Request B] - "[Quote]"
**Consolidated**: [One clear problem statement]
**Pattern**: [Insight]

## Step 3: Categorized

**By Theme**: Analytics [N], Collaboration [N], Integration [N]

**By Requester Type**:
- ICP Customers: [N] requests
- Non-ICP: [N] requests
- Internal: [N] requests

## Step 4: Prioritized

### Scored Items

| Item | Reach | Impact | Confidence | Effort | Score | Priority |
|------|-------|--------|------------|--------|-------|----------|
| [Item 1] | [N] | [0.25-2.0] | [%] | [months] | [Score] | 1 |
| [Item 2] | [N] | [0.25-2.0] | [%] | [months] | [Score] | 2 |

### Force Ranking: Above/Below the Line

**✅ ABOVE THE LINE (DO NOW)**:
1. **[Item 1]** - [Score: X] - [Rationale: Why this, why now]
2. **[Item 2]** - [Score: Y] - [Rationale: Why this, why now]
3. **[Item 3]** - [Score: Z] - [Rationale: Why this, why now]

**⏸️ BELOW THE LINE (NOT NOW)**:
4. **[Item 4]** - [Score: A] - [Why not now: Low impact, high effort, off-strategy]
5. **[Item 5]** - [Score: B] - [Why not now: Not validated, wrong timing]

## Stakeholder Communication

### What We're Saying YES To

**Priority 1: [Item 1]**
- **Why**: [Customer problem + business impact + strategic alignment]
- **Success criteria**: [How we'll measure success]
- **Timeline**: [When we'll ship]

### What We're Saying NO To

**Deferred: [Item 4]**
- **Why not now**: [Rationale - low impact, high effort, not validated]
- **Preserve relationship**: [How to communicate no without burning bridges]
- **Revisit trigger**: [What would change to bring this above the line]
```

---

## Output Format for CLEAN LIST MODE

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

## Stakeholder Communication

[Full YES/NO communication package]
```

---

## Framework-Specific Templates

### RICE Template

| Item | Reach | Impact | Confidence | Effort | RICE Score |
|------|-------|--------|------------|--------|------------|
| [Item] | [N] | [0.25-3.0] | [%] | [person-months] | [Score] |
| [Item] | [N] | [0.25-3.0] | [%] | [person-months] | [Score] |

**RICE Score = (Reach × Impact × Confidence) / Effort**

### ICE Template

| Item | Impact | Confidence | Ease | ICE Score |
|------|--------|------------|-------|-----------|
| [Item] | [1-10] | [1-10] | [1-10] | [(I×C×E)/3] |
| [Item] | [1-10] | [1-10] | [1-10] | [(I×C×E)/3] |

**ICE Score = (Impact × Confidence × Ease) / 3**

### Value/Effort Template

| Item | Value | Effort | Quadrant |
|------|-------|--------|---------|
| [Item] | [1-10] | [1-10] | [DO FIRST/DO NEXT/DO LATER/DON'T DO] |

### Three Buckets Template

| Bucket | Allocation | Items |
|--------|-----------|-------|
| Metrics Movers | 40% | [Items] |
| Customer Requests | 35% | [Items] |
| Delight/Innovation | 25% | [Items] |

---

## Communication Templates

### YES Template

```
Subject: Great news - we're building [Feature]!

Hi [Name],

Thank you for your request about [feature/request]. I'm excited to let you know that we're prioritizing this for [QX/YYYY].

We understand this is important because [underlying problem]. Our goal is to deliver this by [timeline].

I'll keep you updated as we progress. Feel free to reach out with any questions!

Best,
[Your name]
```

### NO Template (Relationship-Preserving)

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

---

## Quick Reference: Scoring Scales

### RICE Impact Scale
- **3.0** = Massive impact (core to product, differentiator)
- **2.0** = High impact (significant value)
- **1.0** = Medium impact (nice to have)
- **0.5** = Low impact (minimal value)
- **0.25** = Tiny impact (negligible value)

### ICE Scoring Scale (1-10)
- **10** = Extreme impact/certainty
- **8-9** = High impact/certainty
- **6-7** = Medium impact/certainty
- **4-5** = Low impact/certainty
- **1-3** = Very low impact/certainty

### Frequency Signals
- **10+ requests** = Strong signal (clear need, prioritize)
- **3-5 requests** = Weak signal (pattern emerging, worth exploring)
- **1 request** = Noise (anecdote, investigate if compelling)

### Strategic Fit
- **Core** = Directly advances strategy, ICP segment, builds competitive moat
- **Adjacent** = Related to strategy, moderate ICP relevance
- **Tangential** = Loosely related, some value
- **Off-strategy** = Doesn't fit product direction, non-ICP only
