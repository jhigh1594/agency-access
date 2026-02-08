# Usage Examples - Synthesis Scenarios

This file provides real-world example flows for using the customer-feedback-synthesis skill.

---

## Scenario 1: Quarterly Interview Synthesis

**Context**: Product team conducted 15 customer interviews in Q1 about cross-team coordination. Need to synthesize findings for Q2 roadmap planning.

### User Input

```
Use customer-feedback-synthesis skill to analyze 15 Q1 customer interviews on cross-team coordination
```

### Execution Flow

**Clarifying questions asked:**

**1. What feedback are you synthesizing?**
- **Answer**: 15 customer interviews (transcripts in memory-bank/interviews/)
- **Time range**: January 1 - March 15, 2026
- **Sources**: Zoom transcripts, Granola meeting notes

**2. What customer segments?**
- **Answer**: 100% ICP (Enterprise, 500-10k employees, Financial Services, Insurance, Logistics)
- **Roles**: Agile Program Managers (8), Engineering Directors (4), Product Owners (3)

**3. What are you trying to learn?**
- **Answer**: Top coordination pain points for Q2 roadmap prioritization
- **Validate**: Do customers care about dependency management?
- **Decide**: Proactive alerts vs. better visualization?

**4. Timeline?**
- **Answer**: Need synthesis by EOW for roadmap review meeting

### Phase 1 Output

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

### Phase 2 Output

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

### Phase 3 Output

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

### Recommended Next Actions

```bash
# Create PRD for top opportunity
/spec "Proactive Dependency Risk Alert System"

# Validate assumption before building
/research "Prototype test: Dependency risk alerts with 5 customers"

# Update roadmap priorities
/prioritize "Q2 roadmap using synthesis insights"
```

---

## Scenario 2: Support Ticket Pattern Analysis

**Context**: Customer success team escalated concern about performance complaints. Need to analyze Q1 support tickets (200 tickets) to identify root causes and prioritize fixes.

### User Input

```
Use customer-feedback-synthesis skill to find patterns in 200 Q1 support tickets - performance category
```

### Execution Flow

**Phase 1**: Extract atomic nuggets from ticket descriptions, group by problem type

**Phase 2**: Apply affinity mapping and signal/noise filtering

**Output**:
- **Root Cause #1**: Slow board loading with 1000+ cards (Signal: 120, 45 tickets)
- **Root Cause #2**: Search timeout on large datasets (Signal: 90, 32 tickets)
- **Root Cause #3**: Export lag for large boards (Signal: 60, 28 tickets)

**Phase 3**: Create prioritized fix recommendations

### Recommended Next Actions

```bash
# Create technical spike for top root cause
/spec "Technical Spike: Board Loading Performance Optimization"

# Communicate fix plan to customer success
/write "Q1 Performance Issues - Root Cause Analysis and Fix Plan"
```

---

## Scenario 3: Enhancement Request Consolidation

**Context**: Sales team submitted 50 enhancement requests from customer calls in Q1. Many seem duplicative. Need to consolidate into underlying needs for roadmap consideration.

### User Input

```
Use customer-feedback-synthesis skill to consolidate 50 Q1 enhancement requests from sales calls
```

### Execution Flow

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

### Recommended Next Actions

```bash
# Share consolidated view with sales
/write "Q1 Enhancement Requests - Consolidated Roadmap View"

# Prioritize top opportunities for roadmap
/prioritize "Q2 roadmap including top 3 enhancement opportunities"

# Create spec for #1 opportunity
/spec "[Top opportunity name] PRD"
```

---

## Summary: Scenario Selection Guide

| Scenario | Data Type | Volume | Primary Framework | Output |
|----------|-----------|--------|------------------|--------|
| **Quarterly Interview Synthesis** | Interviews | 10-20+ | Thematic Analysis + JTBD | Themes, jobs, opportunities |
| **Support Ticket Analysis** | Tickets | 50-200+ | Affinity + Signal/Noise | Root causes, prioritized fixes |
| **Enhancement Request Consolidation** | Requests | 20-100+ | Affinity + JTBD | Consolidated needs, opportunities |

Use these scenarios as reference when applying the customer-feedback-synthesis skill to your own data.
