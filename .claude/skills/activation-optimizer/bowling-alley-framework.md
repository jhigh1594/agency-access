# Bowling Alley Framework

The framework for frictionless activation by Wes Bush (ProductLed).

## Core Concept

The Bowling Alley Framework consists of two components that work together:

1. **Straight-Line Onboarding** - The minimum path to value
2. **Bumpers** - Guidance that keeps users on track

---

## Straight-Line Onboarding

**Goal:** Boil onboarding down to the absolute minimum steps needed to experience value.

### The Three Questions

For every step in your onboarding, ask:

#### 1. What steps can be eliminated?

Remove unnecessary friction:
- Unnecessary form fields
- Confirmation emails (defer or eliminate)
- Setup wizards
- Mandatory tutorials
- Profile completion requirements
- Terms of service checkboxes (make implicit)

**Example:** Linear doesn't ask for company info during signup. You can add it later.

#### 2. What steps can be delayed?

Move non-essential steps to after first value:
- Team invites
- Integration setup
- Advanced configuration
- Profile completion
- Payment (if possible for free trial)

**Example:** Figma lets you start designing immediately. You add team members later.

#### 3. What are mission-critical steps?

Keep only steps required to deliver first value:
- What's absolutely necessary to reach the "aha" moment?
- Everything else can be eliminated or delayed

**Example:** Google Analytics
- Mission-critical: Add tracking code to website
- Eliminate: Company info, team setup, profile completion
- Result: 2 steps instead of 10

### Straight-Line Template

```
Original onboarding: [X] steps, [Y] minutes
Mission-critical steps: [A] steps, [B] minutes
Eliminated steps: [C] steps
Delayed steps: [D] steps

New Straight-Line: [A] steps, [B] minutes
```

---

## Product Bumpers

In-product guidance to keep users on track.

### 1. Product Tours

**When to use:** Users have different goals/use cases

**Best practices:**
- Ask user's goal upfront: "What do you want to do?"
- Show relevant tour based on answer
- Don't force the tour; offer choice to skip
- Keep tours short (3-5 steps max)

**Example:** Wave Accounting asks "What do you want to do?" then shows relevant tour for invoicing, expense tracking, or payroll.

### 2. Checklists

**When to use:** Multiple steps required to reach value

**Best practices:**
- Translate Straight-Line steps into visible checklist
- Show progress clearly (X of Y complete)
- Clear next action highlighted
- Completing items feels rewarding
- Hide completed items to reduce clutter

**Example:** Slack's "Finish setting up your team" checklist shows remaining steps.

### 3. Empty States

**When to use:** User encounters a blank/empty view

**Best practices:**
- Never show empty dashboards
- Show "Get Started" prompts instead
- Guide first integration/action
- This is valuable real estate - use it!
- Show example/placeholder content if helpful

**Example:** Notion shows templates and getting started guides in empty workspaces.

### 4. Contextual Tooltips

**When to use:** Only two valid scenarios

**Valid uses:**
1. Educate on genuinely new concepts
2. Guide to the next step

**Anti-patterns (avoid):**
- Feature announcements ("New! Check this out!")
- Obvious tips ("Click here to click here")
- Whack-a-mole tours (tooltips popping up everywhere)

**Best practices:**
- One tooltip at a time
- Point to specific element
- Clear headline + brief explanation
- Easy to dismiss
- Never repeat for same user

---

## Conversational Bumpers

Behavior-triggered messages (email/in-app) that guide users.

### The Three Triggers

#### Trigger 1: Signup → Welcome Email

**Timing:** Immediately after signup

**Content:**
- Welcome + quick-win tip
- One action they can take right now
- Link directly to that action (not generic dashboard)
- No feature list or "getting started" guide

**Example:**
```
Subject: Here's your first win with [Product]

Hi [Name],

You're 30 seconds away from [first value].

Here's the quickest way to [achieve outcome]:
[Single action with direct link]

This takes most users less than a minute.

[Signature]
```

#### Trigger 2: Quick Win → Push Toward Desired Outcome

**Timing:** When user completes first action

**Content:**
- Celebrate the quick win
- Introduce next step toward bigger goal
- Create momentum

**Example:**
```
Subject: Nice work! Now let's [bigger outcome]

You just [completed quick win]. 🎉

Ready for the next step?

[Next action that moves toward desired outcome]

[Signature]
```

#### Trigger 3: Desired Outcome → Value Celebration

**Timing:** When user achieves first value moment

**Content:**
- Celebrate the achievement
- Show what's now possible
- Introduce next-level features

**Example:**
```
Subject: You did it! [Value achieved]

Congratulations! You just [achieved first value].

Here's what you can do now:
- [Capability 1]
- [Capability 2]
- [Capability 3]

Want to go further? [Next step]

[Signature]
```

### Conversational Bumper Principles

**Just-in-time, not just-in-case:**
- Triggered by behavior, not schedule
- Relevant to what user just did
- Timely for where they are

**One action per message:**
- Don't overwhelm with options
- Single call-to-action
- Clear next step

**Personal when possible:**
- Reference what they actually did
- Connect to their stated goal
- Use their data/context

---

## Implementation Checklist

### Straight-Line
- [ ] Listed all current onboarding steps
- [ ] Identified steps to eliminate
- [ ] Identified steps to delay
- [ ] Confirmed mission-critical steps only
- [ ] New flow is 2-5 steps maximum

### Product Bumpers
- [ ] Product tour for first-time users (if multiple use cases)
- [ ] Checklist showing mission-critical steps
- [ ] Empty states have "Get Started" prompts
- [ ] Tooltips only for new concepts or next steps

### Conversational Bumpers
- [ ] Welcome email with quick-win tip
- [ ] Quick-win follow-up pushing toward outcome
- [ ] Value-achieved celebration message
- [ ] All messages triggered by behavior, not schedule

---

*Source: Wes Bush, ProductLed - [productled.com/blog/user-onboarding-framework](https://productled.com/blog/user-onboarding-framework)*
