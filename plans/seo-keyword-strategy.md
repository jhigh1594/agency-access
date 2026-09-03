# AuthHub — SEO & Content Plan

## Objective
Capture bottom-of-funnel commercial search traffic from people evaluating auth providers (Okta, Auth0 competitors). Build organic acquisition channel alongside paid efforts.

## Data Source
All keyword data pulled live via treg (DataForSEO) on 2026-08-11. US market, English. Total cost: $0.15 of $1.00 promo credit.

---

## Tier 1 — High-Value Targets (Build First)

### 1. "okta alternative" comparison page
- **Volume:** 90,500/mo | **KD:** 59 | **CPC:** $20.87
- **Intent:** Navigational (evaluators looking for options)
- **Action:** Long-form comparison: AuthHub vs Okta vs Auth0. Target H2s for each alternative keyword.

### 2. "auth0 alternatives" landing
- **Volume:** 320/mo | **KD:** 2 | **CPC:** $45.65
- **Intent:** Informational → Commercial
- **Action:** Dedicated /auth0-alternatives page. KD 2 = nearly free rank. Pair with okta alternative content.

### 3. "auth0 pricing" comparison
- **Volume:** 1,300/mo | **KD:** 8 | **CPC:** $12.04
- **Intent:** Commercial (active buyers checking cost)
- **Action:** "AuthHub vs Auth0 Pricing" page. Include calculator. KD 8 is very achievable.

### 4. "okta pricing" content
- **Volume:** 1,600/mo | **KD:** 0
- **Intent:** Commercial
- **Action:** Same pricing comparison page covers both auth0 and okta pricing keywords.

## Tier 2 — Build After Tier 1 Ships

| Keyword | Monthly Vol | KD | CPC | Intent | Content Type |
|---------|-----------|----|----|----|-------------|
| auth0 free tier | 170 | 13 | $4.78 | Informational | Blog: "Auth0 Free Tier Limits — What AuthHub Offers Instead" |
| okta enterprise pricing | 30 | 12 | $24.12 | Commercial | Pricing comparison page section |
| single sign-on example | 170 | 31 | — | Info/Navigational | Technical guide with AuthHub implementation |
| sso single sign on | 14,800 | 37 | $20.87 | Navigational | SSO explainer page linking to AuthHub |
| passwordless authentication | 1,000 | 20 | $34.96 | Informational | Blog/guide: "How to Add Passwordless Auth" |
| identity verification api | 260 | 36 | $101.69 | Info/Commercial | Only if AuthHub adds ID verification |

## Tier 3 — Long-tail, Compound Over Time

| Keyword | Monthly Vol | KD | Content Type |
|---------|-----------|----|-------------|
| multi-tenant authentication | 50 | 4 | Technical guide (core differentiator) |
| auth0 multi-tenant | 30 | 0 | Blog post |
| authentication as a service | 40 | 13 | Pillar page |
| best auth services | 10 | 16 | Listicle/comparison |
| plaid identity verification pricing | 20 | 12 | Only if AuthHub adds ID verification |
| passwordless authentication vs mfa | 10 | — | Blog post |

## Keywords to Skip

- **SSO portal / classlink / ISD keywords** — school-district traffic, not your ICP
- **Identity verification API keywords** — tangential unless AuthHub offers this feature
- **Passwordless authentication linux/ssh** — developer sysadmin traffic, wrong audience

## Content Architecture

```
authhub.co/
├── /compare/authhub-vs-okta          ← Tier 1 (targets "okta alternative")
├── /compare/authhub-vs-auth0         ← Tier 1 (targets "auth0 alternatives")
├── /pricing                          ← Tier 1 (targets "auth0 pricing", "okta pricing")
├── /blog/auth0-free-tier-limits      ← Tier 2
├── /blog/passwordless-auth-guide     ← Tier 2
├── /blog/multi-tenant-authentication ← Tier 3
└── /sso                              ← Tier 2 (targets "sso single sign on")
```

## Next Step
Ship the /compare/authhub-vs-okta and /compare/authhub-vs-auth0 pages first. These two pages alone target ~90K + 320/mo in evaluative search traffic. The pricing page follows as the natural conversion endpoint.
