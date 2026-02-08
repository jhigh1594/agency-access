# Competitive-Analysis Skill: Architecture & Design Plan

## Purpose
The competitive-analysis skill enables **sustained, multi-turn competitive intelligence** for deep competitor understanding and strategic positioning over weeks/months.

## How It's Different from /compete Command and competitive-research Agent

| Aspect | /compete Command | competitive-research Agent | competitive-analysis Skill |
|--------|------------------|---------------------------|---------------------------|
| **Duration** | 15-30 min (single turn) | 30-120 min (point-in-time) | Weeks/months (ongoing campaign) |
| **Scope** | Quick competitive snapshot | Product-focused deep analysis | Comprehensive intelligence gathering |
| **Activities** | Structure existing knowledge | Hands-on product research (Playwright) | Multi-phase intelligence + battlecards |
| **Depth** | Surface-level analysis | Deep product capability analysis | Complete intelligence dossier |
| **Iteration** | One-time assessment | Single research session | Ongoing competitive monitoring |
| **Output** | Competitive brief, battlecard | Feature matrix, roadmap recs | Dossier + strategic battlecards |
| **Use Case** | Quick competitive comparison | Product analysis for roadmap | Strategic competitive campaign |
| **Tools** | Generic (WebFetch, Grep) | MCP (Playwright, Tavily, Context7) | Generic + Agent orchestration |

## When to Use competitive-analysis Skill

**Use this skill when:**
- Deep-diving on a major competitor (multi-week research)
- Building comprehensive competitive intelligence repository
- Tracking competitor moves and product evolution over time
- Preparing for strategic competitive response
- Developing market positioning strategy
- Analyzing competitive landscape for fundraising/M&A
- Creating detailed battlecards for sales enablement

**Use competitive-research agent when:**
- Product-focused analysis needed (30-120 min)
- Feature comparison with hands-on exploration
- Gap prioritization for roadmap decisions
- Quick product differentiation analysis

**Use /compete command when:**
- Quick competitive snapshot needed (15-30 min)
- Creating simple battlecard
- Comparing features across competitors
- One-time competitive analysis

## Product-First Principle (from competitive-research agent)

When conducting competitive intelligence, prioritize **product capability analysis** over supporting context:

**PRIMARY FOCUS (60-70% of effort):**
1. **Product Capability Analysis**
   - Comprehensive feature comparison with quality assessment
   - Feature gaps (they have, we lack) with customer demand priority
   - Unique advantages (we have, they lack) with leverage opportunities
   - Quality/implementation differences for shared features
   - Technical capabilities and integrations

2. **Product Experience Evaluation**
   - User experience and interface quality
   - Performance, reliability, scalability
   - Onboarding and time-to-value
   - Mobile/accessibility considerations

3. **Product Differentiation Strategy**
   - Where we're functionally ahead (strengths to amplify)
   - Where we're behind (gaps to close or leapfrog)
   - Product-based differentiation opportunities
   - Feature roadmap priorities

**SUPPORTING CONTEXT (10-20% of effort):**
4. **Positioning & Messaging** (light coverage - understand how they position capabilities)
5. **Pricing & Packaging** (light coverage - understand feature tier distribution)
6. **GTM Strategy** (light coverage - understand how they sell capabilities)

**Rationale**: Product decisions drive competitive advantage. Market context (positioning, pricing, GTM) supports product strategy but is not the primary focus.

## Skill Architecture

### Phase 1: Competitor Selection & Research Design (Session 1, 30-45 min)
**Goal:** Define which competitors to analyze and research approach

**Activities:**
1. **Identify Competitors to Analyze**
   - Direct competitors (same customer, same solution)
   - Indirect competitors (same customer, different solution)
   - Emerging competitors (new entrants, disruptors)
   - Substitute products (different approach to same job)

2. **Prioritize Competitors**
   - Strategic threat level (high/medium/low)
   - Market overlap (how much do we compete?)
   - Learning value (what can we learn from them?)
   - Resource allocation (how deep to go?)

3. **Define Research Questions**
   - What do we need to know about this competitor?
   - What decisions will this inform? (Product strategy, positioning, pricing, GTM)
   - What's our timeline?

4. **Research Plan**
   - Information sources to leverage
   - Research methods (desk research, trials, customer interviews)
   - Deliverables and timeline

**Output:** Competitor research plan

---

### Phase 2: Intelligence Gathering (Multiple sessions over weeks)
**Goal:** Systematically gather competitive intelligence from multiple sources

**RECOMMENDED APPROACH:** Use **competitive-research agent** for product intelligence sessions (60-90 min each). The agent provides:
- Product-first framework (60-70% time on capabilities, 10-20% on context)
- Hands-on product exploration via Playwright MCP
- Gap prioritization matrix with customer demand evidence
- Differentiation opportunity areas (5-7 themes)
- Feature roadmap recommendations

**For other intelligence categories**, conduct manual research or use agent in "light competitive overview" mode (30-45 min).

**Intelligence Categories:**

#### **2a. Product Intelligence** → USE: competitive-research agent (60-90 min, product-first deep-dive)
- Core product capabilities (features, functionality)
- Product roadmap signals (job postings, announcements, beta programs)
- Product quality & differentiation
- Pricing & packaging
- Integration ecosystem
- Technical architecture (if visible)

**Sources:**
- Free trials / demos / product tours
- Product documentation and help centers
- YouTube demos and tutorials
- Review sites (G2, Capterra, TrustRadius)
- Reddit, Twitter, LinkedIn discussions

#### **2b. Customer Intelligence**
- Target customer segments
- Customer satisfaction (NPS, reviews, ratings)
- Win/loss patterns (when do we win vs. them? Why?)
- Customer complaints and pain points
- Switching patterns (who switches to/from them?)

**Sources:**
- Customer review sites
- Case studies and testimonials
- Customer interviews (ask about alternatives considered)
- Sales team feedback
- Win/loss analysis

#### **2c. Company Intelligence**
- Company stage (startup, growth, mature)
- Funding and financials (ARR, growth rate, valuation)
- Team size and hiring patterns
- Leadership team and advisors
- Strategic priorities (from earnings calls, blog posts)

**Sources:**
- Crunchbase, PitchBook
- LinkedIn (employee count, hiring, leadership changes)
- Job postings (reveal roadmap and priorities)
- Press releases and media coverage
- Earnings calls (if public)

#### **2d. Go-to-Market Intelligence**
- Sales model (self-serve, sales-led, hybrid)
- Marketing channels and messaging
- Pricing strategy and discount patterns
- Partnerships and channel strategy
- Geographic expansion

**Sources:**
- Website and marketing materials
- Sales conversations
- Partner ecosystem pages
- LinkedIn sales navigator
- Marketing automation tools (Builtwith, SimilarWeb)

#### **2e. Strategic Intelligence**
- Strategic positioning (how do they position themselves?)
- Competitive moats (what makes them defensible?)
- Vulnerabilities (where are they weak?)
- Future direction (where are they heading?)

**Sources:**
- Founder/CEO interviews and talks
- Strategic announcements
- Product vision statements
- Analyst reports (Gartner, Forrester)

**Tool Strategy (Product Intelligence Sessions via Agent):**
- **Playwright MCP** (40-50% of time): Hands-on product exploration
  - Feature discovery and functionality testing
  - Interface quality, UX patterns, information architecture
  - Onboarding flow and time-to-value assessment
  - Use `browser_snapshot` for UI structure, `take_screenshot` for evidence
- **WebFetch** (20-30% of time): Deep product documentation extraction
- **Tavily MCP** (15-20% of time): Customer feedback on functionality from reviews
- **Context7 MCP** (10% of time): Integration ecosystem and technical capabilities

**Manual Research Capabilities (Other Intelligence Categories):**
- Can **Read** existing competitive analysis files
- Can **WebFetch** competitor websites, pricing pages, blog posts
- Can **Grep** across files to track competitive changes over time
- Can maintain competitive intelligence repository

**Output:** Comprehensive competitive intelligence dossier (organized by category)

---

### Phase 3: Strategic Analysis (After intelligence gathering, 60-90 min)
**Goal:** Synthesize intelligence into strategic insights

#### **3a. Competitive Positioning Map**

Map competitors across key dimensions:
- **Dimension 1** (e.g., Price: Low → High)
- **Dimension 2** (e.g., Target Market: SMB → Enterprise)
- **Dimension 3** (e.g., Feature Breadth: Specialized → Platform)

Identify:
- Where are we positioned?
- Where are white space opportunities?
- Who are we most directly competing with?
- Where is the market moving?

#### **3b. Gap Prioritization Framework** (from competitive-research agent)

For each gap (they have, we lack), prioritize with evidence:

| Gap | Customer Demand | Competitive Threat | Close Effort | Approach | Priority |
|-----|-----------------|-------------------|--------------|----------|----------|
| [Feature] | High (from G2 reviews) | Critical (deal-breaker) | Medium | Close | P0 |
| [Feature] | High | High | High | Leapfrog | P1 |
| [Feature] | Medium | Medium | Low | Close | P2 |
| [Feature] | Low | Low | High | Accept | -- |

**Priority Logic:**
- **P0 (Must Close)**: High customer demand + Critical competitive threat
- **P1 (Should Close)**: High demand OR critical threat + Medium effort
- **P2 (Consider)**: Medium demand + Low-medium threat

**Approach Definitions:**
- **Close**: Build to parity with competitor (critical competitive gaps)
- **Leapfrog**: Skip parity, build superior version (strategic opportunity)
- **Accept**: Acknowledge gap but don't prioritize (low customer demand)

**Evidence Sources:**
- Customer demand: G2/Capterra/TrustRadius review frequency, sales feedback, lost deal analysis
- Competitive threat: Deal blocker frequency, win/loss patterns, market positioning
- Close effort: Engineering estimate, architectural complexity, design requirements

#### **3c. Strengths, Weaknesses, Opportunities, Threats (SWOT)**

**For Each Competitor:**

**Strengths:**
- What they do really well
- Their competitive advantages
- What customers love about them

**Weaknesses:**
- Where they struggle
- Customer complaints
- Gaps in their offering

**Opportunities (for us):**
- Where we can attack their weaknesses
- Unmet needs in their customer base
- Market shifts they're not prepared for

**Threats (to us):**
- Where they're strong and we're weak
- Roadmap signals that indicate future competition
- Strategic moves that could hurt us

#### **3d. Porter's Five Forces Analysis**

For market-level competitive dynamics:

1. **Competitive Rivalry:** How intense is competition?
2. **Threat of New Entrants:** How easy for new competitors to enter?
3. **Bargaining Power of Suppliers:** How much leverage do suppliers have?
4. **Bargaining Power of Buyers:** How much leverage do customers have?
5. **Threat of Substitutes:** What alternatives exist?

#### **3e. Moat Analysis**

What makes each competitor defensible?

**Types of Moats:**
- Network effects (product gets better with more users)
- Switching costs (hard to leave once you're in)
- Data moats (proprietary data advantage)
- Brand (strong brand equity and trust)
- Scale economies (cost advantage from size)
- Regulatory moats (licenses, approvals)

**Our Moat vs. Their Moat:**
- Where are we defensible?
- Where are they defensible?
- How can we build stronger moats?

**Frameworks Applied:**
- SWOT Analysis
- Porter's Five Forces
- Moat Analysis (7 Powers framework)
- Positioning maps
- Feature comparison matrices

**Output:** Strategic competitive assessment

---

### Phase 4: Strategic Recommendations & Battlecards (Final session, 45-60 min)
**Goal:** Translate analysis into actionable strategy and sales enablement

#### **Strategic Recommendations**

**1. Product Strategy:**
- Where should we invest to widen our lead?
- Where should we close gaps vs. competitors?
- What should we explicitly NOT build? (avoid their game)

**2. Positioning Strategy:**
- How should we position against this competitor?
- What's our unique differentiation?
- What messaging resonates vs. their messaging?

**3. Pricing Strategy:**
- How does our pricing compare?
- Should we adjust pricing/packaging?
- How to handle price-based competition?

**4. Sales Strategy:**
- When do we win vs. this competitor? (double down)
- When do we lose? (avoid or address)
- How to handle this competitor in sales conversations?

**5. Threat Assessment:**
- How urgent is the competitive threat?
- What's our 6-12 month competitive response plan?

#### **Product Differentiation Opportunity Areas** (5-7 themes for deep-dive)

**Note**: From competitive-research agent framework - these are opportunity themes requiring cross-functional refinement, not detailed features.

For each opportunity area, document:

| Rank | Opportunity Area | Customer Problems Addressed | Why Competitors May Not Pursue | Value Potential | Complexity | Validation Needed | Priority |
|------|------------------|----------------------------|-------------------------------|-----------------|-----------|-------------------|----------|
| 1 | [Theme Name] | [Jobs-to-be-done and pain points] | [Strategic mismatch, technical barriers] | High/Med/Low | High/Med/Low | Customer interviews, tech spike | P0/P1/P2 |

**For each opportunity area, include:**
- **Opportunity area name + description** (2-3 sentences describing the theme)
- **Customer problems this area addresses** (jobs-to-be-done and pain points)
- **Why competitors may not pursue** (strategic mismatch, technical barriers, market position)
- **Potential approaches within this area** (2-4 example directions, not detailed features)
- **Customer value potential**: High/Medium/Low
- **Complexity indicators**: Architectural change? New capabilities? Dependencies?
- **Validation needed**: Customer interviews, technical spike, design exploration
- **Priority**: P0/P1/P2 based on strategic fit and validation urgency

**IMPORTANT**: Recommend scheduling cross-functional ideation workshop (Product/Eng/Design) to develop specific features within prioritized opportunity areas before committing to implementation.

#### **Competitive Battlecards**

For each major competitor, create sales-ready battlecard:

```markdown
## vs. [Competitor Name]

### When They Come Up
[In what scenarios do we compete? Deal size, industry, use case]

### How We're Different

**Our Approach:**
- [Key differentiator 1]
- [Key differentiator 2]

**Their Approach:**
- [Their approach 1]
- [Their approach 2]

### Our Advantages (Strengths)
1. **[Advantage 1]**
   - What: [Description]
   - Proof point: [Customer quote, data, case study]

2. **[Advantage 2]**
   [Repeat structure]

### Their Strengths (How to Handle)

**They'll say:** "[Their talking point]"
**We respond:** "[Our counter-positioning]"

**They'll say:** "[Another strength]"
**We respond:** "[How we address this]"

### Where We Win
- [Scenario 1 where we consistently win]
- [Scenario 2]

### Where They Win
- [Scenario where they have advantage - be honest]
- [How to avoid or reposition these deals]

### Proof Points
- "[Customer testimonial about switching from competitor]"
- [Win rate data vs. this competitor]
- [Case study or demo that shows differentiation]

### Questions to Ask Prospects
[Discovery questions that reveal our advantages]
1. [Question that surfaces their pain point]
2. [Question that highlights our strength]
```

**Output:** Strategic recommendations + Competitive battlecards

---

## Reference Materials Included

### 1. Competitive Intelligence Source Checklist

```markdown
## Competitive Intelligence Source Checklist

### Product Intelligence
- [ ] Free trial / Demo (hands-on product experience)
- [ ] Product tours / Screenshots / Videos
- [ ] Help documentation / Knowledge base
- [ ] Release notes / Changelog
- [ ] Feature request forums
- [ ] Integration marketplace
- [ ] API documentation (reveals technical capabilities)

### Customer Intelligence
- [ ] G2 / Capterra / TrustRadius reviews
  - Star rating trends over time
  - Common complaints in negative reviews
  - What customers love in positive reviews
- [ ] Reddit discussions (r/saas, industry subreddits)
- [ ] Twitter search for mentions
- [ ] LinkedIn posts about competitor
- [ ] YouTube reviews and comparisons
- [ ] Customer case studies and testimonials

### Company Intelligence
- [ ] Crunchbase (funding, valuation, investors)
- [ ] LinkedIn company page
  - Employee count (growth rate)
  - Recent hires (especially leadership)
  - Employee sentiment (Glassdoor)
- [ ] Job postings (reveals priorities and roadmap)
  - Engineering roles → product roadmap
  - Sales roles → market expansion
  - Marketing roles → positioning shifts
- [ ] Press releases and media coverage
- [ ] Earnings calls (if public)
- [ ] Blog posts and thought leadership

### Go-to-Market Intelligence
- [ ] Website and marketing messaging
- [ ] Pricing page (pricing, packaging, free trials)
- [ ] SEO and paid search strategy (Ahrefs, SEMrush)
- [ ] Social media presence and engagement
- [ ] Webinars and events
- [ ] Partner ecosystem and integrations
- [ ] Sales process (mystery shop if possible)

### Strategic Intelligence
- [ ] Founder/CEO interviews and presentations
- [ ] Company vision and mission statements
- [ ] Strategic announcements (acquisitions, partnerships, pivots)
- [ ] Analyst reports (Gartner, Forrester, IDC)
- [ ] 10-K / 10-Q filings (if public)
- [ ] Patent filings (technical innovation signals)
```

### 2. Competitive Feature Matrix Template

```markdown
## Competitive Feature Matrix

| Feature Category | Feature | Us | Comp A | Comp B | Comp C | Notes |
|-----------------|---------|-----|--------|--------|--------|-------|
| **Core Features** |
| Feature 1 | ✅ Full | ✅ Full | ⚠️ Partial | ❌ None | We're strong here |
| Feature 2 | ✅ Full | ❌ None | ✅ Full | ✅ Full | We need to catch up |
| Feature 3 | 🚀 Beta | ❌ None | ❌ None | ❌ None | Our differentiation |
| **Integrations** |
| Integration X | ✅ | ✅ | ❌ | ✅ | |
| Integration Y | ❌ | ✅ | ✅ | ✅ | Gap for us |
| **Enterprise Features** |
| SSO | ✅ | ✅ | ⚠️ | ✅ | |
| Advanced Permissions | ✅ | ❌ | ✅ | ✅ | |
| **Pricing** |
| Starting Price | $X/mo | $Y/mo | $Z/mo | $W/mo | |
| Free Tier | Yes | Yes | No | Yes | |

**Legend:**
- ✅ Full support
- ⚠️ Partial / Limited
- ❌ Not available
- 🚀 In beta / Coming soon
```

### 3. Moat Analysis Framework (7 Powers)

```markdown
## Moat Analysis: [Competitor Name]

### 1. Scale Economies
**Does this competitor have cost advantages from scale?**
- [ ] Yes - [Describe: lower unit costs, volume discounts, etc.]
- [ ] No
- **Strength:** Weak / Moderate / Strong
- **Our response:** [How we address or avoid this]

### 2. Network Effects
**Does their product get better with more users?**
- [ ] Yes - [Describe: marketplace, collaboration, data network]
- [ ] No
- **Strength:** Weak / Moderate / Strong
- **Our response:** [How we address or avoid this]

### 3. Counter-Positioning
**Are they positioned in a way that's hard for others to copy?**
- [ ] Yes - [Describe their unique positioning]
- [ ] No
- **Our response:** [Our counter-positioning strategy]

### 4. Switching Costs
**Is it hard for customers to leave once they're in?**
- [ ] Yes - [Describe: data lock-in, integration complexity, training]
- [ ] No
- **Strength:** Weak / Moderate / Strong
- **Our response:** [How we reduce switching costs for their customers]

### 5. Branding
**Do they have strong brand equity and trust?**
- [ ] Yes - [Describe brand strength]
- [ ] No
- **Strength:** Weak / Moderate / Strong
- **Our response:** [How we build brand or position differently]

### 6. Cornered Resource
**Do they have exclusive access to something valuable?**
- [ ] Yes - [Describe: proprietary data, exclusive partnerships, IP]
- [ ] No
- **Our response:** [How we address or work around this]

### 7. Process Power
**Do they have operational advantages from experience?**
- [ ] Yes - [Describe: superior processes, organizational learning]
- [ ] No
- **Our response:** [How we develop our own process advantages]

## Overall Moat Assessment
**Moat Strength:** Weak / Moderate / Strong / Very Strong
**Defensibility:** [1-10 scale]
**Our Competitive Advantage vs. This Competitor:** [Where we win]
```

---

## Integration with AIPMOS Core Rules

- **PM Operating Principles:** Platform thinking (ecosystem effects), competitive loops
- **Mental Models:** Feedback loops (moats), local maxima (their strategic constraints), ROI (where to compete vs. avoid)
- **Frameworks as Tools:** SWOT, Porter's 5 Forces, Moat Analysis, Positioning maps
- **Decision Framework:** Strategic decisions based on competitive intelligence
- **Communication Standards:** Battlecards optimized for sales (audience-specific)

---

## Tools the Skill Can Use

- **Read:** Access existing competitive analysis files, track changes over time
- **WebFetch:** Pull competitor websites, pricing pages, blog posts, job listings
- **Grep:** Search across competitive intelligence files for patterns and trends
- **Glob:** Find all competitive intel on a specific competitor
- **Write:** Generate battlecards, strategic assessments, intelligence summaries

---

## Deliverables

1. **Competitor Research Plan** (Phase 1 output)
2. **Competitive Intelligence Dossier** (Phase 2 output - organized by intelligence category)
3. **Strategic Competitive Assessment** (Phase 3 output - SWOT, positioning, moats)
4. **Strategic Recommendations + Battlecards** (Phase 4 output - main deliverable)

---

## Success Criteria for This Skill

**A successful competitive-analysis session produces:**

**PRIMARY SUCCESS CRITERIA (Product Strategy Focus):**
- ✅ **Product Capability Depth**: Comprehensive feature comparison with quality assessment, not just feature lists
- ✅ **Gap Prioritization Clarity**: Every gap prioritized with evidence (customer demand + competitive threat + close effort)
- ✅ **Strategic Roadmap Guidance**: Clear recommendations on what to close, amplify, or build for differentiation
- ✅ **Unique Advantage Identification**: Assessment of where we're functionally ahead and how to leverage it
- ✅ **Hands-On Validation**: Direct product exploration evidence (via agent's Playwright sessions) beyond marketing claims
- ✅ **Opportunity Areas Quality**: 5-7 differentiation themes with customer problem validation and cross-functional refinement plan

**SUPPORTING SUCCESS CRITERIA:**
- ✅ **Comprehensive Intelligence**: Coverage across 5 categories (product, customer, company, GTM, strategic)
- ✅ **Multi-Source Validation**: Not relying on single source - 3+ sources for major claims
- ✅ **Strategic Insights**: SWOT, positioning, moat analysis frameworks applied
- ✅ **Sales Enablement**: Sales-ready battlecards for top 3-5 competitors
- ✅ **Ongoing Tracking**: Competitive tracking system established

**TIME ALLOCATION VALIDATION:**
- ✅ 60-70% of research time spent on product capability analysis (via agent sessions)
- ✅ 10-20% on supporting context (positioning, pricing, GTM)
- ✅ Primary deliverables (product-focused) comprehensive, supporting deliverables concise

**Time investment:**
- Research plan: 30-45 minutes
- Intelligence gathering: 3-10 hours (spread over days/weeks)
- Strategic analysis: 60-90 minutes
- Recommendations & battlecards: 45-60 minutes
- Total: 5-15 hours depending on depth

**ROI:** Strategic competitive positioning that informs product, pricing, and GTM decisions
