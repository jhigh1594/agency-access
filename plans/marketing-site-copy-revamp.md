# Marketing Site Copy Revamp Plan

**Created:** 2026-08-04  
**Status:** Ready for Implementation  
**Artifact Readiness:** Implementation-Ready  

## Problem Frame

AuthHub's current marketing site copy does not adequately communicate two critical differentiators:
1. The platform's **agent-native functionality** - built from the ground up to support AI agents
2. The **business value of faster client onboarding** for agencies

These gaps reduce conversion effectiveness and fail to resonate with target audiences who are actively seeking AI agent solutions and faster time-to-value.

## Scope

### In Scope
- Hero section copy and supporting value propositions
- Feature descriptions highlighting agent-native capabilities
- Benefits section focused on onboarding speed and time-to-value
- Case studies and testimonials (refreshing framing, not fabrication)
- Pricing and CTA copy alignment
- SEO metadata and page titles

### Out of Scope
- Visual design changes (layout, colors, imagery)
- New feature development or functionality changes
- Technical implementation of landing page variations
- A/B testing setup (testing strategy only)
- Email marketing or nurture sequence copy

## Success Criteria

1. **Conversion Impact:** Increase landing page conversion rate by minimum 20% within 60 days of launch
2. **Message Clarity:** Visitors understand both agent-first and 15-minute onboarding value within 5 seconds
3. **Action Speed:** Time-to-first-demo-request reduced by 30% with new onboarding-focused messaging
4. **SEO Performance:** Page 1 rankings for "AI agent platform for agencies" and "fast client onboarding" within 90 days
5. **Brand Voice:** All copy maintains AuthHub's established direct, benefit-driven voice without corporate fluff

## Research-Driven Messaging Framework

### Agent-First Platform Architecture

**Primary Message:** "Every feature we build thinks like an agent."

**Supporting Points:**
- Native autonomous decision-making across all workflows
- Multi-step process automation without human bottlenecks
- Agent-native APIs from day one—no retrofit required
- Integration that works reliably, not eventually

### Client Onboarding in Minutes

**Primary Message:** "Get your first client live in under 15 minutes."

**Supporting Points:**
- Zero-configuration client setup process
- Pre-built agency templates for instant activation
- Automated success tools that reduce manual work by 80%
- Start generating revenue the same day you sign up

## Copy Principles (Research-Based)

1. **Specific over General:** Use exact numbers ("15 minutes") not vague claims ("fast")
2. **Benefit-First Technical Features:** Every feature explanation starts with business value
3. **Active Voice:** Eliminate passive constructions; use direct benefit statements
4. **No Corporate Fluff:** Remove empty adjectives and filler phrases; every word must earn its place
5. **Competitive Contrast:** Explicitly call out what makes AuthHub different vs agent-retrofitted competitors

## Implementation Units

### 1. Hero Section Overhaul
**Files:** `apps/web/app/(marketing)/page.tsx` (hero copy components)  
**Success Criteria:** Hero communicates both core differentiators in first 75 words with clear CTAs  
**Test Scenarios:**
- Does the headline include both agent-first and 15-minute onboarding claims?
- Is there exactly one primary CTA and one secondary CTA?
- Can a non-technical agency owner understand the value in under 5 seconds?
- Does the copy avoid jargon like "AI-native" in favor of plain language?

### 2. Features Section Enhancement  
**Files:** `apps/web/app/(marketing)/page.tsx` (features component)  
**Success Criteria:** Each feature description starts with a business benefit, not a technical capability  
**Test Scenarios:**
- Does every feature description start with "Agencies that..." or "You'll be able to..."?
- Are there at least 3 specific metrics or timeframes across all features?
- Do features address specific pain points: agent reliability, integration complexity, onboarding time?

### 3. Benefits Section Restructure
**Files:** `apps/web/app/(marketing)/page.tsx` (benefits component)  
**Success Criteria:** Benefits organized into two clear sections: "Agent-First Architecture" and "15-Minute Onboarding"  
**Test Scenarios:**
- Are benefits section headers action-oriented and benefit-focused?
- Does each benefit include either a specific number or timeframe?
- Are testimonials placed next to relevant benefit categories?
- Is there clear visual separation between the two main benefit themes?

### 4. SEO and Metadata Update
**Files:** `apps/web/app/(marketing)/page.tsx` (metadata), relevant layout files  
**Success Criteria:** Meta descriptions and titles optimized for high-intent agency search terms  
**Test Scenarios:**
- Do page titles include "AI agent platform" or "agency client onboarding"?
- Are meta descriptions under 155 characters with clear value propositions?
- Is structured data markup present for product schema and organization schema?
- Do social share previews include both core differentiators?

### 5. CTA and Conversion Copy Alignment
**Files:** Multiple component files with button/link text  
**Success Criteria:** Every CTA is specific, time-bounded, and tied to immediate next step  
**Test Scenarios:**
- Is every CTA verb-driven with specific outcomes ("Book a demo" vs "Learn more")?
- Do CTAs reference the 15-minute onboarding claim where appropriate?
- Are there time-based CTAs like "Get started in 15 minutes" alongside action buttons?
- Do urgency elements reference actual scarcity or limits, not artificial marketing tactics?

## Dependencies

1. **Brand Guidelines:** Must align with existing AuthHub brand voice and style guide
2. **Product Team:** Validate that all agent-native claims are technically accurate
3. **Customer Success:** Gather real onboarding time metrics and success stories
4. **Design Team:** Coordinate any visual updates that may accompany copy changes

## Risks and Mitigations

**Risk:** Over-promising on agent-native capabilities may create implementation expectations  
**Mitigation:** All technical claims validated by product team; use specific capabilities language

**Risk:** Onboarding speed claims may vary by client complexity  
**Mitigation:** Use average metrics and include "typical" qualifiers; provide case studies for context

**Risk:** Copy changes may affect existing SEO performance  
**Mitigation:** Maintain existing keyword density where possible; monitor rankings post-launch

## Testing Approach

### Copy Validation (Before Launch)
- **5-Second Scan Test:** Can 5 non-technical agency owners explain both core value props in their own words?
- **Competitive Positioning Audit:** Does our copy clearly differentiate from agent-retrofitted competitors in 3 key areas?
- **Agency Pain Point Mapping:** Does every major benefit address a specific onboarding or agent-reliability pain point from research?

### Conversion Testing (Post-Launch)
- **Hero A/B Test:** New "Agent-First + 15-Minute Onboarding" headline vs current
- **CTA Action Test:** "Book a demo" vs "Get started in 15 minutes" conversion comparison
- **Benefit Section Scan:** Heat map analysis of engagement with new benefit categorization
- **Form Completion Tracking:** Measure impact of onboarding-focused copy on demo request quality

### Message Validation (Ongoing)
- **Customer Success Feedback:** Interview 5 recent customers on whether 15-minute onboarding claim matches reality
- **Sales Team Alignment:** Ensure sales team uses same "15-minute" and "agent-first" language consistently
- **Product Team Validation:** Confirm all agent-native claims are technically accurate and not overpromised
- **Legal Compliance Review:** Validate all specific time claims and performance guarantees

## Timeline and Milestones

**Week 1:** Research Validation and Messaging Framework
- Day 1-2: Validate "15-minute onboarding" claim with customer success team
- Day 3-4: Confirm all agent-native technical claims with product team
- Day 5: Finalize messaging framework with both teams

**Week 2-3:** Copy Development and Internal Review
- Week 2: Draft all hero, features, and benefits section copy
- Week 3: Internal review with sales, customer success, and product teams

**Week 4:** Implementation and Launch Preparation
- Day 1-3: Implement copy changes in staging environment
- Day 4: Set up conversion tracking and A/B testing infrastructure
- Day 5: Final QA and launch preparation

**Week 5+:** Launch, Monitor, and Optimize
- Launch new copy to production
- Monitor conversion metrics for 30 days
- A/B test hero variants based on initial performance
- Iterative optimization based on data

## Next Steps

1. **Immediate:** Schedule 30-minute meeting with customer success lead to validate 15-minute onboarding claim
2. **Week 1:** Schedule product team review of all agent-native claims
3. **Week 1:** Create copy variations for hero section A/B testing (minimum 3 variants)
4. **Week 2:** Set up Google Analytics 4 events for tracking specific conversion actions
5. **Week 3:** Establish 30-day performance dashboard with key metrics visualization

## Strategic Positioning Angles

### Primary Positioning Statement
"Agencies stop losing clients to broken automation. AuthHub's agent-first architecture gets your first client live in 15 minutes—because every feature thinks like an agent."

This positions AuthHub around two strategic differentiators:
1. **Agent-First Architecture**: Unlike competitors that retrofitted agent capabilities, AuthHub was built for autonomous decision-making from day one
2. **15-Minute Onboarding**: Agencies start generating revenue the same day they sign up, not weeks later

### Competitive Differentiation Framework

**vs. Retrofitted AI Platforms:**
- Competitors added "AI features" to existing tools—agents still hit human bottlenecks
- AuthHub: Native autonomous decision-making means agents complete multi-step workflows without approval delays

**vs. Traditional Agency Tools:**
- Traditional tools require weeks of configuration and training
- AuthHub: Zero-configuration setup with pre-built agency templates

**vs. Generic Automation:**
- Generic automation creates more work through maintenance overhead
- AuthHub: Agents that adapt and improve over time, reducing manual oversight

### Target Audience Positioning by Awareness Stage

**Problem-Aware Readers:**
- Pain: "My team keeps missing client deadlines because agents get stuck on approvals"
- Position: "Autonomous agents finish client work without waiting for your signoff"

**Solution-Aware Readers:**
- Pain: "We tried AI tools but they're more work than help"
- Position: "Agent-native APIs integrate reliably—no retrofitting required"

**Product-Aware Readers:**
- Pain: "Client onboarding takes weeks and clients churn before value"
- Position: "Get your first client live in 15 minutes with automated success tools"

### Value Proposition Architecture

**Core Value:** Agencies stop losing clients to broken automation and start generating revenue faster with agent-first workflows.

**Supporting Pillars:**
1. **Agent Reliability:** Autonomous decision-making eliminates human bottlenecks in client workflows
2. **Speed to Value:** 15-minute onboarding means same-day revenue generation
3. **Agency Scalability:** Agent-native architecture scales without proportional technical overhead
4. **Reduced Management:** Pre-built templates and automated tools reduce manual configuration by 80%

### Objection-Handling Framework

**Objection:** "Our current tools work fine."
- **Answer:** "They work until 4pm Friday when your agents need approvals that no one's around to give."

**Objection:** "AI tools are too expensive for our agency."
- **Answer:** "15-minute onboarding means you start generating revenue before the first month's bill."

**Objection:** "We don't have technical resources for AI implementation."
- **Answer:** "Agent-native APIs integrate without retrofitting—no development team required."

**Objection:** "We need to see it work before committing."
- **Answer:** "Get started in 15 minutes. Cancel anytime in the first week if you don't see value."

---

**Plan ready at `plans/marketing-site-copy-revamp.md`. What would you like to do next?**