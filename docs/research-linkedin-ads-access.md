# LinkedIn Ads Access Workflows for Marketing Agencies

**Research Date:** March 1, 2026
**Document Version:** 1.0

---

## Executive Summary

LinkedIn Campaign Manager uses a role-based access control system with five distinct permission levels. Unlike other platforms (Meta, Google), LinkedIn separates **Company Page access** from **Ad Account access**, requiring different permission scopes for each. Agency access is granted through OAuth 2.0 with specific scopes (`r_ads`, `rw_ads`) and requires members to be connected on LinkedIn before access can be assigned.

---

## Table of Contents

1. [LinkedIn Campaign Manager Structure](#linkedin-campaign-manager-structure)
2. [Account Types & Hierarchy](#account-types--hierarchy)
3. [Permission Levels](#permission-levels)
4. [Step-by-Step Agency Access Workflow](#step-by-step-agency-access-workflow)
5. [Company Page vs. Ad Account Access](#company-page-vs-ad-account-access)
6. [OAuth Scopes & Security](#oauth-scopes--security)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [Comparison: LinkedIn vs. Meta/Google/TikTok](#comparison-linkedin-vs-metagoogletiktok)
9. [Key Differences for Agencies](#key-differences-for-agencies)

---

## LinkedIn Campaign Manager Structure

### Core Entities

| Entity | Description | URN Format |
|--------|-------------|------------|
| **Company Page** (Organization) | Entity representing a company on LinkedIn | `urn:li:organization:{id}` |
| **Ad Account** (Sponsored Account) | Umbrella for advertising management | `urn:li:sponsoredAccount:{id}` |
| **Campaign Group** | Container for related campaigns | `urn:li:sponsoredCampaignGroup:{id}` |
| **Campaign** | Individual ad campaign with budget/schedule | `urn:li:sponsoredCampaign:{id}` |
| **Person** | LinkedIn member (user) | `urn:li:person:{id}` |

### Account Types

1. **BUSINESS** - Standard ad account for most advertisers
2. **ENTERPRISE** - Large organizations with advanced features (not supported by some APIs)

### Hierarchy

```
Company Page (Organization)
    |
    v
Ad Account (Sponsored Account)
    |
    +-- Campaign Group (optional)
    |      |
    |      v
    |   Campaign
    |      |
    |      v
    +-- Creatives (ads)
```

---

## Account Types & Hierarchy

### Ad Account Structure

- **Maximum 5,000 campaigns** per ad account (regardless of status)
- **Maximum 1,000 active campaigns** at any given time
- **Maximum 15 active creatives** and **85 inactive creatives** per campaign
- No limit on campaign groups per ad account
- **Maximum 2,000 campaigns** per non-default campaign group

### Account Creation Requirements

To create an Ad Account via API:
- Valid `reference` to a Company Page (`urn:li:organization:{id}`)
- Currency code (e.g., "USD")
- Account type ("BUSINESS" or "ENTERPRISE")

```json
POST https://api.linkedin.com/rest/adAccounts
{
  "currency": "USD",
  "name": "Company ABC",
  "reference": "urn:li:organization:101202303",
  "type": "BUSINESS"
}
```

---

## Permission Levels

### Ad Account Roles (5 Levels)

| Role | Permissions | Best For |
|------|-------------|----------|
| **VIEWER** | View campaign data and reports only. Cannot create/edit. | Clients wanting read-only reporting access |
| **CREATIVE_MANAGER** | View data + create/edit ads. Cannot create/edit campaigns. | Design teams managing ad creatives |
| **CAMPAIGN_MANAGER** | View data + create/edit campaigns and ads. | Campaign managers running ads |
| **ACCOUNT_MANAGER** | All of above + edit account data + manage user access. | Agency account leads |
| **ACCOUNT_BILLING_ADMIN** | All of above + access billing data + billed for account. **Only one per account.** | Client financial controllers |

**Important Notes:**
- Even with `rw_ads` (read/write) scope, VIEWER role remains read-only
- The creator of the Ad Account is assigned ACCOUNT_BILLING_ADMIN by default
- There should be **exactly one** ACCOUNT_BILLING_ADMIN per account

### Company Page Roles (8 Levels)

| Role | Description |
|------|-------------|
| **ADMINISTRATOR** | Full control: post updates, edit page, manage admins, view analytics |
| **DIRECT_SPONSORED_CONTENT_POSTER** | Create/view direct sponsored content (DSC) |
| **RECRUITING_POSTER** | Post job openings to the page |
| **LEAD_CAPTURE_ADMINISTRATOR** | View/manage landing pages, create/edit lead gen forms |
| **LEAD_GEN_FORMS_MANAGER** | Access leads from forms associated with the page |
| **ANALYST** | View private analytics data, edit competitors |
| **CURATOR** | Broadcast content to employees, view content suggestions, analytics |
| **CONTENT_ADMINISTRATOR** | Create/manage page content (updates, posts, events, jobs) |

---

## Step-by-Step Agency Access Workflow

### Prerequisites

1. **Client Requirements:**
   - Active LinkedIn Company Page
   - Active Campaign Manager Ad Account
   - Client must be connected to agency personnel on LinkedIn

2. **Agency Requirements:**
   - LinkedIn Developer Application with Marketing API access
   - Approved OAuth 2.0 scopes (`r_ads` or `rw_ads`)
   - Ad Account mapped to application (for Development Tier)

### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LINKEDIN AGENCY ACCESS WORKFLOW                   │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: OAuth Authorization
┌────────────────────────────────────────────────────────────────────┐
│  Agency App directs user to:                                        │
│  https://www.linkedin.com/oauth/v2/authorization                   │
│                                                                   │
│  Parameters:                                                       │
│  - response_type: "code"                                          │
│  - client_id: {agency_client_id}                                  │
│  - redirect_uri: {agency_callback_url}                            │
│  - state: {random_CSRF_token}                                     │
│  - scope: "r_ads" or "rw_ads"                                     │
└────────────────────────────────────────────────────────────────────┘
                              │
                              v
STEP 2: User Authorization
┌────────────────────────────────────────────────────────────────────┐
│  Client logs into LinkedIn and approves consent screen             │
│                                                                   │
│  Scope(s) requested:                                              │
│  - r_ads: Read-only access to ad accounts                         │
│  - rw_ads: Read/write access to ad accounts                       │
│                                                                   │
│  NOTE: User must consent to ALL scopes (cannot select subset)     │
└────────────────────────────────────────────────────────────────────┘
                              │
                              v
STEP 3: Authorization Code Exchange
┌────────────────────────────────────────────────────────────────────┐
│  POST https://www.linkedin.com/oauth/v2/accessToken              │
│                                                                   │
│  Body (application/x-www-form-urlencoded):                        │
│  - grant_type: "authorization_code"                              │
│  - code: {authorization_code_from_step2}                          │
│  - redirect_uri: {same_as_step1}                                 │
│  - client_id: {agency_client_id}                                 │
│  - client_secret: {agency_client_secret}                         │
│                                                                   │
│  Response includes:                                               │
│  - access_token (~500 chars, valid 60 days)                      │
│  - expires_in (seconds until expiration)                         │
│  - refresh_token (if approved for programmatic refresh)          │
│  - refresh_token_expires_in (usually 365 days)                   │
└────────────────────────────────────────────────────────────────────┘
                              │
                              v
STEP 4: Fetch Ad Accounts
┌────────────────────────────────────────────────────────────────────┐
│  GET https://api.linkedin.com/rest/adAccounts                     │
│  Authorization: Bearer {access_token}                             │
│                                                                   │
│  Returns list of ad accounts the user has access to              │
└────────────────────────────────────────────────────────────────────┘
                              │
                              v
STEP 5: Grant User Access to Ad Account
┌────────────────────────────────────────────────────────────────────┐
│  PUT https://api.linkedin.com/rest/adAccountUsers/                │
│       account=urn:li:sponsoredAccount:{account_id}&               │
│       user=urn:li:person:{person_id}                              │
│                                                                   │
│  Body:                                                            │
│  {                                                                │
│    "account": "urn:li:sponsoredAccount:123456789",               │
│    "role": "CAMPAIGN_MANAGER",  // or other role                  │
│    "user": "urn:li:person:qZXYVUTSR"                            │
│  }                                                                │
│                                                                   │
│  Valid roles:                                                     │
│  - VIEWER                                                         │
│  - CREATIVE_MANAGER                                               │
│  - CAMPAIGN_MANAGER                                               │
│  - ACCOUNT_MANAGER                                                │
│  - ACCOUNT_BILLING_ADMIN                                          │
└────────────────────────────────────────────────────────────────────┘
                              │
                              v
STEP 6: Verify Access
┌────────────────────────────────────────────────────────────────────┐
│  GET https://api.linkedin.com/rest/adAccountUsers/                │
│       account=urn:li:sponsoredAccount:{account_id}               │
│  Authorization: Bearer {access_token}                             │
│                                                                   │
│  Returns all users with access to the ad account                 │
└────────────────────────────────────────────────────────────────────┘
```

### UI-Based Access (Alternative to API)

For clients who prefer manual setup:

1. Client logs into Campaign Manager
2. Clicks gear icon (upper right) → "Manage Access"
3. Searches for agency personnel by name/email
4. **Must be connected on LinkedIn** (requirement)
5. Selects appropriate role from dropdown
6. Clicks "Invite" or "Add"

---

## Company Page vs. Ad Account Access

### Key Differences

| Aspect | Company Page | Ad Account (Campaign Manager) |
|--------|--------------|-------------------------------|
| **Purpose** | Organic content, brand presence | Paid advertising |
| **OAuth Scopes** | `w_organization_social`, `r_organization_social` | `r_ads`, `rw_ads` |
| **Role Count** | 8 roles | 5 roles |
| **Connection Requirement** | Must be connected to add users | Must be connected to add users |
| **Access Management** → "Manage Admins" | Gear icon → "Manage Access" |
| **API Access** | Community Management API | Marketing API (Advertising) |

### When Agencies Need Each

**Company Page Access Required For:**
- Posting organic content on behalf of client
- Managing page administrators
- Viewing page analytics
- Lead generation forms (organic)

**Ad Account Access Required For:**
- Creating/managing ad campaigns
- Managing ad creatives
- Viewing campaign performance
- Accessing campaign-level data
- Managing campaign budget

### Scenarios

| Scenario | Required Access |
|----------|-----------------|
| **Run paid ads only** | Ad Account with CAMPAIGN_MANAGER role |
| **Manage organic + paid** | Both: Company Page (CONTENT_ADMINISTRATOR) + Ad Account (CAMPAIGN_MANAGER) |
| **View-only reporting** | Ad Account with VIEWER role |
| **Full account management** | Ad Account with ACCOUNT_MANAGER role |
| **Creative management only** | Ad Account with CREATIVE_MANAGER role |

---

## OAuth Scopes & Security

### Available Scopes for Marketing APIs

| Scope | Description | Required For |
|-------|-------------|--------------|
| `r_ads` | Read access to ad accounts | VIEWER role, reporting only |
| `rw_ads` | Read/write access to ad accounts | CAMPAIGN_MANAGER, CREATIVE_MANAGER, ACCOUNT_MANAGER, ACCOUNT_BILLING_ADMIN |
| `r_organization_social` | Read organization posts and analytics | Company page analytics |
| `w_organization_social` | Post/interact on behalf of organization | Posting organic content |
| `r_liteprofile` | Basic profile info (name, photo) | User identification |
| `r_emailaddress` | User's email address | Contact information |

### Security Best Practices

#### 1. Token Storage
- **NEVER** store access tokens in client-side files (JavaScript, HTML)
- **NEVER** store tokens in code files that can be decompiled
- **ALWAYS** use secure server-side storage
- **ALWAYS** use HTTPS for all API calls

#### 2. Token Management
```typescript
// Access token lifecycle
- Access token valid for: 60 days
- Refresh token valid for: 365 days (if approved for programmatic refresh)
- On refresh: New access token (60 days) + same refresh token TTL
- After 365 days: User must reauthorize through full OAuth flow
```

#### 3. CSRF Protection
- Always include a unique `state` parameter in OAuth requests
- Verify the returned `state` matches the original value
- Use cryptographically random values (e.g., `DCEeFWf45A53sdfKef424`)

#### 4. Scope Minimization
- Request only the minimum scopes needed
- Use `r_ads` for read-only access instead of `rw_ads`
- Explain to users why each scope is needed

#### 5. Redirect URL Rules
- URLs must be absolute (e.g., `https://example.com/callback`, not `/callback`)
- URL parameters are ignored (everything after `?` stripped)
- URLs cannot include `#` fragments
- Must use HTTPS

#### 6. Error Handling
- Handle `401 Unauthorized` by retriggering OAuth flow
- Handle `invalid_grant` (expired/revoked tokens) by requesting new authorization
- Handle rate limiting (HTTP 429) with exponential backoff
- Log all API errors for debugging

---

## Common Issues & Solutions

### Issue 1: "User not found" when granting access

**Cause:** The agency personnel is not connected to the client on LinkedIn.

**Solution:**
- Agency personnel must send a connection request to the client
- Client must accept the connection before access can be granted
- This is a hard requirement by LinkedIn

### Issue 2: Access token expires before expected

**Cause:** Tokens may be revoked by LinkedIn or the user for various reasons.

**Solution:**
- Implement token refresh logic if approved for programmatic refresh
- Fall back to full OAuth flow if refresh fails
- Monitor token expiration and proactively refresh

### Issue 3: API returns 403 Forbidden

**Cause:** User lacks required role or scope permissions.

**Solution:**
- Verify user has appropriate Ad Account role
- Check that OAuth token includes required scopes
- Some endpoints require specific role + scope combinations

### Issue 4: Cannot see all ad accounts

**Cause:**
- Application not mapped to ad account (Development Tier limitation)
- User doesn't have access to those accounts
- API tier restrictions

**Solution:**
- Map ad accounts in Developer Portal (Products → Advertising API → View Ad Accounts)
- Upgrade from Development to Standard tier for production
- Verify user has appropriate roles

### Issue 5: VIEWER role can't see data despite rw_ads scope

**Cause:** VIEWER role is read-only regardless of scope.

**Solution:**
- Upgrade user to CREATIVE_MANAGER or higher for write access
- Use `r_ads` scope for VIEWER roles instead of `rw_ads`

### Issue 6: Company page access not working

**Cause:** Using wrong OAuth scopes or API endpoints.

**Solution:**
- Use Community Management API for company pages
- Request `w_organization_social` or `r_organization_social` scopes
- Note: Company Page and Ad Account are separate entities

### Issue 7: Reporting data doesn't match Campaign Manager

**Cause:** LinkedIn adds privacy protection noise to granular data.

**Solution:**
- Metrics may vary by ±3 units for privacy
- Use full time periods instead of aggregating daily data
- Use highest reporting level possible (account vs campaign)
- This is expected behavior, not an error

### Issue 8: Rate Limiting (HTTP 429)

**Cause:** Too many API calls in short period.

**Solution:**
- Implement exponential backoff
- Respect rate limit headers
- Use batch operations when available
- Some endpoints have additional granular rate limits

---

## Comparison: LinkedIn vs. Meta/Google/TikTok

### Account Hierarchy

| Platform | Hierarchy | Key Difference |
|----------|-----------|-----------------|
| **LinkedIn** | Company Page → Ad Account → Campaign Group → Campaign | Company Page and Ad Account are SEPARATE entities |
| **Meta** | Business Manager → Ad Account → Campaign → Ad Set | Single integrated system |
| **Google** | Manager Account → Customer Account → Campaign → Ad Group | Hierarchical manager account structure |
| **TikTok** | Organization → Advertiser → Campaign → Ad Group | Similar to Meta, simpler than LinkedIn |

### Permission Levels

| Platform | Role Count | Unique Characteristic |
|----------|------------|----------------------|
| **LinkedIn** | 5 (Ad Account) | VIEWER is read-only even with write scope |
| **Meta** | 8+ (varies) | Granular permissions per asset |
| **Google** | 10+ | Very granular, role-based access |
| **TikTok** | 3-4 | Simpler, less granular |

### OAuth Token Lifetime

| Platform | Access Token | Refresh Token | Notes |
|----------|--------------|---------------|-------|
| **LinkedIn** | 60 days | 365 days (if approved) | Programmatic refresh requires approval |
| **Meta** | 60 days | 60 days | Can extend to 90 days with System User |
| **Google** | 60 minutes | N/A (uses refresh immediately) | Short-lived access, long-lived refresh |
| **TikTok** | 24 hours | N/A | Very short-lived, requires frequent refresh |

### Connection Requirement

| Platform | Requires User Connection? |
|----------|---------------------------|
| **LinkedIn** | **YES** - Must be connected on LinkedIn to grant access |
| **Meta** | NO - Can grant access to any email |
| **Google** | NO - Can grant access to any Google account |
| **TikTok** | NO - Can grant access to any TikTok account |

### API Access Tiers

| Platform | Tiers | Key Difference |
|----------|-------|-----------------|
| **LinkedIn** | Development, Standard | Development: 5 accounts max, requires upgrade |
| **Meta** | Basic, Standard, Advanced | Different rate limits and features |
| **Google** | Standard, Test (for testing) | Test accounts for development |
| **TikTok** | Sandbox, Production | Sandbox for testing |

---

## Key Differences for Agencies

### 1. Connection Requirement (LinkedIn-Only)

LinkedIn requires the client and agency personnel to be **connected on LinkedIn** before access can be granted. This is unique among major ad platforms.

**Impact on Onboarding:**
- Additional step: Send and accept LinkedIn connection
- Cannot automate access without prior connection
- May delay onboarding if client unresponsive

**Workaround:**
- Include connection step in onboarding checklist
- Use LinkedIn Sales Navigator to find and connect with client contacts
- Create template connection request message

### 2. Separate Company Page vs. Ad Account

LinkedIn treats Company Page (organic) and Ad Account (paid) as completely separate entities with different:
- OAuth scopes
- API endpoints
- Role systems
- Access management UI

**Impact on Agency Workflows:**
- May need to request access to both entities
- Separate OAuth flows for organic vs. paid
- Different permission requirements

**Best Practice:**
- Clarify with client whether agency needs both or just one
- Request appropriate access based on services provided
- Document which entity was granted access

### 3. VIEWER Role Limitations

Even with `rw_ads` scope, VIEWER role remains strictly read-only. This is different from other platforms where scope typically overrides role.

**Impact:**
- Cannot "upgrade" VIEWER to write access via scope
- Must change role in Campaign Manager or via API
- Potential confusion for clients expecting read-write access

**Solution:**
- Use CREATIVE_MANAGER as minimum for any write access
- Document role vs. scope distinction clearly

### 4. Programmatic Refresh (Requires Approval)

LinkedIn requires special approval for programmatic refresh tokens. Not all applications get this by default.

**Impact:**
- May need users to reauthorize every 60 days
- Cannot automatically refresh tokens without approval
- More manual intervention required

**Application Process:**
- Apply through LinkedIn Developer Support
- Demonstrate valid use case
- Technical sign-off may be required

### 5. URN-Based Identifiers

LinkedIn uses URN (Uniform Resource Name) format for all identifiers:
- `urn:li:sponsoredAccount:123456789`
- `urn:li:person:qZXYVUTSR`
- `urn:li:organization:101202303`

**Impact:**
- Must format IDs as URNs for API calls
- Different from other platforms using numeric IDs
- Adds complexity to API integration

**Best Practice:**
- Create helper functions for URN formatting
- Store both raw ID and URN in database
- Document URN format requirements

---

## API Quick Reference

### Key Endpoints

| Action | Method | Endpoint |
|--------|--------|----------|
| Get authorization URL | GET | `https://www.linkedin.com/oauth/v2/authorization` |
| Exchange code for token | POST | `https://www.linkedin.com/oauth/v2/accessToken` |
| Get ad accounts | GET | `https://api.linkedin.com/rest/adAccounts` |
| Get account users | GET | `https://api.linkedin.com/rest/adAccountUsers` |
| Grant user access | PUT | `https://api.linkedin.com/rest/adAccountUsers/` |
| Remove user access | DELETE | `https://api.linkedin.com/rest/adAccountUsers` |
| Get ad account users | GET | `https://api.linkedin.com/rest/adAccountUsers` |

### Role Assignment Example

```typescript
// Grant CAMPAIGN_MANAGER access to agency user
const response = await fetch(
  `https://api.linkedin.com/rest/adAccountUsers/` +
  `account=urn:li:sponsoredAccount:${accountId}&` +
  `user=urn:li:person:${personId}`,
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account: `urn:li:sponsoredAccount:${accountId}`,
      role: 'CAMPAIGN_MANAGER',
      user: `urn:li:person:${personId}`
    })
  }
);
```

---

## Sources & References

### Official Documentation

1. **Account Access Controls** - [Microsoft Learn](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads/account-structure/account-access-controls)
   - Complete reference for ad account roles and permissions

2. **Authorization Code Flow (OAuth 2.0)** - [Microsoft Learn](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
   - Step-by-step OAuth implementation guide

3. **Key Concepts** - [Microsoft Learn](https://learn.microsoft.com/en-us/linkedin/marketing/getting-started)
   - Company Page vs. Ad Account relationship

4. **Campaign Management** - [Microsoft Learn](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads/getting-started)
   - Creating campaigns, campaign groups, and ad accounts

5. **Programmatic Refresh Tokens** - [Microsoft Learn](https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens)
   - Refresh token implementation (for approved partners)

6. **Marketing API Terms** - [LinkedIn Legal](https://www.linkedin.com/legal/l/marketing-api-terms)
   - Legal terms and requirements for Marketing API usage (revised March 19, 2025)

7. **Sign in to Campaign Manager** - [LinkedIn Business](https://business.linkedin.com/marketing-solutions/sign-in)
   - Getting started with Campaign Manager

---

## Appendix

### Glossary

| Term | Definition |
|------|------------|
| **URN** | Uniform Resource Name - LinkedIn's ID format (e.g., `urn:li:sponsoredAccount:123`) |
| **Sponsored Account** | Another term for Ad Account in LinkedIn's system |
| **3-Legged OAuth** | OAuth flow requiring user authorization (standard OAuth 2.0) |
| **CSRF** | Cross-Site Request Forgery - prevented by `state` parameter |
| **DSC** | Direct Sponsored Content - ads created directly without going through company page feed |

### Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-03-01 | 1.0 | Initial research document |

---

**End of Document**
