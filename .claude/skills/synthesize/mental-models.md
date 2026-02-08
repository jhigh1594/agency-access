# Mental Models Applied

This file describes the underlying mental models that inform the customer-feedback-synthesis skill approach.

---

## Four Risks (Marty Cagan)

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

**Quote**: "The biggest risk is building something that nobody wants."

---

## Jobs-to-be-Done (Clayton Christensen)

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

**Quote**: "People don't buy products or services; they 'hire' them to do a job."

---

## Confidence → Speed/Quality (Shreyas Doshi)

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

**Quote**: "Confidence determines speed. High confidence = ship fast. Low confidence = validate first."

---

## Signal vs Noise (Nate Silver)

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

**Quote**: "The signal is the truth. The noise is what distracts us from the truth."

---

## Time Value of Shipping (Shreyas Doshi)

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

**Quote**: "The cost of delay is often higher than the cost of being wrong. Ship and learn."

---

## Summary: Mental Model Integration

### How These Models Work Together

```
1. Jobs-to-be-Done
   ↓
   Understand what customers are trying to accomplish

2. Signal vs Noise
   ↓
   Distinguish real patterns from randomness

3. Four Risks
   ↓
   Prioritize value risk validation

4. Confidence → Speed/Quality
   ↓
   Match validation effort to confidence level

5. Time Value of Shipping
   ↓
   Validate quickly, ship, learn from usage
```

### Application in Synthesis Phases

**Phase 1 (Data Prep)**: Signal vs Noise filtering
- Identify high-signal nuggets early
- Focus on frequency, severity, strategic fit

**Phase 2 (Pattern Analysis)**: Jobs-to-be-Done
- Extract underlying motivations
- Map forces preventing adoption
- Identify workarounds as signal

**Phase 3 (Insights & Recommendations)**: Four Risks + Confidence
- Prioritize value assumptions in tracker
- Score opportunities by confidence
- Plan validation based on confidence level

**Throughout**: Time Value of Shipping
- Time-box each phase
- Move to action quickly
- Don't synthesize forever

---

## Key Takeaways

| Mental Model | Core Insight | Synthesis Application |
|--------------|--------------|----------------------|
| **Four Risks** | Value risk first | Prioritize value assumptions, validate before building |
| **Jobs-to-be-Done** | Customers hire products for progress | Dig deeper than features, understand motivations |
| **Confidence → Speed** | Match effort to evidence | High confidence = ship fast, low = validate first |
| **Signal vs Noise** | Distinguish pattern from randomness | Frequency × severity × strategic fit = signal strength |
| **Time Value** | Shipping sooner is valuable | Time-box synthesis, move to action quickly |

---

## Further Reading

- **Four Risks**: Marty Cagan, "INSPIRED: How to Create Tech Products Customers Love"
- **Jobs-to-be-Done**: Clayton Christensen, "Competing Against Luck"
- **Signal vs Noise**: Nate Silver, "The Signal and the Noise"
- **Confidence → Speed**: Shreyas Doshi, product leadership writings
- **Time Value**: Shreyas Doshi, "The Law of Shitty Clickthroughs"
