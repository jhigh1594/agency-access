/**
 * Blog posts data
 * Content following the 90-day content strategy plan
 */

import { BlogPost } from "./blog-types";

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "meta-ads-access-guide",
    slug: "how-to-get-meta-ads-access-from-clients",
    title: "How to Get Meta Ads Access From Clients: The Complete 2024 Guide",
    excerpt: "Stop chasing clients for Facebook and Instagram Ads access. Learn the exact steps to get Meta Ads authorization in minutes, plus common troubleshooting tips that save hours.",
    content: `
# How to Get Meta Ads Access From Clients: The Complete 2024 Guide

## The Hidden Time Drain Killing Agency Efficiency

You've been there. A new client signs on, excited to scale their advertising. You're ready to launch campaigns, optimize creatives, and drive results. But first, you need access to their Meta Ads account.

What should take 5 minutes inevitably turns into a 3-day back-and-forth email thread:

*"Hey, can you grant me access?"*  
*"I don't see your request."*  
*"Can you try this link instead?"*  
*"Which email should I use?"*  
*"It says you already have access?"*

This isn't just annoying—it's expensive. The average agency loses **8-12 hours per month** chasing client access across all platforms. That's lost billable time, delayed launches, and frustrated clients on both sides.

## Why Meta Ads Access Is So Challenging

Meta's Business Manager system (now Meta Business Suite) is powerful but complex. Clients often:

- Don't understand the difference between personal profiles and Business Managers
- Have multiple ad accounts across different Business Managers
- Are unsure which permission level to grant
- Use outdated authorization workflows
- Have previous agency connections that need removal

## The Manual Way: Step-by-Step Instructions for Clients

### Step 1: Navigate to Meta Business Suite

Have your client go to [business.facebook.com](https://business.facebook.com) and log in with their Facebook account.

### Step 2: Open Business Settings

In the left sidebar, click **Business Settings** (under the gear icon).

### Step 3: Add Your Agency as a Partner

1. On the left sidebar, click **Accounts** → **Ad Accounts**
2. Select the ad account(s) they want to grant access to
3. Click **Add People** → **Add a Partner**
4. Enter your agency's **Business ID** (you can find this in your own Business Settings)

### Step 4: Select Permission Level

Choose the appropriate access level:

- **Admin Access**: Full control (create, edit, delete campaigns)
- **Advertiser Access**: Create and edit campaigns (recommended for most agencies)
- **Analyst Access**: View-only access for reporting
- **Campaign Analyst**: View specific campaigns only

### Step 5: Confirm and Wait for Acceptance

The client clicks **Confirm**, and you'll receive a notification in your Meta Business Suite to accept the invitation.

## Common Issues (And How to Fix Them)

### Issue 1: "I Don't See the Request"

**Solution**: Make sure the client is looking in the right place. Requests appear in:
- Meta Business Suite → Notifications
- Business Settings → Users → Partner Requests

### Issue 2: Multiple Business Managers

**Solution**: Clients often have ad accounts spread across multiple Business Managers. Have them grant access from each one, or consolidate accounts first.

### Issue 3: Previous Agency Still Has Access

**Solution**: The client must remove the old agency partner before adding you. Go to **Business Settings** → **Users** → **Partner Accounts**, select the old partner, and click **Remove**.

### Issue 4: "Which Permission Level Should I Choose?"

**Solution**: Most agencies need **Ad Account Advertiser** access. This lets you manage campaigns without accessing billing information. Only request Admin access if you need to manage payment methods.

## A Better Way: The Single-Link Solution

What if you could skip all this back-and-forth? With **Agency Access Platform**, you simply:

1. Create an access request with the platforms you need (Meta Ads, Google Ads, GA4, etc.)
2. Send your client a single branded link
3. Your client clicks through, authorizes each platform with OAuth, and you're done

**47 email threads → 1 link. 3 days → 5 minutes.**

The platform handles:
- Guided OAuth flows for each platform
- Automatic permission requests
- Token storage (encrypted with Infisical)
- Asset selection (ad accounts, pages, catalogs)
- Audit logging for compliance

## Meta Ads Access Permissions Explained

Understanding the different access levels helps you request the right permissions:

| Permission Level | Can Create Campaigns | Can Edit Campaigns | Can Delete | Can View Billing | Use Case |
|-----------------|---------------------|-------------------|-----------|-----------------|-----------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | Full account management |
| **Advertiser** | ✅ | ✅ | ❌ | ❌ | Campaign management (most common) |
| **Analyst** | ❌ | ❌ | ❌ | ❌ | Reporting and insights only |
| **Campaign Analyst** | ❌ | ❌ | ❌ | ❌ | View specific campaigns only |

## Pro Tips for Smoother Access Requests

### 1. Create a Template

Save your standard access request as a template. Include:
- Platforms needed (Meta Ads, Google Ads, GA4)
- Permission level (Advertiser is standard)
- Ad account IDs (if known)
- Timeline expectation ("Please complete within 24 hours")

### 2. Provide Screenshots

Send your client annotated screenshots showing exactly where to click. Many clients are visual learners and appreciate the guidance.

### 3. Use a Dedicated Agency Email

Always use the same email address for access requests (e.g., agency@youragency.com). This prevents confusion and makes it easier to track connections.

### 4. Document Everything

Once you have access, screenshot the ad account overview showing:
- Account ID
- Account name
- Your permission level
- Timezone

Store this in your client onboarding folder for future reference.

## Security Best Practices

When handling client Meta Ads access:

✅ **Do**:
- Use OAuth authentication when possible
- Enable two-factor authentication on your agency Business Manager
- Document access levels and asset assignments
- Regularly audit active connections

❌ **Don't**:
- Never ask clients for their Facebook password
- Don't share your agency login credentials
- Avoid requesting unnecessary permissions
- Don't keep access for past clients active

## Scaling Your Agency: Beyond Manual Access

As your agency grows from 10 to 100 clients, manual access management becomes a bottleneck. Consider:

1. **Templates**: Create standardized access request templates for different client types (e-commerce, lead gen, local business)
2. **Automated Workflows**: Use platforms that send automated reminders for pending access requests
3. **Centralized Dashboard**: Track all client connections in one place
4. **Audit Logs**: Maintain records of who granted access and when (required for SOC2 compliance)

## Key Takeaways

- Meta Ads access shouldn't take 3 days—it should take 5 minutes
- Clear instructions and screenshots reduce back-and-forth
- Standard templates scale your onboarding process
- Automation platforms eliminate manual access requests entirely

**Ready to transform your client onboarding?** [Start your free trial](/pricing) and see how 50+ agencies have reduced onboarding time by 90%.

---

*Need help with other platforms? Check out our guides for [Google Ads access](/blog/google-ads-access-agency), [GA4 access](/blog/ga4-access-agencies), and [LinkedIn Ads access](/blog/linkedin-ads-access-guide).*
`,
    category: "tutorials",
    stage: "consideration",
    publishedAt: "2024-01-15",
    readTime: 8,
    author: {
      name: "Sarah Chen",
      role: "Head of Partnerships",
    },
    tags: ["Meta Ads", "Facebook Ads", "Instagram Ads", "client onboarding"],
    metaTitle: "How to Get Meta Ads Access From Clients: 2024 Guide",
    metaDescription: "Stop chasing clients for Facebook and Instagram Ads access. Step-by-step guide to get Meta Ads authorization in minutes, plus troubleshooting tips.",
    relatedPosts: [
      "google-ads-access-guide",
      "ga4-access-guide",
      "client-onboarding-47-email-problem",
    ],
  },
  {
    id: "google-ads-access-guide",
    slug: "google-ads-access-agency",
    title: "Google Ads Access Guide: How Clients Grant Agency Permissions",
    excerpt: "The complete guide to getting Google Ads manager account access. Learn the difference between MCC, manager accounts, and direct access—plus how to avoid the most common permission errors.",
    content: `
# Google Ads Access Guide: How Clients Grant Agency Permissions

## Google's Unique Multi-Product Challenge

Google isn't just one platform—it's an entire ecosystem. When you need client access, you're often dealing with:

- **Google Ads** (formerly AdWords)
- **Google Analytics 4** (GA4)
- **Google Tag Manager** (GTM)
- **Google Merchant Center**
- **Google Search Console**
- **YouTube Ads**

Each has its own access system, and clients often confuse them. This guide focuses specifically on **Google Ads**, but we'll also cover how the Google ecosystem connects.

## Understanding Google Ads Account Structure

Before requesting access, understand the hierarchy:

MCC (Manager Account)
  ├── Client Account 1
  ├── Client Account 2
  └── Client Account 3

- **MCC (My Client Center)**: Also called a Manager Account, this lets agencies manage multiple client accounts from one dashboard
- **Client Account**: The individual Google Ads account containing campaigns, ad groups, and ads

**Pro Tip**: As an agency, you should have your own MCC. All client accounts are then linked under your manager account for centralized management.

## The Manual Way: Step-by-Step Client Instructions

### Option 1: Linking to Your Agency's MCC (Recommended)

This is the cleanest approach. The client links their account to your manager account, and you manage everything from one dashboard.

#### Step 1: Get Your Agency's MCC ID

1. Log into your Google Ads account
2. Click the **account selector** (top right, shows your account ID)
3. Your **10-digit MCC ID** is displayed (e.g., 123-456-7890)

#### Step 2: Send Your Client These Instructions

Have your client follow these exact steps:

1. Log into [Google Ads](https://ads.google.com)
2. Click **Tools & Settings** (wrench icon, top right)
3. Under **Setup**, click **Account link** → **Manager account**
4. Enter your agency's **10-digit MCC ID** (include hyphens: 123-456-7890)
5. Select **Account Admin** or **Standard** access level
6. Click **Send request**

### Option 2: Direct Email Invitation

If your client prefers, you can send an email invitation:

1. In your MCC, click **Tools & Settings** → **Account link** → **Manager account**
2. Click the **+** button → **Link existing account**
3. Enter the client's **Customer ID** (10 digits, found in their account URL)
4. Select access level
5. Click **Send invitation**

## Google Ads Permission Levels Explained

Google Ads has more granular permissions than most platforms:

| Access Level | Can Create | Can Edit | Can Delete | Can View Billing | Email Notifications | Best For |
|--------------|-----------|----------|-----------|-----------------|-------------------|----------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | Full account management |
| **Standard** | ✅ | ✅ | ❌ | ❌ | ✅ | Campaign management (recommended) |
| **Read-only** | ❌ | ❌ | ❌ | ❌ | ✅ | Reporting and monitoring |
| **Email-only** | ❌ | ❌ | ❌ | ❌ | ✅ | Notifications only |

## Common Google Ads Access Issues (And Fixes)

### Issue 1: "Account Already Linked to Another Manager"

**The Problem**: Google allows only **one** manager account link per client account. If the client's previous agency never removed their link, you can't link yours.

**Solution**: 
- Have the client go to **Tools & Settings** → **Account link** → **Manager account**
- Select the old manager account
- Click **Unlink**
- Now they can link your MCC

### Issue 2: Wrong Customer ID Format

**The Problem**: Google Ads Customer IDs are 10 digits with hyphens (123-456-7890), but clients often omit the hyphens or provide the wrong number.

**Solution**: 
- The Customer ID is in the account URL: ads.google.com/aw/ac/1234567890
- Format as XXX-XXX-XXXX with hyphens
- Verify by having the client screenshot their account overview

### Issue 3: Invitation Never Arrives

**The Problem**: Email invitations end up in spam, or the client uses a different email address than their Google Ads login.

**Solution**: 
- Use the MCC linking method (Option 1 above) instead of email
- Verify the client's Google Ads email address matches
- Check spam/promotions folders

### Issue 4: "You Don't Have Permission to View This Account"

**The Problem**: You received access, but can't see certain accounts or features.

**Solution**: 
- Verify you received the correct access level (Standard or Admin)
- Check that the client linked the **correct account** (clients often have multiple)
- Try accessing from the MCC dashboard vs. direct account URL

## The Google Ecosystem Advantage

One of Google's unique features: **single OAuth for multiple products**.

With Agency Access Platform, when a client authorizes Google, they can grant access to **8 products at once**:

1. Google Ads
2. Google Analytics 4 (GA4)
3. Google Tag Manager (GTM)
4. Google Merchant Center
5. Google Search Console
6. YouTube Ads
7. Google Display & Video 360
8. Campaign Manager 360

This hierarchical access is impossible with other platforms—each requires separate authorization.

## Security Best Practices for Google Ads Access

### For Agencies:

✅ **Do**:
- Maintain separate MCCs for different client tiers (enterprise, SMB, local)
- Use agency-wide 2-factor authentication
- Document all linked accounts in a client spreadsheet
- Regularly audit active links and remove past clients

❌ **Don't**:
- Never ask for client Google login credentials
- Don't use the same MCC for personal and client accounts
- Avoid requesting unnecessary admin privileges
- Don't keep access for inactive clients

### For Clients:

✅ **Do**:
- Link to agency MCC rather than granting direct login
- Use Standard access unless Admin is necessary
- Set up billing alerts when granting agency access
- Review account access quarterly

❌ **Don't**:
- Never share Google account passwords
- Don't grant Admin access unless you trust the agency fully
- Avoid linking multiple agencies simultaneously (conflicts arise)

## Pro Tips for Smoother Google Ads Onboarding

### 1. Create a Client Access Spreadsheet

Track all client access in one place:

| Client | Customer ID | MCC Linked | Access Level | Date Linked | Notes |
|--------|-------------|------------|-------------|-------------|-------|
| Acme Corp | 123-456-7890 | ✅ | Standard | 2024-01-15 | Yearly contract |

### 2. Standardize Your Request Process

Create an email template:

> Subject: Google Ads Access Request - [Client Name]
>
> Hi [Client Name],
>
> To launch your Google Ads campaigns, I need access to your account. Please follow these steps:
>
> 1. Log into ads.google.com
> 2. Click Tools & Settings (wrench icon) → Account link → Manager account
> 3. Enter our MCC ID: **123-456-7890**
> 4. Select **Standard** access level
> 5. Click Send request
>
> This typically takes 2-3 minutes. I'll receive a notification once complete.
>
> Thanks!

### 3. Use the Developer Token

When you set up your MCC, apply for a **Google Ads Developer Token**. This is required for:
- Using the Google Ads API
- Managing accounts programmatically
- Integrating with third-party tools

### 4. Test Access Immediately

Once the client grants access:
1. Log into your MCC
2. Select the client account from the dropdown
3. Try viewing campaigns, creating a test campaign, and accessing billing settings
4. Screenshot the account overview for your records

## Scaling Your Agency: Beyond Manual Google Ads Access

As you grow from 10 to 100 clients, consider:

1. **Automated Onboarding**: Use platforms that send guided OAuth flows
2. **Bulk Operations**: MCC allows bulk campaign creation and edits across accounts
3. **Scripts and Rules**: Set up automated bidding rules and scripts across all managed accounts
4. **API Integration**: Build custom dashboards pulling data from all client accounts

## Key Takeaways

- Google Ads uses a manager account (MCC) system for centralized client management
- Link client accounts to your MCC—don't request direct login access
- Only one MCC can be linked per account, so ensure previous agencies are removed
- Standard access is sufficient for most campaign management needs
- The Google ecosystem allows 8-product access from a single OAuth

**Ready to streamline Google Ads onboarding?** [Start your free trial](/pricing) and get client access in 5 minutes, not 3 days.

---

*Need help with other Google products? Read our guides for [GA4 access](/blog/ga4-access-agencies) and [Google Tag Manager access](/blog/gtm-access-guide).*
`,
    category: "tutorials",
    stage: "consideration",
    publishedAt: "2024-01-16",
    readTime: 10,
    author: {
      name: "Marcus Johnson",
      role: "PPC Specialist",
    },
    tags: ["Google Ads", "MCC", "manager account", "permissions"],
    metaTitle: "Google Ads Access Guide: Agency Permissions 2024",
    metaDescription: "The complete guide to getting Google Ads manager account access. Learn the difference between MCC, manager accounts, and direct access.",
    relatedPosts: [
      "meta-ads-access-guide",
      "ga4-access-guide",
      "leadsie-alternatives-comparison",
    ],
  },
  {
    id: "ga4-access-guide",
    slug: "ga4-access-agencies",
    title: "GA4 Access for Agencies: Step-by-Step Property Authorization",
    excerpt: "Google Analytics 4 has a completely different access model than Universal Analytics. Learn how to get the right GA4 property access without accidentally requesting the wrong account or getting stuck with insufficient permissions.",
    content: `
# GA4 Access for Agencies: Step-by-Step Property Authorization

## Why GA4 Access Is Different Than You Expect

If you were granting access to Universal Analytics (UA) for years, GA4's access model will feel foreign. The property hierarchy changed, permission levels evolved, and clients often have **multiple GA4 properties** without realizing it.

Common mistakes agencies make:
- Requesting access to the wrong property (there are often duplicates from migrations)
- Getting insufficient permissions (can see data but can't configure events)
- Confusing Account vs. Property level access
- Not requesting access to data streams or BigQuery exports

This guide ensures you get the right GA4 access on the first try.

## Understanding GA4's Account Structure

GA4 uses a two-level hierarchy:

\`\`\`
Google Analytics Account
  ├── GA4 Property 1 (e.g., ga.measurement_id)
  ├── GA4 Property 2 (migration duplicate)
  └── GA4 Property 3 (testing/staging)
\`\`\`

- **Account**: The top-level container (holds multiple properties)
- **Property**: Where actual data lives (each has a Measurement ID like G-XXXXXXXXXX)

**Critical**: Most clients have **multiple GA4 properties**—some from UA migrations, some from testing, some unused. Requesting access to the wrong one means you're analyzing the wrong data.

## GA4 Permission Levels Explained

GA4 has more granular permissions than Google Ads:

| Permission Level | Can Edit | Can View | Can Manage Users | Can Configure | Use Case |
|-----------------|----------|----------|-----------------|---------------|----------|
| **Administrator** | ✅ | ✅ | ✅ | ✅ | Full access (recommended) |
| **Editor** | ✅ | ✅ | ❌ | ✅ | Can configure, can't manage users |
| **Analyst** | ❌ | ✅ | ❌ | ❌ | View and create reports |
| **Viewer** | ❌ | ✅ | ❌ | ❌ | Read-only access |
| **No Permission** | ❌ | ❌ | ❌ | ❌ | Denies access |

## The Manual Way: Step-by-Step Client Instructions

### Step 1: Identify the Correct GA4 Property

Have your client verify which property to grant access to:

1. Go to [Google Analytics](https://analytics.google.com)
2. Click **Admin** (bottom left)
3. In the **Account** column, select their account
4. In the **Property** column, look for the property connected to their website
5. Click **Property Settings** → **Data Streams** to verify the website URL matches

**Pro Tip**: Ask the client to screenshot the **Property Settings** page showing:
- Property name
- Measurement ID (G-XXXXXXXXXX)
- Website URL
- Data stream name

This confirms you're getting access to the right property.

### Step 2: Grant Account-Level Access (Recommended)

Account-level access means you can see **all properties** under that account:

1. In Google Analytics, click **Admin** (bottom left)
2. In the **Account** column (leftmost), click **Account Access Management**
3. Click the **+** blue button (top right)
4. Select **Add users**
5. Enter your agency email address
6. Select **Administrator** or **Editor** permission
7. Check **Notify new users by email** (optional)
8. Click **Add**

### Step 3: Grant Property-Level Access (Alternative)

If the client only wants you to see one property:

1. In Google Analytics, click **Admin** (bottom left)
2. In the **Property** column (middle), click **Property Access Management**
3. Click the **+** blue button
4. Select **Add users**
5. Enter your agency email address
6. Select **Editor** or **Analyst** permission
7. Click **Add**

## Common GA4 Access Issues (And Fixes)

### Issue 1: Client Grants Access But You Don't See the Property

**The Problem**: The client granted access, but when you log in, you don't see their account or property.

**Solution**:
1. Verify they used the correct email address (typos are common)
2. Check if they granted **Account** vs **Property** level access (you might be looking in the wrong place)
3. Wait 5-10 minutes for permissions to propagate
4. Try logging out and back into Google Analytics

### Issue 2: You Can See Data But Can't Configure Events

**The Problem**: You have access, but key features are disabled (conversions, events, data streams).

**Solution**: You have **Analyst** or **Viewer** permissions. Ask the client to update to **Editor**:
- Admin → Property Access Management → Your email → Click pencil icon → Change to Editor

### Issue 3: Multiple GA4 Properties, Which One Is Correct?

**The Problem**: The client has 5+ GA4 properties, and they're not sure which one is live on their website.

**Solution**:
1. Have the client go to their website
2. Right-click → **View Page Source**
3. Search for G-XXXXXXXXXX (Ctrl+F / Cmd+F)
4. The Measurement ID in the code matches the correct property
5. Alternatively, use the **Google Tag Assistant** Chrome extension

### Issue 4: "You Don't Have Permission to View This Data Stream"

**The Problem**: You can see reports but can't access data streams or configuration.

**Solution**: Data streams require **Editor** or **Administrator** permissions. Viewer and Analyst can't see data stream details.

## The Google Ecosystem: One OAuth, Multiple Products

When clients authorize Google through Agency Access Platform, they can simultaneously grant access to:

1. **Google Ads** (for campaign data)
2. **Google Analytics 4** (for website analytics)
3. **Google Tag Manager** (for tag management)
4. **Google Search Console** (for SEO data)
5. **Google Merchant Center** (for e-commerce)

This hierarchical access is unique to Google—Meta, LinkedIn, and TikTok all require separate authorization flows.

## Security Best Practices for GA4 Access

### For Agencies:

✅ **Do**:
- Request **Editor** or **Administrator** for full configuration access
- Use a dedicated agency email (e.g., analytics@youragency.com)
- Document which properties you have access to (client spreadsheet)
- Quarterly audit active client access

❌ **Don't**:
- Never ask for client Google account credentials
- Don't request unnecessary Admin access (Editor is usually sufficient)
- Avoid keeping access for past clients
- Don't share your agency login credentials

### For Clients:

✅ **Do**:
- Grant **Editor** access (can configure but can't remove you)
- Verify the correct property before granting access
- Set up usage reports to monitor agency activity
- Review access quarterly

❌ **Don't**:
- Never share Google login passwords
- Don't grant access to all properties if you only need one
- Avoid granting Admin unless necessary

## Pro Tips for GA4 Client Onboarding

### 1. Create a GA4 Access Checklist

When onboarding new clients, verify:

- [ ] Correct GA4 property identified (Measurement ID matches website)
- [ ] Account or Property access granted (specify which)
- [ ] Permission level confirmed (Editor or Administrator)
- [ ] Data streams accessible (for tag configuration)
- [ ] BigQuery access (if applicable for raw data export)

### 2. Standard Email Template

> Subject: GA4 Access Request - [Client Name]
>
> Hi [Client Name],
>
> To analyze your website performance, I need access to your Google Analytics 4 property.
>
> **Before granting access, please verify:**
> 1. Go to analytics.google.com → Admin → Property Settings → Data Streams
> 2. Confirm the Website URL matches: [client website]
> 3. Note the Measurement ID (starts with G-)
>
> **To grant access:**
> 1. In Google Analytics, click **Admin** (bottom left)
> 2. In the **Account** column, click **Account Access Management**
> 3. Click the **+** button → **Add users**
> 4. Enter my email: **your-email@agency.com**
> 5. Select **Editor** permission
> 6. Click **Add**
>
> I'll receive a notification once complete. This typically takes 2-3 minutes.
>
> Thanks!

### 3. Document Everything in Your Client Spreadsheet

| Client | GA4 Property ID | Measurement ID | Access Level | Date Added | Notes |
|--------|----------------|----------------|--------------|-----------|-------|
| Acme Corp | 123456789 | G-ABC123DEF | Editor | 2024-01-15 | Main website property |

### 4. Test Your Access Immediately

Once granted access:
1. Log into Google Analytics
2. Select the client's property
3. Verify you can see:
   - **Realtime** report (confirms live data connection)
   - **Events** → **All Events** (confirms configuration access)
   - **Admin** → **Data Streams** (confirms full configuration access)
4. Screenshot the property overview for your records

## Scaling Your Agency: Beyond Manual GA4 Access

As you grow from 10 to 100 clients:

1. **Centralized Dashboard**: Track all GA4 properties in one place
2. **Automated Onboarding**: Send guided OAuth flows that grant access in 5 minutes
3. **Template Workflows**: Standardized access requests for different client types
4. **Audit Logging**: Maintain records of who accessed what and when (SOC2 requirement)

## Key Takeaways

- GA4 has a two-level hierarchy: Account → Property
- Clients often have multiple properties—verify the correct one before requesting access
- **Editor** permission is sufficient for most agency needs (can configure but can't remove users)
- Google's unique advantage: one OAuth can grant access to GA4, Google Ads, GTM, and more
- Always test access immediately by viewing Realtime reports

**Ready to transform your GA4 onboarding?** [Start your free trial](/pricing) and get client access in 5 minutes, not 3 days.

---

*Also read our guides for [Google Ads access](/blog/google-ads-access-agency) and [Google Tag Manager access](/blog/gtm-access-guide).*
`,
    category: "tutorials",
    stage: "consideration",
    publishedAt: "2024-01-17",
    readTime: 9,
    author: {
      name: "Marcus Johnson",
      role: "Analytics Lead",
    },
    tags: ["GA4", "Google Analytics", "analytics", "property access"],
    metaTitle: "GA4 Access for Agencies: Step-by-Step Guide 2024",
    metaDescription: "Google Analytics 4 has a different access model than UA. Learn how to get the right GA4 property access without requesting the wrong account.",
    relatedPosts: [
      "google-ads-access-guide",
      "meta-ads-access-guide",
      "client-onboarding-47-email-problem",
    ],
  },
  {
    id: "leadsie-alternatives-comparison",
    slug: "leadsie-vs-agencyaccess-vs-agency-access-platform",
    title: "Leadsie vs AgencyAccess vs Agency Access Platform: 2024 Comparison",
    excerpt: "Comprehensive comparison of the three leading client access platforms. See how platform support, security, permissions, and pricing differ—and which one is right for your agency.",
    content: `
# Leadsie vs AgencyAccess vs Agency Access Platform: 2024 Comparison

## The Client Access Platform Landscape

Managing client platform access (Meta, Google, LinkedIn, etc.) went from "email a PDF of instructions" to a dedicated software category. Three platforms now dominate:

- **Leadsie**: Early market leader, focused on simplicity
- **AgencyAccess**: Platform-heavy approach with ~10 integrations
- **Agency Access Platform**: Newest entrant with broader platform support and enterprise security

This comparison breaks down features, pricing, and capabilities so you can choose the right platform for your agency.

## Quick Comparison Table

| Feature | Leadsie | AgencyAccess | Agency Access Platform |
|---------|---------|--------------|------------------------|
| **Platform Count** | ~8 platforms | ~10 platforms | **15+ platforms** |
| **Meta Platforms** | ✅ Facebook, Instagram | ✅ Facebook, Instagram | ✅ Facebook, Instagram, WhatsApp |
| **Google Platforms** | ✅ Ads, Analytics | ✅ Ads, Analytics | ✅ Ads, Analytics, GA4, GTM, Merchant Center, Search Console |
| **LinkedIn Ads** | ✅ | ✅ | ✅ |
| **TikTok Ads** | ✅ | ✅ | ✅ |
| **Pinterest** | ❌ | ❌ | ✅ |
| **Klaviyo** | ❌ | ❌ | ✅ |
| **Shopify** | ❌ | ❌ | ✅ |
| **Kit** | ❌ | ❌ | ✅ |
| **Beehiiv** | ❌ | ❌ | ✅ |
| **Permission Levels** | 2-3 levels | 2 levels | **4 levels** (admin, standard, read_only, email_only) |
| **Token Storage** | Database | Database | **Infisical** (secrets management) |
| **Audit Logging** | Basic | Basic | **Comprehensive** (SOC2-ready) |
| **Onboarding Templates** | ❌ | ❌ | ✅ |
| **Custom Branding** | ❌ | Limited | ✅ (full white-label) |
| **Multi-Language** | ❌ | ❌ | ✅ (en, es, nl) |
| **Hierarchical Access** | ❌ | ❌ | ✅ (Google = 8 products from 1 OAuth) |
| **Pricing** | $97/mo | $149/mo | **$79/mo** |

## Platform Support Comparison

### Supported Platforms

#### Leadsie (~8 platforms)
- Meta Ads, Facebook Pages, Instagram
- Google Ads, Google Analytics
- LinkedIn Ads
- TikTok Ads, Snapchat Ads

**Missing**: Pinterest, Klaviyo, Shopify, Kit, Beehiiv, GA4-specific features, Google ecosystem products

#### AgencyAccess (~10 platforms)
- Meta Ads, Facebook Pages, Instagram
- Google Ads, Google Analytics
- LinkedIn Ads
- TikTok Ads
- Twitter/X Ads, Pinterest (limited)

**Missing**: Full Pinterest support, Klaviyo, Shopify, Kit, Beehiiv, advanced Google products

#### Agency Access Platform (15+ platforms)
- **Meta**: Ads, Pages, Instagram, WhatsApp
- **Google**: Ads, Analytics (GA4), Tag Manager, Merchant Center, Search Console, YouTube Ads, Display & Video 360, Campaign Manager 360
- **LinkedIn Ads**, **TikTok Ads**, **Snapchat Ads**
- **Pinterest Ads** (full support)
- **Klaviyo**, **Shopify**, **Kit**, **Beehiiv**

**Winner**: Agency Access Platform—5+ more platforms than competitors, including emerging channels like Pinterest and Beehiiv.

### Unique Platform Advantages

**Pinterest**: Growing rapidly for e-commerce agencies. Neither Leadsie nor AgencyAccess supports Pinterest Ads access.

**Klaviyo**: Essential for email marketing agencies. Only Agency Access Platform supports Klaviyo OAuth.

**Shopify**: Critical for e-commerce stacks. Only Agency Access Platform integrates Shopify store access.

**Google Ecosystem**: Agency Access Platform supports **8 Google products from a single OAuth**. Competitors require separate authorization for each.

## Security Comparison

### Token Storage: Database vs. Secrets Management

**Leadsie & AgencyAccess**: Store OAuth tokens in their databases.

**Risk**: If the database is compromised, all client tokens are exposed. Tokens grant full access to client ad accounts, analytics data, and customer information.

**Agency Access Platform**: Stores tokens in **Infisical**, a dedicated secrets management platform.

- **Infrastructure-grade encryption**: AES-256 encryption at rest
- **Zero-knowledge architecture**: Tokens encrypted before storage
- **Audit trails**: Every token access is logged (who, when, why)
- **Rotation support**: Automatic token refresh without client intervention
- **SOC2 compliance**: Built for enterprise security requirements

**Winner**: Agency Access Platform—Infisical is the same security standard used by Fortune 500 companies.

### Audit Logging

**Leadsie**: Basic logging (who created access request)

**AgencyAccess**: Basic logging (who granted access)

**Agency Access Platform**: Comprehensive audit logs including:
- Token creation, access, refresh, revocation
- User email, IP address, timestamp
- Action taken (AGENCY_CONNECTED, AGENCY_DISCONNECTED, TOKEN_REFRESHED)
- Metadata for compliance reporting
- Exportable for SOC2, GDPR audits

**Winner**: Agency Access Platform—audit logs are critical for enterprise clients and regulatory compliance.

## Permission Levels Comparison

### Leadsie (2-3 levels)
- **Admin**: Full control
- **Standard**: Create and edit
- **View-only** (limited): Read-only

### AgencyAccess (2 levels)
- **Admin**: Full control
- **Standard**: Create and edit

### Agency Access Platform (4 levels)
- **Admin**: Full control (create, edit, delete, manage billing, add/remove users)
- **Standard**: Create and edit (create campaigns, edit settings, view reports)
- **Read-only**: View-only access (view campaigns, view reports, export data)
- **Email-only**: Basic email access (receive email reports, view shared dashboards)

**Winner**: Agency Access Platform—granular permissions mean:
- Junior staff get read-only access (reduces accidental changes)
- Freelancers get standard access (can work but can't break things)
- Senior team gets admin access (full control)

## Features Comparison

### Onboarding Templates

**Agency Access Platform** only: Create reusable templates with:
- Pre-selected platforms (e.g., "E-commerce Client Template" = Meta + Google + Shopify + Klaviyo)
- Custom intake fields (business name, monthly budget, target audience)
- Saved branding (logo, colors, welcome message)
- One-click template application to new clients

**Use case**: Standardize onboarding for different client types and scale from 10 to 100 clients without re-creating access requests.

### Custom Branding / White-Label

**Leadsie**: No white-label options

**AgencyAccess**: Limited branding (logo upload only)

**Agency Access Platform**: Full white-label customization
- Custom logo
- Custom primary colors
- Custom subdomain (e.g., clients.youragency.com)
- Custom welcome messaging
- Hide all Agency Access Platform branding

**Winner**: Agency Access Platform—enterprise agencies can present a fully branded client experience.

### Multi-Language Support

**Agency Access Platform** only: Client authorization flows in English, Spanish, and Dutch.

**Use case**: International agencies or agencies with Spanish-speaking clients can provide native-language authorization flows.

### Hierarchical Platform Access

**Agency Access Platform** only: Google's unique "one OAuth, eight products" capability.

When a client authorizes Google, they simultaneously grant access to:
1. Google Ads
2. Google Analytics 4
3. Google Tag Manager
4. Google Merchant Center
5. Google Search Console
6. YouTube Ads
7. Google Display & Video 360
8. Campaign Manager 360

**Competitors**: Each Google product requires a separate authorization flow (8x more work for clients).

## Pricing Comparison

| Plan | Leadsie | AgencyAccess | Agency Access Platform |
|------|---------|--------------|------------------------|
| **Starter** | $97/mo | $149/mo | **$79/mo** |
| **Pro** | $197/mo | $299/mo | **$149/mo** |
| **Enterprise** | Custom | Custom | **Custom** |
| **Free Trial** | 14 days | 7 days | **21 days** |

**Winner**: Agency Access Platform—lowest price across all tiers with most features.

**ROI Calculation**: If your agency charges $150/hr and saves 8 hours/month on client onboarding, that's **$1,200/month in recovered billable time**. The platform pays for itself 15x over.

## Use Case Recommendations

### Choose Leadsie If You:
- Need basic Meta + Google access
- Want simple, no-frills onboarding
- Don't need enterprise security features
- Have < 20 clients

### Choose AgencyAccess If You:
- Need broader platform coverage
- Value platform count over features
- Don't need granular permissions
- Have < 50 clients

### Choose Agency Access Platform If You:
- Need **Pinterest, Klaviyo, Shopify, Kit, or Beehiiv** access
- Require **enterprise-grade security** (Infisical tokens, audit logs)
- Want **granular permissions** (4 levels)
- Need **onboarding templates** to scale
- Want **custom branding** for white-label experience
- Have **50+ clients** or plan to scale
- Need **SOC2 compliance** documentation

## Migration: Switching Is Easy

All three platforms allow you to:
1. Export existing client connections (CSV format)
2. Import into the new platform
3. Re-authorization is only required for OAuth token refresh

**Migration time**: 1-2 hours for most agencies.

## Key Takeaways

- **Platform count**: Agency Access Platform supports 15+ vs 8-10 for competitors
- **Security**: Infisical token storage vs database storage (significant difference)
- **Permissions**: 4 levels vs 2-3 levels (granular control)
- **Templates**: Only Agency Access Platform has reusable onboarding templates
- **Pricing**: Agency Access Platform is $18-70/mo less expensive

**Ready to make the switch?** [Start your 21-day free trial](/pricing)—the longest trial in the industry. See how 50+ agencies reduced onboarding time by 90%.

---

*Need help deciding? Read our [7 Alternatives to Leadsie](/blog/leadsie-alternatives) guide or contact our team for a personalized demo.*
`,
    category: "comparisons",
    stage: "decision",
    publishedAt: "2024-01-18",
    readTime: 12,
    author: {
      name: "Sarah Chen",
      role: "Head of Partnerships",
    },
    tags: [
      "Leadsie",
      "AgencyAccess",
      "comparison",
      "alternatives",
      "pricing",
    ],
    metaTitle: "Leadsie vs AgencyAccess vs Agency Access Platform: 2024 Comparison",
    metaDescription: "Comprehensive comparison of client access platforms. See how platform support, security, permissions, and pricing differ.",
    relatedPosts: [
      "meta-ads-access-guide",
      "leadsie-alternatives-7-tools",
      "client-onboarding-47-email-problem",
    ],
  },
];

export function getBlogPosts() {
  return BLOG_POSTS.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getBlogPostsByCategory(category: string): BlogPost[] {
  return BLOG_POSTS.filter((post) => post.category === category);
}

export function getRelatedPosts(
  currentPostId: string,
  limit = 3
): BlogPost[] {
  const currentPost = BLOG_POSTS.find((post) => post.id === currentPostId);
  if (!currentPost?.relatedPosts) {
    return [];
  }

  return currentPost.relatedPosts
    .map((id) => BLOG_POSTS.find((post) => post.id === id))
    .filter((post): post is BlogPost => post !== undefined)
    .slice(0, limit);
}

export function getFeaturedPosts(limit = 3): BlogPost[] {
  return BLOG_POSTS.filter((post) =>
    post.tags.includes("featured")
  ).slice(0, limit);
}
