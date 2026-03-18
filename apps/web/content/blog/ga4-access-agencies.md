---
id: ga4-access-guide
title: 'GA4 Access for Agencies: Step-by-Step Property Authorization (2026)'
excerpt: >-
  Google Analytics 4 has a completely different access model than Universal
  Analytics. Learn how to get the right GA4 property access without accidentally
  requesting the wrong account or getting stuck with insufficient permissions.
category: tutorials
stage: consideration
publishedAt: '2024-01-17'
readTime: 9
author:
  name: Jon High
  role: Founder
tags:
  - GA4
  - Google Analytics
  - analytics
  - property access
  - GA4 access for agencies
metaTitle: 'GA4 Access for Agencies: Step-by-Step Property Authorization (2026)'
metaDescription: >-
  How to get GA4 access for agencies. Step-by-step guide to Google Analytics 4
  property access — request the right permissions, avoid common errors, and get
  client analytics running in minutes.
relatedPosts:
  - google-ads-access-guide
  - meta-ads-access-guide
  - client-onboarding-47-email-problem
---
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

```
Google Analytics Account
  ├── GA4 Property 1 (e.g., ga.measurement_id)
  ├── GA4 Property 2 (migration duplicate)
  └── GA4 Property 3 (testing/staging)
```

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
