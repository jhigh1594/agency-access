# Gap Classification System

Every onboarding step falls into one of four categories. This classification helps identify the right AI agent intervention.

**Note:** The Knowledge/Skill/Product (K/S/P) gap classification system is a methodology designed for this skill to systematically identify activation blockers. The Bowling Alley Framework and 60-second activation standard are from ProductLed; the K/S/P taxonomy is created by this skill's author.

---

## Knowledge Gap (K)

**Definition:** What user must understand to proceed

User is blocked because they don't know something or can't make a decision without understanding concepts.

### Examples

| Gap | User's Question |
|-----|-----------------|
| Project type selection | "What's the difference between these project types?" |
| Permission model | "How do permissions work? What should I choose?" |
| Data structure | "What's a workspace vs. a project vs. a task?" |
| Plan selection | "Which plan is right for me?" |
| Integration choice | "Which integration should I set up first?" |

### AI Agent Solution

**Principle:** Agent makes the decision; user describes their goal.

| Instead of | Agent Does |
|------------|-----------|
| Teaching the user about project types | Agent analyzes user's stated goal and selects the right type |
| Explaining permission models | Agent sets up role-based access based on team structure |
| Defining terminology | Agent translates user's natural language to product terms |

### Implementation Pattern

```
User: "I want to track my marketing campaigns"

❌ Old: [Shows explanation of project types]
✅ New: Agent creates "Marketing Campaigns" project with relevant templates

User effort: Describes what they're building (not learning product concepts)
```

---

## Skill Gap (S)

**Definition:** What user must execute well

User is blocked because they lack the skills to complete the step successfully.

### Examples

| Gap | Skill Required |
|-----|----------------|
| Design creation | Visual design skills |
| Formula writing | Spreadsheet/programming skills |
| Data modeling | Database design skills |
| Content creation | Writing/creative skills |
| Report building | Analytical skills |

### AI Agent Solution

**Principle:** Agent performs the task; user reviews and approves.

| Instead of | Agent Does |
|------------|-----------|
| Requiring design skills | Agent generates design based on user preferences |
| Expecting formula knowledge | Agent creates formulas from described calculation |
| Demanding data modeling | Agent structures data based on user's described needs |

### Implementation Pattern

```
User: "I want a dashboard showing our sales by region"

❌ Old: [Shows tutorial on building dashboards]
✅ New: Agent generates dashboard with sales-by-region visualization

User effort: Reviews and approves (doesn't need dashboard-building skills)
```

---

## Product Gap (P)

**Definition:** What user must configure/setup

User is blocked because they need to configure the product, connect integrations, or make setup decisions.

### Examples

| Gap | Configuration Required |
|-----|----------------------|
| Integration setup | Connect to external services |
| Settings configuration | Choose preferences, defaults |
| Data import | Bring in existing data |
| Template selection | Choose starting point |
| Account linking | Connect multiple accounts |

### AI Agent Solution

**Principle:** Agent handles configuration with smart defaults; user confirms.

| Instead of | Agent Does |
|------------|-----------|
| Manual integration setup | Agent detects tech stack, pre-configures connections |
| Settings configuration | Agent applies intelligent defaults for 80% use case |
| Data import mapping | Agent auto-maps data from detected sources |

### Implementation Pattern

```
User: Signs up with company email

❌ Old: [Shows integration setup screen with 20 options]
✅ New: Agent detects: "We found your team uses Slack and Google Workspace.
        Connect now?" [One-click confirm]

User effort: Confirms connections (doesn't manually configure each one)
```

---

## No Gap (—)

**Definition:** Frictionless, necessary step

Step is required and causes minimal friction. No intervention needed.

### Examples

| Step | Why No Gap |
|------|------------|
| Enter email | Necessary, minimal effort |
| Create password | Necessary, quick to do |
| Click "Create" | Single action, instant |
| Verify with SSO | One click if already logged in |
| Name your project | Quick, personal decision |

### No Intervention Needed

These steps don't require AI agents. Focus optimization efforts on K/S/P gaps.

---

## Gap Identification Checklist

Use this checklist to classify each onboarding step:

### Knowledge Gap Indicators
- [ ] User needs to read documentation
- [ ] User asks "what's the difference between..."
- [ ] User needs to understand product concepts
- [ ] Decision requires product knowledge
- [ ] Tutorials exist for this step

### Skill Gap Indicators
- [ ] User needs design skills
- [ ] User needs technical/programming skills
- [ ] User needs writing/content skills
- [ ] Output quality depends on user expertise
- [ ] "Make it look good" is a common request

### Product Gap Indicators
- [ ] User must configure settings
- [ ] User must connect integrations
- [ ] User must import/migrate data
- [ ] User must select from many options
- [ ] Setup wizard exists for this

### No Gap Indicators
- [ ] Step is a single click/tap
- [ ] Step takes <5 seconds
- [ ] Step is universally understood
- [ ] No decision required
- [ ] No learning curve

---

## AI Agent Design Template

For each gap, specify the agent intervention:

```markdown
## Gap: [Name of the gap]

**Type:** K / S / P (circle one)

**Current State:**
- User must: [what they currently do]
- Time required: [estimated time]
- Frustration level: Low / Medium / High

**AI Agent Intervention:**
- Agent analyzes: [what input agent receives]
- Agent does: [specific action agent takes]
- Agent outputs: [what agent produces]

**New User Effort:**
- User provides: [minimal input needed]
- User reviews: [what they confirm/approve]
- Time required: [new estimated time]

**Time Saved:** [X seconds/minutes]
```

---

## Gap Prioritization

When you have multiple gaps, prioritize by:

1. **Impact on TTV** - How much time does this gap add?
2. **User frustration** - How painful is this gap?
3. **AI feasibility** - Can AI actually solve this?
4. **Implementation effort** - How hard to build the agent?

**Priority Matrix:**

| | High Impact | Low Impact |
|---|---|---|
| **High Frustration** | Fix First | Fix Third |
| **Low Frustration** | Fix Second | Fix Last |

---

*Use this classification system to systematically identify and address every activation blocker.*
