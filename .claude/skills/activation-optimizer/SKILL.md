---
name: activation-optimizer
description: Audit product onboarding to identify gaps preventing 60-second activation. Uses Bowling Alley Framework to map user journey, classify blockers (knowledge/skill/product gaps), and design AI agent interventions. Use when optimizing onboarding, reducing time-to-value, or diagnosing activation drop-off.
---
# Activation Optimizer

Audit your product's onboarding flow to achieve sub-60-second activation using Wes Bush's Bowling Alley Framework and AI agent interventions.

## Capabilities

- Map complete activation journey (signup → first value)
- Classify every step as Knowledge/Skill/Product gap or frictionless
- Calculate current time-to-value
- Design AI agent interventions to eliminate gaps
- Apply Bowling Alley Framework (Straight Line + Bumpers)
- Benchmark against competitor onboarding flows

## When to Use

Use this skill when:
- Optimizing onboarding or activation flows
- Reducing time-to-value (TTV)
- Diagnosing activation drop-off
- Designing new user onboarding experiences
- Comparing against competitor onboarding

## How to Use

1. **Define your "first value moment"** - What outcome = activation? Be specific.
2. **Provide product information** - Name, optionally URL, current metrics
3. **Skill maps journey** - Identifies gaps, designs AI interventions
4. **Receive Activation Gap Report** - Before/after comparison

## Input Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| Product Name | Yes | Your product name |
| Product URL | No | Signup/onboarding URL (enables flow scraping) |
| First Value Moment | Yes | What outcome = "activated"? Be specific |
| Current Activation Rate | No | % of signups who reach first value |
| Average Time-to-Value | No | Current time from signup → first value |
| Competitor URLs | No | 2-3 competitor signup flows to benchmark |

## Output: Activation Gap Report

1. **Executive Summary** - Current vs. target TTV, gap count, Instant Activation Score
2. **Current Activation Journey** - Every step mapped with gap types and time estimates
3. **Gap Analysis** - Knowledge, Skill, and Product gaps detailed with impact
4. **AI Agent Redesign** - Specific agent interventions for each gap
5. **Redesigned Activation Flow** - New journey with AI agents, target <60 sec TTV
6. **Bowling Alley Implementation** - Straight-Line + Product/Conversational Bumpers
7. **Competitive Benchmark** - Your TTV vs. competitors (if URLs provided)
8. **Implementation Roadmap** - Prioritized by activation impact

## Workflow Overview

The skill follows a 5-phase process (~35 min total):

1. **Research Onboarding** (5 min) - Define first value, scrape flows
2. **Map Activation Journey** (6 min) - List steps, classify gaps, estimate times
3. **Design AI Interventions** (8 min) - Create specific agents for each gap
4. **Apply Bowling Alley** (6 min) - Build straight-line, add bumpers
5. **Generate Report** (10 min) - Comprehensive before/after comparison

See `workflow.md` for detailed phase instructions.

## Gap Classification System

Every onboarding step falls into one of four categories:

| Type | Symbol | Description | AI Solution |
|------|--------|-------------|-------------|
| Knowledge | K | What user must understand | Agent makes the decision |
| Skill | S | What user must execute well | Agent performs the task |
| Product | P | What user must configure | Agent handles configuration |
| No Gap | — | Frictionless, necessary | No intervention needed |

See `gap-classification.md` for detailed examples and AI agent solutions.

## Bowling Alley Framework

The framework for frictionless activation has two components:

1. **Straight-Line Onboarding** - Boil down to minimum steps for value
2. **Bumpers** - Product and conversational guidance to keep users on track

See `bowling-alley-framework.md` for implementation details.

## Example Usage

**SaaS onboarding:**
```
"Optimize activation for AnalyticsPro. First value moment is when
user sees their first dashboard with real data. Currently takes
15 minutes. Compare to Mixpanel and Amplitude."
```

**AI tool:**
```
"Audit onboarding for DesignAI at designai.com. First value is
first design generated. We're at 40% activation rate. How do we
get to sub-60 second activation?"
```

**Marketplace:**
```
"Activation audit for TaskMarket. First value: Freelancer posts
first task OR client hires first freelancer. Currently 25%
activate. Compare to Upwork and Fiverr."
```

## Best Practices

1. **Define first value precisely** - Not "completes onboarding" but "achieves outcome"
2. **Map from user perspective** - New user, not power user timeline
3. **Be aggressive on elimination** - Most steps can be eliminated or delayed
4. **Design specific AI agents** - Not "AI helps" but exactly what agent does
5. **Test against 60-second bar honestly** - Most products can't hit it yet; be realistic
6. **Validate time estimates with real users** - Founder estimates are often 2-3x faster than reality
7. **Consider "first value" flexibility** - Redefine if inherent blockers exist

## Limitations

- Signup flows require account to fully experience (scraping captures documented flow)
- **Time estimates are often optimistic** - validate with real user observations
- AI agent feasibility depends on current tech (some gaps not solvable yet)
- Different personas may have different activation paths
- Product-heavy industries (fintech, healthcare) face regulatory constraints
- **Sub-60 second activation is rare** - many products have inherent time requirements

## Quality Checklist

- [ ] First value moment clearly defined (outcome, not activity)
- [ ] Every step from signup → first value mapped
- [ ] Each step classified with rationale (K/S/P/—)
- [ ] Time estimates realistic for new users
- [ ] AI interventions specific and technically feasible
- [ ] Redesigned flow honestly targets <60 sec (not aspirational)
- [ ] Implementation roadmap prioritized by impact

## About

**Bowling Alley Framework by:** Wes Bush, founder of ProductLed
**Learn more:** [productled.com/blog/user-onboarding-framework](https://productled.com/blog/user-onboarding-framework)
**Gap classification methodology (K/S/P) by:** Jenna Potter (systematic blocker identification)
**Skill created by:** Jenna Potter ([promptashell.com](https://promptashell.com))

---

*Achieve sub-60-second activation with AI-powered onboarding optimization.*
