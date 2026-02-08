# Prioritization Phases - Detailed Instructions

This file provides detailed, step-by-step instructions for each phase of the prioritization process.

---

## Phase 0: Expert Mode Toggle (1 min)

**Goal**: Let users opt into faster execution

**Ask:**
- "Interactive Mode: I'll ask clarifying questions throughout to ensure we don't miss strategic considerations"
- "Expert Mode: Skip to framework application with minimal back-and-forth"

**Proceed with user's preference.**

---

## Phase 1: Input Detection & Setup (5-10 min)

**Goal**: Understand prioritization scope and gather context

### Questions to Ask

1. **Input Type**: Are you starting with **raw feedback** (quotes, tickets, interviews, requests from multiple sources) or a **prepared list** of items to prioritize?

2. **What are we prioritizing?**
   - **Roadmap** (quarterly/annual): Themes and initiatives
   - **Sprint/Release** (weekly/monthly): Specific features and bugs
   - **Features** (within a project): Capabilities for V1 vs. later
   - **Bugs/Tech Debt** (ongoing): Which issues to fix
   - **Customer Requests** (reactive): Which requests to act on

3. **Time Horizon**: Short-term (this quarter) or Long-term (this year+)?

4. **What data do you have?**
   - Usage numbers (active users, page views, etc.)
   - Effort estimates (story points, person-months, etc.)
   - Customer segments (ICP vs. non-ICP)
   - Frequency of requests (how many times requested, by how many)

5. **What framework do you prefer?** (I'll recommend based on your data)
   - **RICE** - Have quantitative data (usage, revenue, effort)
   - **ICE** - Limited data, need quick scoring
   - **Value/Effort** - Stakeholder alignment discussions
   - **Three Buckets** - Roadmap portfolio balance
   - **Kano** - Understanding satisfaction vs. investment
   - **Cost of Delay/WSJF** - Time-to-market critical

6. **Context check:**
   - "Are there any strategic commitments or executive mandates that must be above the line?"
   - "Any items already promised to customers or stakeholders?"
   - "What's our capacity constraint for this time horizon?"

### Historical Context Check

- Search for previous prioritization decisions in `memory-bank/triage/` or similar
- Reference past framework choices and rationale
- Ask: "Last quarter we used RICE for roadmap planning—should we maintain consistency for comparability?"

### Deliverable

Clear prioritization scope document with:
- Input type identified
- Prioritization type confirmed
- Time horizon established
- Available data documented
- Framework selected or recommended
- Constraints noted
- Historical context referenced

---

## Phase 2A: Triage Processing (10-15 min)
*Only for RAW FEEDBACK mode*

**Goal**: Transform raw feedback into analyzable format

### Step 1: Gather and Preserve

**Collect from multiple sources:**
- Customer interviews, support tickets, sales requests, internal teams
- **Preserve verbatim language** (don't paraphrase, quote directly)
- **Count frequency** ("one is noise, ten is signal")
- **Identify requesters** (customer segment, stakeholder role, influence level)

**Ask me to provide or point to:**
- Raw feedback sources (file paths, direct quotes, ticket IDs)
- Or share the feedback directly in chat

### Step 2: Summarize and Normalize

**For each request:**
- **One-sentence summary** capturing the essence
- **Map to underlying problem** (not solution - what job are they trying to do?)
- **Assess frequency** (how many times requested, by how many different people)
- **Estimate impact** (who benefits, how much value, business impact)

**Frequency Signal:**
- 1 request = Noise (anecdote, investigate if compelling)
- 3-5 requests = Weak signal (pattern emerging, worth exploring)
- 10+ requests = Strong signal (clear need, prioritize)

### Step 3: Deduplicate

**Group related requests** that are solving the same problem:

```
**Group 1: [Problem Theme]**
- [Request A] - "[Verbatim quote]"
- [Request B] - "[Verbatim quote]"
- [Request C] - "[Verbatim quote]"
**Consolidated Problem**: [One clear problem statement]
**Pattern**: [Insight about what customers really need]
```

**Identify conflicts:**
- Some customers want X, others want opposite Y
- Flag for stakeholder resolution

### Step 4: Categorize

**By Theme**: Analytics, collaboration, integration, performance, etc.

**By Requester Type:**
- ICP Customers (Enterprise, 500-10k employees)
- Non-ICP Customers (SMB, <500 employees)
- Internal (Sales/Support/Exec)
- Stakeholders

**By Strategic Fit:**
- Aligned with strategy
- Adjacent to strategy
- Off-strategy

**By Type of Work:**
- New feature, enhancement, bug fix, tech debt, infrastructure

### Deliverable

Normalized, deduplicated request list with categorization

---

## Phase 2B: Framework Selection & Scoring (10-15 min)

**Goal**: Apply appropriate framework and score items

**Skip directly here if CLEAN LIST mode.**

### Framework Selection

Use the decision tree to select the appropriate framework based on:
- Available data
- Prioritization context
- Stakeholder needs

### Scoring Items

For each item, apply the selected framework:

1. **Gather/confirm scores** (Reach, Impact, Confidence, Effort for RICE, etc.)
2. **Calculate final scores** using framework formulas
3. **Document rationale** for each score
4. **Identify scoring gaps** (missing data, uncertain estimates)

### Probing Questions

- "We have effort estimates for 5 items but not the other 15—how should we handle incomplete data?"
- "Some items are customer requests, others are strategic bets—how do we compare across types?"
- "These are all 'high priority' according to requesters—how do we break the tie?"
- "Should we use the same framework as last quarter ([framework]) for consistency, or switch based on this data?"

### Deliverable

Scored items with framework rationale:
- Framework choice documented
- Each item scored with rationale
- Scoring gaps identified
- Initial priority ranking

---

## Phase 3: Strategic Validation & Force Ranking (5-10 min)

**Goal**: Apply strategic filters and make hard calls

### Apply Strategic Filters

**Strategic Alignment:**
- Does this align with company strategy and vision?
- Does this move us toward our North Star?
- Does this support our differentiation?

**Four Risks (validate critical assumptions first):**
1. **Value Risk**: Will customers find this valuable? *(Highest priority)*
2. **Usability**: Can customers figure it out?
3. **Feasibility**: Can we build this?
4. **Viability**: Does this work for our business model?

**Time Horizon:**
- Are we optimizing for short-term (quick wins) or long-term (strategic bets)?
- Does our mix balance both?

**Resource Constraints:**
- Do we have the right people/skills?
- Are there dependencies or blockers?
- What's the opportunity cost?

### Force Ranking (Make the Hard Calls)

**After scoring, force rank everything**—no ties, no multiple #1 priorities:

```
1. [Item 1] - [Score: X] - [Rationale]
2. [Item 2] - [Score: Y] - [Rationale]
3. [Item 3] - [Score: Z] - [Rationale]
4. [Item 4] - [Score: A] - [Rationale]
5. [Item 5] - [Score: B] - [Rationale]
...
```

**Then draw the line:**

```
──── ABOVE THE LINE (DO NOW) ────
1. Item A
2. Item B
3. Item C
──────────────────────────────────
──── BELOW THE LINE (NOT NOW) ────
4. Item D
5. Item E
```

**Remember**: Everything below the line is a **NO** for now. It's not "never"—it's "not now."

### Probing Questions

- "These 3 items are all above the line—do we really have capacity for all three this quarter?"
- "Item C is high-score but off-strategy ([describe misalignment])—do we deprioritize despite the score?"
- "Item D is below the line but was promised to a key customer—do we need to reconsider capacity?"
- "We have capacity for 2 items from the top 5—which 2 give us the best strategic portfolio balance?"

### Reference Historical Consistency

- "Last quarter we prioritized [similar item type] above the line—should we maintain that pattern?"
- "In Q1 we said NO to [item type]—does this align with that precedent?"

### Deliverable

Force-ranked roadmap with above/below line:
- All items force ranked (no ties)
- Clear line drawn
- Above/below line rationale documented
- Strategic filters applied
- Capacity constraints considered

---

## Phase 4: Stakeholder Communication (5-10 min)
*Always included per user preference*

**Goal**: Craft messages that honor requests while preserving relationships

### What We're Saying YES To

For each above-the-line item, document:
- **Why**: Customer problem + business impact + strategic alignment
- **Success criteria**: How we'll measure success
- **Timeline**: When we'll ship

### What We're Saying NO To

For each below-the-line item, document:
- **Why not now**: Rationale (low impact, high effort, not validated, off-strategy)
- **Preserve relationship**: How to communicate no without burning bridges
- **Revisit trigger**: What would change to bring this above the line

### Communication Templates

**For YES Items:**
```
Subject: Great news - we're building [Feature]!

Hi [Name],

Thank you for your request about [feature/request]. I'm excited to let you know that we're prioritizing this for [QX/YYYY].

We understand this is important because [underlying problem]. Our goal is to deliver this by [timeline].

I'll keep you updated as we progress. Feel free to reach out with any questions!

Best,
[Your name]
```

**For NO Items (Preserving Relationships):**
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

**Document:**
"By saying YES to [Item 1], we're saying NO to:
- [Item A] - [Trade-off explanation]
- [Item B] - [Trade-off explanation]

**This is the right trade-off because**: [Strategic rationale]

### Probing Questions

- "Who needs to hear NO about Item D—how do we preserve the relationship while being firm?"
- "Sales promised Item E to a prospect—how do we manage that expectation?"
- "What's the opportunity cost of saying YES to Item A—what are we giving up?"
- "How do we explain this roadmap to exec in a way that shows strategic discipline?"

### Deliverable

Stakeholder communication package:
- YES items documented with rationale and timeline
- NO items documented with rationale and relationship-preserving communication
- Opportunity cost trade-offs documented
- Email templates ready for customization

---

## Phase Timing Summary

| Phase | Duration | When Included |
|-------|----------|---------------|
| Phase 0: Expert Mode Toggle | 1 min | Always |
| Phase 1: Input Detection | 5-10 min | Always |
| Phase 2A: Triage | 10-15 min | Raw feedback mode only |
| Phase 2B: Framework Scoring | 10-15 min | Always |
| Phase 3: Force Ranking | 5-10 min | Always |
| Phase 4: Communication | 5-10 min | Always |

**Total Time**: 30-45 minutes for raw feedback mode, 20-30 minutes for clean list mode
