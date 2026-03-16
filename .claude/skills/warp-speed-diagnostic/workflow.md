# WARP Diagnostic Workflow

Step-by-step process for conducting a comprehensive WARP assessment. Total time: ~25 minutes.

## Phase 1: Gather Context (3 min)

### Step 1a: Collect User Inputs

Gather required parameters:

| Parameter | Required | Example |
|-----------|----------|---------|
| Product Name | Yes | "AuthHub" |
| Product URL | No | "https://authhub.co" |
| Brief Description | Yes | "OAuth aggregation for marketing agencies" |
| Stage | Yes | "Early traction" |
| Target Market | Yes | "5-20 person marketing agencies" |
| Competitor URLs | No | ["https://zapier.com", "https://motion.dev"] |

If URLs not provided, work with descriptions only (confidence drops to 60%).

### Step 1b: Research (Web Search)

**Option A: Use Firecrawl CLI (preferred):**

If product URL provided:
```
firecrawl scrape [product URL] --only-main-content -o .firecrawl/product.md
```
Extract: positioning, features, value proposition, pricing

If competitor URLs provided, scrape each for comparison.

**Option B: Fallback to WebSearch:**

Product research:
```
WebSearch(query: "[product name] pricing features")
WebSearch(query: "[product name] how it works value proposition")
```

User complaints/pain:
```
WebSearch(query: "[product name] onboarding learning curve review")
WebSearch(query: "[product name] problems complaints site:reddit.com")
```

Competitor research:
```
WebSearch(query: "[competitor] vs [product] comparison pricing")
WebSearch(query: "[competitor] features pricing")
```

### Confidence Levels by Data Source

| Source | Confidence | Why |
|--------|------------|-----|
| URLs + Firecrawl | 85% | Can scrape exact features, pricing, onboarding |
| URLs + WebSearch | 75% | Summaries and reviews, not raw data |
| Description only | 60% | Relies on user's perspective, may be biased |
| With competitor data | +10% | Benchmarking validates scores |

---

## Phase 2: Score Each WARP Force (12 min)

### Step 2a: Pervasive Pain (P) - 3 min

**Ask probing questions:**

1. **Widespread:** "How many people have this problem?"
   - Estimate TAM
   - Check market size data if available

2. **Frequent:** "How often do they hit it?"
   - Daily/weekly/monthly?
   - More frequent = more switching opportunities

3. **Loud:** "Where do people complain about it?"
   - Search Reddit, Twitter, G2 reviews
   - Count visible complaints

**Score each criterion:**
- Widespread (0-10)
- Frequent (0-10)
- Loud (0-5)

**Document evidence** for each score with sources.

### Step 2b: Win Preference (W) - 3 min

**Define the transformation:**
1. Create From→To statement
2. Test: Would users say "I can't imagine going back"?

**Map the approach:**
1. Old workflow steps vs. new workflow steps
2. Time comparison
3. Expertise required comparison

**Identify defaults:**
1. What decisions does the product make for users?
2. What % of users can succeed with zero configuration?

**Calculate:** Transformation (0-10) × Approach (0-10) × Defaults (0-5)

### Step 2c: Activate Instantly (A) - 3 min

**Define first value moment:**
- What specific action demonstrates the product's value?
- When does the user think "wow, this works"?

**Map the journey:**
1. Signup → First value
2. Count every step, click, form field
3. Measure actual time (not estimated)

**Identify blockers:**
- Knowledge gaps (what must they understand?)
- Skill gaps (what must they execute?)
- Product gaps (what must they configure?)

**Score based on TTV:**
- Sub-60 seconds: 20-25 pts
- 2-5 minutes: 15-19 pts
- 5-15 minutes: 10-14 pts
- 15+ minutes: 0-9 pts

**Validation tip:** Founder estimates are often 2-3x faster than reality. If possible, observe real users.

### Step 2d: Repeatable Leverage (R) - 3 min

**Map human dependencies:**
- Onboarding: Self-serve or sales-led?
- Support: AI or human team?
- Sales: Product-led or sales team?
- Success: Automated or CSM?

**Assess AI automation:**
- What does AI/product handle automatically?
- What still requires humans?

**Calculate revenue potential:**
- Current or projected ARR per employee
- Compare to benchmarks ($5M/employee = exceptional)

**Run the 10,000 User Test:**
> "If 10,000 users signed up tomorrow, could we activate, convert, and keep them without adding headcount?"

**Score:**
- Zero marginal humans (0-10)
- AI + product automation (0-10)
- Effortless ARR (0-5)

---

## Phase 3: Benchmark & Diagnose (3 min)

### Step 3a: Calculate Overall Score

```
Total WARP Score = P + W + A + R (out of 100)
Primary Constraint = Lowest scoring force
```

### Step 3b: Interpret Results

| Score | Status | Action |
|-------|--------|--------|
| 90-100 | Warp speed ready | Go fast, optimize constraint |
| 75-89 | Strong foundation | Fix constraint first |
| 60-74 | Viable PLG | Work on 2+ forces |
| <60 | Major gaps | Fundamental model questions |

### Step 3c: Compare to Benchmarks

If competitor data available, compare across all 4 forces:

| Force | Your Product | Competitor A | Competitor B |
|-------|--------------|--------------|--------------|
| P | ? | ? | ? |
| W | ? | ? | ? |
| A | ? | ? | ? |
| R | ? | ? | ? |
| **Total** | ? | ? | ? |

### Step 3d: Identify the Constraint

**The constraint is the lowest-scoring force.**

Why focus on the constraint?
- WARP forces multiply, not add
- Fixing the weak link has highest leverage
- Balanced scores beat uneven scores

**Example:**
- Product scores: P=22, W=20, A=8, R=18 (Total: 68)
- Constraint: Activate Instantly (8)
- Priority: Fix onboarding before anything else

---

## Phase 4: Generate Report (7 min)

### Report Structure

```markdown
# WARP Speed Assessment: [Product Name]

## Executive Summary
- **Total WARP Score:** X/100
- **Primary Constraint:** [Lowest force]
- **Warp Speed Verdict:** [Ready / Not Ready / Needs Work]

## Detailed Scoring

### P: Pervasive Pain (X/25)
| Criterion | Score | Evidence |
|-----------|-------|----------|
| Widespread | ?/10 | [Evidence] |
| Frequent | ?/10 | [Evidence] |
| Loud | ?/5 | [Evidence] |

### W: Win Preference (X/25)
| Criterion | Score | Evidence |
|-----------|-------|----------|
| Transformation | ?/10 | [From→To statement] |
| Approach | ?/10 | [Workflow comparison] |
| Defaults | ?/5 | [Opinionated choices] |

### A: Activate Instantly (X/25)
| Metric | Value | Score |
|--------|-------|-------|
| Time-to-Value | [X min/sec] | ?/25 |
| Knowledge Blockers | [List] | |
| Skill Blockers | [List] | |
| Product Blockers | [List] | |

### R: Repeatable Leverage (X/25)
| Criterion | Score | Evidence |
|-----------|-------|----------|
| Zero Marginal Humans | ?/10 | [10K user test result] |
| AI Automation | ?/10 | [What's automated] |
| Effortless ARR | ?/5 | [Revenue/employee] |

## Competitive Benchmark
[If competitor data available - comparison table]

## Prioritized Roadmap

### 1. [Highest Priority Improvement]
- **Target Force:** [Which WARP force]
- **Current Score:** X
- **Target Score:** Y
- **Key Actions:**
  - [ ] Action 1
  - [ ] Action 2
  - [ ] Action 3
- **Expected Impact:** [Description]

### 2. [Second Priority]
[Same format]

### 3. [Third Priority]
[Same format]

## Next Steps
Based on your constraint ([force]), use these skills next:
- [Relevant skill recommendations]

---
*Assessment generated: [Date]*
*Confidence level: [X%]*
```

### Quality Checklist

Before delivering, verify:
- [ ] All 4 forces scored with supporting evidence
- [ ] Primary constraint clearly identified with justification
- [ ] Roadmap prioritized by impact (fix constraint first)
- [ ] Competitive benchmark included (if URLs provided)
- [ ] Realistic assessment (not biased optimism)
- [ ] Next steps clear (which skills to use next)

---

## Best Practices

1. **Be honest about scores** - Accurate diagnosis is critical for improvement
2. **Gather evidence** - Every score needs supporting data or rationale
3. **Focus on constraint** - Fix the lowest-scoring force first (biggest leverage)
4. **Use web research when possible** - URLs enable deeper competitive analysis
5. **Revisit quarterly** - WARP scores change as you improve
6. **Validate TTV estimates** - Watch real users, don't trust founder estimates

## Common Mistakes to Avoid

| Mistake | Solution |
|---------|----------|
| Inflating scores | If evidence is weak, score lower |
| Ignoring the constraint | Fix the lowest force first |
| Optimistic TTV | Measure real users, not estimates |
| Skipping competitive research | Even 1-2 competitors provide valuable context |
| Total score focus | Individual force minimums matter more |
