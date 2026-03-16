# Activation Optimizer Workflow

Detailed instructions for each phase of the activation optimization process.

## Phase 1: Research Onboarding (5 min)

### Step 1a: Define First Value Moment

Be specific. Not "sees dashboard" but "achieves outcome."

**Examples of well-defined first value moments:**
- Canva: First design exported
- Notion: First page with real content created
- Loom: First video recorded and shared
- Slack: First message sent in channel
- AuthHub: First platform connection authorized by client

**Prompt the user:**
"What is the specific outcome that means a user has experienced value? Not an activity (clicking a button) but an achievement (actual value received)."

### Step 1b: Scrape Onboarding Flow (if URL provided)

Use web scraping tools to capture the documented onboarding flow:

```
# Use Firecrawl CLI:
firecrawl scrape [signup URL] --only-main-content -o .firecrawl/signup.md

# Alternative: Use /browse command to navigate and capture
```

**Extract from the scrape:**
- Signup form fields
- Onboarding wizard steps
- Required configuration
- Tutorial/walkthrough requirements
- First action prompts

### Step 1c: Search for Tutorials/Complaints

Research external sources to identify friction points:

```
# Search for onboarding tutorials (proof of gaps)
firecrawl search "[product] getting started tutorial onboarding" --limit 5 -o .firecrawl/search-onboarding.json --json

# Search for complaints about setup
firecrawl search "[product] setup difficult confusing hard" --limit 5 -o .firecrawl/search-complaints.json --json
```

**Insight:** Tutorials = proof of activation gaps. If users need tutorials to complete onboarding, the onboarding has gaps.

---

## Phase 2: Map Activation Journey (6 min)

### Step 2a: List Every Step

From "user lands on signup page" to "user experiences first value"

**Include all steps:**
- Account creation (email, password, SSO)
- Email verification
- Profile/company info
- Onboarding wizard
- Configuration/settings
- Integrations
- Tutorials (if required)
- First action
- Value confirmation

**Format as a table:**

| Step # | Step Name | Description |
|--------|-----------|-------------|
| 1 | Landing | User lands on signup page |
| 2 | Email Entry | User enters email address |
| 3 | Password Setup | User creates password |
| ... | ... | ... |

### Step 2b: Classify Each Step

Mark each step as one of:
- **K** (Knowledge Gap) - User must understand something to proceed
- **S** (Skill Gap) - User must execute something well
- **P** (Product Gap) - User must configure/setup something
- **—** (No Gap) - Frictionless, necessary step

**Add classification column:**

| Step # | Step Name | Description | Gap Type |
|--------|-----------|-------------|----------|
| 1 | Landing | User lands on signup page | — |
| 2 | Email Entry | User enters email address | — |
| 3 | Choose Plan | User must understand plan differences | K |
| 4 | Configure Workspace | User must set up workspace settings | P |
| ... | ... | ... | ... |

### Step 2c: Estimate Time Per Step

From a **new user perspective** (not expert):

| Time Category | Duration | Examples |
|---------------|----------|----------|
| Instant | <5 sec | Clicking a button, entering email |
| Quick | 5-30 sec | Filling a short form, selecting from dropdown |
| Moderate | 30 sec - 2 min | Reading instructions, making a decision |
| Slow | 2-10 min | Configuration, data entry, learning |
| Blocking | 10+ min | Complex setup, external dependencies |

**Add time estimate column:**

| Step # | Step Name | Gap Type | Time Estimate |
|--------|-----------|----------|---------------|
| 1 | Landing | — | Instant |
| 2 | Email Entry | — | Quick |
| 3 | Choose Plan | K | Moderate |
| 4 | Configure Workspace | P | Slow |
| ... | ... | ... | ... |

### Step 2d: Calculate Current TTV

Sum all step times to get current time-to-value.

**Time conversion:**
- Instant = 3 sec
- Quick = 15 sec
- Moderate = 60 sec
- Slow = 5 min
- Blocking = 15 min

**Example calculation:**
```
Instant steps: 5 × 3 sec = 15 sec
Quick steps: 4 × 15 sec = 60 sec
Moderate steps: 3 × 60 sec = 180 sec
Slow steps: 2 × 5 min = 600 sec
Blocking steps: 1 × 15 min = 900 sec

Total: 15 + 60 + 180 + 600 + 900 = 1755 sec = ~29 min
```

---

## Phase 3: Design AI Interventions (8 min)

For each gap, design a specific AI agent intervention.

### Knowledge Gap Agents

**Principle:** Agent makes the decision, user describes goal.

| Gap | Agent Intervention | User Effort |
|-----|-------------------|-------------|
| User must choose project type | Agent analyzes stated goal, selects right type | Describes what they're building |
| User must understand permissions | Agent sets up role-based access based on team size | Confirms team structure |
| User must learn terminology | Agent translates user language to product terms | Uses natural language |

### Skill Gap Agents

**Principle:** Agent performs the task, user reviews and approves.

| Gap | Agent Intervention | User Effort |
|-----|-------------------|-------------|
| User must design layout | Agent generates layout based on data type | Reviews and approves |
| User must write formulas | Agent creates formulas based on described calculation | Confirms output |
| User must create content | Agent drafts content based on topic/audience | Edits as needed |

### Product Gap Agents

**Principle:** Agent handles configuration, user confirms.

| Gap | Agent Intervention | User Effort |
|-----|-------------------|-------------|
| User must configure integrations | Agent detects tech stack, pre-configures | Confirms connections |
| User must import data | Agent maps and imports from detected sources | Reviews import |
| User must select templates | Agent recommends based on stated goals | Chooses from 2-3 options |

---

## Phase 4: Apply Bowling Alley (6 min)

### Step 4a: Build Straight-Line

Apply the three questions to each step:

1. **Can this step be eliminated?**
   - Unnecessary form fields → Remove
   - Confirmation emails → Remove or defer
   - Setup wizards → Remove, make intelligent defaults

2. **Can this step be delayed?**
   - Team setup → After first value
   - Advanced settings → Contextual, when needed
   - Profile completion → Progressive profiling

3. **Is this step mission-critical?**
   - Only steps required for first value stay
   - Target: 2-5 steps maximum

**Create Before/After comparison:**

| Original Steps | New Flow | Status |
|---------------|----------|--------|
| 1. Sign up | 1. Sign up (streamlined) | Kept |
| 2. Email verify | — | Eliminated (deferred) |
| 3. Profile info | — | Delayed |
| 4. Choose plan | AI: Auto-select based on usage | AI-handled |
| 5. Configure | AI: Smart defaults | AI-handled |
| 6. Tutorial | — | Eliminated |
| 7. First action | 2. First action (guided) | Kept |

### Step 4b: Add Product Bumpers

**Product Tours:**
- Ask user's goal upfront
- Show relevant tour based on goal
- Don't force; offer choice

**Checklists:**
- Translate mission-critical steps into visible checklist
- Show progress
- Clear next action
- Motivates completion

**Empty States:**
- Never show empty dashboards
- Show "Get Started" prompts instead
- Guide first integration/action
- Most valuable real estate in product

**Contextual Tooltips:**
- Only for genuinely new concepts
- Only to guide to next step
- Don't overuse (avoid whack-a-mole)

### Step 4c: Add Conversational Bumpers

**Behavior-triggered messages:**

| Trigger | Message | Purpose |
|---------|---------|---------|
| Signup | Welcome email with quick-win tip | Immediate value |
| Quick Win | Follow-up pushing toward desired outcome | Momentum |
| Desired Outcome | Value-achieved celebration, what's next | Retention |

**Key:** Just-in-time (based on behavior), not just-in-case (scheduled drip)

---

## Phase 5: Generate Report (10 min)

Create comprehensive Activation Gap Report with:

### 1. Executive Summary

```
# Activation Gap Report: [Product Name]

## Executive Summary
- Current TTV: [X minutes]
- Target TTV: <60 seconds
- Gap Count: [X] gaps identified
  - Knowledge: [X]
  - Skill: [X]
  - Product: [X]
- Instant Activation Score: [X]/100
- Estimated TTV with AI agents: [X seconds]
```

### 2. Current Activation Journey

Full table with all steps, classifications, and time estimates.

### 3. Gap Analysis

Detailed breakdown of each gap type with:
- Specific gaps identified
- Impact on TTV
- User frustration level

### 4. AI Agent Redesign

For each gap:
- Current state (what user must do)
- AI agent intervention
- New user effort
- Time saved

### 5. Redesigned Activation Flow

Before/after comparison with new step count and TTV.

### 6. Bowling Alley Implementation

Specific recommendations for:
- Straight-Line onboarding steps
- Product Bumpers to implement
- Conversational Bumpers to implement

### 7. Competitive Benchmark

If competitor URLs provided:
- Competitor TTV estimates
- Gap comparison
- Competitive advantages/weaknesses

### 8. Implementation Roadmap

Prioritized list of changes by impact:
1. [Highest impact change]
2. [Second highest]
3. ...

---

*Use this workflow to systematically optimize any product's activation flow.*
