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

```
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
```

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

1. Go to `pinterest.com` and click **"Create business account"**
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

```html
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
```

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
| `ads:read` | View campaigns, ad groups, and reporting data |
| `ads:write` | Create, edit, and delete campaigns and ads |
| `billing:read` | View billing information |
| `catalogs:read` | View product catalogs |
| `catalogs:write` | Manage product feeds and catalogs |
| `biz_access:write` | Manage business access and invitations |

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
- Check that all required fields are present: `item_id`, `title`, `description`, `link`, `image_link`, `price`, `availability`
- Use `availability: "out of stock"` instead of removing products entirely

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

Pinterest supports `continuous_refresh=true` during OAuth, which returns refresh tokens that don't expire. This prevents access disruption every 30 days.

### 2. Never Store Tokens in Your Database

Store only the `secretId` reference in your database. The actual tokens live in a secrets management system (Infisical, AWS Secrets Manager, etc.).

### 3. Request Minimum Required Scopes

Don't ask for `billing:write` if you only need `ads:read`. Scope minimization reduces risk if credentials are compromised.

### 4. Log All Access

Maintain an audit trail of every API call:

```typescript
{
  "action": "token_accessed",
  "timestamp": "2025-03-01T10:00:00Z",
  "user_email": "agency@example.com",
  "ip_address": "192.168.1.1",
  "scopes_used": ["ads:read", "ads:write"],
  "asset_id": "ad_account_123"
}
```

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
