# 2026-03-08 Affiliate Program Brainstorm

## Objective
Define a full affiliate program for Agency Access Platform with lightweight partner management and tracking, grounded in current repo patterns, informed by Alex Hormozi-style affiliate enablement, and biased toward open-source implementation choices.

## Repo Context (Observed)
- No existing affiliate, referral, partner, commission, or payout models exist in Prisma today. Current billing data lives around [`Subscription`](/Users/jhigh/agency-access-platform/apps/api/prisma/schema.prisma#L281) and [`Invoice`](/Users/jhigh/agency-access-platform/apps/api/prisma/schema.prisma#L315).
- Billing already runs through Creem, and the backend already processes subscription and invoice webhooks in [`webhook.service.ts`](/Users/jhigh/agency-access-platform/apps/api/src/services/webhook.service.ts#L38), including `invoice.paid` handling.
- Internal operational tooling already exists and is a strong fit for affiliate ops. Relevant patterns:
  - API routes: [`internal-admin.routes.ts`](/Users/jhigh/agency-access-platform/apps/api/src/routes/internal-admin.routes.ts)
  - service/query pattern: [`internal-admin.service.ts`](/Users/jhigh/agency-access-platform/apps/api/src/services/internal-admin.service.ts), [`internal-admin.ts`](/Users/jhigh/agency-access-platform/apps/web/src/lib/query/internal-admin.ts)
  - authenticated admin surfaces: [`apps/web/src/app/(authenticated)/internal/admin/page.tsx`](/Users/jhigh/agency-access-platform/apps/web/src/app/(authenticated)/internal/admin/page.tsx)
- Marketing + product analytics already use PostHog on web via [`instrumentation-client.ts`](/Users/jhigh/agency-access-platform/apps/web/instrumentation-client.ts) and event helpers like [`billing.ts`](/Users/jhigh/agency-access-platform/apps/web/src/lib/analytics/billing.ts).
- Current auth baseline is Clerk. Building custom partner auth from scratch would cut against current repo practice and increase risk.

## Default Architecture Baseline Check
The `workflow-discovery` default baseline does **not** apply.

Applicable baseline for this repo:
- Next.js App Router (`apps/web`)
- Fastify + Prisma (`apps/api`)
- Clerk auth
- React Query for authenticated data loading
- Tailwind tokenized UI + shared React primitives
- Creem for billing lifecycle and invoice webhooks

## Users, Jobs, and Success Criteria
### Primary users
- Growth/admin team running the affiliate program
- Affiliate partners referring agencies to the product

### Core jobs to be done
- Recruit, review, approve, and manage affiliates without spreadsheets becoming the source of truth
- Give each approved affiliate a clear link, attribution window, performance dashboard, and payout status
- Track click -> signup -> paid subscription -> renewal attribution with enough confidence to pay commissions
- Prevent obvious self-referral, duplicate attribution, and refunded/reversed payout errors

### Success criteria
- New affiliate can apply, be approved, and receive a usable referral link without manual engineering help
- Internal team can answer “who referred this customer, what do we owe them, and why?” from product data
- Paid conversions can be reconciled from first click through `invoice.paid` without relying on vendor black boxes
- Phase 1 remains lightweight operationally: manual payout execution is acceptable, but commission computation and status must be system-tracked

## Constraints and Guardrails
- Preserve API response shape: `{ data }` on success and `{ error }` on failure
- Follow repo TDD expectations for behavior changes
- Reuse shared types in `packages/shared`
- Keep the affiliate surface tenant-safe and role-safe
- Do not build custom auth from scratch if Clerk can handle partner users cleanly
- Optimize for open-source implementation where that improves control over attribution, tracking, and cost
- Treat payout data as sensitive operational data; do not dump raw payout details into random JSON blobs without validation and access controls

## External Research Summary
### Hormozi-style learnings worth copying
- Alex Hormozi’s affiliate materials push enablement, not just commission rates:
  - “swipe files” and launch materials are provided to reduce partner effort
  - leaderboard / prize mechanics are used to activate top affiliates
  - partners are told to promote early so their audience gets cookied and attributed sooner
- Practical takeaway:
  - high-leverage affiliates need a real promotional kit, not just a link
  - attribution windows and “get your audience cookied early” tactics materially affect partner output
  - recurring incentives plus periodic contests/bonuses are stronger than flat one-time payouts alone

### SaaS affiliate patterns from strong current programs
- Webflow: 50% recurring commission for 12 months and a 90-day cookie
- Kit: 50% recurring commission for 12 months and a 90-day cookie
- Framer: 50% of first-year sales with a 60-day cookie
- Semrush: large fixed bounties with a 120-day cookie

### Cross-program lessons
- Strong programs use long attribution windows, especially for considered B2B purchases
- The economics are meaningfully generous; weak percentages do not attract serious affiliates
- Programs bias toward approval, tracking clarity, and partner enablement assets
- Not every successful program uses pure recurring rev-share, but all make value obvious and trackable

### OSS / implementation research
- Creem already has native affiliate and revenue-split features, which reduces build time but shifts core attribution logic into a vendor path
- Dub is open-source and explicitly supports marketing links / partner-style attribution use cases
- Plausible provides self-hostable analytics if we want attribution reporting without extra SaaS dependence
- Refferq is an open-source affiliate platform with affiliate portal, campaigns, payouts, webhooks, and API support, but it would still require significant integration and product-fit validation against this repo’s auth + billing model

## Product Direction
### Recommended program shape
Launch an **approval-based affiliate program** aimed at:
- agency operators with audiences
- consultants and educators in the agency ecosystem
- adjacent SaaS/service partners
- existing happy customers who want to refer peers

### Recommended phase-1 economics
- Default commission: `30% recurring for 12 months` on collected subscription revenue
- Cookie window: `90 days`
- Commission hold: `30 days` after collection before payout approval
- Payout cadence: monthly batches
- Payout execution: manual in v1, using approved ledger + CSV/export
- Bonus layer:
  - first `5` paid customers: launch bonus
  - first `10` paid customers: larger milestone bonus
  - optional quarterly leaderboard contest for top partners

Reasoning:
- The product has relatively modest ACVs versus enterprise SaaS, so commissions must still feel material
- 30% recurring is easier to sustain than 50% recurring while remaining serious enough to recruit good partners
- Monthly manual payout keeps scope light while still making the program real

## Approaches
### 1) Creem-Native Affiliate Program + Thin Internal Views
Scope:
- Use Creem affiliate/revenue-split features as the source of truth
- Add only minimal internal admin visibility inside this product
- Keep partner portal and commission logic mostly external/vendor-managed

Pros:
- Fastest time to first program launch
- Lowest engineering lift for attribution and payout logic
- Uses the existing billing provider

Cons:
- Weak open-source alignment
- Attribution and commission rules become vendor-constrained
- Harder to tailor partner UX or add product-specific fraud rules
- Increases switching cost later

### 2) Full OSS External Affiliate Platform Integration (Refferq-First)
Scope:
- Self-host an OSS affiliate platform
- Sync leads, customers, invoices, and commission state across systems
- Use the external tool as partner/admin source of truth

Pros:
- Strongest open-source posture
- Includes many “full program” features out of the box
- Faster than building every portal/admin screen ourselves

Cons:
- Integration tax is high
- Auth, billing mapping, and attribution ownership become split across products
- Product surface feels bolted on unless heavily customized
- Risky for early-stage operational simplicity

### 3) First-Party Affiliate Domain Model + OSS Tracking Components (Recommended)
Scope:
- Build affiliate management, attribution, and commission ledger in this repo
- Use OSS components selectively for link management and analytics
- Keep payout execution manual at first, but system-track everything needed for repeatable monthly payouts

Pros:
- Best fit with current repo architecture and admin surfaces
- Keeps attribution and commission rules first-party
- Strong OSS alignment without overfitting to an external product
- Easier to evolve from “lightweight but real” into a mature program later

Cons:
- More engineering than vendor-native mode
- Requires careful fraud/attribution design
- Needs a modest partner portal and admin surface build

## Recommendation
Choose **Approach 3**.

Implementation stance:
1. Keep the source of truth in Prisma for partners, clicks, referrals, commissions, and payout batches.
2. Track attribution first-party via redirect links and first-party cookies.
3. Use Creem webhooks only as monetization events, not as the primary affiliate system.
4. Keep payout execution manual in phase 1.
5. Prefer OSS link/analytics components only where they reduce commodity work:
   - `Dub` as an optional OSS accelerator for short-link infrastructure
   - `Plausible` as an optional self-hosted reporting layer
   - existing `PostHog` for product funnel instrumentation

## Recommended Architecture
### Core domain objects
- `AffiliatePartner`
  - profile, approval status, default commission settings, partner auth identity
- `AffiliateLink`
  - unique referral code, destination, campaign metadata
- `AffiliateClick`
  - click token, link, partner, referrer, UTM fields, hashed device/network signals
- `AffiliateReferral`
  - claimed signup/agency record tied to the winning partner attribution
- `AffiliateCommission`
  - pending/approved/paid/void amounts tied to invoice/revenue events
- `AffiliatePayoutBatch`
  - monthly operational grouping for approved commissions and export

### Attribution model
- Public link format: `/r/[code]` on the web app domain
- Next.js route handler sets a first-party `HttpOnly` cookie with the click token and 90-day TTL
- Redirect request records click metadata server-side before sending user to landing page
- On signup / checkout creation, the affiliate cookie is claimed and attached to the new agency/referral
- On Creem `invoice.paid`, backend creates or extends commission records from collected revenue
- Refund / failure / cancelation events adjust commission status before payout

### Partner-facing UX
- `/affiliate` or `/partners` public page explaining the program
- application form
- approved partner portal:
  - overview stats
  - links / campaigns
  - clicks, signups, paid, MRR influenced
  - pending / approved / paid commissions
  - promo kit / swipe copy

### Internal admin UX
- internal affiliate overview
- partner review queue
- partner detail page
- commission review table
- payout batch/export page

## Proposed Phase-1 Scope
### In scope
- Public affiliate landing page
- Affiliate application + approval workflow
- Partner auth and lightweight partner portal
- Referral links and first-party click tracking
- Signup and checkout attribution
- Commission ledger from invoice events
- Internal admin management pages
- Monthly payout batch generation and export
- Basic fraud rules and manual review tooling
- Swipe-copy / partner asset library in a lightweight form

### Out of scope for phase 1
- Automated payout rails (Stripe Connect, Wise, PayPal API execution)
- Multi-tier / sub-affiliate networks
- Coupon-code-only attribution as a primary path
- Marketplace discovery or public searchable partner directory
- Complex rev-share customization by product SKU beyond simple overrides
- Tax form automation

## Risks and Design Tensions
- Affiliate fraud is the biggest hidden scope cost. Self-referrals, duplicate accounts, refund abuse, and internal-team referrals need explicit rules from day one.
- Affiliate auth can sprawl if it reuses the same onboarding assumptions as agencies. Keep partner flows isolated in a dedicated route group.
- If partner economics are too weak, the program ships but does not recruit anyone meaningful.
- If the system depends too heavily on a vendor-owned affiliate feature, migration later gets painful.

## Open Questions
1. Should phase 1 stop at payout ledger + exports, or do you want automated payout execution immediately?
2. Do you want the program to launch as invite-only, application-only, or open signup with approval?
3. Should coupon-code attribution exist in v1, or should we force links-only attribution until the ledger is stable?
4. Do top partners need custom commission overrides in v1, or can we launch with one default plan plus manual exceptions?

## Validation Check
- Clarity: the problem, user types, architecture fit, and recommendation are explicit
- Scope boundaries: phase-1 vs later-stage program capabilities are separated cleanly
- Open questions: the main scope-changing product decisions are isolated and visible

## Research Sources
- Alex Hormozi affiliate materials:
  - https://www.acquisition.com/training/training-affiliate-blackbook
  - https://www.acquisition.com/training/training-affiliate-offer
- SaaS affiliate programs:
  - https://webflow.com/affiliates
  - https://kit.com/affiliates
  - https://www.framer.com/partners/affiliates/
  - https://www.semrush.com/affiliate-program/
- OSS / tooling:
  - https://docs.creem.io/payments-and-checkout/affiliate-integration
  - https://docs.creem.io/payments-and-checkout/revenue-splits
  - https://github.com/dubinc/dub
  - https://plausible.io/docs/self-hosting
  - https://refferq.com/
  - https://github.com/bytebeacon/refferq

## Handoff
Ready for `workflow-plan`.
