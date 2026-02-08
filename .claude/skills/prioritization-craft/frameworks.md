# Prioritization Frameworks

This file provides detailed explanations of the six prioritization frameworks used in the prioritization-craft skill.

---

## Framework Selection Guide

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

---

## 1. RICE (Reach × Impact × Confidence / Effort)

**When to use**: You have quantitative data on usage and effort

**Scoring**:
- **Reach** (number): How many users will this benefit per quarter?
- **Impact** (0.25-3.0): How much value? (0.25 = Tiny, 0.5 = Low, 1 = Medium, 2 = High, 3 = Massive)
- **Confidence** (%): How sure are we? (50% = Low, 80% = Medium, 100% = High)
- **Effort** (person-months): How much work? (1 = 1 person-month, etc.)

**Formula**: `(Reach × Impact × Confidence) / Effort = RICE Score`

**Example**:
| Feature | Reach | Impact | Confidence | Effort | RICE Score |
|---------|-------|--------|------------|--------|------------|
| A | 1000 | 3 | 80% | 3 | (1000 × 3 × 0.8) / 3 = 800 |
| B | 500 | 2 | 60% | 2 | (500 × 2 × 0.6) / 2 = 300 |
| C | 2000 | 1 | 50% | 6 | (2000 × 1 × 0.5) / 6 = 167 |

**Interpretation**: Higher scores = higher priority

---

## 2. ICE (Impact × Confidence × Ease)

**When to use**: Early stage, limited data, need quick scoring

**Scoring**: Score each 1-10
- **Impact** (1-10): How much value would this create?
- **Confidence** (1-10): How sure are we about impact?
- **Ease** (1-10): How easy is this? (1 = Hard, 10 = Easy)

**Formula**: `(Impact × Confidence × Ease) / 3 = ICE Score`

**Example**:
| Feature | Impact | Confidence | Ease | ICE Score |
|---------|--------|------------|-------|-----------|
| A | 8 | 7 | 3 | (8 × 7 × 3) / 3 = 56 |
| B | 9 | 5 | 5 | (9 × 5 × 5) / 3 = 75 |
| C | 6 | 8 | 8 | (6 × 8 × 8) / 3 = 128 |

**Interpretation**: Higher scores = higher priority

---

## 3. Value vs. Effort (2×2 Matrix)

**When to use**: Need visual alignment, stakeholder discussions

**Quadrants**:
- **DO FIRST** (high value, low effort)
- **DO NEXT** (high value, high effort OR low value, low effort)
- **DO LATER** (low value, high effort)
- **DON'T DO** (low value, low effort)

**Scoring**:
- **Value** (1-10): Business impact, customer value, strategic importance
- **Effort** (1-10): Development effort, complexity, resource requirements

**Example**:
```
High Effort
    │
 8  │ [DO NEXT]      [DO LATER]
    │
 4  │                    [DO FIRST]
    │
 1  │ [DON'T DO]      [DO NEXT]
    │
    └────────────────────────
      1         5        10
           Value
```

**Interpretation**: Focus on DO FIRST items, then DO NEXT

---

## 4. Three Buckets (Adam Nash)

**When to use**: Roadmap planning, balancing different types of work

**Buckets**:
- **Metrics Movers** (30-50%): Features that directly improve key metrics
- **Customer Requests** (30-40%): Features requested by customers (not all features are customer-facing)
- **Delight/Innovation** (20-30%): New capabilities, differentiation, innovation

**Example**:
| Bucket | Allocation | Items |
|--------|-----------|-------|
| Metrics Movers | 40% | 4 features |
| Customer Requests | 35% | 3 features |
| Delight/Innovation | 25% | 2 features |

**Benefits**:
- Ensures balanced roadmap
- Prevents over-optimizing one area
- Guarantees customer voice is heard
- Creates space for innovation

---

## 5. Kano Model

**When to use**: Understanding feature satisfaction vs. investment

**Categories**:
- **Must-Haves** (Basic needs): Customers expect these - table stakes
  - Example: Login, password reset, basic functionality
- **Performance** (More is better): Investment increases satisfaction linearly
  - Example: Faster load times, more data export options
- **Delighters** (Unexpected wow): Features customers didn't know they wanted
  - Example: Intelligent recommendations, delightful micro-interactions

**Investment Strategy**:
1. **First**: Satisfy all Must-Haves (customers are dissatisfied without them)
2. **Second**: Invest in Performance features (linear satisfaction gain)
3. **Third**: Add Delighters for differentiation and customer delight

**Warning**: Don't over-invest in Performance - diminishing returns

---

## 6. Cost of Delay / WSJF (Weighted Shortest Job First)

**When to use**: Time-to-market matters, opportunity cost is high

**Cost of Delay**: How much value is lost per month by delaying this?

**WSJF Formula**: `Cost of Delay per month / Duration (months) = WSJF Score`

**Example**:
| Feature | Cost of Delay/Month | Duration | WSJF Score |
|---------|---------------------|----------|------------|
| A | $100K/month | 2 months | 50 |
| B | $50K/month | 1 month | 50 |
| C | $200K/month | 3 months | 67 |

**Interpretation**: Higher WSJF = do sooner (shortest jobs first when weighted by cost of delay)

**Use Cases**:
- Time-sensitive market opportunities
- Competitive responses
- Regulatory compliance deadlines
- Seasonal opportunities

---

## Strategic Alignment Matrix

**When to use**: Strategic alignment unclear, need to filter by company vision

**Dimensions**:
- **Strategic Fit** (Core, Adjacent, Off-strategy): Does this align with company direction?
- **Urgency** (Time-sensitive, Important but not urgent, Backlog): How time-sensitive?

**Matrix**:
```
              Off-Strategy    Adjacent    Core
                  │              │         │
Time-sensitive    │   DO FIRST   │         │
                  │              │         │
Important         │   BACKLOG     │  DO NEXT │
Not Urgent        │              │         │
                  │              │         │
```

**Interpretation**: Focus on Core items first, then Adjacent if capacity allows

---

## Framework Comparison Summary

| Framework | Best For | Data Needed | Time Required |
|-----------|----------|-------------|---------------|
| **RICE** | Quantitative prioritization | Usage, effort, impact, confidence | 15 min |
| **ICE** | Quick qualitative scoring | Impact, confidence, ease | 10 min |
| **Value/Effort** | Visual alignment, stakeholder discussion | Value, effort estimates | 10 min |
| **Three Buckets** | Roadmap portfolio balance | None (allocation-based) | 5 min |
| **Kano** | Feature satisfaction analysis | Customer satisfaction data | 15 min |
| **Cost of Delay** | Time-sensitive decisions | Cost of delay, duration | 10 min |
| **Strategic Matrix** | Strategic fit filtering | Strategic vision, urgency | 10 min |

---

## Probing Questions for Framework Selection

When selecting a framework, ask:

- "We have effort estimates for 5 items but not the other 15—how should we handle incomplete data?"
- "Some items are customer requests, others are strategic bets—how do we compare across types?"
- "These are all 'high priority' according to requesters—how do we break the tie?"
- "Should we use the same framework as last quarter for consistency, or switch based on this data?"
- "We're optimizing for short-term wins this quarter—is that the right approach given our long-term strategy?"

---

## Common Mistakes

1. **Using RICE without data**: Don't fake numbers - use ICE instead
2. **Comparing apples to oranges**: Group similar items before scoring
3. **Forcing everything into one framework**: Different situations need different frameworks
4. **Ignoring strategic fit**: High score doesn't mean prioritize if off-strategy
5. **Not revisiting as data improves**: Update scores as you learn more

---

## Quick Reference

| Situation | Use Framework |
|-----------|--------------|
| Have usage/effort data | RICE |
| Early stage, limited data | ICE |
| Stakeholder alignment needed | Value/Effort matrix |
| Roadmap portfolio balance | Three Buckets |
| Feature satisfaction analysis | Kano Model |
| Time-sensitive opportunities | Cost of Delay/WSJF |
| Strategic fit unclear | Strategic Alignment Matrix |
