# Command Integration Patterns

This file describes how the customer-feedback-synthesis skill integrates with other commands and skills in your workflow.

---

## Upstream: Commands that Feed INTO Synthesis

### From `/research`

```bash
# /research generates interview data or research findings
/research "Customer interviews on cross-team coordination"
# (Conduct research, save interview notes)
# Then synthesize the accumulated research:
Use customer-feedback-synthesis skill to analyze 15 Q1 customer interviews on coordination
```

**Integration pattern**: `/research` → generates raw data → `synthesis` analyzes patterns

---

### From `/discover`

```bash
# /discover plans and conducts discovery research
/discover "Dependency management problem space"
# (Multi-session discovery work over weeks)
# After discovery phase completes:
Use customer-feedback-synthesis skill to synthesize discovery findings from dependency research
```

**Integration pattern**: `/discover` → multi-week discovery → `synthesis` extracts themes

---

### From `/prioritize`

```bash
# /prioritize processes and prioritizes feature requests
/prioritize "50 enhancement requests from Q1 sales calls"
# After prioritization, synthesize patterns:
Use customer-feedback-synthesis skill to find patterns in Q1 prioritized requests
```

**Integration pattern**: `/prioritize` → ranked backlog → `synthesis` consolidates needs

---

### From Granola MCP (meeting transcripts)

```bash
# Fetch meeting data via MCP, then synthesize
Use customer-feedback-synthesis skill to analyze all Granola customer meetings from January 2026
# Tool will use: mcp__granola__search_meetings() to fetch transcripts
```

**Integration pattern**: Granola MCP → meeting data → `synthesis` extracts insights

---

## Downstream: Commands that CONSUME Synthesis Outputs

### To `/prioritize`

```bash
# Synthesis identifies top insights
Use customer-feedback-synthesis skill → Output: Top 5 insights with evidence

# Use insights to inform roadmap prioritization
/prioritize "Q2 roadmap priorities using synthesis insights"
# Reference: memory-bank/synthesis/2026-01-21-q1-feedback-synthesis.md
```

**Integration pattern**: `synthesis` → insights → `/prioritize` ranks roadmap items

---

### To `/spec` (PRD Creation)

```bash
# Synthesis identifies opportunity
Use customer-feedback-synthesis skill → Output: "Slow query performance" is top opportunity

# Create PRD for top opportunity
/spec "Query performance optimization feature"
# Reference synthesis report for customer evidence and requirements
```

**Integration pattern**: `synthesis` → opportunity → `/spec` creates PRD

---

### To `/think` (Strategic Analysis)

```bash
# Synthesis reveals strategic finding
Use customer-feedback-synthesis skill → Finding: Market shifting from team-level to portfolio-level coordination

# Deep strategic analysis of finding
/think "Strategic implications of portfolio-level coordination trend"
```

**Integration pattern**: `synthesis` → finding → `/think` strategic deep-dive

---

### To `/decide` (Go/No-Go Decisions)

```bash
# Synthesis presents conflicting signals
Use customer-feedback-synthesis skill → Finding: Different segments want opposite things

# Make go/no-go decision
/decide "Should we build enterprise-first or SMB-first features?"
# Use synthesis evidence to weigh options
```

**Integration pattern**: `synthesis` → evidence → `/decide` makes decision

---

### To `/write` (Executive Communication)

```bash
# Synthesis generates insights for exec communication
Use customer-feedback-synthesis skill → Output: 3 key insights, 5 top opportunities

# Create executive brief
/write "CAB Insights Executive Summary for CEO"
# Format synthesis findings for exec audience
```

**Integration pattern**: `synthesis` → insights → `/write` creates comms

---

## Workflow Patterns

### Pattern 1: Quarterly Synthesis Cycle

```
Week 1-2: /research (conduct interviews)
Week 3: customer-feedback-synthesis (analyze patterns)
Week 4: /prioritize (update roadmap)
         ↓
         /spec (PRDs for top opportunities)
```

**Use case**: Regular quarterly customer feedback synthesis

---

### Pattern 2: Support Ticket Analysis

```
Ongoing: Support tickets accumulate
Trigger: 50+ tickets on a topic
          ↓
customer-feedback-synthesis (root cause analysis)
          ↓
/spec (technical spike PRD if needed)
```

**Use case**: Reactive analysis of support ticket patterns

---

### Pattern 3: Discovery to Synthesis

```
Week 1-4: /discover (problem space research)
Week 5: customer-feedback-synthesis (synthesize findings)
          ↓
/think (strategic analysis of opportunities)
          ↓
/decide (go/no-go on feature direction)
```

**Use case**: Multi-week discovery project followed by synthesis

---

### Pattern 4: Enhancement Request Consolidation

```
Ongoing: Sales/CS collect enhancement requests
Quarterly: /prioritize (rank all requests)
          ↓
customer-feedback-synthesis (consolidate underlying needs)
          ↓
/prioritize (re-rank based on consolidated opportunities)
```

**Use case**: Consolidating duplicative enhancement requests

---

## When to Use Synthesis Standalone

Use `customer-feedback-synthesis` directly when you have:

✅ **Accumulated feedback** ready for analysis
- Quarterly interview batch (10+ interviews)
- Support tickets for root cause analysis (50+ tickets)
- Enhancement requests needing consolidation (20+ requests)

✅ **Multi-source data** that needs integration
- Interviews + tickets + analytics
- Customer advisory board feedback
- Cross-segment feedback comparison

✅ **Strategic decisions** requiring evidence
- Roadmap planning input
- Feature prioritization
- Market analysis

---

## When to Chain with Other Commands

Chain synthesis with other commands when:

**Before synthesis:**
- Data collection phase complete (`/research`, `/discover`)
- Requests prioritized but not consolidated (`/prioritize`)

**After synthesis:**
- Insights need strategic analysis (`/think`)
- Opportunities require PRD creation (`/spec`)
- Findings need executive formatting (`/write`)
- Evidence informs go/no-go decision (`/decide`)
- Insights update roadmap priorities (`/prioritize`)

---

## Summary: Command Integration Matrix

| Phase | Input Command | Synthesis Role | Output Command |
|-------|--------------|----------------|----------------|
| Research | `/research`, `/discover` | Analyze findings | `/spec` |
| Planning | `/prioritize` | Consolidate needs | `/prioritize` |
| Strategy | `synthesis` | Extract insights | `/think`, `/decide` |
| Communication | `synthesis` | Format findings | `/write` |
| Roadmap | `synthesis` | Prioritize opportunities | `/prioritize`, `/spec` |
