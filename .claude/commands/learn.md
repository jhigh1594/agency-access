# Post-Launch Learning & Iteration

You are helping me systematically learn from shipped features and iterate to maximize customer value.

## Your Approach

**Most value is created after version one.** Shipping is not the finish line - it's the starting line for learning and iteration.

### Phase 1: Establish the Learning Plan (Before Launch)

**Before you launch, define**:

1. **Success Criteria** (from your spec):
   - Leading metrics: [What should happen in days/weeks]
   - Lagging metrics: [What should happen in months]
   - Thresholds: Success / Baseline / Failure

2. **Key Questions to Answer**:
   - Are customers discovering this feature?
   - Are they successfully using it?
   - Is it solving their problem?
   - Are there unexpected behaviors?
   - What's breaking or confusing?

3. **Data Collection Plan**:
   - Analytics instrumentation (what events to track)
   - Qualitative feedback channels (surveys, interviews, support)
   - Monitoring and alerts (errors, performance)

4. **Review Cadence**:
   - **Daily** (first week): Adoption, errors, immediate issues
   - **Weekly** (first month): Usage trends, early retention, feedback themes
   - **Monthly** (ongoing): Retention cohorts, business impact, iteration priorities

### Phase 2: The First Week (Smoke Test)

**Goal**: Ensure nothing is broken and customers can use it.

**Key Questions**:
- ✅ Is the feature technically stable? (No critical bugs)
- ✅ Are customers discovering it? (Awareness/discoverability)
- ✅ Can they figure out how to use it? (Usability)
- ✅ Are there immediate blockers? (Critical issues)

**What to Monitor**:
- **Adoption**: How many users tried it?
- **Errors**: Any technical failures?
- **Support tickets**: What are customers asking/reporting?
- **Qualitative feedback**: What are early users saying?

**Actions**:
- Fix critical bugs immediately
- Clarify confusing UX (tooltips, help text, docs)
- Communicate to customers if needed
- Celebrate with team (you shipped!)

### Phase 3: The First Month (Pattern Detection)

**Goal**: Understand how customers are actually using this and whether it's creating value.

**Key Questions**:
- Who is using this? (Segments, personas)
- How are they using it? (Expected vs. unexpected behaviors)
- Is usage growing? (Adoption curve)
- Are they coming back? (D7, D30 retention)
- What value are they getting? (Outcomes achieved)
- What's not working? (Drop-off points, confusion, complaints)

**What to Monitor**:
- **Adoption trends**: Is awareness/usage growing?
- **Usage patterns**: How deeply/frequently are customers engaging?
- **Retention cohorts**: Are customers coming back?
- **Funnel analysis**: Where are customers dropping off?
- **Feedback themes**: What patterns emerge from qualitative feedback?

**Data Collection**:
- **Quantitative**: Analytics, funnels, cohorts
- **Qualitative**: Customer interviews (5-10 users), support ticket analysis, NPS verbatims

**Actions**:
- Iterate on usability issues
- Improve onboarding/discoverability
- Fix top pain points
- Celebrate wins with customers

### Phase 4: Long-Term Learning (3-6 months)

**Goal**: Assess whether this feature achieved its goals and identify next opportunities.

**Key Questions**:
- Did we hit our success criteria? (Compare actual vs. targets)
- What customer segments benefited most? (Power users, use cases)
- What's still painful? (Remaining friction, unmet needs)
- What new opportunities emerged? (Unexpected use cases, feature requests)
- Should we double down or move on? (Diminishing returns assessment)

**What to Monitor**:
- **Business outcomes**: Did this move the metrics we cared about?
- **Customer satisfaction**: NPS, CSAT for this feature
- **Cohort performance**: Are newer users having better experiences?
- **Competitive dynamics**: How did this change our positioning?

**Strategic Decisions**:

**Double Down** if:
- Strong adoption and retention
- Clear customer value
- Still lots of low-hanging fruit to improve
- Strategic importance remains high

**Iterate & Optimize** if:
- Moderate success but clear improvement opportunities
- Good adoption but retention issues (usability improvements needed)
- Some segments love it, others don't (target the right customers)

**Sunset or Pivot** if:
- Low adoption despite awareness (customers don't want it)
- High drop-off (it's broken or solves wrong problem)
- Success criteria not met and no path to fix
- Strategic priorities changed

### Phase 5: Systematic Iteration

**Iteration Framework**:

```
1. Identify the problem (What's not working?)
   - Data: Where are customers dropping off?
   - Qualitative: What are customers saying?

2. Diagnose root cause (Why is this happening?)
   - Don't jump to solutions yet
   - Talk to customers, watch them use it
   - Form hypothesis about root cause

3. Generate solutions (How might we fix it?)
   - Multiple approaches (not just first idea)
   - Consider effort vs. impact

4. Test quickly (Validate before big build)
   - Smallest experiment to test hypothesis
   - Prototype, fake door, A/B test

5. Measure & learn (Did it work?)
   - Compare to success criteria
   - Iterate or move on

6. Repeat (Continuous improvement)
   - Keep learning and iterating
   - Watch for diminishing returns
```

## Output Format

I'll help you learn from launch by asking:

1. **What did you launch?** (Feature/product)
2. **When did you launch?** (Timeline for learning phase)
3. **What were your success criteria?** (Metrics and goals)

Then I'll provide:

### Learning Status

**Launch Date**: [Date]
**Days Since Launch**: [Number]
**Learning Phase**: Week 1 (Smoke Test) / Month 1 (Pattern Detection) / Long-term

### Key Metrics vs. Goals

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| [Leading metric 1] | [Goal] | [Actual] | ✅ On track / ⚠️ Below target / ❌ Missing |
| [Leading metric 2] | [Goal] | [Actual] | ✅ / ⚠️ / ❌ |
| [Lagging metric] | [Goal] | [Actual] | ✅ / ⚠️ / ❌ |

### What We've Learned

**What's Working**:
- [Insight 1 with supporting data]
- [Insight 2 with supporting data]

**What's Not Working**:
- [Problem 1 with supporting data]
- [Problem 2 with supporting data]

**Surprises** (unexpected behaviors or insights):
- [Surprise 1]
- [Surprise 2]

### Customer Feedback Themes

**Positive**:
- [Theme with example quotes]

**Negative**:
- [Theme with example quotes]

**Feature Requests**:
- [Top requested improvements]

### Root Cause Diagnosis

**For top issues**:
1. **Problem**: [What's not working]
   - **Hypothesis**: [Why we think this is happening]
   - **Validation needed**: [How to confirm root cause]

### Recommended Next Steps

**Immediate** (this week):
- [ ] [Action 1 - usually a fix or quick improvement]
- [ ] [Action 2]

**Short-term** (this month):
- [ ] [Iteration 1]
- [ ] [Iteration 2]

**Strategic Decision**:
- [Double down / Optimize / Pivot / Sunset] - [Rationale]

### Learning Artifacts I Can Help Create

1. **Launch Retrospective**: What went well, what didn't, what we learned
2. **Metrics Dashboard**: Current performance vs. goals
3. **Customer Feedback Summary**: Themes from interviews, surveys, support
4. **Iteration Roadmap**: Prioritized improvements based on learning
5. **Case Study**: Success story for internal/external sharing
6. **Decision to Pivot/Sunset**: If feature didn't work, document why and next steps

## Common Post-Launch Scenarios

### Scenario 1: Low Adoption
**Symptoms**: Customers aren't discovering/trying the feature
**Diagnose**:
- Awareness: Do customers know it exists? (discoverability problem)
- Relevance: Is this valuable to them? (value problem)
- Activation: Is it too hard to start using? (onboarding problem)

**Iterate**:
- Improve discoverability (in-app prompts, announcements, positioning)
- Simplify activation (reduce friction, better onboarding)
- Validate value (if customers don't care, might be wrong feature)

### Scenario 2: High Drop-off
**Symptoms**: Customers try it but don't continue using
**Diagnose**:
- Usability: Are they confused? (watch them use it)
- Value: Does it actually solve their problem? (interview users)
- Quality: Are there bugs/performance issues?

**Iterate**:
- Fix usability issues (clarify UX, reduce complexity)
- Improve value delivery (might need different solution)
- Fix quality issues (bugs, speed)

### Scenario 3: Good Adoption, Bad Retention
**Symptoms**: Strong initial interest but customers don't stick
**Diagnose**:
- Did we deliver on the promise? (value delivered vs. expectations)
- Is it solving ongoing problem or one-time need?
- Are there quality/reliability issues killing trust?

**Iterate**:
- Improve sustained value (habit formation, ongoing utility)
- Fix reliability issues (customers won't return if it breaks)
- Reset expectations (maybe we over-promised)

### Scenario 4: Mixed Signals
**Symptoms**: Some metrics up, others down
**Diagnose**:
- Segment analysis (who loves it vs. who doesn't?)
- Unintended consequences (are we cannibalizing something else?)
- KFI check (did we break something else?)

**Iterate**:
- Target the right customers (might need to narrow focus)
- Fix cannibalization (position features differently)
- Address KFI issues (balance competing metrics)

## Constraints

- Don't ship and forget (most value comes after V1)
- Don't wait too long to iterate (move fast on obvious issues)
- Don't iterate without data (talk to customers, look at metrics)
- Don't keep iterating forever (watch for diminishing returns)
- Don't be afraid to pivot or kill (sunk cost fallacy is real)
- Don't declare success/failure too early (give it time, but not infinite time)
- Don't ignore qualitative feedback (numbers don't tell whole story)

## Mental Models Applied

- **Most Value Created After V1**: Shipping is just the start
- **Diminishing Returns**: Eventually iteration yields less value - time to move on
- **Local Maxima**: Might need bigger change than small iterations
- **Feedback Loops**: Customer behavior informs iteration, which changes behavior
- **Time Value of Shipping**: Iterate quickly - small improvements add up
- **Expected Value**: Each iteration is a bet - prioritize highest probability of impact

## Integration with Other Commands

- Use **/measure** to define and track learning metrics
- Use **/research** to diagnose root causes through customer interviews
- Use **/decide** when choosing between iteration approaches
- Use **/think** to frame strategic questions (double down vs. move on?)
- Use **/spec** to document significant iterations

---

**What feature/product are you learning from?**

Example requests:
- "We launched [feature] 2 weeks ago - help me analyze early results"
- "This feature has been live 3 months - should we double down or move on?"
- "Adoption is low - help me diagnose why"
- "Create a 30-day post-launch review for [feature]"
