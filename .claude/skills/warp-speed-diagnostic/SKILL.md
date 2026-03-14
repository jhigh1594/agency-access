---
name: warp-speed-diagnostic
description: Assess PLG product readiness for hypergrowth using Wes Bush's WARP Framework (Win Preference, Activate Instantly, Repeatable Leverage, Pervasive Pain). Produces scored assessment with prioritized recommendations. Use when launching PLG products, diagnosing growth bottlenecks, or evaluating product-market fit for AI-era growth.
---

# WARP Speed Diagnostic

Comprehensive assessment of your product's readiness for hypergrowth using Wes Bush's WARP Framework. This skill scores your product across all 4 WARP forces and identifies your primary growth constraint.

## When to Use This Skill

- Launching a PLG (Product-Led Growth) product
- Diagnosing why growth has stalled
- Benchmarking against category leaders (Cursor, Lovable, Midjourney)
- Evaluating if $100M ARR in 12 months is realistic
- Before major product pivots or repositioning

## Capabilities

- Score product across all 4 WARP forces (0-100 scale)
- Benchmark against warp-speed companies
- Identify primary growth constraint
- Research competitor WARP scores using web search
- Generate prioritized improvement roadmap
- Determine if warp speed is achievable

## Input Format

| Parameter | Required | Description |
|-----------|----------|-------------|
| Product Name | Yes | Your product name |
| Product URL | No | Homepage URL (enables web research) |
| Brief Description | Yes | What your product does in 2-3 sentences |
| Stage | Yes | Pre-launch / Early traction / Growth / Scale |
| Target Market | Yes | Who uses this (persona, company size, industry) |
| Competitor URLs | No | 2-3 competitor URLs for benchmarking |

## Quick Reference: The 4 WARP Forces

| Force | Question | Max Score |
|-------|----------|-----------|
| **P**ervasive Pain | Are you solving a problem the market is desperate to fix? | 25 |
| **W**in Preference | Do users try you once and can't go back? | 25 |
| **A**ctivate Instantly | Do users gain a new capability in 60 seconds or less? | 25 |
| **R**epeatable Leverage | Can you scale revenue without scaling headcount? | 25 |

**Total Score Interpretation:**
- 90-100: Ready for warp speed
- 75-89: Strong foundation, optimize constraint
- 60-74: Viable PLG, significant work needed
- <60: Major gaps, not ready for hypergrowth

## Basic Workflow

1. **Gather Context** (3 min) - Collect inputs, research product/competitors via web search
2. **Score Each Force** (12 min) - P, W, A, R with evidence
3. **Benchmark & Diagnose** (3 min) - Calculate total, identify constraint
4. **Generate Report** (7 min) - Comprehensive assessment with roadmap

For detailed scoring methodology, see `scoring-rubric.md`.
For detailed workflow steps, see `workflow.md`.
For framework deep-dive, see `framework-guide.md`.

## Output Format

**WARP Speed Assessment Report** includes:

1. **Executive Summary** - Overall WARP score, primary constraint, go/no-go for warp speed
2. **Pervasive Pain Analysis** - Widespread, frequent, loud pain assessment
3. **Win Preference Score** - Transformation clarity, approach strength, defaults
4. **Activate Instantly Score** - Time-to-value analysis, blocker identification
5. **Repeatable Leverage Score** - Human dependencies, AI readiness
6. **Competitive Benchmark** - Your scores vs. competitors (if URLs provided)
7. **Prioritized Roadmap** - Top 3 improvements with expected impact
8. **Next Steps** - Which other PLG skills to use based on your constraint

## Example Usage

```
"Run a WARP diagnostic on AuthHub, my OAuth aggregation platform for
marketing agencies. We're at early traction stage ($5K MRR). Target
market is 5-20 person marketing agencies. Main competitors are
Motion andzapier.com."
```

## About This Assessment

**WARP Framework:** Created by Wes Bush, founder of ProductLed
**Learn more:** [productled.com/blog/warp-speed](https://productled.com/blog/warp-speed)
**Scoring Methodology:** Quantitative rubric designed for comparative assessments
**Skill Author:** Jenna Potter ([promptashell.com](https://promptashell.com))

## Reference Files

- **`framework-guide.md`**: Deep explanation of each WARP force with examples
- **`scoring-rubric.md`**: Detailed 0-25 point scoring criteria for each force
- **`workflow.md`**: Step-by-step diagnostic process with research methods

---

*Generate comprehensive WARP assessments in 25 minutes with evidence-based scoring and competitive benchmarking.*
