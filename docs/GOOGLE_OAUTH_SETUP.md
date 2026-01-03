# Google OAuth Setup Guide

This guide walks you through setting up Google OAuth for Google Ads and Google Analytics 4 (GA4).

## Prerequisites

- Google account (Gmail or Google Workspace)
- 30-45 minutes

---

## Step 1: Create Google Cloud Project

1. Go to: https://console.cloud.google.com/
2. Sign in with your Google account
3. Click the project dropdown at the top
4. Click **"NEW PROJECT"**
5. Enter project name: `Agency Access Platform`
6. Click **"CREATE"** (wait ~30 seconds for creation)

---

## Step 2: Enable Required APIs

### Enable Google Ads API
1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for: "Google Ads API"
3. Click on it, then click **"ENABLE"**

### Enable Analytics Admin API
1. Go back to **"APIs & Services"** → **"Library"**
2. Search for: "Analytics Admin API"
3. Click on it, then click **"ENABLE"**

---

## Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (for production) or **"Internal"** (for testing only)
3. Click **"CREATE"**

### Fill in the required fields:
- **App name**: `Agency Access Platform`
- **User support email**: Your email
- **Developer contact information**: Your email
- **Scopes** (click "ADD OR REMOVE SCOPES" → manually add):
  - `https://www.googleapis.com/auth/adwords` (Google Ads)
  - `https://www.googleapis.com/auth/analytics.readonly` (GA4)
- **Authorized domains**: Your domain (optional for development)
- **Developer contact**: Your email
- **Save and Continue**

### Test Users (for Internal/Testing):
- Add your email as a test user
- Click **"SAVE AND CONTINUE"**

---

## Step 4: Create OAuth 2.0 Client IDs

### For Google Ads:

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: `Google Ads - Agency Platform`
5. **Authorized redirect URIs** (click "ADD URI"):
   - `http://localhost:3001/api/oauth/google-ads/callback` (development)
   - `https://your-api-domain.com/api/oauth/google-ads/callback` (production)
6. Click **"CREATE"**

**Save these credentials:**
- **Client ID** → `GOOGLE_ADS_CLIENT_ID`
- **Client Secret** → `GOOGLE_ADS_CLIENT_SECRET`

### For Google Analytics (GA4):

1. Click **"CREATE CREDENTIALS"** → **"OAuth client ID"** again
2. Application type: **"Web application"**
3. Name: `Google Analytics - Agency Platform`
4. **Authorized redirect URIs**:
   - `http://localhost:3001/api/oauth/ga4/callback` (development)
   - `https://your-api-domain.com/api/oauth/ga4/callback` (production)
5. Click **"CREATE"**

**Save these credentials:**
- **Client ID** → `GOOGLE_ANALYTICS_CLIENT_ID`
- **Client Secret** → `GOOGLE_ANALYTICS_CLIENT_SECRET`

---

## Step 5: Get Google Ads Developer Token

**Note:** This is required for Google Ads API access.

1. Go to: https://ads.google.com/aw/apicenter
2. Sign in with your Google account
3. Click **"Apply for API access"**
4. Fill in the form:
   - **Your name**: Your name
   - **Your email**: Your email
   - **Company name**: Your agency name
   - **Website**: Your website (or placeholder)
   - **I want to access the API for**: "My company"
   - **I want to**: "Manage my campaigns"
5. Submit the application

**Important:** Google Ads developer token approval can take 1-2 business days. You'll receive an email when approved.

**Save the token when received:**
- **Developer Token** → `GOOGLE_ADS_DEVELOPER_TOKEN`

---

## Step 6: Update Your .env File

Add the following to your `apps/api/.env` file:

```bash
# Google Ads OAuth
GOOGLE_ADS_CLIENT_ID=your-google-ads-client-id-here
GOOGLE_ADS_CLIENT_SECRET=your-google-ads-client-secret-here
GOOGLE_ADS_DEVELOPER_TOKEN=your-google-ads-developer-token-here

# Google Analytics OAuth
GOOGLE_ANALYTICS_CLIENT_ID=your-analytics-client-id-here
GOOGLE_ANALYTICS_CLIENT_SECRET=your-analytics-client-secret-here
```

---

## Step 7: Test the OAuth Flow

### For Google Ads:

```bash
# Start the API server
cd apps/api
npm run dev

# Test the OAuth initiation
curl -X POST http://localhost:3001/agency-platforms/google_ads/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "agencyId": "test-agency-id",
    "userEmail": "your@email.com"
  }'
```

Expected response:
```json
{
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
    "state": "..."
  },
  "error": null
}
```

### For GA4:

```bash
curl -X POST http://localhost:3001/agency-platforms/ga4/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "agencyId": "test-agency-id",
    "userEmail": "your@email.com"
  }'
```

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Check that the redirect URI in your Google Cloud Console **exactly matches** what's in your code
- Include `http://localhost:3001/api/oauth/google-ads/callback` for development

### Error: "access_denied"
- Make sure you're listed as a test user in the OAuth consent screen
- Or verify the API is enabled

### Error: "400 Bad Request" on initiation
- Verify the platform name matches: `google_ads` or `ga4` (not `google`)
- Check that credentials are in `.env` file

---

## Production Deployment

When deploying to production:

1. Update the redirect URIs in Google Cloud Console to your production domain:
   - `https://api.yourdomain.com/api/oauth/google-ads/callback`
   - `https://api.yourdomain.com/api/oauth/ga4/callback`

2. Add production credentials to your environment variables (Railway, Vercel, etc.)

3. Publish your OAuth app (move from "Testing" to "Production" in the OAuth consent screen)

---

## Additional Resources

- [Google Ads OAuth Documentation](https://developers.google.com/google-ads/api/docs/oauth/overview)
- [Analytics Admin API OAuth](https://developers.google.com/analytics/devguides/config/mgmt/v3)
- [Google Cloud OAuth Documentation](https://cloud.google.com/docs/authentication)
