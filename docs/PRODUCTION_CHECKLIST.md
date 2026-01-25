# Production OAuth Checklist - Quick Start

## ✅ What's Already Working

- **Meta OAuth** - Fully implemented (`meta.ts`)
- **Google OAuth** - Fully implemented (`google.ts`)
- **Google Ads** - Separate connector (`google-ads.ts`)
- **GA4** - Separate connector (`ga4.ts`)

## ⚠️ Important: Two Types of OAuth

**1. Clerk OAuth (User Authentication)**
- For users signing in to your app
- Configured in Clerk Dashboard → Social Connections
- Needs separate Google OAuth client ID
- See [CLERK_GOOGLE_OAUTH_SETUP.md](./CLERK_GOOGLE_OAUTH_SETUP.md)

**2. Platform OAuth (Connecting Accounts)**
- For connecting agency/client accounts
- Configured via environment variables
- Uses different Google OAuth client ID
- See sections below

## ⚠️ What Needs to Be Done

### 1. Environment Variables (Render)

Set these in Render dashboard → Environment:

```bash
# URLs (set after deployment)
API_URL=https://your-service.onrender.com
FRONTEND_URL=https://your-app.onrender.com

# Meta OAuth
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_ADS_DEVELOPER_TOKEN=your-token  # Optional
```

### 2. Meta OAuth App Configuration

**In Meta App Settings:**

1. **Valid OAuth Redirect URIs:**
   ```
   https://your-service.onrender.com/agency-platforms/meta/callback
   ```

2. **App Review:**
   - Request permissions: `ads_management`, `ads_read`, `business_management`
   - OR add test users for immediate testing

3. **Production Mode:**
   - Toggle app to "Public" after permissions approved

### 3. Google OAuth App Configuration

**In Google Cloud Console:**

1. **Authorized Redirect URIs:**
   ```
   https://your-service.onrender.com/agency-platforms/google/callback
   ```

2. **OAuth Consent Screen:**
   - Add required scopes
   - Add privacy policy URL
   - Publish app OR add test users

3. **Enable APIs:**
   - Google Ads API
   - Google Analytics Admin API
   - Google Tag Manager API
   - (Others as needed)

### 4. Configure Clerk Google OAuth (User Authentication)

**Separate from platform OAuth!**

1. Create Google OAuth client ID in Google Cloud Console
2. Add Clerk redirect URI to authorized redirect URIs
3. Go to Clerk Dashboard → Social Connections → Google
4. Enable Google and add Client ID + Secret
5. See [CLERK_GOOGLE_OAUTH_SETUP.md](./CLERK_GOOGLE_OAUTH_SETUP.md) for details

### 5. Test OAuth Flow

1. **User Sign-In:**
   - Test "Sign in with Google" button
   - Should redirect to Google and sign you in

2. **Agency Connection:**
   - Go to `/onboarding/platforms`
   - Click "Connect" for Meta or Google
   - Should redirect to OAuth provider
   - Authorize and return to app

3. **Client Authorization:**
   - Create access request
   - Send link to client
   - Client authorizes platforms
   - Agency receives tokens

### 5. Verify Tokens

1. **Check Database:**
   - `AgencyPlatformConnection` should have `secretId`
   - `PlatformAuthorization` should have `secretId`

2. **Check Infisical:**
   - Tokens should be stored in Infisical
   - Secret name format: `meta_connection_{id}_meta_ads`

3. **Check Logs:**
   - No errors in Render logs
   - Token refresh jobs running

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| `redirect_uri_mismatch` | Check callback URL matches exactly in OAuth app |
| `Invalid OAuth state` | Check Redis is connected, state token not expired |
| `Access denied` | Add test users or publish OAuth app |
| `Token exchange failed` | Verify credentials are correct |

## 📋 Full Documentation

See [PRODUCTION_OAUTH_SETUP.md](./PRODUCTION_OAUTH_SETUP.md) for detailed setup instructions.
