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

What if you could skip all this back-and-forth? With **AuthHub**, you simply:

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

**Ready to transform your client onboarding?** [Start your free trial](/pricing) and see how teams reduce onboarding time by up to 90%.

---

*Need help with other platforms? Check out our guides for [Google Ads access](/blog/google-ads-access-agency), [GA4 access](/blog/ga4-access-agencies), and [LinkedIn Ads access](/blog/linkedin-ads-access-guide).*
`,
    category: "tutorials",
    stage: "consideration",
    publishedAt: "2024-01-15",
    readTime: 8,
    author: {
      name: "Jon High",
      role: "Founder",
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

With AuthHub, when a client authorizes Google, they can grant access to **8 products at once**:

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
- Set up billing alerts when granting account access
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
      name: "Jon High",
      role: "Founder",
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

When clients authorize Google through AuthHub, they can simultaneously grant access to:

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
      name: "Jon High",
      role: "Founder",
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
    slug: "leadsie-vs-authhub-comparison",
    title: "Leadsie vs Other Platforms vs AuthHub: 2024 Comparison",
    excerpt: "Comprehensive comparison of the three leading client access platforms. See how platform support, security, permissions, and pricing differ—and which one is right for your agency.",
    content: `
# Leadsie vs Other Platforms vs AuthHub: 2024 Comparison

## The Client Access Platform Landscape

Managing client platform access (Meta, Google, LinkedIn, etc.) went from "email a PDF of instructions" to a dedicated software category. Three platforms now dominate:

- **Leadsie**: Early market leader, focused on simplicity
- **Other Platforms**: Platform-heavy approach with ~10 integrations
- **AuthHub**: Newest entrant with broader platform support and enterprise security

This comparison breaks down features, pricing, and capabilities so you can choose the right platform for your agency.

## Quick Comparison Table

| Feature | Leadsie | Other Platforms | AuthHub |
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

#### Other Platforms (~10 platforms)
- Meta Ads, Facebook Pages, Instagram
- Google Ads, Google Analytics
- LinkedIn Ads
- TikTok Ads
- Twitter/X Ads, Pinterest (limited)

**Missing**: Full Pinterest support, Klaviyo, Shopify, Kit, Beehiiv, advanced Google products

#### AuthHub (15+ platforms)
- **Meta**: Ads, Pages, Instagram, WhatsApp
- **Google**: Ads, Analytics (GA4), Tag Manager, Merchant Center, Search Console, YouTube Ads, Display & Video 360, Campaign Manager 360
- **LinkedIn Ads**, **TikTok Ads**, **Snapchat Ads**
- **Pinterest Ads** (full support)
- **Klaviyo**, **Shopify**, **Kit**, **Beehiiv**

**Winner**: AuthHub—5+ more platforms than competitors, including emerging channels like Pinterest and Beehiiv.

### Unique Platform Advantages

**Pinterest**: Growing rapidly for e-commerce agencies. Neither Leadsie nor Other Platforms supports Pinterest Ads access.

**Klaviyo**: Essential for email marketing agencies. Only AuthHub supports Klaviyo OAuth.

**Shopify**: Critical for e-commerce stacks. Only AuthHub integrates Shopify store access.

**Google Ecosystem**: AuthHub supports **8 Google products from a single OAuth**. Competitors require separate authorization for each.

## Security Comparison

### Token Storage: Database vs. Secrets Management

**Leadsie & Other Platforms**: Store OAuth tokens in their databases.

**Risk**: If the database is compromised, all client tokens are exposed. Tokens grant full access to client ad accounts, analytics data, and customer information.

**AuthHub**: Stores tokens in **Infisical**, a dedicated secrets management platform.

- **Infrastructure-grade encryption**: AES-256 encryption at rest
- **Zero-knowledge architecture**: Tokens encrypted before storage
- **Audit trails**: Every token access is logged (who, when, why)
- **Rotation support**: Automatic token refresh without client intervention
- **SOC2 compliance**: Built for enterprise security requirements

**Winner**: AuthHub—Infisical is the same security standard used by Fortune 500 companies.

### Audit Logging

**Leadsie**: Basic logging (who created access request)

**Other Platforms**: Basic logging (who granted access)

**AuthHub**: Comprehensive audit logs including:
- Token creation, access, refresh, revocation
- User email, IP address, timestamp
- Action taken (AGENCY_CONNECTED, AGENCY_DISCONNECTED, TOKEN_REFRESHED)
- Metadata for compliance reporting
- Exportable for SOC2, GDPR audits

**Winner**: AuthHub—audit logs are critical for enterprise clients and regulatory compliance.

## Permission Levels Comparison

### Leadsie (2-3 levels)
- **Admin**: Full control
- **Standard**: Create and edit
- **View-only** (limited): Read-only

### Other Platforms (2 levels)
- **Admin**: Full control
- **Standard**: Create and edit

### AuthHub (4 levels)
- **Admin**: Full control (create, edit, delete, manage billing, add/remove users)
- **Standard**: Create and edit (create campaigns, edit settings, view reports)
- **Read-only**: View-only access (view campaigns, view reports, export data)
- **Email-only**: Basic email access (receive email reports, view shared dashboards)

**Winner**: AuthHub—granular permissions mean:
- Junior staff get read-only access (reduces accidental changes)
- Freelancers get standard access (can work but can't break things)
- Senior team gets admin access (full control)

## Features Comparison

### Onboarding Templates

**AuthHub** only: Create reusable templates with:
- Pre-selected platforms (e.g., "E-commerce Client Template" = Meta + Google + Shopify + Klaviyo)
- Custom intake fields (business name, monthly budget, target audience)
- Saved branding (logo, colors, welcome message)
- One-click template application to new clients

**Use case**: Standardize onboarding for different client types and scale from 10 to 100 clients without re-creating access requests.

### Custom Branding / White-Label

**Leadsie**: No white-label options

**Other Platforms**: Limited branding (logo upload only)

**AuthHub**: Full white-label customization
- Custom logo
- Custom primary colors
- Custom subdomain (e.g., clients.youragency.com)
- Custom welcome messaging
- Hide all AuthHub branding

**Winner**: AuthHub—enterprise agencies can present a fully branded client experience.

### Multi-Language Support

**AuthHub** only: Client authorization flows in English, Spanish, and Dutch.

**Use case**: International agencies or agencies with Spanish-speaking clients can provide native-language authorization flows.

### Hierarchical Platform Access

**AuthHub** only: Google's unique "one OAuth, eight products" capability.

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

| Plan | Leadsie | Other Platforms | AuthHub |
|------|---------|--------------|------------------------|
| **Starter** | $97/mo | $149/mo | **$79/mo** |
| **Pro** | $197/mo | $299/mo | **$149/mo** |
| **Enterprise** | Custom | Custom | **Custom** |
| **Free Trial** | 14 days | 7 days | **21 days** |

**Winner**: AuthHub—lowest price across all tiers with most features.

**ROI Calculation**: If your agency charges $150/hr and saves 8 hours/month on client onboarding, that's **$1,200/month in recovered billable time**. The platform pays for itself 15x over.

## Use Case Recommendations

### Choose Leadsie If You:
- Need basic Meta + Google access
- Want simple, no-frills onboarding
- Don't need enterprise security features
- Have < 20 clients

### Choose Other Platforms If You:
- Need broader platform coverage
- Value platform count over features
- Don't need granular permissions
- Have < 50 clients

### Choose AuthHub If You:
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

- **Platform count**: AuthHub supports 15+ vs 8-10 for competitors
- **Security**: Infisical token storage vs database storage (significant difference)
- **Permissions**: 4 levels vs 2-3 levels (granular control)
- **Templates**: Only AuthHub has reusable onboarding templates
- **Pricing**: AuthHub is $18-70/mo less expensive

**Ready to make the switch?** [Start your 21-day free trial](/pricing)—the longest trial in the industry. See how teams reduce onboarding time by up to 90%.

---

*Need help deciding? Read our [7 Alternatives to Leadsie](/blog/leadsie-alternatives) guide or contact our team for a personalized demo.*
`,
    category: "comparisons",
    stage: "decision",
    publishedAt: "2024-01-18",
    readTime: 12,
    author: {
      name: "Jon High",
      role: "Founder",
    },
    tags: [
      "Leadsie",
      "AuthHub",
      "comparison",
      "alternatives",
      "pricing",
    ],
    metaTitle: "Leadsie vs Other Platforms vs AuthHub: 2024 Comparison",
    metaDescription: "Comprehensive comparison of client access platforms. See how platform support, security, permissions, and pricing differ.",
    relatedPosts: [
      "meta-ads-access-guide",
      "leadsie-alternatives-7-tools",
      "client-onboarding-47-email-problem",
    ],
  },
  {
    id: "linkedin-ads-access-guide",
    slug: "linkedin-ads-access-agency",
    title: "LinkedIn Ads Access for Agencies: Step-by-Step Campaign Manager Guide",
    excerpt: "LinkedIn Ads access is uniquely challenging. Learn the difference between Company Page and Ad Account permissions, the 5 role levels, and how to navigate LinkedIn's connection requirement for smooth client onboarding.",
    content: `
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

\`\`\`
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
\`\`\`

### The Two Separate Systems

**Company Page (Organization)**: This is your client's LinkedIn business presence—their organic content, employee listings, and company updates. It's identified by a URN format like \`urn:li:organization:123456789\`.

**Ad Account (Sponsored Account)**: This is where paid advertising happens. It's a completely separate entity from the Company Page, even though they're connected. Ad accounts use the format \`urn:li:sponsoredAccount:123456789\`.

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

**VIEWER**: Even if you have \`rw_ads\` (read/write) OAuth scope, the VIEWER role remains strictly read-only. Scope doesn't override role permissions on LinkedIn.

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

**OAuth scopes**: \`w_organization_social\`, \`r_organization_social\`

### Ad Account Access (Paid)

**Required for:**
- Creating and managing ad campaigns
- Managing ad creatives
- Viewing campaign performance
- Managing campaign budgets

**Roles (5 levels)**: Viewer, Creative Manager, Campaign Manager, Account Manager, Account Billing Admin

**OAuth scopes**: \`r_ads\`, \`rw_ads\`

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

### Issue 2: VIEWER Role Can't See Data Despite \`rw_ads\` Scope

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
2. Check that OAuth token includes required scopes (\`r_ads\` or \`rw_ads\`)
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
- Use \`r_ads\` scope for VIEWER roles (read-only)
- Use \`rw_ads\` scope for CREATIVE_MANAGER and above
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
`,
    category: "tutorials",
    stage: "consideration",
    publishedAt: "2024-01-19",
    readTime: 11,
    author: {
      name: "Jon High",
      role: "Founder",
    },
    tags: ["LinkedIn Ads", "Campaign Manager", "permissions", "client onboarding"],
    metaTitle: "LinkedIn Ads Access for Agencies: Step-by-Step Campaign Manager Guide",
    metaDescription: "LinkedIn Ads access is uniquely challenging. Learn the difference between Company Page and Ad Account permissions, the 5 role levels, and connection requirements.",
    relatedPosts: [
      "meta-ads-access-guide",
      "google-ads-access-guide",
      "leadsie-alternatives-comparison",
    ],
  },
  {
    id: "pinterest-ads-access-guide",
    slug: "pinterest-ads-access-agencies",
    title: "Pinterest Ads Access for Agencies: The E-commerce Guide",
    excerpt: "Why Pinterest matters for e-commerce agencies (more than you think). Complete guide to Pinterest Business accounts, ad access, permissions, and common issues.",
    content: `
# Pinterest Ads Access for Agencies: The E-commerce Guide

You just landed an e-commerce client ready to scale. They sell beautiful products—handcrafted furniture, sustainable fashion, artisanal skincare. Pinterest is the perfect platform: 445 million users actively searching for inspiration, 80% with purchase intent, spending 2x more than users on other social platforms.

But first, you need access to their Pinterest Ads account.

What should be simple turns into a days-long email thread. The client doesn't understand the difference between a personal account and a Business account. They're confused about ad accounts vs. organic profiles. They're not sure where to find the "Invite Partners" option.

Meanwhile, your launch timeline slips. The client gets frustrated. You're doing account management instead of strategy.

Pinterest doesn't have to be this hard.

## Why Pinterest Matters for E-commerce Agencies (Maybe More Than You Think)

Most agencies treat Pinterest as an afterthought. Clients mention it and you think: *"Nice to have, but not essential."*

You're missing an opportunity.

Pinterest isn't social media—it's a **visual search engine**. Users come with intent. They're not doomscrolling; they're actively searching for ideas, products, and solutions. This fundamental difference changes everything:

- **97% of searches are unbranded**—users discovering products, not looking for specific brands
- **80% of users start with search** rather than browsing feeds
- **Pin content lasts 3-6 months** (vs. 24-48 hours on Instagram, TikTok)
- **45% of US users have household income over $100K**
- **85% higher add-to-cart rates** compared to other platforms

For e-commerce clients in fashion, home decor, beauty, food, or lifestyle categories, Pinterest is a hidden gem. The competition is lower, the intent is higher, and the content you create compounds over time.

But none of that matters if you can't get access.

## Pinterest's Account Structure (The Source of Most Confusion)

The first thing to understand: Pinterest has **three distinct account types**, and mixing them up causes most access problems:

### 1. Personal Account
- Basic Pinterest usage for individuals
- Cannot run ads
- No analytics or business features

### 2. Business Account
- Required for advertising and analytics
- Can be created from scratch or converted from a personal account
- Includes Ads Manager, Pinterest Tag, and catalog features
- **All your e-commerce clients should have this**

### 3. Verified Merchant
- Business account with blue verification badge
- Shop Tab on profile (auto-generated storefront)
- Enhanced distribution in shopping results
- Requires complete website pages (Contact, Refund Policy, Shipping Policy)

### The Hierarchy

\`\`\`
Business Account
├── Business Profile (organic presence)
│   ├── Pins
│   └── Boards
├── Ad Account(s) (where you run ads)
│   ├── Campaigns
│   ├── Ad Groups
│   └── Ads
└── Catalog (product feed for shopping ads)
    └── Product Pins
\`\`\`

When clients say *"I have a Pinterest account,"* they usually mean their personal profile. When you ask for *"ad account access,"* they hear *"give you my Pinterest login."*

This mismatch is why you're still waiting for access three days later.

## The Step-by-Step Access Workflow (Share This with Clients)

Save this link. Send it to every new Pinterest client. You'll save hours of back-and-forth.

### Step 1: Convert to Business Account (If They Haven't Already)

**If they have a personal account:**

1. Log into Pinterest
2. Click profile icon → **Settings** → **Account management**
3. Select **"Convert to business account"**
4. Enter business details (name, website, industry)
5. All existing pins and followers are preserved

**If they're starting fresh:**

1. Go to \`pinterest.com\` and click **"Create business account"**
2. Enter business information
3. Accept Pinterest's Business Terms of Service

### Step 2: Create an Ad Account

1. Navigate to **Business Hub** → **Ads Account Overview**
2. Select currency and click **"Next"**
3. Accept Pinterest Ads Agreement
4. Copy the Ad Account ID (you'll need this)

### Step 3: Install the Pinterest Tag

This is where most clients get stuck. They create the account but forget the tracking.

**For Shopify stores:**
- Install the official **Pinterest for Shopify** app
- It handles everything automatically: tag installation, catalog sync, product pins

**For other platforms:**

\`\`\`html
<!-- Add this to every page -->
<script>
  pintrk('track', 'pagevisit');
</script>

<!-- Add this to checkout/confirmation pages -->
<script>
  pintrk('track', 'checkout', {
    value: 100.00,
    order_quantity: 2,
    currency: 'USD',
    line_items: [{
      product_name: 'Product Name',
      product_id: '12345',
      product_price: 50.00,
      product_quantity: 1
    }]
  });
</script>
\`\`\`

**Tag ID location:** Business account → **Ads** → **Conversions** → Copy Tag ID

### Step 4: Invite Your Agency (The Final Step)

Once everything is set up, the client invites you:

1. In Pinterest Ads Manager, go to **Partners** → **Invite Partners**
2. Enter your agency's Partner ID or email
3. Select the ad account(s) to share
4. Choose permission level (more on this below)
5. Send the invitation

You accept the invitation, verify permissions, and you're in.

## Pinterest Permission Levels Explained

Pinterest's permission system is more nuanced than most platforms. Understanding it prevents access issues down the road.

### Business Roles (Account-Level)

| Role | What It Means |
|------|---------------|
| **EMPLOYEE** | Standard team member with access to assigned assets |
| **BIZ_ADMIN** | Full account access, can manage members and partners |
| **PARTNER** | External agency or service provider |

### OAuth Scopes (API-Level)

If you're using API tools or platforms like AuthHub, you'll encounter scope permissions:

| Scope | What It Allows |
|-------|----------------|
| \`ads:read\` | View campaigns, ad groups, and reporting data |
| \`ads:write\` | Create, edit, and delete campaigns and ads |
| \`billing:read\` | View billing information |
| \`catalogs:read\` | View product catalogs |
| \`catalogs:write\` | Manage product feeds and catalogs |
| \`biz_access:write\` | Manage business access and invitations |

### Asset-Level Permissions

When granting access, clients can specify what you can do with each asset:

- **READ** – View-only access to data and reports
- **WRITE** – Create and edit campaigns, ads, and creatives
- **REPORTING** – Access to analytics and performance data

**For most agency relationships:** Request READ and WRITE permissions for ad accounts, plus READ access to catalogs if you're managing shopping ads.

## The 6 Most Common Pinterest Access Issues (And How to Fix Them)

Even with clear instructions, things go wrong. Here's what you'll encounter and how to handle it.

### Issue 1: "I Don't See the Invite Option"

**Cause:** Client is on a personal account, not a Business account with an active ad account.

**Solution:** Walk them through Step 1 and Step 2 above. They must have a Business account with at least one ad account before they can invite partners.

### Issue 2: Pinterest Tag Not Firing

**Symptoms:** Zero conversions recorded, ROAS shows zero or infinity

**Diagnosis:** Use the Pinterest Tag Helper browser extension to check if the tag is installed and firing

**Solutions:**
- Verify the Tag ID matches what's in Pinterest Ads Manager
- Check for tag conflicts (multiple Pinterest tags installed)
- Ensure checkout events fire on the thank-you/confirmation page
- For Shopify: Reinstall the Pinterest app if tag isn't detected

### Issue 3: Catalog Sync Failures

**Symptoms:** Missing products, outdated pricing, "out of stock" errors on in-stock items

**For Shopify clients:**
- Reinstall the Pinterest app
- Check that API permissions are granted
- Verify the app is connected to the correct Pinterest account

**For custom feeds:**
- Validate feed format against Pinterest's specification
- Ensure image URLs are publicly accessible (not behind authentication)
- Check that all required fields are present: \`item_id\`, \`title\`, \`description\`, \`link\`, \`image_link\`, \`price\`, \`availability\`
- Use \`availability: "out of stock"\` instead of removing products entirely

### Issue 4: Creative Approvals Stuck in "Review"

**Common rejection reasons:**
- Images below 600x900 pixels
- Blurry or grainy quality
- Incorrect orientation (horizontal instead of vertical)
- Before/after comparisons
- Text overlay covering more than 20% of the image
- Misleading claims or false urgency ("Sale ends in 1 hour!" when it doesn't)

**Best practices to avoid rejections:**
- Use 1000x1500 pixels (2:3 aspect ratio)
- High-quality, professionally edited images
- Vertical orientation preferred
- Minimal or no text on images
- Authentic, lifestyle photography rather than overly polished product shots

### Issue 5: ROI Looks Terrible (But It Might Not Be)

Pinterest has a longer attribution window than most platforms—up to 30 days for view-through conversions. Clients checking results after 3 days will think ads aren't working.

**Solutions:**
- Set expectations upfront: Pinterest is a marathon, not a sprint
- Use both view-through and click-through attribution
- Track assisted conversions, not just last-click
- Consider Pinterest's role in awareness and discovery, not just immediate conversion

### Issue 6: Client Is in China (No Self-Service Ads)

Pinterest hasn't fully opened self-service advertising to China-based businesses. These clients face additional hurdles.

**Workaround:**
- Use official Pinterest advertising partners like 飞书逸途 (Sinoclick)
- Partners handle compliant account opening and RMB payment
- Independent ad accounts (recommended) vs. BM architecture
- Minimum deposits typically $300-$1000 depending on partner

## Security Best Practices (For Agencies Managing Multiple Clients)

If you're managing multiple Pinterest client accounts, security matters. Here's what to do right:

### 1. Use Continuous Refresh Tokens

Pinterest supports \`continuous_refresh=true\` during OAuth, which returns refresh tokens that don't expire. This prevents access disruption every 30 days.

### 2. Never Store Tokens in Your Database

Store only the \`secretId\` reference in your database. The actual tokens live in a secrets management system (Infisical, AWS Secrets Manager, etc.).

### 3. Request Minimum Required Scopes

Don't ask for \`billing:write\` if you only need \`ads:read\`. Scope minimization reduces risk if credentials are compromised.

### 4. Log All Access

Maintain an audit trail of every API call:

\`\`\`typescript
{
  "action": "token_accessed",
  "timestamp": "2025-03-01T10:00:00Z",
  "user_email": "agency@example.com",
  "ip_address": "192.168.1.1",
  "scopes_used": ["ads:read", "ads:write"],
  "asset_id": "ad_account_123"
}
\`\`\`

### 5. Revoke Promptly When Relationships End

When clients leave, revoke access immediately. Don't let old credentials pile up—it's a security nightmare waiting to happen.

## Pro Tips for E-commerce Agencies

### Leverage Pinterest's Seasonality

Pinterest users plan 30-60 days ahead. This creates unique opportunities:

| Season | Post Timing |
|--------|-------------|
| Holiday gifts | October-November |
| Weddings | January-March (peak) |
| Home decor | Spring (March-May) |
| Fashion | 4-6 weeks before season |

### Focus on Product Pins Over Standard Pins

Product Pins include real-time pricing and availability. When prices change or items go out of stock, the Pin updates automatically. This means less maintenance and better user experience.

### Use the Verified Merchant Program

For established brands, the blue verification badge and Shop Tab are worth the effort:

- Enhanced distribution in shopping results
- Shop Tab on profile (auto-generated storefront)
- Blue checkmark builds trust
- Priority access to performance reports

### Combine Organic and Paid

Pinterest doesn't have to be all paid ads. Strong organic Pin performance validates creative before you spend on ads. Test content organically, then amplify what works with paid promotion.

## The Alternative: Let AuthHub Handle Access

Every agency has been there. You send detailed instructions. The client tries their best but gets stuck somewhere. You spend an hour on a screenshare call walking them through each step. They finally grant access—but by then, you've lost the momentum.

There's a better way.

AuthHub streamlines Pinterest access (and Meta, Google, LinkedIn, TikTok) into a single 5-minute flow:

1. **You create an access request** in AuthHub—select Pinterest, specify the permission level you need
2. **AuthHub generates a unique link** to send to your client
3. **Client clicks the link**, logs into Pinterest, and authorizes access
4. **AuthHub stores tokens securely**, logs all access, and handles token refresh automatically

No more back-and-forth emails. No more screenshot tutorials. No more "which email should I use?"

Just a clean, professional onboarding experience that scales with your agency.

**See how AuthHub transforms client onboarding:**

[Get Started with AuthHub](https://authhub.co) →
`,
    category: "tutorials",
    stage: "consideration",
    publishedAt: "2025-03-01",
    readTime: 10,
    author: {
      name: "Jon High",
      role: "Founder",
    },
    tags: ["Pinterest Ads", "e-commerce", "client onboarding", "permissions"],
    metaTitle: "Pinterest Ads Access for Agencies: The E-commerce Guide",
    metaDescription: "Why Pinterest matters for e-commerce agencies. Complete guide to Pinterest Business accounts, ad access workflows, permissions, and troubleshooting common issues.",
    relatedPosts: [
      "meta-ads-access-guide",
      "google-ads-access-guide",
      "tiktok-ads-access-guide",
    ],
  },
  {
    id: "tiktok-ads-access-guide",
    slug: "tiktok-ads-access-agency",
    title: "TikTok Ads Access for Agencies: Business Center & Spark Ads Guide (2026)",
    excerpt: "Master TikTok Business Center access workflows. Learn the three permission levels, QR code authorization for Spark Ads, and how to navigate TikTok's unique 3-Business-Center limit for agency management.",
    content: `
# TikTok Ads Access for Agencies: Business Center & Spark Ads Guide (2026)

## The Fastest-Growing Ad Platform (With the Most Confusing Access)

TikTok reached 1 billion users faster than any social platform in history. For agencies, it represents a massive opportunity—particularly for brands targeting Gen Z and Millennials. But getting access to client TikTok ad accounts comes with unique challenges you won't find on Meta, Google, or LinkedIn.

The biggest? TikTok limits users to **3 Business Centers**. If your agency already manages multiple brands, you may hit this ceiling faster than expected.

This guide covers everything you need to know about TikTok Ads access: Business Center structure, permission levels, the unique Spark Ads QR authorization flow, and common issues that trip up even experienced agencies.

## TikTok Business Center: The Foundation

Unlike Meta's unlimited Business Managers or Google's unrestricted MCC accounts, TikTok enforces strict limits:

| Entity | Limit |
|--------|-------|
| **Business Centers per user** | 3 |
| **Ad accounts per Business Center** | 3,000 |
| **Campaigns per ad account** | 5,000 |
| **Active campaigns at once** | 1,000 |

The 3-Business-Center limit is the key constraint. An agency principal who manages personal brands, side projects, and client work can quickly max out. Plan your Business Center strategy before inviting team members.

### Account Hierarchy

\`\`\`
Business Center (max 3 per user)
    |
    +-- Ad Account 1
    |       |
    +-- Ad Account 2
    |       |
    +-- Ad Account 3
            |
            +-- Campaign Group (optional)
            |       |
            +-- Campaign
            |       |
            +-- Creatives
\`\`\`

### Business Center Setup

1. Go to **business.tiktok.com**
2. Register with email and password
3. Complete email verification
4. Create Business Center (name and timezone)
5. The BC becomes your central hub for all advertising assets

## Permission Levels: Who Can Do What

TikTok offers three main permission levels for ad accounts, plus two financial roles:

### Ad Account Roles

| Role | Permissions | Best For |
|------|-------------|----------|
| **Admin** | Full permissions including financial management | Campaign managers, account leads |
| **Operator** | Create/edit ads, no financial access | Media buyers, creative teams |
| **Analyst** | View reports only | Reporting analysts, clients |

### Financial Roles

| Role | Permissions |
|------|-------------|
| **Finance Manager** | Full control over payment functions, card management, refunds |
| **Finance Analyst** | View billing invoices and transaction logs |

### Business Center Roles

| Role | Permissions | Best For |
|------|-------------|----------|
| **BC Admin** | Full control over BC, manage members, all accounts | Agency owners, department heads |
| **BC Standard** | Can only access assigned assets | Team members, specialists |

**Recommendation:** Grant clients Analyst access for transparency. Keep Admin and Operator roles for your team. Use Finance roles sparingly—most agencies don't need client billing access.

## Two Methods for Agency Access

### Method A: Request Access to Client's Ad Account

Use this when the client already has an established TikTok ad account:

1. **Go to Business Center** → Assets → Ad Accounts
2. **Click "Add Ad Account"**
3. **Select "Request Access"**
4. **Enter Ad Account ID** (find this in the client's Ads Manager)
5. **Choose permission level**:
   - Admin for full control
   - Operator for campaign management only
   - Analyst for read-only reporting
6. **Click "Send Request"**
7. **Client receives notification** in their TikTok app (Messages section)
8. **Client approves** → Agency gains access

### Method B: Partner Invitation (Client-Initiated)

Use this when the client prefers to control the invitation:

1. **Client goes to Business Center** → Users → Partners
2. **Clicks "Add Partner"**
3. **Enters your agency's Business Center ID**
4. **Selects ad accounts to share**
5. **Chooses permission level**
6. **Sends invitation**
7. **Agency accepts** in their Business Center
8. **Access is linked** across both Business Centers

**Key advantage of Method B:** TikTok allows ad accounts to be linked to multiple Business Centers. This means clients don't have to choose between agencies—they can grant access to multiple partners simultaneously.

## Spark Ads: The QR Code Authorization Flow

Spark Ads let agencies boost organic TikTok content as ads. This requires a separate authorization flow that's unique to TikTok: **QR code scanning**.

### How It Works

1. **BC Admin** goes to Assets → TikTok Accounts
2. **Clicks "Request Access"**
3. **Selects permission scopes**:
   - Access profile information
   - Access live videos
   - Use posts for ads
   - Access public videos
4. **System generates a QR code**
5. **TikTok account owner scans QR code** with their phone
6. **Authorization completes** → Agency can now boost content

### Why This Matters

Unlike Meta's Page access (granted through Business Manager) or YouTube's channel permissions, TikTok requires the actual creator to physically scan a QR code. This means:

- You can't complete this remotely without the creator present
- The creator must have their phone with the TikTok app
- Screen sharing doesn't work—needs to be in-person or coordinated live

**Pro tip:** Schedule a 5-minute video call with the creator to complete this step. Have them ready with TikTok open while you generate the QR code.

## Common Issues & Solutions

### Issue 1: "Account Already Linked to Another Business Center"

**Cause:** The ad account is already associated with a different Business Center.

**Solution:** Unlike some platforms, TikTok allows multiple Business Center links. Have the client:
1. Go to their Business Center → Assets → Ad Accounts
2. Select the account
3. Click "Link to Business Center"
4. Enter your agency's BC ID

### Issue 2: "Access Request Not Received"

**Cause:** Requests appear in TikTok app notifications, not email.

**Solution:**
1. Have client open TikTok app
2. Go to Profile → Menu (three lines) → Messages
3. Look for "Business Center" notifications
4. Also verify the email address matches their TikTok for Business account

### Issue 3: Wrong Permission Level Granted

**Cause:** Client selected wrong role during approval.

**Solution:**
1. Go to Business Center → Users → Ad Accounts
2. Select the user
3. Click pencil icon
4. Change role
5. Save changes (takes effect immediately)

### Issue 4: Attribution Settings Are View-Only

**Cause:** As of January 1, 2024, TikTok made attribution parameters view-only for agencies.

**Impact:** Agencies can see attribution settings but cannot modify:
- Attribution windows
- View-through settings
- Click-through settings

**Solution:** For full attribution control, clients must configure settings in their own Ads Manager. Provide them with written instructions for the specific changes needed.

### Issue 5: Sandbox Account Spending Limits

**Cause:** Testing with a Sandbox account (limited to $500/day).

**Solution:**
- Use Sandbox for testing campaign structures and creative workflows
- For production traffic, switch to a Standard account
- Standard accounts require business license verification (1-3 day review)

### Issue 6: Business Center Limit Reached

**Cause:** User already has 3 Business Centers.

**Solutions:**
1. **Archive unused Business Centers** (Settings → Business Info → Archive)
2. **Use team member accounts** strategically (each person can have 3 BCs)
3. **Consolidate** multiple small clients into one BC (less ideal for separation)

## TikTok vs. Meta vs. Google vs. LinkedIn

| Feature | TikTok | Meta | Google | LinkedIn |
|---------|-------|------|--------|----------|
| **Business Center** | Yes (max 3) | Yes (unlimited) | MCC (unlimited) | Campaign Manager |
| **Permission Levels** | 3 (Admin, Operator, Analyst) | 4 levels | 4 levels | 5 levels |
| **Spark Ads** | QR code authorization | N/A | N/A | N/A |
| **Agency Attribution** | View-only (2024+) | Full control | Full control | Full control |
| **Multi-BC Linking** | Yes | Yes | No | No |
| **Unique Constraint** | 3 BC limit per user | None | None | Connection required |

## Security Best Practices

### 1. Never Share Login Credentials

TikTok Business Center is designed for team access. Sharing passwords:
- Breaks audit trails
- Creates security vulnerabilities
- Violates TikTok's terms

### 2. Enable Two-Factor Authentication

Required for all Business Center admins. Make it standard for all team members.

### 3. Audit Access Regularly

Quarterly review:
- Who has access to which accounts
- Whether permission levels are still appropriate
- Former team members or clients who should be removed

### 4. Remove Access Promptly

When clients churn or team members leave:
- Remove their access within 24 hours
- Document the removal in your records
- Verify they no longer appear in any Business Center

### 5. Use Dedicated Agency Emails

Create separate TikTok accounts for team members using their agency email. This:
- Maintains professional boundaries
- Simplifies offboarding
- Keeps client access separate from personal accounts

### 6. Monitor Connected Business Centers

TikTok shows which Business Centers are linked to each ad account. Periodically verify only authorized partners have access.

## Pro Tips for Agency Teams

### Structure Your Business Centers Strategically

With the 3-BC limit, consider:

- **BC 1:** Active clients (primary revenue)
- **BC 2:** Prospects and testing
- **BC 3:** Internal projects or overflow

### Use Campaign Groups for Client Organization

Campaign groups help organize large accounts:
- Group by product line, season, or objective
- Set group-level budgets
- Simplify reporting and management

### Prepare Clients for Spark Ads Authorization

Before scheduling that QR code call:
- Send a brief explanation of what Spark Ads are
- Confirm the creator has the TikTok app installed
- Schedule for when they'll have 5 minutes of focus time
- Have a backup plan if they can't complete it live

### Document Everything

TikTok's interface changes frequently. Document:
- Which permission levels each client granted
- Who approved access and when
- Any special configurations or workarounds

## The Alternative: Streamline with AuthHub

Managing TikTok access—along with Meta, Google, LinkedIn, Pinterest, and every other platform—quickly becomes an operational burden. Each platform has different:

- Permission systems
- Authorization workflows
- Notification methods
- Token refresh requirements

AuthHub consolidates everything into a single workflow:

1. **Create an access request** in AuthHub (select TikTok + any other platforms)
2. **Send one link** to your client
3. **Client authorizes** each platform through guided OAuth flows
4. **Tokens are stored securely** and refreshed automatically
5. **Audit logging** tracks every access for compliance

No more chasing clients through different interfaces. No more explaining Business Center vs. ad account. No more manual token management.

**Transform your client onboarding:**

[Get Started with AuthHub](https://authhub.co) →
`,
    category: "tutorials",
    stage: "consideration",
    publishedAt: "2026-03-01",
    readTime: 12,
    author: {
      name: "Jon High",
      role: "Founder",
    },
    tags: ["TikTok Ads", "Business Center", "Spark Ads", "permissions"],
    metaTitle: "TikTok Ads Access for Agencies: Business Center Guide",
    metaDescription: "Complete guide to TikTok Business Center access for agencies. Learn permission levels, Spark Ads QR authorization, and navigate the 3-Business-Center limit.",
    relatedPosts: [
      "meta-ads-access-guide",
      "pinterest-ads-access-guide",
      "linkedin-ads-access-guide",
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
