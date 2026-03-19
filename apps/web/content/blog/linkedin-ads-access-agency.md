---
id: linkedin-ads-access-guide
title: 'LinkedIn Ads Access for Agencies: Step-by-Step Campaign Manager Guide (2026)'
excerpt: >-
  LinkedIn Ads access is uniquely challenging. Learn the difference between
  Company Page and Ad Account permissions, the 5 role levels, and how to
  navigate LinkedIn's connection requirement for smooth client onboarding.
category: tutorials
stage: consideration
publishedAt: '2026-01-19'
readTime: 11
author:
  name: Jon High
  role: Founder
tags:
  - LinkedIn Ads
  - Campaign Manager
  - permissions
  - client onboarding
  - LinkedIn Campaign Manager access
metaTitle: 'LinkedIn Ads Access for Agencies: Step-by-Step Campaign Manager Guide (2026)'
metaDescription: >-
  How to get LinkedIn Ads access for your agency. Complete guide to Campaign
  Manager permissions, the 5 role levels, and Company Page access.
relatedPosts:
  - meta-ads-access-guide
  - google-ads-access-guide
  - leadsie-alternatives-comparison
---
# LinkedIn Ads Access for Agencies: Step-by-Step Campaign Manager Guide

## The Unique Challenge of LinkedIn Ads Access

You've mastered Meta Business Manager. You navigate Google Ads MCC in your sleep. TikTok Ads Manager? No problem. Then comes LinkedIn—the platform that breaks every rule you've learned.

LinkedIn Campaign Manager doesn't work like other advertising platforms. It has quirks that trip up even experienced agency professionals:

- **Separate entities**: Company Page access and Ad Account access are completely different systems
- **Connection requirement**: You and your client must be connected on LinkedIn before access can be granted
- **Five permission levels**: Each with specific capabilities that don't align neatly with other platforms
- **URN-based identifiers**: LinkedIn uses unique ID formats that add complexity to API integrations

These differences turn what should be a 5-minute task into a multi-day back-and-forth. The average agency spends **6-10 hours per month** troubleshooting LinkedIn access issues alone.

This guide cuts through the complexity. You'll learn exactly how LinkedIn's access system works, how to guide clients through the process, and how to avoid the most common pitfalls.

## Understanding LinkedIn Campaign Manager Structure

Before requesting access, you need to understand LinkedIn's unique hierarchy:

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

### The Two Separate Systems

**Company Page (Organization)**: This is your client's LinkedIn business presence—their organic content, employee listings, and company updates. It's identified by a URN format like `urn:li:organization:123456789`.

**Ad Account (Sponsored Account)**: This is where paid advertising happens. It's a completely separate entity from the Company Page, even though they're connected. Ad accounts use the format `urn:li:sponsoredAccount:123456789`.

**Critical distinction**: Having access to a client's Company Page does NOT give you access to their Ad Account, and vice versa. They require separate permission grants with different OAuth scopes.

### Account Types

LinkedIn has two ad account types:

| Type | Description | Use Case |
|------|-------------|----------|
| **BUSINESS** | Standard ad account for most advertisers | 99% of clients |
| **ENTERPRISE** | Large organizations with advanced features | Fortune 500, major brands |

Most agencies will only ever work with BUSINESS accounts. ENTERPRISE accounts have additional restrictions and some API limitations.

## The Manual Way: Step-by-Step Client Instructions

### Prerequisites (Don't Skip These)

Before your client can grant access, ensure:

1. **You're connected on LinkedIn**: This is a hard requirement. The client cannot grant access to someone they're not connected to.
2. **Client has an active Campaign Manager account**: Verify they've run ads before or have an active account.
3. **You know the correct Ad Account ID**: Clients often have multiple accounts.

### Step 1: Connect on LinkedIn (If Not Already)

If you're not connected:
1. Search for your client contact on LinkedIn
2. Send a connection request with a personalized note
3. Wait for them to accept before proceeding

**Pro tip**: Include your agency email in the connection request message so they can verify your identity.

### Step 2: Client Navigates to Campaign Manager

Have your client go to [linkedin.com/adaccount](https://linkedin.com/adaccount) and log in with their LinkedIn account.

### Step 3: Access Account Settings

1. Click the **gear icon** (Account Settings) in the upper-right corner
2. Select **Manage Access** from the dropdown menu

This opens the access management panel where they can grant permissions to team members.

### Step 4: Search for Your Profile

1. In the "People" section, click **Add people**
2. Search for your name or email address
3. **Critical**: Your profile must appear in search results. If it doesn't, you're not connected on LinkedIn.

### Step 5: Select the Appropriate Role

Choose from the five available permission levels (see the detailed table below). For most campaign management work, request **CAMPAIGN_MANAGER**.

### Step 6: Send the Invitation

Click **Send invitation**. You'll receive a notification in LinkedIn and an email notification.

### Step 7: Accept the Invitation

1. Check your LinkedIn notifications
2. Navigate to Campaign Manager
3. You should now see the client's ad account in your account list

## LinkedIn Ads Permission Levels Explained

LinkedIn Campaign Manager has five distinct permission levels—more than Meta Ads, fewer than Google Ads. Understanding what each role can (and can't) do is essential for requesting the right access.

| Permission Level | Can View Campaigns | Can Create Campaigns | Can Edit Campaigns | Can Manage Users | Can Access Billing | Best For |
|-----------------|-------------------|---------------------|-------------------|-----------------|-------------------|----------|
| **VIEWER** | ✅ | ❌ | ❌ | ❌ | ❌ | Read-only reporting access |
| **CREATIVE_MANAGER** | ✅ | ❌ | ❌ | ❌ | ❌ | Creating and editing ad creatives only |
| **CAMPAIGN_MANAGER** | ✅ | ✅ | ✅ | ❌ | ❌ | Full campaign management (recommended) |
| **ACCOUNT_MANAGER** | ✅ | ✅ | ✅ | ✅ | ❌ | Agency account leads, managing team access |
| **ACCOUNT_BILLING_ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | Client financial controllers (one per account) |

### Key Role Nuances

**VIEWER**: Even if you have `rw_ads` (read/write) OAuth scope, the VIEWER role remains strictly read-only. Scope doesn't override role permissions on LinkedIn.

**CREATIVE_MANAGER**: Can create and edit ads but cannot create or edit campaigns. This is for design teams who manage creatives but not campaign strategy.

**CAMPAIGN_MANAGER**: The sweet spot for most agency work. Full campaign management without access to billing or user management.

**ACCOUNT_MANAGER**: Add this role only for the agency lead who needs to manage team access. There's usually no need for every team member to have this level.

**ACCOUNT_BILLING_ADMIN**: Only one person can hold this role per account. This should be the client, not the agency. Agencies rarely need billing access.

## Company Page vs. Ad Account: What's the Difference?

This is where most agencies get confused. LinkedIn treats these as completely separate systems:

### Company Page Access (Organic)

**Required for:**
- Posting organic content on behalf of the client
- Managing page administrators
- Viewing page analytics
- Managing lead generation forms (organic)

**Roles (8 levels)**: Administrator, Content Administrator, Analyst, Curator, Recruiting Poster, Lead Capture Administrator, Lead Gen Forms Manager, Direct Sponsored Content Poster

**OAuth scopes**: `w_organization_social`, `r_organization_social`

### Ad Account Access (Paid)

**Required for:**
- Creating and managing ad campaigns
- Managing ad creatives
- Viewing campaign performance
- Managing campaign budgets

**Roles (5 levels)**: Viewer, Creative Manager, Campaign Manager, Account Manager, Account Billing Admin

**OAuth scopes**: `r_ads`, `rw_ads`

### When You Need Both

| Scenario | Required Access |
|----------|-----------------|
| **Run paid ads only** | Ad Account with CAMPAIGN_MANAGER role |
| **Manage organic + paid** | Both: Company Page (CONTENT_ADMINISTRATOR) + Ad Account (CAMPAIGN_MANAGER) |
| **View-only reporting** | Ad Account with VIEWER role |
| **Full account management** | Ad Account with ACCOUNT_MANAGER role |
| **Creative management only** | Ad Account with CREATIVE_MANAGER role |

**Pro tip**: Clarify with your client upfront whether you're managing paid ads, organic content, or both. This determines which access you need to request.

## Common LinkedIn Ads Access Issues (And How to Fix Them)

### Issue 1: "User Not Found" When Granting Access

**The Problem**: The client searches for your name but nothing appears.

**Root Cause**: You're not connected on LinkedIn. This is a hard requirement—LinkedIn won't let you grant access to unconnected users.

**Solution**:
1. Send a connection request to your client contact
2. Have them accept the connection
3. Then retry the access grant

**Prevention**: Include connection as Step 1 in your client onboarding checklist. Don't assume you're already connected.

### Issue 2: VIEWER Role Can't See Data Despite `rw_ads` Scope

**The Problem**: Your OAuth token has read/write scope, but you still can't create or edit campaigns.

**Root Cause**: VIEWER role is read-only regardless of OAuth scope. On LinkedIn, role overrides scope.

**Solution**: Ask the client to upgrade your role to CREATIVE_MANAGER or CAMPAIGN_MANAGER. The OAuth scope alone doesn't grant write permissions.

### Issue 3: Client Grants Access But You Don't See the Account

**The Problem**: The client says they've granted access, but the account doesn't appear in your Campaign Manager.

**Potential causes and solutions**:
1. **Wrong account**: Verify they granted access to the correct ad account (clients often have multiple)
2. **Pending invitation**: Check your LinkedIn notifications for a pending invitation
3. **Not connected**: Confirm you're connected on LinkedIn (see Issue 1)
4. **Wrong email**: Verify they used the same email address as your LinkedIn profile

### Issue 4: API Returns 403 Forbidden

**The Problem**: You're trying to access the LinkedIn Marketing API but receiving 403 errors.

**Root causes**:
- User lacks required role or scope permissions
- Ad account not mapped to your developer application (Development Tier limitation)
- API tier restrictions

**Solutions**:
1. Verify user has appropriate Ad Account role
2. Check that OAuth token includes required scopes (`r_ads` or `rw_ads`)
3. Map ad accounts in Developer Portal (Products → Advertising API → View Ad Accounts)
4. Upgrade from Development to Standard tier for production

### Issue 5: Can't See All Ad Accounts

**The Problem**: You have access to one account but not others you know exist.

**Root causes**:
- Application not mapped to those accounts (Development Tier limitation)
- User doesn't have access to those specific accounts
- API tier restrictions

**Solutions**:
- Map all required ad accounts in Developer Portal
- Verify the user has been granted access to each account individually
- Consider upgrading from Development to Standard tier

### Issue 6: Access Token Expires Before Expected

**The Problem**: Your access token should be valid for 60 days but stops working sooner.

**Root causes**:
- LinkedIn revoked the token for security reasons
- User changed their LinkedIn password
- Token was invalidated by a system update

**Solutions**:
- Implement token refresh logic (if approved for programmatic refresh)
- Fall back to full OAuth flow if refresh fails
- Monitor token expiration and proactively refresh before expiry

## LinkedIn Ads vs. Other Platforms: Key Differences

Understanding how LinkedIn differs from Meta, Google, and TikTok helps set proper expectations with clients.

| Aspect | LinkedIn | Meta | Google | TikTok |
|--------|----------|------|--------|--------|
| **Connection required?** | YES | NO | NO | NO |
| **Page/Account separation?** | YES | Integrated | Integrated | Integrated |
| **Permission levels** | 5 | 8+ | 10+ | 3-4 |
| **Access token lifetime** | 60 days | 60 days | 60 minutes | 24 hours |
| **Refresh token** | 365 days* | 60 days | Immediate refresh | N/A |
| **URN-based IDs?** | YES | NO | NO | NO |

*Programmatic refresh requires special approval from LinkedIn.

### The Connection Requirement (LinkedIn-Only)

LinkedIn is the only major ad platform that requires the client and agency personnel to be connected before granting access. This unique requirement:

- Adds an extra step to onboarding
- Can delay access if clients are unresponsive to connection requests
- Cannot be automated or bypassed

**Workaround**: Include the connection step as the first item in your onboarding checklist. Create a template connection request message for clients.

### Separate Company Page vs. Ad Account

Only LinkedIn treats organic (Company Page) and paid (Ad Account) as completely separate entities with:
- Different OAuth scopes
- Different API endpoints
- Different role systems
- Different access management UI

**Impact**: You may need separate OAuth flows for organic and paid access. Clarify with clients upfront which services you're providing.

## Security Best Practices for LinkedIn Ads Access

### For Agencies:

✅ **Do**:
- Use `r_ads` scope for VIEWER roles (read-only)
- Use `rw_ads` scope for CREATIVE_MANAGER and above
- Implement token storage in secrets management (Infisical or equivalent)
- Log all token access for audit trails
- Use 2-factor authentication on agency LinkedIn accounts
- Regularly audit active client connections

❌ **Don't**:
- Never ask clients for their LinkedIn password
- Don't store access tokens in client-side code or databases
- Avoid requesting ACCOUNT_BILLING_ADMIN (this should be the client)
- Don't keep access for past clients active
- Never share agency login credentials

### Token Security

LinkedIn access tokens are valid for 60 days, with refresh tokens valid for 365 days (if approved for programmatic refresh). Treat these with the same security as passwords:

- Store tokens in encrypted secrets management (not databases)
- Never log tokens in plain text
- Implement token refresh before expiration
- Monitor for unusual API activity

## Pro Tips for Smoother LinkedIn Ads Onboarding

### 1. Create a LinkedIn Access Checklist

When onboarding new clients, verify:

- [ ] Agency personnel connected to client on LinkedIn
- [ ] Client has active Campaign Manager account
- [ ] Correct Ad Account ID identified (clients often have multiple)
- [ ] Role level determined (CAMPAIGN_MANAGER for most cases)
- [ ] Separate Company Page access requested (if managing organic)

### 2. Standard Email Template

> Subject: LinkedIn Ads Access Request - [Client Name]
>
> Hi [Client Name],
>
> To launch your LinkedIn advertising campaigns, I need access to your Campaign Manager account.
>
> **Before granting access, please verify:**
> 1. Are we connected on LinkedIn? (This is required before granting access)
> 2. Which Ad Account should I access? (Account ID: XXXXXXXXX)
>
> **To grant access:**
> 1. Go to linkedin.com/adaccount
> 2. Click the gear icon (upper right) → Manage Access
> 3. Click "Add people" and search for my name: [Your Name]
> 4. Select **CAMPAIGN_MANAGER** role
> 5. Click Send invitation
>
> I'll receive a notification once complete. This typically takes 2-3 minutes.
>
> Thanks!

### 3. Document Everything in Your Client Spreadsheet

| Client | Ad Account ID | Role | Connection Status | Date Added | Notes |
|--------|---------------|------|-------------------|------------|-------|
| Acme Corp | 123456789 | CAMPAIGN_MANAGER | ✅ Connected | 2024-01-15 | Yearly contract |

### 4. Test Access Immediately

Once granted access:
1. Log into Campaign Manager
2. Select the client's account from the dropdown
3. Verify you can see:
   - Campaign list
   - Campaign performance data
   - Ability to create a test campaign
4. Screenshot the account overview for your records

### 5. Handle Multiple Ad Accounts

Clients often have multiple ad accounts (different regions, business units, products).

**Best practice**: Ask for a complete list of all ad accounts upfront. Have the client grant access to each account individually, or use ACCOUNT_MANAGER role which provides visibility across accounts.

## Scaling Your Agency: Beyond Manual LinkedIn Ads Access

As you grow from 10 to 100 clients, consider:

1. **Automated Onboarding**: Use platforms that send guided OAuth flows, handling LinkedIn's unique requirements automatically
2. **Template Workflows**: Standardized access requests for different client types (B2B SaaS, enterprise, local business)
3. **Centralized Dashboard**: Track all LinkedIn connections in one place with status indicators
4. **Audit Logging**: Maintain records of who accessed what and when (required for SOC2 compliance)

## Key Takeaways

- LinkedIn Ads access is uniquely complex due to separate Company Page and Ad Account systems
- The **connection requirement** (must be connected on LinkedIn) is a hard prerequisite
- **CAMPAIGN_MANAGER** role is sufficient for most agency campaign management work
- **VIEWER** role remains read-only regardless of OAuth scope—role overrides scope on LinkedIn
- OAuth tokens are valid for 60 days with refresh tokens lasting 365 days (if approved)
- Always verify the correct Ad Account ID—clients often have multiple accounts
- Document all access in a client spreadsheet for future reference

**Ready to transform your LinkedIn Ads onboarding?** [Start your free trial](/pricing) and get client access in 5 minutes, not 3 days. AuthHub handles LinkedIn's unique OAuth flow, including proper scope management and secure token storage.

---

*Need help with other platforms? Read our guides for [Meta Ads access](/blog/how-to-get-meta-ads-access-from-clients), [Google Ads access](/blog/google-ads-access-agency), and [GA4 access](/blog/ga4-access-agencies).*
