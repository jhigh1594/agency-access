# Pinterest Ads Access Research for Marketing Agencies

**Research Date:** March 2025
**Platform:** Pinterest Ads Manager
**Focus:** E-commerce Agencies & Client Access Workflows

---

## Executive Summary

Pinterest is a visual discovery platform with 445+ million monthly active users. Unlike other social platforms, Pinterest is fundamentally a **search-driven inspiration platform** where users actively search for ideas, products, and services. This makes Pinterest particularly valuable for e-commerce agencies, especially those in fashion, home decor, beauty, and lifestyle categories.

**Key Insight for Agencies:** Pinterest users spend **2x more monthly** than users on other platforms and show **85% more add-to-cart actions** compared to other social platforms.

---

## 1. Pinterest Business Account Structure

### Account Types

| Account Type | Description | Use Case |
|-------------|-------------|----------|
| **Personal Account** | Basic Pinterest usage for individuals | Personal browsing and pinning |
| **Business Account** | Required for advertising and analytics | Agencies, brands, e-commerce merchants |
| **Verified Merchant** | Business account with blue verification badge | Established e-commerce brands |

### Business Account Features

- **Rich Pins**: Enhanced pins with real-time pricing, availability, and product information
- **Product Pins**: Display current prices, availability, and direct purchase links
- **Pinterest Tag**: Tracking code for conversion measurement and ad optimization
- **Analytics Dashboard**: Performance metrics and audience insights
- **Catalog Management**: Product feed integration for shopping campaigns
- **Shop Tab**: Auto-created storefront on profile when catalog is uploaded

### Hierarchy Structure

```
Business Account (Top Level)
├── Business Profile (Organic presence)
│   ├── Pins
│   └── Boards
├── Ad Accounts (One or more)
│   ├── Campaigns
│   ├── Ad Groups
│   └── Ads
└── Catalog (Product feeds)
    └── Product Pins
```

---

## 2. Official Pinterest Ads Manager Access Workflow

### Step 1: Create or Convert to Business Account

**For New Accounts:**
1. Go to `https://www.pinterest.com`
2. Click "Sign up" or "Register"
3. Choose "Create a business account"
4. Enter business details (name, website, industry)
5. Accept Pinterest's Business Terms of Service

**Convert Existing Personal Account:**
1. Log into personal Pinterest account
2. Click profile icon → Settings → Account management
3. Select "Convert to business account"
4. Complete business profile information
5. All existing pins and followers are preserved

### Step 2: Create Ad Account

1. Navigate to **Business Hub** → **Ads Account Overview**
2. Select currency and click "Next"
3. Accept Pinterest Ads Agreement
4. Ad account ID is generated
5. View ad account via **Manage Business** → **Business Manager**

### Step 3: Partner Invitation Workflow (Agency Access)

**Agency invites Client (Partner Invitation):**

1. **Client** navigates to: **Partners** → **Invite Partners**
2. Enter the **Agency's Partner ID**
3. Select ad account(s) to share
4. Configure access permissions
5. Send invitation

**Agency accepts invitation:**

1. Agency receives invitation notification
2. Reviews permissions and assets to be accessed
3. Accepts invitation via Business Manager or API
4. Agency can now manage client's ad account

### Step 4: Pinterest Tag Installation

**For E-commerce Sites:**
```html
<!-- Base Pinterest Tag -->
<script>
  pintrk('track', 'pagevisit');
</script>

<!-- Checkout Event with Product Data -->
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

**Tag ID Location:** Business account → **Ads** → **Conversions** → Copy Tag ID

### Step 5: Catalog Setup (For Shopping Ads)

1. **For Shopify stores:** Install official Pinterest for Shopify app
   - Automatic daily catalog sync
   - Pinterest tag auto-installation
   - Product pin creation for entire catalog

2. **For other platforms:** Create product feed
   - Format: CSV, XML, or API via Pinterest Catalogs API
   - Required fields: `item_id`, `title`, `description`, `link`, `image_link`, `price`, `availability`
   - Supports up to 20 feeds per account for different markets/currencies

---

## 3. Permission Levels & Scopes

### Business Roles (Account-Level)

| Role | Description | Permissions |
|------|-------------|-------------|
| **EMPLOYEE** | Standard team member | Access assigned assets only |
| **BIZ_ADMIN** | Business Administrator | Full account access, can manage members and partners |

### OAuth Scopes (API Permissions)

| Scope | Read Permissions | Write Permissions |
|-------|------------------|-------------------|
| `ads` | See ads, ad groups, campaigns data | Create, update, delete ads and campaigns |
| `billing` | View billing profile and data | Manage billing information |
| `biz_access` | View business access data | Manage business access and invitations |
| `boards` | View public/secret boards | Create, update, delete boards |
| `catalogs` | View catalog data | Manage product catalogs and feeds |
| `pins` | View public/secret pins | Create, update, delete pins |
| `user_accounts` | View user accounts and followers | Manage user accounts |

### Asset-Level Permissions

When sharing access, specific asset permissions can be granted:

- **READ** - View only access to data
- **WRITE** - Create and edit permissions
- **REPORTING** - Access to analytics and reports

**Example Invite Payload:**
```json
{
  "business_role": "PARTNER",
  "invite_type": "PARTNER_INVITE",
  "asset_to_id_permissions": {
    "ad_account_123": ["READ", "WRITE"],
    "catalog_456": ["READ"]
  }
}
```

---

## 4. Common Issues Agencies Face (E-commerce Focus)

### Issue 1: Pinterest Tag Not Firing

**Symptoms:** No conversions recorded, inaccurate ROAS

**Solutions:**
- Verify Tag ID matches the one in Pinterest Ads Manager
- Use Pinterest Tag Helper browser extension to debug
- Check for tag conflicts (multiple tag installations)
- Ensure checkout events fire on thank-you/confirmation page

### Issue 2: Product Catalog Sync Failures

**Symptoms:** Missing products, outdated pricing, "out of stock" errors

**Solutions:**
- **Shopify users:** Reinstall Pinterest app, check API permissions
- **Custom feeds:** Validate feed format against Pinterest specification
- Check image URLs are publicly accessible (not behind auth)
- Ensure all required fields are present and properly formatted
- Use `availability: "out of stock"` instead of removing products

### Issue 3: Verified Merchant Program Rejection

**Common Reasons:**
- Incomplete website pages (missing Contact, Refund Policy, Shipping Policy)
- Website doesn't match merchant guidelines
- Product pricing/availability inaccurate

**Solutions:**
- Complete all required website pages before applying
- Ensure real-time product data sync
- Verify website ownership via DNS or file upload
- Maintain high-quality website and product pages

### Issue 4: Ad Account Suspensions (China-Based Businesses)

**Issue:** Pinterest has not fully opened self-service advertising to China-based entities

**Workarounds:**
- Use official Pinterest advertising partners (e.g., 飞书逸途/Sinoclick)
- Partners provide compliant account opening and RMB payment options
- Account type: Independent ad account (recommended) vs. BM architecture
- Minimum deposit typically $300-$1000 depending on partner

### Issue 5: Creative Approval Delays

**Common Rejection Reasons:**
- Images below 600x900 pixels
- Poor image quality (blurry, grainy)
- Incorrect orientation (not vertical)
- Before/after images
- Excessive text overlay (>20% of image)
- Misleading claims or false urgency

**Best Practices:**
- Use 1000x1500 pixels (2:3 aspect ratio)
- High-quality, professionally edited images
- Vertical orientation preferred
- Minimal or no text on images
- Authentic, lifestyle photography

### Issue 6: ROI Tracking Challenges

**Problem:** Pinterest has longer attribution windows (up to 30 days)

**Solutions:**
- Use view-through and click-through attribution
- Implement Pinterest Conversions API alongside tag
- Track assisted conversions, not just last-click
- Consider Pinterest's role in awareness/funnel-top activities

---

## 5. Pinterest & E-commerce Platform Integrations

### Shopify Integration

**Official App Features:**
- Automatic daily catalog sync in near real-time
- Pinterest tag auto-installation
- Entire catalog becomes browsable Product Pins
- Unified dashboard in Shopify admin
- Support for multiple Shopify stores under one Pinterest account

**Setup:**
1. Install "Pinterest for Shopify" from Shopify App Store
2. Connect Pinterest Business account
3. Sync product catalog
4. Enable "Save to Pinterest" button on store

### Supported E-commerce Platforms

- **Shopify** (Official app)
- **WooCommerce** (via plugin)
- **Magento** (via extension)
- **BigCommerce** (via integration)
- **Custom platforms** (via Catalogs API)

### Catalog Feed Specifications

**Required Fields:**
```csv
id,title,description,link,image_link,price,availability,condition
001,Product Name,Description,https://site.com/product,https://site.com/image.jpg,19.99 USD,in stock,new
```

**Optional but Recommended Fields:**
- `brand` - For Verified Merchant eligibility
- `google_product_category` - For product categorization
- `item_group_id` - For product variants
- `sale_price` - For promotional pricing
- `shipping` - For shipping cost calculation

**Feed Schedule:**
- Minimum: Daily update
- Recommended: Real-time via API for inventory changes
- Multi-feed support: Up to 20 feeds per account

---

## 6. Security Best Practices for Pinterest OAuth

### 1. Token Management

**Never Store Tokens in Database or Code:**
```typescript
// ❌ WRONG - Never do this
const token = 'pina_...';  // Hardcoded token
await database.save({ token });

// ✅ CORRECT - Use secrets management
const secretId = await secretsManager.store('pinterest_token', {
  accessToken: token.access_token,
  refreshToken: token.refresh_token,
  expiresAt: token.expires_at
});
await database.save({ secretId });
```

### 2. Use Continuous Refresh Tokens

Pinterest supports `continuous_refresh=true` parameter during initial OAuth exchange, which returns refresh tokens that don't expire.

**Example:**
```bash
POST https://api.pinterest.com/v5/oauth/token
Authorization: Basic {base64(client_id:client_secret)}
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code={auth_code}&
redirect_uri={redirect_uri}&
continuous_refresh=true
```

### 3. Token Refresh Before Expiration

Access tokens typically expire after 30 days. Implement scheduled refresh:

```typescript
// Refresh token flow
POST https://api.pinterest.com/v5/oauth/token
Authorization: Basic {base64(client_id:client_secret)}

grant_type=refresh_token&
refresh_token={stored_refresh_token}&
scope=ads:read,ads:write
```

### 4. Scope Minimization

Request only the scopes needed for your use case:

| Use Case | Required Scopes |
|----------|----------------|
| Campaign reporting | `ads:read` |
| Create/edit campaigns | `ads:write` |
| Catalog management | `catalogs:read`, `catalogs:write` |
| Full agency access | `ads:read`, `ads:write`, `billing:read`, `catalogs:write`, `biz_access:write` |

### 5. PKCE (Proof Key for Code Exchange)

For public clients (mobile apps, SPAs), use PKCE instead of client secret:

1. Generate code verifier and code challenge
2. Include `code_challenge` and `code_challenge_method=S256` in authorization URL
3. Include `code_verifier` in token exchange

### 6. Secure Redirect URIs

- Always use HTTPS
- Whitelist redirect URIs in Pinterest App settings
- Use dynamic redirect URIs with nonce/state parameter for CSRF protection
- Never use `localhost` in production

### 7. Audit Logging

Log all token access for compliance:

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

---

## 7. Why Pinterest Matters for E-commerce Agencies

### User Demographics & Intent

| Metric | Pinterest | Other Platforms |
|--------|-----------|-----------------|
| **Monthly Active Users** | 445M+ | Varies |
| **Users with Household Income >$100K** | 45% | ~25-30% |
| **Users who actively search** | 80% | ~20-30% |
| **Average monthly spend** | 2x higher | Baseline |
| **Add-to-cart rate** | 85% higher | Baseline |

### Pinterest vs. Other Platforms

| Feature | Pinterest | Meta/IG | TikTok | Google Ads |
|---------|-----------|---------|--------|------------|
| **User Intent** | Active search | Passive browsing | Passive browsing | Active search |
| **Content Lifespan** | Months-years | Days | Days | N/A |
| **Visual Focus** | High | High | High | Low |
| **E-commerce Native** | Yes | Growing | Growing | Yes (Shopping) |
| **Attribution Window** | Up to 30 days | 7-28 days | 7 days | 30+ days |

### Ideal E-commerce Categories

**Best Performing:**
- Fashion & Apparel
- Home Decor & Furniture
- Beauty & Cosmetics
- Food & Beverage
- DIY & Crafts
- Wedding & Events
- Travel & Experiences

**Moderate Performance:**
- Electronics
- Fitness & Wellness
- Pets
- Baby & Kids

### Seasonality Planning

Pinterest users plan **30-60 days ahead**. Content strategy:

| Season | Post Content Timeline |
|--------|----------------------|
| **Holiday/Gift** | October-November |
| **Wedding** | January-March (peak) |
| **Home Decor** | Spring (March-May) |
| **Fashion** | 4-6 weeks before season |

---

## 8. Key Statistics for Client Presentations

### Platform Statistics
- **445+ million** monthly active users globally
- **97%** of searches are unbranded (discovery opportunity)
- Pinterest users are **50% more likely** to try new brands
- **80%** of users discover new brands and products on Pinterest
- Users spend **2x more** monthly than on other platforms
- **85% more** add-to-cart actions compared to other platforms

### E-commerce Statistics
- **Product Pins** show real-time pricing and availability
- **Rich Pins** provide detailed product information
- **Catalog feeds** support up to 20 feeds per account
- **Shopify integration** offers near real-time sync
- **Conversion tracking** supports both tag and Conversions API

---

## 9. API Endpoints for Agency Integration

### Authentication & Token Management

```
POST /v5/oauth/token                    # Exchange code for access token
POST /v5/oauth/token                    # Refresh access token
```

### Business Access & Sharing

```
POST /v5/business_access/invites        # Create invites/requests
PATCH /v5/business_access/invites/{id}  # Accept/decline invites
GET  /v5/businesses/{id}/members        # List business members
PATCH /v5/businesses/{id}/members/{id}  # Change member roles
```

### Ads Management

```
GET  /v5/ad_accounts                    # List accessible ad accounts
POST /v5/ad_accounts/{id}/campaigns     # Create campaign
GET  /v5/ad_accounts/{id}/campaigns     # List campaigns
POST /v5/ad_accounts/{id}/ad_groups     # Create ad group
GET  /v5/ad_groups/{id}/ads             # List ads in ad group
```

### Catalog Management

```
GET  /v5/catalogs/feeds                 # List feeds
POST /v5/catalogs/feeds                 # Create feed
GET  /v5/catalogs/feeds/{id}            # Get feed details
POST /v5/catalogs/feeds/{id}/items      # Ingest feed items
POST /v5/catalogs/{id}/items/batch     # Batch item operations
```

---

## 10. Quick Reference: Agency Access Checklist

### Before Onboarding Client
- [ ] Client has Pinterest Business account
- [ ] Client has active Ad Account
- [ ] Pinterest Tag is installed on client's website
- [ ] Catalog feed is configured (for shopping ads)
- [ ] Verified Merchant status (optional but recommended)

### Agency Access Setup
- [ ] Client invites agency via Partners → Invite Partners
- [ ] Agency accepts invitation
- [ ] Verify permissions (READ, WRITE for ad accounts)
- [ ] Confirm access to reporting and analytics
- [ ] Test API access if using programmatic management

### Ongoing Management
- [ ] Monitor token expiration (30-day validity)
- [ ] Implement automatic token refresh
- [ ] Log all API access for audit trail
- [ ] Regularly review granted permissions
- [ ] Revoke access when relationship ends

---

## 11. Additional Resources

### Official Documentation
- **Pinterest Developers**: https://developers.pinterest.com
- **Pinterest API v5 Docs**: https://developers.pinterest.com/docs/api/v5/
- **Business Access Sharing**: https://developers.pinterest.com/docs/api-features/share-business-access
- **Pinterest Tag**: https://developers.pinterest.com/docs/api-features/pinterest-tag
- **Shopping Overview**: https://developers.pinterest.com/docs/api-features/shopping-overview

### E-commerce Integration
- **Pinterest for Shopify App**: https://apps.shopify.com/pinterest
- **Catalog Best Practices**: https://developers.pinterest.com/docs/api-features/shopping-best-practices
- **Conversions API**: https://developers.pinterest.com/docs/api-features/third-party-integrations

### Agency Resources
- **Pinterest Business Help Center**: https://help.pinterest.com/en/business/article
- **Pinterest Ads Manager**: https://ads.pinterest.com/
- **Verified Merchant Program**: https://help.pinterest.com/en/business/article/get-verified-on-pinterest

### For China-Based Businesses
- **飞书逸途 (Sinoclick)**: Official Pinterest advertising partner
- **Account Opening**: Via partner (not self-service)
- **Payment**: RMB supported
- **Support**: Chinese language available

---

**Research Compiled:** March 1, 2025
**Sources:** Official Pinterest Developer Documentation, Business Help Center, and verified agency resources
**Next Steps:** Consider integrating Pinterest as a platform connector in Agency Access Platform
