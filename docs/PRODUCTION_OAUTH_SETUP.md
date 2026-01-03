# Production OAuth Setup Checklist

This guide covers everything needed to get OAuth working in production for all platforms.

## Overview

Your app currently supports these OAuth platforms:
- ✅ **Meta** (Facebook/Instagram) - Implemented
- ✅ **Google** (Ads, GA4, Tag Manager, etc.) - Implemented
- ⏳ **TikTok** - Not yet implemented
- ⏳ **LinkedIn** - Not yet implemented
- ⏳ **Snapchat** - Not yet implemented

## Critical Production Requirements

### 1. Environment Variables (Railway Backend)

All of these must be set in Railway with **production values**:

```bash
# Core URLs (set after deployment)
API_URL=https://your-service.railway.app
FRONTEND_URL=https://your-app.vercel.app

# Meta OAuth (REQUIRED)
META_APP_ID=your-production-meta-app-id
META_APP_SECRET=your-production-meta-app-secret

# Google OAuth (REQUIRED if using Google)
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token  # Optional, for Google Ads API

# Other services (already configured)
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
INFISICAL_CLIENT_ID=...
INFISICAL_CLIENT_SECRET=...
INFISICAL_PROJECT_ID=...
INFISICAL_ENVIRONMENT=production
DATABASE_URL=...
REDIS_URL=...
```

**Important:** 
- Use **production** OAuth app credentials, not test/dev credentials
- `API_URL` must be your Railway backend URL
- `FRONTEND_URL` must be your Vercel frontend URL

---

## 2. Meta (Facebook/Instagram) OAuth Setup

### Step 1: Create/Configure Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/apps/)
2. Create a new app or select existing app
3. Add **Facebook Login** product
4. Add **Marketing API** product (required for ads access)

### Step 2: Configure OAuth Settings

**In Meta App Settings → Basic:**

1. **App Domains:** Add your production domain
   - Example: `your-app.vercel.app`

2. **Privacy Policy URL:** Required for production
   - Example: `https://your-app.vercel.app/privacy`

3. **Terms of Service URL:** Required for production
   - Example: `https://your-app.vercel.app/terms`

### Step 3: Configure OAuth Redirect URIs

**In Facebook Login → Settings:**

Add these **Valid OAuth Redirect URIs**:

```
https://your-service.railway.app/agency-platforms/meta/callback
```

**Important:** 
- Must be HTTPS in production
- Must match exactly what's in your code
- No trailing slashes

### Step 4: Configure App Review & Permissions

**Required Permissions (Marketing API):**
- `ads_management` - Create and manage ads
- `ads_read` - Read ads data
- `business_management` - Access Business Manager assets

**For Production:**
1. Go to **App Review** → **Permissions and Features**
2. Request approval for each permission
3. Submit for review (can take 1-7 days)
4. **OR** add test users for immediate testing

**Test Users (Quick Start):**
- Go to **Roles** → **Test Users**
- Add test users who can authorize your app
- Test users can use the app without App Review

### Step 5: Switch to Production Mode

1. Go to **App Review** → **Permissions and Features**
2. Toggle **"Make [App Name] public"** to ON
3. This allows any user to authorize (after permissions are approved)

### Step 6: Get Production Credentials

1. Go to **Settings** → **Basic**
2. Copy **App ID** → Use as `META_APP_ID`
3. Copy **App Secret** → Use as `META_APP_SECRET`
4. Add to Railway environment variables

### Step 7: Configure Business Manager (Optional but Recommended)

For production, set up Business Manager partner access:
1. Create Business Manager account
2. Add your Meta App to Business Manager
3. Configure partner access settings
4. This enables better asset management

**Callback URL Pattern:**
```
Backend: https://your-service.railway.app/agency-platforms/meta/callback
Frontend: https://your-app.vercel.app/platforms/callback
```

---

## 3. Google OAuth Setup

### Step 1: Create/Configure OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create new)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**

### Step 2: Configure OAuth Consent Screen

**Required for Production:**

1. Go to **APIs & Services** → **OAuth consent screen**
2. Fill out required fields:
   - **App name:** Your app name
   - **User support email:** Your email
   - **Developer contact:** Your email
   - **App domain:** `your-app.vercel.app`
   - **Privacy Policy URL:** `https://your-app.vercel.app/privacy`
   - **Terms of Service URL:** `https://your-app.vercel.app/terms`

3. **Scopes:** Add these scopes:
   - `https://www.googleapis.com/auth/adwords` (Google Ads)
   - `https://www.googleapis.com/auth/analytics.readonly` (GA4)
   - `https://www.googleapis.com/auth/business.manage` (Business Profile)
   - `https://www.googleapis.com/auth/tagmanager.readonly` (Tag Manager)
   - `https://www.googleapis.com/auth/content` (Merchant Center)
   - `https://www.googleapis.com/auth/userinfo.email` (User email)

4. **Test Users (Quick Start):**
   - Add test users who can authorize
   - Test users can use app without verification

5. **Publish App (Production):**
   - Click **Publish App** button
   - Submit for verification (can take 1-2 weeks)
   - **OR** keep in testing mode with test users

### Step 3: Configure Authorized Redirect URIs

**In OAuth Client → Authorized redirect URIs:**

Add this redirect URI:

```
https://your-service.railway.app/agency-platforms/google/callback
```

**Important:**
- Must be HTTPS in production
- Must match exactly what's in your code
- No trailing slashes

### Step 4: Enable Required APIs

Enable these APIs in **APIs & Services** → **Library**:

- ✅ **Google Ads API** (if using Google Ads)
- ✅ **Google Analytics Admin API** (for GA4)
- ✅ **Google Business Profile API** (if using Business Profile)
- ✅ **Google Tag Manager API** (if using Tag Manager)
- ✅ **Content API for Shopping** (if using Merchant Center)

### Step 5: Get Production Credentials

1. Go to **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID
3. Copy **Client ID** → Use as `GOOGLE_CLIENT_ID`
4. Copy **Client secret** → Use as `GOOGLE_CLIENT_SECRET`
5. Add to Railway environment variables

### Step 6: Google Ads Developer Token (Optional)

If using Google Ads API:

1. Go to [Google Ads API Center](https://ads.google.com/aw/apicenter)
2. Apply for developer token
3. Copy token → Use as `GOOGLE_ADS_DEVELOPER_TOKEN`
4. Add to Railway environment variables

**Callback URL Pattern:**
```
Backend: https://your-service.railway.app/agency-platforms/google/callback
Frontend: https://your-app.vercel.app/invite/oauth-callback
```

---

## 4. Vercel Frontend Configuration

### Environment Variables

Set these in Vercel dashboard:

```bash
NEXT_PUBLIC_API_URL=https://your-service.railway.app
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

### Clerk Configuration

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your production application
3. Go to **Settings** → **Domains**
4. Add your production domain: `your-app.vercel.app`
5. Update **Redirect URLs**:
   - After sign-in: `https://your-app.vercel.app/dashboard`
   - After sign-up: `https://your-app.vercel.app/onboarding`

---

## 5. Testing Production OAuth

### Test Flow Checklist

1. **Agency Platform Connection:**
   - Agency connects their own platform accounts
   - Endpoint: `/agency-platforms/:platform/initiate`
   - Callback: `/agency-platforms/:platform/callback`

2. **Client Authorization:**
   - Client authorizes platforms through access request
   - Endpoint: `/client/:token/oauth-state`
   - Callback: `/invite/oauth-callback`

### Common Issues

**"redirect_uri_mismatch" Error:**
- ✅ Check OAuth app has exact callback URL
- ✅ Verify `API_URL` environment variable is correct
- ✅ Ensure no trailing slashes in URLs

**"Invalid OAuth state" Error:**
- ✅ Check Redis is connected and working
- ✅ Verify OAuth state service is running
- ✅ Check state token hasn't expired (default: 10 minutes)

**"Access denied" Error:**
- ✅ Check OAuth app is published (or test users added)
- ✅ Verify required permissions/scopes are requested
- ✅ Check user has authorized the app

**"Token exchange failed" Error:**
- ✅ Verify OAuth credentials are correct
- ✅ Check client ID/secret match OAuth app
- ✅ Ensure redirect URI matches exactly

---

## 6. Production Security Checklist

### OAuth Security

- [ ] All OAuth apps use HTTPS callbacks only
- [ ] OAuth credentials stored in environment variables (not code)
- [ ] OAuth state tokens use Redis with TTL (CSRF protection)
- [ ] OAuth apps are published (or test users configured)
- [ ] Required permissions/scopes are approved

### Token Security

- [ ] All OAuth tokens stored in Infisical (not database)
- [ ] Only `secretId` stored in database
- [ ] Token refresh jobs configured and running
- [ ] Audit logging enabled for all token access

### Environment Security

- [ ] All environment variables set in Railway/Vercel
- [ ] No default/development values in production
- [ ] Clerk keys are production keys (`pk_live_`, `sk_live_`)
- [ ] Infisical environment is `production`
- [ ] Database uses SSL connection
- [ ] Redis uses TLS connection

---

## 7. Platform-Specific Notes

### Meta (Facebook/Instagram)

**Special Requirements:**
- Meta requires exchanging short-lived tokens for 60-day tokens
- Use `getLongLivedToken()` method after initial OAuth
- 60-day tokens don't refresh automatically (require re-auth)
- Business Manager setup recommended for production

**Production Considerations:**
- App Review can take 1-7 days for permissions
- Test users can be used for immediate testing
- Business Manager partner access enables better asset management

### Google

**Special Requirements:**
- Google refresh tokens don't expire (unless revoked)
- Multiple Google products use single OAuth (unified connector)
- Google Ads API requires `developer-token` header
- OAuth consent screen must be configured

**Production Considerations:**
- OAuth consent screen verification can take 1-2 weeks
- Test users can be used for immediate testing
- Some APIs require additional verification (Business Profile)

---

## 8. Monitoring & Debugging

### Check OAuth Flow

1. **Check Railway Logs:**
   ```bash
   railway logs
   ```

2. **Check OAuth State:**
   - Verify Redis is storing state tokens
   - Check state token expiration (default: 10 minutes)

3. **Check Token Storage:**
   - Verify tokens are stored in Infisical
   - Check `secretId` is stored in database
   - Verify token refresh jobs are running

### Health Checks

- **Backend Health:** `https://your-service.railway.app/health`
- **Frontend:**** Check Vercel deployment status

---

## 9. Quick Reference: Callback URLs

### Agency Platform Connections

```
Meta:    https://your-service.railway.app/agency-platforms/meta/callback
Google:  https://your-service.railway.app/agency-platforms/google/callback
```

### Client Authorization Flow

```
Meta:    https://your-app.vercel.app/invite/oauth-callback?platform=meta
Google:  https://your-app.vercel.app/invite/oauth-callback?platform=google
```

**Important:** Client flow uses frontend URL, agency flow uses backend URL.

---

## 10. Next Steps

1. ✅ Set all environment variables in Railway
2. ✅ Configure Meta OAuth app with production callback URL
3. ✅ Configure Google OAuth app with production callback URL
4. ✅ Publish OAuth apps (or add test users)
5. ✅ Test OAuth flows in production
6. ✅ Monitor logs for errors
7. ✅ Set up error tracking (Sentry recommended)

---

## Support Resources

- [Meta OAuth Documentation](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT.md)
- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md)

