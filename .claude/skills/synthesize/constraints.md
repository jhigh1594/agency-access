# Constraints & Anti-Patterns

This file describes what NOT to do when using the customer-feedback-synthesis skill. These constraints and anti-patterns help ensure high-quality synthesis outcomes.

---

## 8 Anti-Patterns to Avoid

### 1. Don't Confuse Customer Requests with Customer Problems

**❌ BAD**: "Customers want a dashboard"

This is a solution request, not a problem statement. Building dashboards without understanding the underlying need often leads to unused features.

**✅ GOOD**: "Customers struggle to track cross-team progress, currently using spreadsheets that require 3+ hours per week of manual updates"

This describes the underlying problem and current pain. Solutions can change, but problems stay constant. Build for the problem.

**Why it matters**: Solutions change frequently; problems remain stable. Focusing on problems rather than solutions leads to more durable product decisions.

---

### 2. Don't Rely on Single Data Points

**❌ BAD**: One customer mentioned X, so it's high priority

A single mention is an anecdote, not a pattern. Basing product decisions on one customer's feedback leads to overfitting and missed opportunities.

**✅ GOOD**: 10+ customers described similar pain, with quantified impact, and all are ICP segment

Multiple mentions across customers indicate a pattern. Frequency, severity, and strategic fit together indicate priority.

**Rule**: "One is noise, ten is signal"

**Why it matters**: Single data points can be outliers, vocal minorities, or edge cases. Patterns across multiple customers indicate real market needs.

---

### 3. Don't Keyword-Match in Affinity Mapping

**❌ BAD**: Group all feedback containing "dependency" together

This lumps together different underlying problems:
- "Can't see dependencies" (visibility problem)
- "Dependencies break too often" (reliability problem)
- "Tracking dependencies takes too long" (efficiency problem)

**✅ GOOD**: Group by underlying meaning

**Reactive Dependency Detection**:
- "We find out too late that dependencies broke"
- "Blockers surprise downstream teams"
- "No early warning when risks emerge"

**Manual Verification Overhead**:
- "Hours spent checking dependency status manually"
- "Spreadsheets don't scale for tracking"
- "Status meetings consume too much time"

**Why it matters**: Keyword matching misses nuance and creates overly broad themes. Different underlying problems may require different solutions.

---

### 4. Don't Skip Assumption Tracking

**❌ BAD**: "Customers will love this" without validation plan

Proceeding without documenting assumptions leads to hidden risks and failed launches.

**✅ GOOD**: "We assume customers will switch from spreadsheets → Test with prototype"

Assumption tracking makes risks explicit and ensures validation happens before major investment.

**Template**:

| Assumption | Risk Level | Validation Method | Status | Evidence |
|------------|-----------|-------------------|--------|----------|
| Customers will find proactive alerts more valuable than manual tracking | Critical | Prototype testing with 5 customers | ⚠️ Uncertain | Need to test prototype |

**Why it matters**: Assumptions = risks. Tracking them explicitly ensures validation happens and prevents wasted investment.

---

### 5. Don't Synthesize Forever (Diminishing Returns)

**❌ BAD**: "Let's do 50 more interviews before deciding"

More research isn't always better. At some point, you're just hearing the same patterns repeatedly.

**✅ GOOD**: "After 15 interviews, themes are repeating → Synthesize and validate top opportunity"

When patterns repeat 3+ times, it's time to synthesize and test. Learn by building, not just researching.

**Rule**: When you hear the same patterns 3+ times, synthesize and validate

**Why it matters**: Research has diminishing returns. Shipping and learning from real usage is more valuable than endless research.

---

### 6. Don't Ignore Disconfirming Evidence

**❌ BAD**: Cherry-picking quotes that support preferred solution

Ignoring evidence that doesn't fit your narrative leads to confirmation bias and failed products.

**✅ GOOD**: "12/15 said X, but 3/15 had opposite view → Investigate segment difference"

Outliers and contradictions often reveal:
- Segment differences (enterprise vs. SMB)
- Edge cases that matter
- Flaws in your analysis

**Why it matters**: Disconfirming evidence reveals nuance and prevents confirmation bias. Understanding why some customers disagree improves your understanding of the problem space.

---

### 7. Don't Synthesize Without an Action Plan

**❌ BAD**: Beautiful synthesis report that sits in a document

Synthesis without action is wasted effort. The goal is better decisions, not better documents.

**✅ GOOD**: Synthesis → Prioritized opportunities → Validation plan → Roadmap decision

Always complete the cycle:
1. Synthesize to identify opportunities
2. Prioritize opportunities
3. Plan validation for top opportunities
4. Make roadmap decisions
5. Update product strategy

**Recommended Next Actions**:
- `/prioritize` - Use insights to rank roadmap
- `/spec` - Create PRD for top opportunity
- `/think` - Strategic analysis of key finding
- `/decide` - Go/no-go decision on opportunity

**Why it matters**: Synthesis is input to decisions, not the end goal. Actionable synthesis drives product progress.

---

### 8. Don't Lose Customer Voice

**❌ BAD**: Paraphrasing everything in your own words

"Customers want better tracking" loses the customer's actual language, emotion, and context.

**✅ GOOD**: "Every Monday I spend 2-3 hours updating our dependency spreadsheet by pinging teams on Slack. Half the time I get stale information, and we still miss blockers until it's too late."

Verbatim quotes preserve:
- Exact customer language
- Emotional intensity
- Specific context and detail
- Credibility with stakeholders

**Atomic Nugget Template**:
```markdown
**Quote**: "[Exact verbatim quote]"
**Context**: [What triggered this? What were they trying to do?]
**Customer**: [Segment, role, company size]
**Date**: [When this was captured]
```

**Why it matters**: Customer language reveals framing, emotion, and context that paraphrasing loses. Stakeholders find verbatim quotes more credible than summaries.

---

## Quick Reference: Anti-Pattern Checklist

When using the customer-feedback-synthesis skill, verify:

- [ ] Focused on problems, not solutions
- [ ] Patterns supported by multiple data points
- [ ] Affinity mapping by meaning, not keywords
- [ ] Assumptions documented with validation plans
- [ ] Synthesis time-boxed (not endless research)
- [ ] Disconfirming evidence investigated
- [ ] Clear action plan after synthesis
- [ ] Customer voice preserved (verbatim quotes)

---

## Consequences of Violating Constraints

| Anti-Pattern | Consequence | Impact |
|--------------|-------------|--------|
| Solution vs. Problem | Build wrong thing | Wasted engineering, low adoption |
| Single data point | Overfit to outliers | Miss broader market opportunity |
| Keyword matching | Miss nuance | Ineffective solutions |
| Skip assumption tracking | Hidden risks | Failed launches, wasted investment |
| Endless synthesis | Analysis paralysis | Delayed value delivery |
| Ignore disconfirming evidence | Confirmation bias | Blind spots, failed products |
| No action plan | Research without impact | Wasted effort, no progress |
| Lose customer voice | Low credibility | Stakeholder skepticism |

---

## Mental Model: First Principles of Good Synthesis

1. **Problems > Solutions**: Solve real problems, not feature requests
2. **Patterns > Anecdotes**: Base decisions on multiple data points
3. **Meaning > Keywords**: Understand underlying causes
4. **Assumptions > Certainty**: Track and validate beliefs
5. **Action > Analysis**: Synthesis drives decisions, not documents
6. **Evidence > Bias**: Seek disconfirming evidence
7. **Voice > Paraphrase**: Preserve customer language
8. **Learning Over Knowing**: Ship and iterate, don't research forever
