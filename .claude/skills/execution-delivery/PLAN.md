# Execution-Delivery Skill: Architecture & Design Plan

## Purpose
The execution-delivery skill enables **sustained, multi-turn execution management** for shipping products and driving outcomes over weeks/quarters.

## The Critical Gap This Fills

**Current AIPMOS Coverage:**
- Strategy: ✅ Excellent (strategic-thinking skill, /think, mental models)
- Discovery: ✅ Excellent (discovery skill, /research, /discover)
- Competition: ✅ Excellent (competitive-analysis skill, /compete)
- Communication: ✅ Good (/write, /narrative, /align)
- **Execution: ⚠️ WEAK** (Only /ship for launch, /measure, /learn - no sustained execution skill)

**Where PMs Actually Spend Time:**
- 10% Strategy → ✅ Well covered
- 15% Discovery → ✅ Well covered
- 5% Competitive → ✅ Well covered
- 20% Communication → ✅ Covered
- **50% Execution & Delivery → ⚠️ GAP**

## Why This Matters

**From user's principles:**
- "Best PMs get things done and run through walls" → Execution focus
- "Execution Bias: Ship to Learn" → Delivery is critical
- "Outcome Over Output: Measure Impact, Not Activity" → Execution with accountability

**Reality of PM work:**
- Strategy sessions: 2-3 hours/week
- Discovery research: 5-10 hours/week (during active research phases)
- Execution & delivery: 20-30 hours/week (EVERY week)

## How It's Different from Commands

| Aspect | /ship, /measure, /learn | execution-delivery Skill |
|--------|------------------------|-------------------------|
| **Duration** | Single-turn (15-30 min) | Ongoing (weeks/quarters) |
| **Scope** | Specific events (launch) | Sustained execution |
| **Activities** | Plan a launch | Manage roadmap, sprints, unblocking |
| **Iteration** | One-time | Weekly/daily check-ins |
| **Output** | Launch plan, metrics | Shipped features, velocity, outcomes |
| **Use Case** | Specific milestone | Day-to-day PM execution |

## When to Use execution-delivery Skill

**Use this skill when:**
- Managing multi-quarter roadmap execution
- Weekly sprint planning and backlog grooming
- Ongoing unblocking and problem-solving
- Tracking progress and adjusting course
- Improving team velocity and shipping cadence
- Managing scope creep and timeline pressure
- Building engineering partnership over time

**Use commands when:**
- Planning a specific launch (/ship)
- Defining metrics (/measure)
- Post-launch retrospective (/learn)

## Skill Architecture

### Phase 1: Roadmap & Execution Planning (Initial session, 45-60 min)
**Goal:** Set up execution framework for the quarter/half

**Activities:**
1. **Roadmap Review**
   - What are we committed to shipping?
   - What are the key milestones and dates?
   - What dependencies exist?
   - What could go wrong?

2. **Execution Structure**
   - Sprint cadence (1-week, 2-week, or custom)
   - Planning rituals (sprint planning, backlog grooming, retrospectives)
   - Tracking approach (burndown, velocity, milestones)
   - Communication rhythm (standups, updates, demos)

3. **Success Criteria**
   - What does "on track" look like?
   - What metrics indicate velocity? (story points/week, features shipped/month)
   - What are our quality standards? (bug rate, performance, tech debt ratio)
   - What are the non-negotiables? (dates, scope, quality)

4. **Risk Identification**
   - Technical risks (feasibility, complexity, unknowns)
   - Resource risks (capacity, skills, dependencies)
   - Scope risks (creep, under-specification)
   - External risks (dependencies on other teams, market timing)

**Output:** Execution plan for the quarter with milestones, cadence, success criteria

---

### Phase 2: Sprint Planning Support (Weekly/Bi-weekly, ongoing)
**Goal:** Support effective sprint planning and backlog prioritization

**Activities:**

#### **Pre-Sprint Planning (30 min before sprint planning)**
- Review backlog readiness (are stories well-defined?)
- Identify priorities for next sprint (based on roadmap)
- Highlight blockers or dependencies
- Suggest what to pull into sprint vs. defer

#### **Sprint Planning Facilitation**
- Help articulate sprint goal (what's the outcome?)
- Guide story estimation (complexity, unknowns, dependencies)
- Identify risks and mitigations
- Ensure capacity vs. commitment alignment
- Define "done" criteria for key stories

#### **Backlog Grooming Support (Ongoing)**
- Help refine upcoming stories
- Break down epics into shippable chunks
- Identify missing acceptance criteria
- Flag under-specified stories
- Prioritize based on value, risk, dependencies

**Capabilities:**
- Can **Read** sprint planning docs, backlogs, story descriptions
- Can **Grep** across issues to find patterns (common blockers, recurring themes)
- Help estimate effort vs. value trade-offs
- Apply prioritization frameworks (RICE, ICE, Value/Effort)

**Output:** Well-prioritized sprint with clear goals and realistic commitments

---

### Phase 3: Daily/Weekly Execution Support (Ongoing)
**Goal:** Unblock the team, track progress, maintain velocity

**Activities:**

#### **Progress Tracking**
- Are we on track to hit sprint goals?
- What's completed vs. in-progress vs. blocked?
- Is velocity trending up, stable, or declining?
- Are we accumulating tech debt?

#### **Unblocking**
- What's blocking the team right now?
- Who can help unblock? (escalation, resources, decisions)
- What decisions need to be made to unblock?
- What dependencies need to be resolved?

**Types of Blocks:**
- **Technical blockers:** Architecture decisions, technical unknowns, complex bugs
- **Resource blockers:** Capacity constraints, skill gaps, dependencies
- **Decision blockers:** Unclear requirements, conflicting priorities, stakeholder decisions
- **External blockers:** Dependencies on other teams, vendor issues

**Unblocking Playbook:**
- Identify root cause (what's really blocking?)
- Assess urgency (does this block immediate work or future work?)
- Determine owner (who can resolve this?)
- Escalate if needed (when to involve leadership)
- Provide alternatives (can we work around this?)

#### **Scope Management**
- Is scope creeping? (new requirements mid-sprint)
- Can we defer scope to maintain timeline?
- What's the minimum shippable increment?
- Trade-off discussions (scope vs. quality vs. timeline)

#### **Communication & Alignment**
- Stakeholder updates (weekly/bi-weekly progress reports)
- Risk escalation (when to raise red flags)
- Team morale (are we energized or burning out?)
- Celebrating wins (shipped features, milestones hit)

**Capabilities:**
- Can **Read** sprint boards, progress tracking docs
- Can **Grep** for blockers across sprint notes
- Help draft stakeholder updates
- Suggest course corrections

**Output:** Maintained velocity, unblocked team, stakeholder confidence

---

### Phase 4: Retrospectives & Continuous Improvement (End of sprint/quarter)
**Goal:** Learn from execution and improve process

**Activities:**

#### **Sprint Retrospective**
- What went well? (celebrate and reinforce)
- What didn't go well? (identify problems)
- What should we change? (actionable improvements)

**Retrospective Themes:**
- **Velocity:** Are we shipping at a sustainable pace?
- **Quality:** Are we maintaining quality standards?
- **Process:** Are our ceremonies effective or wasteful?
- **Collaboration:** Is cross-functional partnership working?
- **Scope:** Are we managing scope well?

#### **Metrics Review**
- Velocity trends (are we getting faster or slower?)
- Quality metrics (bug rates, production incidents, tech debt)
- Cycle time (idea → shipped)
- Team satisfaction (morale, burnout signals)

#### **Process Improvements**
- What rituals should we add/remove/change?
- What tooling would help?
- What skills do we need to develop?
- What dependencies can we eliminate?

**Frameworks Applied:**
- Retrospective formats (Start/Stop/Continue, 4Ls, Mad/Sad/Glad)
- Velocity analysis (trending, capacity planning)
- Root cause analysis (5 Whys, Fishbone diagrams)

**Output:** Actionable improvements for next sprint/quarter

---

## Reference Materials Included

### 1. Sprint Planning Template

```markdown
# Sprint [Number] Planning

## Sprint Goal
**What are we trying to achieve this sprint?**
[One-sentence outcome, not list of tasks]

## Sprint Duration
- Start: [Date]
- End: [Date]
- Sprint Review: [Date/Time]
- Retrospective: [Date/Time]

## Team Capacity
- [Team Member 1]: [X points/hours available]
- [Team Member 2]: [X points/hours available]
- Total Capacity: [Total points/hours]
- Buffer (20% for unexpected): [Buffer amount]

## Stories In Sprint

### High Priority (Must Ship)
- [ ] [Story 1] - [Points] - **Owner:** [Name] - **Done Criteria:** [Definition]
- [ ] [Story 2] - [Points] - **Owner:** [Name] - **Done Criteria:** [Definition]

### Medium Priority (Should Ship)
- [ ] [Story 3] - [Points] - **Owner:** [Name] - **Done Criteria:** [Definition]

### Stretch (Nice to Have)
- [ ] [Story 4] - [Points] - **Owner:** [Name] - **Done Criteria:** [Definition]

**Total Committed:** [X points] vs. Capacity [Y points]

## Risks & Dependencies
| Risk/Dependency | Impact | Mitigation |
|-----------------|--------|------------|
| [Risk 1] | High/Med/Low | [How we'll address] |
| [Dependency on Team X] | High | [Contingency plan] |

## Definition of Done
- [ ] Code complete and reviewed
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] QA signed off
- [ ] Product review completed
- [ ] Ready for production deployment
```

### 2. Unblocking Playbook

```markdown
## Unblocking Playbook

### Step 1: Identify the Block
**What's blocked?** [Story/Epic/Milestone]
**Who's blocked?** [Team member or team]
**Since when?** [Date blocked]
**Impact:** [What can't happen because of this?]

### Step 2: Categorize the Block

**Technical Block:**
- Architecture decision needed
- Technical unknowns/complexity
- Dependency on another system
- Production bug blocking progress

**Resource Block:**
- Insufficient capacity
- Missing skills/expertise
- Dependency on other team
- Tooling/infrastructure limitations

**Decision Block:**
- Unclear requirements
- Conflicting priorities
- Stakeholder decision needed
- Trade-off discussion required

**External Block:**
- Vendor/partner dependency
- Legal/compliance review
- Budget/procurement process

### Step 3: Assess Urgency

**Critical** (Blocks immediate sprint work):
- Resolve within 24 hours
- Escalate immediately if needed

**High** (Blocks upcoming work):
- Resolve within 2-3 days
- Plan resolution path

**Medium** (Blocks future work):
- Resolve within 1-2 weeks
- Track and monitor

**Low** (Nice to resolve but not blocking):
- Address when capacity allows

### Step 4: Unblock

**For Technical Blocks:**
- [ ] Convene technical spike meeting
- [ ] Make architecture decision (use /decide)
- [ ] Prototype/POC to reduce unknowns
- [ ] Find alternative technical approach

**For Resource Blocks:**
- [ ] Reprioritize other work
- [ ] Bring in additional resources
- [ ] Adjust scope to fit capacity
- [ ] Escalate to leadership for headcount

**For Decision Blocks:**
- [ ] Clarify requirements with stakeholders
- [ ] Use decision framework (one-way vs two-way door)
- [ ] Make call with 70% certainty if two-way door
- [ ] Escalate to decision owner if needed

**For External Blocks:**
- [ ] Find temporary workaround
- [ ] Escalate through appropriate channels
- [ ] Adjust timeline to accommodate
- [ ] Identify alternative path forward

### Step 5: Communicate & Track

- [ ] Update team on unblock status
- [ ] Document decision/resolution
- [ ] Update sprint board/tracker
- [ ] Follow up to ensure resolution worked
```

### 3. Velocity Tracking & Analysis

```markdown
## Velocity Tracking

### Sprint Velocity (Points Completed per Sprint)

| Sprint | Planned | Completed | % Achievement | Notes |
|--------|---------|-----------|---------------|-------|
| Sprint 1 | 40 | 38 | 95% | Strong start |
| Sprint 2 | 42 | 35 | 83% | 2 stories carried over |
| Sprint 3 | 40 | 42 | 105% | Crushed it |
| Sprint 4 | 45 | 40 | 89% | Unexpected production issue |

**Average Velocity:** [X points/sprint]
**Trend:** ⬆️ Increasing / ➡️ Stable / ⬇️ Decreasing

### Analysis

**If velocity is declining:**
- Are we taking on too much?
- Is quality suffering (tech debt accumulating)?
- Are there persistent blockers?
- Is team morale/capacity changing?

**If velocity is increasing:**
- Are we getting better at estimation?
- Is team gelling and improving?
- Are we cutting corners on quality?

**If velocity is volatile:**
- Are sprint commitments realistic?
- Are there external disruptions?
- Do we need better estimation?

### Capacity Planning

**Team Capacity per Sprint:**
- Total capacity: [X hours/points]
- Buffer (20% for unexpected): [Y hours/points]
- Sustainable commitment: [Z hours/points]

**Capacity Factors:**
- Holidays/PTO: [Adjust capacity]
- Production support: [Allocate % of capacity]
- Tech debt work: [Allocate % of capacity]
- Innovation time: [Allocate % of capacity]
```

### 4. Stakeholder Update Template

```markdown
# [Product/Team] Update - [Date]

## BLUF (Bottom Line Up Front)
[One paragraph: Overall status, key accomplishments, any risks/asks]

## This Sprint/Week

### ✅ Shipped
- [Feature/Story 1] - [Brief description, impact]
- [Feature/Story 2] - [Brief description, impact]

### 🚧 In Progress
- [Feature/Story 3] - [Status, expected completion]
- [Feature/Story 4] - [Status, expected completion]

### 🎯 Next Sprint/Week
- [Planned work 1]
- [Planned work 2]

## Roadmap Progress

**Q[X] Goals:**
- Goal 1: ✅ Complete / 🟢 On Track / 🟡 At Risk / 🔴 Behind
- Goal 2: [Status]
- Goal 3: [Status]

**Milestones:**
- Milestone 1 ([Date]): [Status description]
- Milestone 2 ([Date]): [Status description]

## Metrics

**Key Metrics:**
- [Metric 1]: [Current] (Target: [Goal]) - [Trend: ⬆️/➡️/⬇️]
- [Metric 2]: [Current] (Target: [Goal]) - [Trend]

## Risks & Blockers

**🔴 Critical:**
- [Risk 1] - **Impact:** [What's at risk] - **Mitigation:** [What we're doing]

**🟡 Medium:**
- [Risk 2] - **Status:** [Being addressed by X]

## Asks / Decisions Needed
- [Decision 1] - **Owner:** [Who needs to decide] - **By:** [Date]
- [Resource request] - **Context:** [Why needed]

## Wins 🎉
- [Team accomplishment or milestone worth celebrating]
```

---

## Integration with AIPMOS Core Rules

- **PM Operating Principles:** Execution bias (ship to learn), ruthless prioritization, outcome over output
- **Decision Framework:** Fast two-way door decisions to unblock, documented decisions for clarity
- **Mental Models:** Time value of shipping, diminishing returns, version two is a lie (ship complete V1)
- **Frameworks as Tools:** Prioritization (RICE, Value/Effort), retrospective formats
- **Communication Standards:** Stakeholder updates (BLUF format, evidence-based, actionable)

---

## Tools the Skill Can Use

- **Read:** Sprint docs, roadmaps, progress tracking, retrospectives
- **Grep:** Search across sprint notes for patterns, blockers, themes
- **Write:** Draft stakeholder updates, retrospective notes, unblocking plans
- Can maintain ongoing execution context across weeks/quarters

---

## Deliverables

1. **Execution Plan** (Phase 1 output - quarterly)
2. **Sprint Plans** (Phase 2 output - weekly/bi-weekly)
3. **Unblocking Actions** (Phase 3 output - daily/weekly)
4. **Stakeholder Updates** (Phase 3 output - weekly)
5. **Retrospective Insights** (Phase 4 output - end of sprint/quarter)

---

## Success Criteria for This Skill

**A successful execution-delivery engagement produces:**
- ✅ Consistent velocity (predictable shipping cadence)
- ✅ Maintained quality (not sacrificing quality for speed)
- ✅ Unblocked team (minimal blockers, fast resolution)
- ✅ Stakeholder confidence (regular updates, transparency on risks)
- ✅ Shipped outcomes (features that drive metrics, not just activities)
- ✅ Improving process (retrospectives lead to actionable changes)
- ✅ Sustainable pace (not burning out the team)

**Time investment:**
- Initial execution planning: 45-60 min
- Sprint planning support: 30-60 min/sprint
- Weekly execution check-ins: 15-30 min/week
- Retrospectives: 30-45 min/sprint or quarter
- Total: 2-4 hours/week of ongoing execution support

**ROI:** Maintained velocity, shipped outcomes, stakeholder confidence, team morale
