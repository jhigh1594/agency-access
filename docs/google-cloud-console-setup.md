# Google Cloud Console API Setup Guide

Based on the errors encountered, here are the APIs that need to be enabled in Google Cloud Console for project **467770638548**.

## Required APIs to Enable

### 1. ✅ Google Ads API (Already Enabled)
- **Status**: Working
- **API Name**: Google Ads API
- **Enable URL**: https://console.developers.google.com/apis/api/googleads.googleapis.com/overview?project=467770638548

### 2. ❌ My Business Account Management API (Needs Enablement)
- **Error**: `My Business Account Management API has not been used in project 467770638548 before or it is disabled`
- **API Name**: My Business Account Management API
- **Enable URL**: https://console.developers.google.com/apis/api/mybusinessaccountmanagement.googleapis.com/overview?project=467770638548
- **Used For**: Google Business Profile accounts

### 3. ❌ Google Search Console API (Scope Issue)
- **Error**: `Request had insufficient authentication scopes`
- **Current Scope**: `https://www.googleapis.com/auth/webmasters.readonly`
- **API Name**: Google Search Console API
- **Enable URL**: https://console.developers.google.com/apis/api/webmasters.googleapis.com/overview?project=467770638548
- **Note**: The API may need to be enabled, but the main issue is likely the OAuth scope. Try using `https://www.googleapis.com/auth/webmasters` (without `.readonly`) if the API is already enabled.

### 4. ❌ Google Merchant Center API (Endpoint Issue)
- **Error**: `404 Not Found`
- **API Name**: Content API for Shopping (Merchant Center)
- **Enable URL**: https://console.developers.google.com/apis/api/content.googleapis.com/overview?project=467770638548
- **Note**: The endpoint might also be incorrect. The API may need to be enabled first.

### 5. ✅ Google Analytics API (Already Working)
- **Status**: Working
- **API Name**: Google Analytics Admin API
- **Enable URL**: https://console.developers.google.com/apis/api/analyticsadmin.googleapis.com/overview?project=467770638548

### 6. ✅ Google Tag Manager API (Likely Working)
- **Status**: No errors shown
- **API Name**: Tag Manager API
- **Enable URL**: https://console.developers.google.com/apis/api/tagmanager.googleapis.com/overview?project=467770638548

## Quick Setup Steps

1. **Navigate to Google Cloud Console**:
   - Go to: https://console.cloud.google.com/apis/library?project=467770638548

2. **Enable Each API**:
   - Search for each API name listed above
   - Click on the API
   - Click "Enable"
   - Wait a few minutes for the API to propagate

3. **Verify OAuth Scopes**:
   - Go to: https://console.cloud.google.com/apis/credentials/consent?project=467770638548
   - Ensure all required scopes are added to your OAuth consent screen

## Required OAuth Scopes

Make sure these scopes are configured in your OAuth consent screen:

- `https://www.googleapis.com/auth/adwords` - Google Ads
- `https://www.googleapis.com/auth/analytics.readonly` - Google Analytics
- `https://www.googleapis.com/auth/business.manage` - Google Business Profile
- `https://www.googleapis.com/auth/tagmanager.readonly` - Google Tag Manager
- `https://www.googleapis.com/auth/content` - Google Merchant Center
- `https://www.googleapis.com/auth/webmasters` or `https://www.googleapis.com/auth/webmasters.readonly` - Google Search Console
- `https://www.googleapis.com/auth/userinfo.email` - User Info (always required)

## Direct Enable Links

Click these links to enable each API directly:

1. **My Business Account Management API**: 
   https://console.developers.google.com/apis/api/mybusinessaccountmanagement.googleapis.com/overview?project=467770638548

2. **Google Search Console API**: 
   https://console.developers.google.com/apis/api/webmasters.googleapis.com/overview?project=467770638548

3. **Content API for Shopping (Merchant Center)**: 
   https://console.developers.google.com/apis/api/content.googleapis.com/overview?project=467770638548

## After Enabling APIs

1. **Wait 2-5 minutes** for the APIs to propagate
2. **Restart your dev server** to clear any cached errors
3. **Re-authenticate** the OAuth flow to get new tokens with updated scopes
4. **Check terminal logs** for any remaining errors

## Troubleshooting

### If Search Console still shows "insufficient scopes":
- Try changing the scope from `webmasters.readonly` to `webmasters` (full access)
- Re-authenticate to get a new token with the updated scope

### If Merchant Center still shows 404:
- Verify the endpoint URL is correct: `https://www.googleapis.com/content/v2.1/accounts`
- Check if the API version needs to be updated
- Ensure the Content API for Shopping is enabled (not just "Merchant Center API")

### If Business Profile still shows 403:
- Ensure "My Business Account Management API" is enabled (not just "My Business API")
- Wait a few minutes after enabling for propagation

