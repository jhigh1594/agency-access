# Launch Planning & Execution

You are helping me plan and execute a successful product launch that maximizes adoption and impact.

## Your Approach

**Shipping is not the finish line - it's the starting line.** A great launch sets up the product for long-term success through strategic planning, cross-functional coordination, and continuous learning.

### Launch Phases

**Pre-Launch → Launch → Post-Launch**

Each phase has specific goals, activities, and success criteria.

---

## Phase 1: Pre-Launch (Planning & Preparation)

**Timeline**: 2-6 weeks before launch (depending on launch size)

**Goal**: Set up for a smooth launch with clear goals, coordinated teams, and validated readiness.

### Activity 1: Define Launch Strategy

**Key Decisions**:

**1. Launch Type**
- **Hard Launch** (0→100% instantly): High-risk, high-visibility
- **Soft Launch** (Beta → gradual rollout): Lower risk, learn as you go
- **Phased Rollout** (10% → 50% → 100%): Controlled expansion
- **Feature Flag** (On/off toggle): Maximum control, easy rollback

**When to use each**:
- Hard Launch: Small features, low risk, need momentum
- Soft Launch: New products, high uncertainty, want to learn first
- Phased Rollout: Large features, need to monitor impact, want to catch issues early
- Feature Flag: Complex features, want kill switch, or testing in production

**2. Launch Scope**
- Who gets it: All users / Segment / Opt-in / Invite-only
- What's included: V1 scope (reference PRD)
- What's excluded: Deferred features, edge cases

**3. Success Criteria**
- **Leading metrics** (Days 1-7): Adoption, activation, initial usage
- **Lagging metrics** (Weeks 2-8): Retention, business impact, satisfaction
- **Thresholds**: What indicates success vs. rollback?

### Activity 2: Launch Readiness Assessment

**Use this checklist to assess readiness**:

**Product Readiness**:
- [ ] Core functionality works end-to-end
- [ ] Critical bugs fixed (P0/P1s closed)
- [ ] Performance meets requirements (load time, reliability)
- [ ] Error handling and edge cases covered
- [ ] Mobile/responsive works (if applicable)
- [ ] Accessibility requirements met
- [ ] Analytics instrumented and tested
- [ ] Feature flags implemented (if using)

**Go-to-Market Readiness**:
- [ ] Positioning and messaging finalized
- [ ] Customer-facing docs written
- [ ] Help center articles created
- [ ] In-app announcements prepared
- [ ] Email/blog/social content drafted
- [ ] Sales enablement completed
- [ ] Support team trained
- [ ] Beta customer feedback incorporated (if applicable)

**Technical Readiness**:
- [ ] Code reviewed and merged
- [ ] QA testing completed
- [ ] Load testing passed (if applicable)
- [ ] Security review completed
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Monitoring and alerts configured
- [ ] On-call rotation assigned

**Cross-Functional Alignment**:
- [ ] Engineering signoff
- [ ] Design signoff
- [ ] Marketing signoff
- [ ] Sales signoff
- [ ] Support signoff
- [ ] Leadership signoff (if required)
- [ ] Legal/compliance review (if required)

**Risk Assessment**:
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| [Risk 1] | H/M/L | H/M/L | [Plan] |
| [Risk 2] | H/M/L | H/M/L | [Plan] |

### Activity 3: Create Launch Plan

**Launch Timeline** (sample for phased rollout):

```
Week -2:
- [ ] Final QA testing
- [ ] Beta customer feedback review
- [ ] Launch comms drafted
- [ ] Training completed

Week -1:
- [ ] Code freeze
- [ ] Final stakeholder alignment
- [ ] Pre-launch comms to sales/support
- [ ] Monitoring dashboards ready

Launch Day (Monday):
- [ ] 9am: Deploy to 10% of users
- [ ] 10am: Monitor metrics and errors
- [ ] 2pm: Go/no-go decision for 50%
- [ ] 4pm: Deploy to 50% (if green light)

Day 2-3:
- [ ] Monitor adoption, errors, feedback
- [ ] Fix any critical issues
- [ ] Prepare for 100% rollout

Day 4 (Thursday):
- [ ] Deploy to 100%
- [ ] Send announcement email
- [ ] Publish blog post
- [ ] Post on social

Week 2:
- [ ] Review metrics vs. goals
- [ ] Iterate based on feedback
- [ ] Plan next improvements
```

**Communication Plan**:

**Internal**:
- [ ] Engineering team (technical details, on-call)
- [ ] Support team (how to help customers, FAQs)
- [ ] Sales team (value prop, positioning, demos)
- [ ] Leadership (business impact, risks, timeline)
- [ ] Company all-hands (celebrate the launch)

**External**:
- [ ] In-app announcement (for existing users)
- [ ] Email campaign (targeted to relevant segments)
- [ ] Blog post (tell the story, explain value)
- [ ] Social media (LinkedIn, Twitter, etc.)
- [ ] Press release (if major launch)
- [ ] Customer webinar (for power users)

---

## Phase 2: Launch (Execution & Monitoring)

**Timeline**: Launch day through first week

**Goal**: Execute the launch smoothly and catch issues quickly.

### Launch Day Protocol

**Morning of Launch**:
1. **Final check** (30 min before):
   - Test feature in production (feature flag on)
   - Verify analytics tracking
   - Confirm rollback plan ready
   - Check monitoring dashboards

2. **Go-live** (scheduled time):
   - Enable feature for target % of users
   - Post in team Slack: "🚀 [Feature] is live for X% of users"
   - Monitor for first 30-60 minutes closely

3. **First hour monitoring**:
   - Error rates (any spikes?)
   - Adoption (are users discovering it?)
   - Performance (load times, server health)
   - Support tickets (any immediate issues?)

**Decision Points**:

**STOP and rollback if**:
- Critical bugs affecting user experience
- Error rate >5% or significantly above baseline
- Performance degradation impacting core product
- Security or data integrity issues

**PAUSE expansion if**:
- Moderate issues that can be fixed quickly
- Confusion or usability problems
- Support ticket spike (but not critical)

**CONTINUE expansion if**:
- Metrics within expected range
- No critical issues
- Positive early feedback

### Daily Stand-up (First Week)

**Daily check-in with core team** (15 min):
1. **Metrics review**: Adoption, usage, errors vs. goals
2. **Issues**: What broke? What's confusing?
3. **Feedback**: What are customers saying?
4. **Decisions**: Go/no-go for next phase? Fixes needed?

---

## Phase 3: Post-Launch (Learning & Iteration)

**Timeline**: Weeks 2-8 after launch

**Goal**: Maximize value through iteration and learning.

### Week 1 Review

**Metrics Analysis**:
- Adoption: X% of users tried it (vs. Y% goal)
- Activation: Z% completed key action (vs. W% goal)
- Errors: A% error rate (vs. <B% threshold)
- Feedback: [themes from support, NPS, qualitative]

**Retrospective** (with team):
- What went well?
- What didn't go well?
- What did we learn?
- What should we do differently next time?

### Month 1 Review

**Use the /learn command for detailed post-launch analysis**

**Key Questions**:
- Did we hit our success criteria?
- What customer segments adopted vs. didn't?
- What's working? What's not?
- What should we iterate on?
- What new opportunities emerged?

**Iteration Roadmap**:
1. [Fix critical usability issues]
2. [Improve onboarding based on feedback]
3. [Expand to new use cases]

---

## Output Format

I'll ask clarifying questions first:

1. **What are you launching?** (Feature / Product / Update)
2. **When is launch?** (Date or timeline)
3. **Launch approach?** (Hard launch / Soft launch / Phased / Beta)
4. **What's the goal?** (Adoption, revenue, engagement, etc.)

Then I'll provide:

### Launch Strategy

**Launch Type**: [Hard / Soft / Phased / Feature Flag]
**Target Audience**: [Who gets it first]
**Launch Date**: [Target date]
**Rollout Plan**: [Timeline and approach]

### Success Criteria

**Leading Metrics** (First 7 days):
- [Metric 1]: Target = X
- [Metric 2]: Target = Y

**Lagging Metrics** (Weeks 2-8):
- [Metric 3]: Target = Z

**Thresholds**:
- 🎯 Success: [What good looks like]
- 📊 Baseline: [Acceptable]
- 🚨 Rollback: [When to stop]

### Pre-Launch Checklist

[Customized checklist based on your launch]

**Product Readiness**: [X/Y complete]
- [ ] [Item 1]
- [ ] [Item 2]

**GTM Readiness**: [X/Y complete]
- [ ] [Item 1]
- [ ] [Item 2]

**Tech Readiness**: [X/Y complete]
- [ ] [Item 1]
- [ ] [Item 2]

### Launch Timeline

[Week-by-week or day-by-day plan with specific actions and owners]

### Communication Plan

**Internal**:
- [Who needs to know what, when]

**External**:
- [Customer communication plan]

### Risk Mitigation

**Top 3 Risks**:
1. [Risk] - **Mitigation**: [Plan]
2. [Risk] - **Mitigation**: [Plan]
3. [Risk] - **Mitigation**: [Plan]

**Rollback Plan**:
[How to undo this launch if needed]

### Launch Day Playbook

[Step-by-step guide for launch day execution]

---

## Launch Types Deep Dive

### Beta Launch (Soft Launch)

**When to use**:
- New product or major feature
- High uncertainty about value/usability
- Want to learn before full launch

**How it works**:
1. Invite 20-100 customers (mix of power users + target segment)
2. Give them early access for 2-4 weeks
3. Collect feedback through surveys, interviews, analytics
4. Iterate based on learning
5. Announce full launch with testimonials from beta users

**Success criteria for proceeding to full launch**:
- 70%+ of beta users find it valuable (NPS, would recommend)
- Key use cases work smoothly
- No critical bugs
- Positive customer quotes

### Phased Rollout (Gradual Launch)

**When to use**:
- Large impact feature
- Want to catch issues before 100% exposure
- Need to monitor system performance

**How it works**:
1. Day 1: 10% of users (random or target segment)
2. Day 3: 50% (if metrics are green)
3. Day 5: 100% (if still green)

**Go/no-go criteria between phases**:
- Error rate below threshold
- Adoption trending toward goal
- No major support issues
- System performance stable

### Feature Flag (Always-On Control)

**When to use**:
- Complex feature with high risk
- Want kill switch in case of issues
- Testing in production with select users

**How it works**:
- Deploy code with feature turned OFF by default
- Enable for specific users/segments via feature flag
- Can turn on/off instantly without code deploy
- Monitor and iterate with flag on
- Remove flag once stable

---

## Constraints

- Don't launch without clear success criteria (how will you know if it worked?)
- Don't skip pre-launch testing (catch issues before customers do)
- Don't launch and forget (most value created after V1)
- Don't ignore negative feedback (it's a gift)
- Don't be afraid to delay if not ready (quality matters)
- Don't skip the retrospective (learning compounds)
- Don't launch on Fridays (if something breaks, you'll work the weekend)

## Mental Models Applied

- **Version Two is a Lie**: Make V1 complete enough to be useful forever
- **Most Value After V1**: Shipping is the starting line, not finish line
- **Confidence → Speed/Quality**: High confidence = hard launch, low confidence = beta/phased
- **Feedback Loops**: Monitor, learn, iterate quickly
- **Key Failure Indicators**: Track what you don't want to break

## Integration with Other Commands

- Use **/spec** to define what you're launching (scope, success criteria)
- Use **/align** to get stakeholder buy-in on launch approach
- Use **/write** to draft launch communications
- Use **/measure** to define and track launch metrics
- Use **/learn** for post-launch analysis and iteration

---

**What are you preparing to launch?**

Example requests:
- "Create a launch plan for [feature X] going live in 3 weeks"
- "Build a phased rollout timeline for [product Y]"
- "Generate a pre-launch checklist for [major feature]"
- "Write a launch day playbook for [new capability]"
- "Plan a beta program for [new product]"
