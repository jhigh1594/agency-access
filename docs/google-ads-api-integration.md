# Google Ads API Integration Reference

## Overview

This document summarizes the implementation and troubleshooting of Google Ads API integration for fetching client accounts after OAuth authorization. It covers common issues, solutions, and best practices learned during development.

## Key Learnings

### 1. API Version Compatibility

**Critical Finding:** The Google Ads API REST endpoint version matters significantly:
- **v17**: Returns 404 (Not Found) - endpoint doesn't exist
- **v18**: Returns 501 (Not Implemented) - endpoint exists but operation not supported
- **v19**: Returns 401 (Unauthenticated) - endpoint works, needs valid credentials
- **v22**: ✅ **Recommended** - Latest stable version, fully functional

**Solution:** Always use the latest stable API version (currently v22).

### 2. Required Headers

The Google Ads API requires three essential headers for all REST requests:

```typescript
{
  'Authorization': `Bearer ${accessToken}`,      // OAuth 2.0 access token
  'developer-token': developerToken,              // Developer token from Google Ads API Center
  'Content-Type': 'application/json'             // Required for POST requests
}
```

**Important Notes:**
- The `developer-token` header is **required** for all Google Ads API calls
- Developer token must be approved in Google Ads API Center
- Developer token must be stored securely (use environment variables)

### 3. HTTP Method for listAccessibleCustomers

**Critical Finding:** The `listAccessibleCustomers` endpoint uses **GET**, not POST.

**Correct Implementation:**
```typescript
const response = await fetch(
  'https://googleads.googleapis.com/v22/customers:listAccessibleCustomers',
  {
    method: 'GET',  // ✅ GET is correct
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    },
  }
);
```

**Incorrect (will fail):**
- Using POST method
- Missing developer-token header
- Using query parameters for access token (should be in Authorization header)

### 4. OAuth Scope Configuration

**Problem:** OAuth scopes were not being correctly extracted from the access request structure.

**Root Cause:** The `platforms` array contains objects like:
```typescript
{
  product: 'google_ads',
  accessLevel: 'view'
}
```

But the code was checking `googleProducts.includes('google_ads')` which always returned false.

**Solution:** Extract product IDs before checking:
```typescript
const productIds = googleProducts.map((p: any) =>
  typeof p === 'string' ? p : p.product
);

if (productIds.includes('google_ads')) {
  scopes.push('https://www.googleapis.com/auth/adwords');
}
```

**Required OAuth Scopes:**
- Google Ads: `https://www.googleapis.com/auth/adwords`
- Google Analytics: `https://www.googleapis.com/auth/analytics.readonly`
- Google Business Profile: `https://www.googleapis.com/auth/business.manage`
- Google Tag Manager: `https://www.googleapis.com/auth/tagmanager.readonly`
- Google Merchant Center: `https://www.googleapis.com/auth/content`
- User Info: `https://www.googleapis.com/auth/userinfo.email` (always include)

### 5. Fetching Account Display Names

**Problem:** `listAccessibleCustomers` only returns customer resource names (IDs), not display names.

**Solution:** Query each customer individually to get their `descriptive_name`:

```typescript
// Step 1: Get list of accessible customers
const listResponse = await fetch(
  'https://googleads.googleapis.com/v22/customers:listAccessibleCustomers',
  { method: 'GET', headers: { ... } }
);
const { resourceNames } = await listResponse.json();

// Step 2: Extract customer IDs
const customerIds = resourceNames.map(rn => rn.split('/').pop());

// Step 3: Query each customer for descriptive name (in parallel)
const accountPromises = customerIds.map(async (customerId) => {
  const searchResponse = await fetch(
    `https://googleads.googleapis.com/v22/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: { ... },
      body: JSON.stringify({
        query: 'SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1',
      }),
    }
  );
  
  const searchData = await searchResponse.json();
  const customer = searchData.results?.[0]?.customer;
  return {
    id: customerId,
    name: customer?.descriptiveName || `Account ${customerId}`,
    type: 'google_ads',
    status: 'active',
  };
});

const accounts = await Promise.all(accountPromises);
```

**Performance Note:** Use `Promise.all()` to query customers in parallel for better performance.

## Common Error Codes and Solutions

### 404 Not Found
- **Cause:** Wrong API version or incorrect endpoint URL
- **Solution:** Use v22 and verify endpoint format: `customers:listAccessibleCustomers`

### 401 Unauthenticated
- **Cause:** Invalid or expired OAuth access token
- **Solution:** Refresh the access token or re-authenticate

### 403 Forbidden / Permission Denied

**Multiple possible causes:**

1. **Google Ads API not enabled in Google Cloud project**
   - **Solution:** Enable the API at: `https://console.developers.google.com/apis/api/googleads.googleapis.com/overview?project={PROJECT_ID}`

2. **Developer token not approved or insufficient permissions**
   - **Solution:** Verify developer token status in Google Ads API Center

3. **⚠️ CRITICAL: "Test Access" Developer Token trying to access Production Accounts**
   - **The "Look but don't touch" error:** `listAccessibleCustomers` works (you can see accounts), but all detail queries return 403
   - **Root Cause:** Developer Token is in "Test Access" mode but you're querying Production (real) accounts
   - **The Rule:** Test Access tokens can ONLY interact with designated Test Accounts (marked with red "Test Account" label in Google Ads UI)
   - **Solution Options:**
     - **Option A (Recommended for Production):** Apply for "Basic Access" in Google Ads Manager Account > Tools & Settings > API Center
     - **Option B (For Development):** Create Test Accounts at: `https://ads.google.com/aw/billing/testaccountcreate` and use those for testing
   - **How to Check:** Go to Google Ads Manager Account (MCC) > Tools & Settings > API Center > Check if token says "Test Account"
   - **Symptom:** All accounts return 403 when querying `customer` or `customer_client`, but `listAccessibleCustomers` succeeds

### 501 Not Implemented
- **Cause:** API version doesn't support the operation
- **Solution:** Upgrade to a newer API version (v22 recommended)

## Implementation Checklist

- [ ] Developer token configured in environment variables (`GOOGLE_ADS_DEVELOPER_TOKEN`)
- [ ] Developer token approved in Google Ads API Center
- [ ] **Developer token access level verified (Test vs Basic/Standard)**
- [ ] Google Ads API enabled in Google Cloud Console
- [ ] OAuth scopes correctly extracted and requested
- [ ] Using API v22 (latest stable version)
- [ ] Using GET method for `listAccessibleCustomers`
- [ ] All required headers included (Authorization, developer-token, Content-Type, login-customer-id)
- [ ] Access token is valid and not expired
- [ ] Account display names fetched using universal `customer_client` query
- [ ] Error handling implemented for all API calls (especially 403 Test Access errors)

## API Endpoints Reference

### List Accessible Customers
```
GET https://googleads.googleapis.com/v22/customers:listAccessibleCustomers
```

**Headers:**
- `Authorization: Bearer {accessToken}`
- `developer-token: {developerToken}`
- `Content-Type: application/json`

**Response:**
```json
{
  "resourceNames": [
    "customers/1234567890",
    "customers/0987654321"
  ]
}
```

### Search Customer Details
```
POST https://googleads.googleapis.com/v22/customers/{customerId}/googleAds:search
```

**Headers:**
- `Authorization: Bearer {accessToken}`
- `developer-token: {developerToken}`
- `Content-Type: application/json`

**Body:**
```json
{
  "query": "SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1"
}
```

**Response:**
```json
{
  "results": [
    {
      "customer": {
        "id": "1234567890",
        "descriptiveName": "My Business Account"
      }
    }
  ]
}
```

## Files Modified

1. **`apps/api/src/routes/client-auth.ts`**
   - Fixed OAuth scope extraction for Google products
   - Added proper scope mapping for all Google products

2. **`apps/api/src/services/connectors/google.ts`**
   - Updated to API v22
   - Fixed HTTP method (GET instead of POST)
   - Added developer token header
   - Implemented universal `customer_client` query (works for both direct and manager accounts)
   - Simplified logic to remove complex fallback attempts
   - Added specific error handling for Test Access token issues

3. **`apps/api/src/services/client-assets.service.ts`**
   - Updated to API v22
   - Added developer token header support

4. **`apps/api/src/services/connectors/google-ads.ts`**
   - Updated to API v22
   - Added developer token header support

5. **`apps/web/src/components/client-auth/GoogleAssetSelector.tsx`**
   - Fixed display name priority (use `displayName` over `name`)

## Testing Checklist

1. **OAuth Flow:**
   - [ ] Client can authorize Google account
   - [ ] Correct scopes are requested
   - [ ] Access token is stored correctly

2. **Account Listing:**
   - [ ] Google Ads accounts appear after authorization
   - [ ] Account display names show correctly (not just IDs)
   - [ ] Multiple accounts are displayed if available

3. **Error Handling:**
   - [ ] Graceful handling when API is not enabled
   - [ ] Graceful handling when developer token is missing
   - [ ] Graceful handling when no accounts are accessible

## Environment Variables

```bash
# Required
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token_here

# OAuth (already configured)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

## Resources

- [Google Ads API Documentation](https://developers.google.com/google-ads/api/docs/)
- [Listing Accessible Accounts](https://developers.google.com/google-ads/api/docs/account-management/listing-accounts)
- [REST API Authorization](https://developers.google.com/google-ads/api/rest/auth)
- [Google Ads API Center](https://ads.google.com/aw/apicenter)
- [Google Cloud Console - Enable API](https://console.developers.google.com/apis/api/googleads.googleapis.com/overview)

## Notes

- The Google Ads API is primarily a gRPC API, but REST endpoints are available for certain operations
- `listAccessibleCustomers` is one of the few REST endpoints that doesn't require a customer ID
- Developer tokens must be approved before use (can take 24-48 hours)
- API version updates are frequent - always check for the latest stable version
- Rate limits apply - implement proper error handling and retry logic for production

