# AIPMOS Command Reference for Intent Detection

This guide helps AI assistants understand when to suggest specific AIPMOS commands based on user intent. Use this to match natural language requests to the most appropriate command.

## How to Use This Guide

1. **Analyze the user's intent**: What are they trying to accomplish?
2. **Match to command patterns**: Look for matching trigger phrases and intent descriptions
3. **Check negative patterns**: Verify it's NOT something better handled by a different command
4. **Suggest with confidence**: Only suggest when confidence is >70%

---

## Command Intent Reference

### /think
**User intent**: Strategic analysis, complex decisions, mental models

**When to suggest**:
- "I need to figure out..." (strategy, OKRs, positioning)
- "What's your strategy for..."
- "Should we do X or Y?"
- "Help me think through..."
- "Strategic analysis of..."
- "Figure out our Q1 OKRs"
- "Positioning for..."
- Complex decision framing

**NOT for**:
- Writing a spec document (use /spec)
- Making a specific decision (use /decide)
- Research interviews (use /discover)

---

### /synthesize
**User intent**: Pattern analysis across multiple data sources

**When to suggest**:
- "Find patterns in..."
- "Synthesize customer feedback"
- "Analyze these interviews/tickets"
- "What patterns do you see in..."
- "Consolidate these requests"
- "Cross-source analysis of..."
- "Pull together insights from multiple sources"

**NOT for**:
- Planning research (use /discover)
- Real-time prioritization/triage (use /prioritize)
- Single document analysis (read it directly)

---

### /spec
**User intent**: Create formal specifications, PRDs, documentation

**When to suggest**:
- "Write a spec for..."
- "Create a PRD for..."
- "Document this feature..."
- "Specification for..."
- "Write product requirements for..."
- "Create technical spec..."

**NOT for**:
- Strategic thinking (use /think first)
- Problem discovery (use /discover first)
- Quick documentation (use /write)

---

### /prioritize
**User intent**: Quick prioritization of prepared lists (5-15 min)

**When to suggest**:
- "Score these 5 features with RICE"
- "Rank my Q2 sprint"
- "ICE scoring for this list"
- "Prioritize these prepared items"
- Quick scoring with known framework
- Simple ranking decisions

**NOT for**:
- Raw feedback processing (use **prioritization-craft skill**)
- Stakeholder communication needed (use **prioritization-craft skill**)
- Complex triage needed (use **prioritization-craft skill**)
- Strategic decisions (use /think or /decide)

**Dual-Mode Note**: For complex prioritization requiring raw feedback processing, stakeholder communication, or strategic validation, use the **prioritization-craft skill** instead. The skill provides a 4-phase deep prioritization process (30-45 min) with triage, deduplication, categorization, multiple frameworks, and stakeholder communication packages.

---

### prioritization-craft (Skill)
**User intent**: Deep prioritization with stakeholder communication (30-45 min)

**When to suggest**:
- "Triage 50 customer requests"
- "Build roadmap with stakeholder buy-in"
- "Process feedback from multiple sources"
- "Need to say NO gracefully"
- Complex trade-offs requiring strategic validation
- Raw customer feedback (quotes, tickets, interviews)

**NOT for**:
- Quick scoring (use /prioritize command)
- Simple ranking (use /prioritize command)

---

### /refresh-memory
**User intent**: Update memory.md with session activity and git commits

**When to suggest**:
- "Update my memory file"
- "Record this session to memory"
- "Refresh memory with current activity"
- "Capture session progress"
- After completing a feature or milestone
- Before running /check-progress

**NOT for**:
- Checking what changed (use /check-progress)
- Viewing memory content (read the file directly)

---

### /decide
**User intent**: Make a specific choice between options

**When to suggest**:
- "Should we do X or Y?"
- "Help me decide between..."
- "Go/no-go decision for..."
- "Choose option A or B"
- "Make a decision on..."

**NOT for**:
- Strategic framing (use /think first)
- Prioritization (use /prioritize)
- Research validation (use /discover or /research)

---

### /discover
**User intent**: Problem exploration and customer research

**When to suggest**:
- "I need to understand the problem space"
- "Research customer needs for..."
- "Discovery for..."
- "Validate problem assumptions"
- "Customer research on..."
- "Explore the opportunity in..."

**NOT for**:
- Writing specs (use /spec after discovery)
- Detailed research planning (use /research)
- Synthesizing existing data (use /synthesize)

---

### /research
**User intent**: Execute specific research studies

**When to suggest**:
- "Create a research plan for..."
- "Design customer interviews for..."
- "Prototype testing for..."
- "Validate this assumption..."
- "Research methodology for..."

**NOT for**:
- Open-ended discovery (use /discover)
- Synthesizing findings (use /synthesize after research)

---

### /align
**User intent**: Get stakeholder buy-in and consensus

**When to suggest**:
- "Get buy-in from..."
- "Align stakeholders on..."
- "Influence leadership to..."
- "Manage objection from..."
- "Build consensus around..."
- "Prepare for stakeholder meeting"

**NOT for**:
- Just drafting communication (use /write)
- Making the decision yourself (use /decide)
- Technical analysis

---

### /write
**User intent**: Draft communication or documentation

**When to suggest**:
- "Draft an email to..."
- "Write executive summary for..."
- "Create announcement for..."
- "Draft customer communication..."
- "Write a blog post about..."
- "Stakeholder update on..."

**NOT for**:
- Strategic analysis (analyze first)
- Full PRD creation (use /spec)
- Technical specifications

---

### /measure
**User intent**: Define metrics and success criteria

**When to suggest**:
- "What metrics should I track for..."
- "Define success criteria for..."
- "How do we measure..."
- "KPIs for..."
- "Dashboard for..."
- "Metrics framework for..."

**NOT for**:
- Post-launch analysis (use /learn)
- Analyzing existing metrics (just analyze them)

---

### /compete
**User intent**: Competitive intelligence and analysis

**When to suggest**:
- "Analyze [competitor]"
- "Competitive analysis of..."
- "What are competitors doing?"
- "Market positioning vs..."
- "Competitive matrix for..."
- "Intelligence on [competitor]"

**NOT for**:
- Daily competitive briefs (use /daily-brief)
- Pricing research (use /price-intel)

---

### /daily-brief
**User intent**: Automated daily competitive intelligence summary

**When to suggest**:
- "Daily competitive briefing"
- "What's happening in our market?"
- "Competitive news summary"

**NOT for**:
- Deep competitive analysis (use /compete)
- General competitive questions

---

### /brainstorm
**User intent**: Tactical/pre-PRD brainstorming with expert persona perspectives

**When to suggest**:
- "How might we approach..."
- "I have an idea for..."
- "Help me brainstorm solutions for..."
- "Explore different angles on..."
- "What are some ways we could..."
- "Thinking through approaches to..."
- Pre-PRD exploration of product ideas
- Generating multiple solution concepts

**NOT for**:
- Strategic "should we do this" questions (use /think)
- Formal specification writing (use /spec)
- Customer research interviews (use /discover)
- Making a specific decision (use /decide)

---

### /learn
**User intent**: Post-launch analysis and iteration

**When to suggest**:
- "Post-launch review for..."
- "We shipped [feature] 2 weeks ago - how's it doing?"
- "Should we double down or pivot on..."
- "Analyze launch results for..."
- "Iteration planning for..."

**NOT for**:
- Launch planning (use /ship)
- Metrics definition (use /measure)

---

### /ship
**User intent**: Launch planning and execution

**When to suggest**:
- "Plan the launch for..."
- "Launch readiness for..."
- "Create a launch plan..."
- "Go-to-market strategy for..."
- "Phased rollout for..."

**NOT for**:
- Post-launch analysis (use /learn)
- Just writing announcements (use /write)

---

### /mockup
**User intent**: Create UI/UX mockups and designs

**When to suggest**:
- "Create a mockup for..."
- "Design the UI for..."
- "Wireframe for..."
- "Visual design of..."
- "Mockup generator for..."

**NOT for**:
- Full prototype with interactions (use /prototype)
- Technical implementation

---

### /narrative
**User intent**: Strategic storytelling and positioning

**When to suggest**:
- "Create a strategic narrative for..."
- "Positioning story for..."
- "Strategic messaging for..."
- "Narrative around..."

**NOT for**:
- General writing (use /write)
- Feature specs (use /spec)

---

### /onboard
**User intent**: New user onboarding and orientation

**When to suggest**:
- "New to AIPMOS - help me get started"
- "How do I use these commands?"
- "Getting started with..."
- "Introduction to..."

---

### /bug-report
**User intent**: Report issues or problems

**When to suggest**:
- "Report a bug in..."
- "Issue with..."
- "Something's broken..."

---

### /critique
**User intent**: Review and provide feedback

**When to suggest**:
- "Critique this design..."
- "Review this document..."
- "Feedback on..."
- "What do you think of..."

---

### /price-intel
**User intent**: Competitive pricing research

**When to suggest**:
- "Competitor pricing analysis"
- "Pricing intelligence for..."
- "Price comparison with..."

**NOT for**:
- General competitive analysis (use /compete)

---

### /prototype
**User intent**: Create interactive prototypes

**When to suggest**:
- "Build a prototype for..."
- "Interactive mockup of..."
- "Clickable prototype for..."

**NOT for**:
- Static mockups (use /mockup)

---

## Quick Reference Table

| User Says... | Suggest Command |
|--------------|-----------------|
| "Figure out our Q1 OKRs" | /think |
| "Should we do X or Y?" | /decide |
| "Write a spec for feature X" | /spec |
| "Find patterns in customer feedback" | /synthesize |
| "Score these 5 features" | /prioritize (command) |
| "Rank my Q2 sprint" | /prioritize (command) |
| "Triage 50 customer requests" | prioritization-craft (skill) |
| "Process raw feedback for roadmap" | prioritization-craft (skill) |
| "Build roadmap with stakeholder comms" | prioritization-craft (skill) |
| "Research customer needs" | /discover |
| "Update memory with session" | /refresh-memory |
| "Get stakeholder buy-in" | /align |
| "Write executive brief" | /write |
| "Validate this assumption" | /research |
| "What metrics to track?" | /measure |
| "Analyze competitor X" | /compete |
| "Daily competitive briefing" | /daily-brief |
| "Help me brainstorm solutions" | /brainstorm |
| "Post-launch learning" | /learn |
| "Plan the launch" | /ship |
| "Create a mockup" | /mockup |
| "Strategic narrative" | /narrative |
| "New to AIPMOS" | /onboard |
| "Report a bug" | /bug-report |
| "Critique this design" | /critique |
| "Pricing research" | /price-intel |

**Dual-Mode Commands**: Some capabilities have both a quick command and a deep skill variant:
- **/prioritize** (quick) vs **prioritization-craft skill** (deep): Quick scoring vs. comprehensive prioritization with triage, deduplication, and stakeholder communication
- **/think** (quick) vs **strategic-thinking skill** (deep): Quick strategic framing vs. comprehensive 4-phase decision process

---

## Suggestion Format Template

When suggesting a command, use this format:

```markdown
💡 **Command Suggestion**

Your request sounds like {intent description}.

Consider using **/{command}** for {what the command does}.

**What it will help you with**:
- {Benefit 1}
- {Benefit 2}
- {Benefit 3}

[Invoke /{command}] or [Continue conversation]
```

## Important Notes

1. **Don't over-suggest**: Only suggest when a command would clearly be more effective than direct conversation
2. **Trust user intent**: If they want to just talk, let them talk
3. **Explain the value**: Briefly explain WHY this command is better than conversation
4. **Always offer choice**: Never auto-invoke; always suggest with opt-out
5. **Be confident but humble**: "Consider using" not "You must use"
