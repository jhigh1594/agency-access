---
id: oauth-token-management-agencies
title: OAuth Token Management for Agencies (2026 Complete Guide)
excerpt: >-
  Your agency manages 150+ OAuth tokens across 30 clients and 5 platforms.
  Each one has its own expiry schedule, scope, and silent failure mode.
  Here's the token lifecycle framework that keeps campaigns running — and
  what happens when you skip it.
category: operations
stage: awareness
publishedAt: '2026-05-05'
readTime: 13
author:
  name: Jon High
  role: Founder
tags:
  - oauth token management
  - oauth token lifecycle
  - platform access management
  - oauth token refresh
  - agency operations
  - client access management
  - ad account access
metaTitle: 'OAuth Token Management for Agencies: 2026 Complete Guide'
metaDescription: >-
  OAuth token management for agencies means 150+ tokens across 5 platforms
  with different expiry rules. Learn the complete lifecycle: storage,
  refresh, monitoring, and revocation.
relatedPosts:
  - what-is-client-access-management
  - how-to-revoke-client-access-offboarding
  - agency-security-checklist
  - social-media-access-request-template
  - how-to-onboard-new-marketing-client
---

# OAuth Token Management for Agencies (2026 Complete Guide)

Your account manager checks Slack on Monday morning and finds this: "Why are our Facebook ads paused?"

You pull up the account. The Meta access token expired over the weekend. No warning. No retry. No alert. Just silence — and 52 hours of a $12,000/month client's campaigns not running.

This is what happens when you apply single-application OAuth logic to an agency's multi-client reality. Every tutorial on **OAuth token management** assumes you're building one app with one set of credentials. Agencies manage something categorically different: 30 clients × 5 platforms = 150 OAuth tokens, each on its own expiry schedule, each with its own silent failure mode.

This guide covers the complete **OAuth token management** lifecycle for agencies — from initial authorization through storage, refresh, monitoring, and revocation. The framework applies whether you're managing it manually or using a platform like [AuthHub](https://authhub.co) to automate the process.

---

## What OAuth Token Management Actually Means for Agencies

**OAuth token management** is the practice of requesting, storing, refreshing, and revoking the authorization credentials that give your agency access to client platform accounts. It's a subset of [client access management](/blog/what-is-client-access-management) — the broader operational layer that covers how agencies request, track, and maintain platform access across their entire client roster.

That definition sounds simple. The execution is not.

When you connect to a client's Meta Business Manager, Google Ads account, or GA4 property, you receive an OAuth token — a time-limited credential that authorizes specific actions on that account. Unlike a username and password, an OAuth token carries scope (what you're allowed to do), an expiry (how long it's valid), and a chain of dependencies (if a client revokes their grant, your token stops working immediately, regardless of its listed expiry).

For a single developer building a single app, OAuth token management is manageable. You store one token, refresh it periodically, and handle the occasional re-authorization.

Agencies face a different problem. You're managing tokens for dozens of clients across platforms that each have their own token behavior:

- **Meta** [long-lived user access tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived) last 60 days — no exceptions, no extensions, just expiry
- **Google Ads** [access tokens expire after one hour](https://developers.google.com/google-ads/api/docs/oauth/overview); refresh tokens are indefinite but require active refresh calls
- **LinkedIn** [access tokens last 60 days](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow); refresh tokens last 365 days but must be used before the window closes
- **TikTok Ads** access tokens last 24 hours with a refresh window of 30 days

Managing this matrix manually — across 30 clients, each with 3-5 platforms — is the operational equivalent of manually tracking subscription renewals by spreadsheet. Except when a subscription lapses, you get an email. When a token expires, a campaign goes dark.

---

## The Five Stages of the Token Lifecycle

Most agencies treat OAuth tokens as a one-time setup task. Get the access, save the token, move on. This works until the first token expires — usually at 11 PM on a Friday before a big campaign launch.

Treating **oauth token management** as a lifecycle rather than a one-time task is the difference between agencies that discover token failures and agencies that prevent them. There are five stages.

### Stage 1: Authorization (Getting the Token)

Everything starts with the client granting your agency access. For standard OAuth platforms (Meta, Google, LinkedIn, TikTok), this means:

1. Your agency sends the client an authorization link with your app's client ID, the requested scopes, and a state parameter (CSRF protection — do not skip this)
2. The client logs in to the platform and approves the requested permissions
3. The platform redirects back to your callback URL with a short-lived authorization code
4. Your backend exchanges that code for an access token and, where available, a refresh token

The authorization request is the highest-stakes step. Scopes requested here cannot be expanded without re-authorization. If you request read-only analytics access and later need write access for campaign management, you're sending the client back through the flow.

Three things agencies get wrong here:

**Insufficient scopes.** Requesting the minimum set of permissions feels polite. In practice, it means re-authorization every time your needs expand. Request the full set of scopes your agency might ever need during the initial flow — clients authorize once and forget.

**Missing CSRF state.** The state parameter on OAuth requests exists to prevent cross-site request forgery attacks against your callback endpoint. Use a random, per-request string, store it server-side (in Redis or equivalent), and verify it on callback. This is a security requirement, not an optimization.

**No error handling on denied permissions.** Clients sometimes approve partial scopes — accepting read access but declining write access, for example. Your callback handler needs to explicitly check which scopes were granted rather than assuming the full set was approved.

---

### Stage 2: Storage (Where Tokens Live)

An OAuth access token is a credential. Treat it like one.

This means: **never store tokens in plaintext in your application database.** A compromised database table shouldn't give an attacker access to 30 clients' Meta accounts, Google Ads, and GA4 properties simultaneously.

The correct approach: store tokens in a dedicated secrets management system (Infisical, HashiCorp Vault, AWS Secrets Manager, or equivalent) and keep only a reference ID in your database. When your application needs to make a platform API call, it retrieves the token from the vault at runtime.

This adds one network round-trip per token retrieval. It also means a database breach doesn't cascade into a client platform access breach.

Beyond security, storage structure affects your ability to manage the lifecycle. At minimum, each token record should track:

| Field | Purpose |
|-------|---------|
| `platformType` | Which platform (meta, google_ads, ga4, etc.) |
| `clientId` | Which client this token belongs to |
| `scopes` | What permissions are attached to this token |
| `expiresAt` | When the token expires (UTC timestamp) |
| `refreshExpiresAt` | When the refresh token itself expires |
| `lastRefreshedAt` | When you last successfully refreshed |
| `status` | active / expiring_soon / expired / revoked |

Without `expiresAt` and `refreshExpiresAt`, you can't build proactive monitoring. Without `status`, you're reactive — discovering problems when campaigns fail rather than preventing failures.

---

### Stage 3: Refresh (Keeping Tokens Alive)

Most OAuth platforms issue both an access token (short-lived) and a refresh token (longer-lived) during the initial authorization. Your application uses the refresh token to obtain new access tokens without requiring the client to re-authorize.

The operational challenge: every platform has different refresh behavior.

**Google Ads** — Access tokens expire after one hour. Refresh tokens don't expire but require an active refresh call. A background job that refreshes access tokens every 50 minutes is standard practice for Google integrations.

**Meta** — Long-lived user access tokens expire after 60 days. Meta doesn't provide a traditional refresh token. Instead, you extend the token by making a request to the `/oauth/access_token` endpoint with the current long-lived token before it expires. The window: you can re-extend any time within the 60-day validity window. After expiry, the client must re-authorize.

**LinkedIn** — Access tokens last 60 days; refresh tokens last 365 days. Refresh the access token using the refresh token before the 60-day window closes. Let the refresh token lapse and you need re-authorization.

**TikTok Ads** — Access tokens expire every 24 hours. You need automated refresh running daily at minimum.

The only way to manage this reliably across dozens of clients is automated scheduled refresh. A manual process — even with calendar reminders — fails at scale. A single missed refresh on a high-spend client can mean thousands of dollars in paused ad delivery.

Implement refresh jobs as background workers that run on a schedule appropriate to each platform. Run them more frequently than the expiry window requires: refresh Meta tokens every 45 days (not every 59), Google tokens every 45 minutes (not every 59), TikTok tokens every 20 hours. Buffer time prevents edge cases from becoming outages.

---

### Stage 4: Monitoring (Knowing Before Campaigns Know)

A token expires. Who finds out first — your client, or you?

If the answer is your client (or their new agency, or their CFO when the spend report comes in flat), your **oauth token management** is reactive. Reactive token management is a client relationship problem as much as a technical one.

Proactive monitoring requires two things: alerts before expiry and alerts on failure.

**Pre-expiry alerts.** Set threshold alerts at 30 days, 14 days, and 7 days before expiry for 60-day tokens. For 24-hour tokens, failure alerts are more practical than countdown alerts. Alert channels matter — email alerts that go to a generic operations mailbox get missed. Slack alerts to the account manager assigned to the client get acted on.

**Health checks.** Independently of expiry dates, make lightweight read requests against each connected platform account on a regular schedule (daily is sufficient for most platforms). A token can be technically valid but practically broken — the client revoked it, changed their password, removed your app from their account. Only a live API call reveals this.

**Scope drift detection.** Clients sometimes inadvertently change permissions on their end. A health check that includes a permissions verification call can catch scope reductions before they cause API errors.

The output of your monitoring system should be a simple status view: every client, every platform, every token, current status, days until expiry, last successful health check. You want this to be boring — all green, all healthy. The moment it isn't, you should know before anyone else does.

---

### Stage 5: Revocation (Ending the Lifecycle Cleanly)

When a client relationship ends, tokens don't expire automatically. They stay valid until they naturally expire — which could be weeks or months after offboarding.

This is a liability. A former client's Meta Business Manager that your agency can still access isn't a theoretical risk. It's a documented access breach waiting to surface.

Clean token revocation at offboarding means:

1. **Revoke at the platform level** — call the platform's token revocation endpoint, not just delete your local record. Deleting the database row removes your access, but doesn't invalidate the token. The token can still be used by anyone who has a copy.
2. **Revoke in the right order** — revoke child tokens before parent access. For Meta, this means revoking ad account access before Business Manager access.
3. **Confirm revocation** — make a test API call after revocation to verify the token is actually invalid. Don't trust the revocation response alone.
4. **Audit log everything** — record who revoked what, when, and from which IP. This protects you if access disputes arise later.

Full platform-by-platform offboarding instructions are covered in [how to revoke client access when offboarding](/blog/how-to-revoke-client-access-offboarding). The short version: revoke, verify, and log. In that order. Every time.

---

## Where Manual OAuth Management Breaks Down

For a small agency managing 3-5 clients on 2-3 platforms, manual OAuth token management is painful but survivable. You might have a spreadsheet, a set of calendar reminders, and a reliable account manager.

At 15+ clients, the math changes. Five platforms per client, each on a different expiry schedule, managed by multiple account managers, across clients that turn over every 6-18 months — the complexity exceeds what manual processes can reliably handle.

The failure modes are predictable:

**The Friday expiry.** Meta tokens expire on a Friday evening. The scheduled reminder went to someone who's out. Discovery: Monday morning, client message asking why spend is flat.

**The forgotten offboarding.** A client churned three months ago. Their Google Ads token is still active and attached to a team member's credentials. The team member leaves. The credentials go with them.

**The scope creep.** A token was initially authorized for read-only access. Six months later, you need write access for a new campaign type. The client isn't sure how to update permissions and the back-and-forth takes four days.

**The permission assumption.** A client grants access to their personal Facebook profile when you needed their Business Manager. Or grants access to one ad account when you needed all three. The connection shows "active" in your system because the OAuth flow completed — but the scope is wrong.

These aren't rare failures. They're the expected output of manual systems applied to a volume problem. The [client onboarding process](/blog/how-to-onboard-new-marketing-client) can be excellent; if the token management layer underneath it fails, the campaign outcomes will.

---

## The Security Layer

OAuth token management isn't just operational — it's the boundary between your agency and your clients' ad spend, analytics, and business data.

The [agency security checklist](/blog/agency-security-checklist) covers broader access security practices. For token management specifically, the non-negotiables:

**Minimum viable scopes.** Only request the permissions your agency actually uses. If you manage ads but not organic posts, don't request organic post access. Smaller scope = smaller blast radius if a token is compromised.

**Token isolation per client.** Store each client's tokens separately, with separate access controls. A single leaked credential shouldn't give access to all clients simultaneously.

**Rotation on suspected compromise.** If a team member leaves under bad terms, or if an account manager's credentials are potentially compromised, revoke and re-request affected tokens immediately. Don't wait for scheduled expiry.

**Audit logs.** Every token access — not just creation and revocation, but every API call made using an OAuth token — should produce an audit record. Timestamp, action, actor, IP. This is how you answer "who ran that campaign change at 2 AM?" with evidence rather than uncertainty.

**No token sharing across team members.** OAuth tokens should be issued to your application, not to individual employees' accounts. Employee-issued tokens break when the employee leaves. Application-issued tokens survive personnel changes.

---

## Setting Up the Access Request Layer

Token management starts before the token exists — at the authorization request.

A structured access request process sets the scope of what you're managing. Sending clients a formatted [social media access request template](/blog/social-media-access-request-template) for each platform, with specific instructions for granting the correct permissions, reduces the rate of incorrect authorizations. Fewer scope mismatches mean fewer re-authorization requests and fewer tokens with missing permissions.

The access request is also where you set expectations for re-authorization. Clients who understand they may need to re-grant access — and know exactly how to do it — are far less likely to respond to a token issue by removing access entirely and starting over.

---

## A Practical Token Management Checklist

If you're setting up or auditing your agency's OAuth token management, work through this list:

**Authorization**
- [ ] CSRF state parameter on all OAuth initiation requests
- [ ] Full scope set requested upfront — not minimum viable
- [ ] Callback handler validates state, checks granted scopes, handles partial approvals
- [ ] Client-specific error messaging when authorization fails

**Storage**
- [ ] Tokens stored in secrets management system (not in the database)
- [ ] Only secret reference IDs in the application database
- [ ] `expiresAt`, `refreshExpiresAt`, and `status` fields per token record
- [ ] Tokens scoped to client and platform (not shared)

**Refresh**
- [ ] Automated background refresh jobs per platform on appropriate schedules
- [ ] Refresh buffer time built in (refresh well before expiry, not at expiry)
- [ ] Failure handling: retry logic, team alerts on failed refresh
- [ ] Tracking for `lastRefreshedAt` and refresh failure counts

**Monitoring**
- [ ] Pre-expiry alerts at 30d / 14d / 7d (60-day tokens)
- [ ] Daily health checks via live API calls
- [ ] Alert routing to assigned account manager (not generic inbox)
- [ ] Dashboard showing token status across all clients and platforms

**Revocation**
- [ ] Revocation at platform level (not just local database deletion)
- [ ] Revocation confirmation via test API call
- [ ] Audit log entry on every revocation
- [ ] Offboarding checklist triggers token revocation automatically

---

## The Automation vs. Manual Decision

If your agency has fewer than 10 active clients and uses 2-3 platforms, manual OAuth token management with good tooling (a shared tracker, calendar reminders, a clear runbook) is viable. The operational overhead stays manageable.

Beyond 10 clients — or if you're growing and expect to cross that threshold — the manual approach becomes a liability. The complexity scales faster than headcount.

Platforms like [AuthHub](https://authhub.co) handle the lifecycle management layer: automated token refresh on platform-specific schedules, pre-expiry monitoring with account-manager-level alerts, secrets vault storage, and audit logging built in. The tradeoff is platform dependency versus operational risk. For most growth-stage agencies, reducing the operational risk is the right call.

What you're trying to avoid isn't just campaign downtime — it's the category of problem where a client discovers an issue before you do. That's the actual cost of inadequate oauth token management. Not just the hours spent firefighting. The trust.

---

## One Token, One Job

OAuth tokens are not passwords. They're temporary, scoped credentials with a defined lifecycle — and that lifecycle requires active management.

The agency that treats token management as a one-time setup task will lose campaigns to expiry. The agency with a structured token lifecycle — authorization, storage, refresh, monitoring, revocation — runs the same client accounts with less operational overhead and fewer surprise outages.

The difference between those two agencies isn't technical complexity. It's whether someone owns the problem before the token expires.
