# Packaging Architecture

Use this reference when designing packaging tiers or modules as part of Step 5 in the pricing workflow.

## Two Primary Models

### Good / Better / Best (Tiered)

**How it works:** Three tiers with escalating value. Each tier includes everything below it plus additional capabilities.

**When to use:**
- Clear value progression from individual → team → enterprise
- Features naturally stack (more users, more integrations, more support)
- Buyers self-select into tiers based on maturity or scale
- Sales motion benefits from clear upgrade path

**Design principles:**
- **Good** should be genuinely useful — not a crippled demo. It's the wedge.
- **Better** should be where most customers land. This is the anchor.
- **Best** should be for customers who get outsized value. Price reflects that.
- Each tier should have a clear "why upgrade" trigger, not just "more stuff"

**Example fence logic:**

| Fence Type | Good | Better | Best |
|------------|------|--------|------|
| Users | Up to 10 | Up to 100 | Unlimited |
| Features | Core workflow | + Analytics, integrations | + Custom, API, SSO |
| Support | Community / email | Priority email | Dedicated CSM |
| Data | 90-day retention | 1-year retention | Unlimited + export |

### Modular Add-Ons

**How it works:** A base platform plus optional modules customers can combine based on their needs.

**When to use:**
- Customer needs vary widely across segments
- Features serve different jobs (not a natural progression)
- Customers want to pay only for what they use
- Large product surface where bundles feel forced

**Design principles:**
- Base platform should deliver standalone value — it's the anchor
- Each module should be independently valuable (not "half a feature")
- Price modules relative to the value they deliver, not cost to build
- Keep the menu to 3-5 modules — more creates decision paralysis

---

## Value Fence Design

A value fence is the visible boundary between tiers or modules that justifies the price difference. Good fences feel natural to customers and align with how value scales.

**Strong fences (customers understand them intuitively):**
- **Usage volume** — seats, API calls, records, storage
- **Scale** — teams, departments, enterprise-wide
- **Capabilities** — analytics, automation, integrations, SSO
- **Support level** — self-serve, priority, dedicated
- **Compliance/security** — SOC 2, audit logs, data residency

**Weak fences (feel arbitrary or punitive):**
- Removing a basic feature to force an upgrade
- Limits that don't correlate with customer value (e.g., color themes)
- Support as a tier gate when product complexity demands support at every level
- Features that are cheap to deliver but expensive to unlock

**The test:** If a customer asks "Why do I have to pay more for that?" and the answer is "because we put it in the higher tier," the fence is weak. If the answer is "because at your scale, that feature delivers significantly more value," the fence is strong.

---

## The 30-Second Explainability Test

If a buyer can't understand the packaging in 30 seconds, simplify. Enterprise procurement already deals with enough complexity — pricing shouldn't add more.

**Checklist:**
- Can a sales rep explain all tiers in one slide?
- Can a buyer self-select a tier from the pricing page without calling sales?
- Does each tier have a clear name that signals who it's for? (e.g., Team, Business, Enterprise — not Bronze, Silver, Gold)
- Are there fewer than 8 feature rows in the comparison table?

---

## Upgrade Triggers

Design packaging so upgrades happen when customers hit natural value milestones, not artificial walls.

**Usage-based triggers:**
- Hit the seat or usage cap
- Need data beyond the retention window
- API call volume exceeds threshold

**Value-based triggers:**
- Team grows beyond the tier's coordination model
- Need analytics to justify ROI to leadership
- Regulatory requirement triggers compliance features

**Timing signals for CS/Sales:**
- Feature adoption rate crosses threshold (e.g., 80% of tier's features used)
- Multiple users requesting a gated feature
- Customer asks about a capability in the next tier

---

## Common Anti-Patterns

**The Feature Dump:** Every new feature gets thrown into the highest tier. Result: top tier bloats, mid tier stagnates, customers feel locked in rather than expanding.

**The Decoy Trap:** Middle tier exists only to make the top tier look good. Result: customers feel manipulated, trust erodes.

**The Penny-Wise Gate:** Cheap-to-deliver features gated behind expensive tiers to inflate perceived value. Result: customer resentment, support tickets, churn.

**The Frankenbundle:** Modules assembled to hit a price point rather than serve a coherent job. Result: customers buy and don't adopt, leading to churn.

**The Moving Target:** Packaging changes every quarter. Result: sales can't keep talk tracks current, customers lose trust in pricing stability.
