# Willingness-to-Pay (WTP) Research Methods

Use this reference when planning WTP research as part of Step 4 in the pricing workflow. Pick 1-2 methods based on the decision context and available resources.

## Method Selection Guide

| Method | Best For | Sample Size | Effort | Precision |
|--------|----------|-------------|--------|-----------|
| Van Westendorp PSM | Early-stage range finding | 50-200 | Low | Range only |
| Gabor-Granger | Demand curve at specific points | 100-300 | Medium | Moderate |
| Conjoint / Choice-based | Multi-attribute trade-offs | 200-500+ | High | High |
| Customer Interviews | Narrative, context, hidden constraints | 8-15 | Low-Medium | Directional |

**Quick decision:**
- **Don't know the ballpark yet?** Start with Van Westendorp or interviews.
- **Have a ballpark, need to optimize?** Use Gabor-Granger.
- **Multiple packaging/feature trade-offs?** Use conjoint.
- **Complex enterprise with long sales cycles?** Interviews + Van Westendorp hybrid.

---

## Van Westendorp Price Sensitivity Meter (PSM)

**What it does:** Establishes a range of acceptable prices by asking four questions that map psychological price boundaries.

**When to use:**
- Early in the pricing process when no anchor exists
- Quick read on a new product or segment
- Validating whether a planned price is in the acceptable range

**The four questions:**
1. At what price would this be **so cheap** you'd question quality?
2. At what price is this a **bargain** — great value for money?
3. At what price is this **getting expensive** — you'd still consider it but need to think?
4. At what price is this **too expensive** — you'd never buy it?

**Output:** Four intersecting curves that define:
- **Point of Marginal Cheapness (PMC)**: Below this, credibility erodes
- **Point of Marginal Expensiveness (PME)**: Above this, resistance rises sharply
- **Indifference Price Point (IDP)**: Equal cheap-vs-expensive perception
- **Optimal Price Point (OPP)**: Minimum total resistance

**Limitations:** Gives a range, not a demand curve. Doesn't account for competitive context or feature trade-offs.

**More:** [Van Westendorp PSM on Wikipedia](https://en.wikipedia.org/wiki/Van_Westendorp%27s_Price_Sensitivity_Meter)

---

## Gabor-Granger Method

**What it does:** Builds a demand curve by testing purchase intent at specific price points, revealing the revenue-maximizing price.

**When to use:**
- You have an approximate range and need to find the optimal point
- Testing a small number of price points (typically 5-7)
- Simpler products where price is the main variable

**How it works:**
1. Present the product at a randomly assigned price
2. Ask: "How likely are you to purchase at this price?" (5-point scale)
3. Repeat at different price points (ascending or descending)
4. Plot purchase probability against price to build demand curve
5. Multiply price x probability to find revenue-maximizing point

**Sample questions:**
- "At $X/month, how likely would you be to subscribe?" (Definitely would / Probably would / Might or might not / Probably would not / Definitely would not)
- Follow up: "What is the maximum you would pay for this?"

**Limitations:** Tests price in isolation — doesn't capture packaging or feature trade-offs. Hypothetical bias can inflate WTP.

**More:** [Gabor-Granger method on Wikipedia](https://en.wikipedia.org/wiki/Gabor%E2%80%93Granger_method)

---

## Conjoint Analysis (Choice-Based)

**What it does:** Reveals how customers trade off across multiple attributes (features, price, support level, brand) by forcing choices between bundles.

**When to use:**
- Packaging decisions with multiple feature/tier combinations
- Need to understand relative value of individual features
- Want to simulate market share at different price/package configurations
- Enough budget and sample size for statistical rigor

**How it works:**
1. Define attributes (e.g., features, support tier, price, contract length)
2. Define levels within each attribute (e.g., price: $50, $100, $150)
3. Present respondents with choice sets (pairs or triads of bundles)
4. Ask: "Which would you choose?" (or "none")
5. Statistical model extracts part-worth utilities for each attribute level
6. Simulate market scenarios by combining utilities

**Design considerations:**
- Keep attributes to 4-6 (more causes fatigue)
- Include a "none" option to allow opt-out
- Randomize presentation order
- Use a qualified survey platform (Sawtooth, Conjointly, or similar)

**Limitations:** Expensive and complex to design well. Requires large sample. Hypothetical choices may not match real behavior.

**More:** [Conjoint analysis on Wikipedia](https://en.wikipedia.org/wiki/Conjoint_analysis)

---

## Customer Interviews (Value-Based Pricing Narrative)

**What it does:** Uncovers the qualitative story behind WTP — budget processes, decision criteria, competitive alternatives, perceived value, and hidden constraints that surveys miss.

**When to use:**
- Enterprise deals where procurement is complex
- Exploring a new market segment
- Understanding "why" behind the numbers
- Supplementing quantitative methods with context

**Interview guide (top questions):**
1. "Walk me through how you'd evaluate and budget for a tool like this."
2. "What are you using today, and roughly what does it cost you?" (total cost of ownership, not just license)
3. "If this solved [core problem], what would that be worth to your team in time/money/risk?"
4. "What would make this feel expensive? What would make it feel like a no-brainer?"
5. "Who else would need to approve this purchase, and what do they care about?"

**Analysis approach:**
- Code responses into themes (value anchors, budget ranges, objections, competitive benchmarks)
- Look for clusters — do segments converge on similar ranges?
- Pay attention to the language customers use to describe value (these become sales talk tracks)

**Limitations:** Small sample, subject to framing effects. Directional, not statistically generalizable. Best paired with a quantitative method.

---

## Combining Methods

For high-stakes pricing decisions, combine methods:

- **Interviews first → Van Westendorp** — Use interviews to understand context, then PSM to validate the range quantitatively
- **Van Westendorp → Gabor-Granger** — Establish the range, then optimize within it
- **Interviews + Conjoint** — Use interviews to identify the right attributes, then conjoint to quantify trade-offs
- **All four (major reprice):** Interviews for context → Van Westendorp for range → Conjoint for packaging → Gabor-Granger for final price point
