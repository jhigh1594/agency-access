# Production OAuth - Action Items Summary

## 🎯 What You Need to Do

### 1. Set Environment Variables in Railway

**Critical Variables:**
```bash
API_URL=https://your-service.railway.app          # Your Railway backend URL
FRONTEND_URL=https://your-app.vercel.app          # Your Vercel frontend URL
META_APP_ID=your-meta-app-id                      # From Meta App Settings
META_APP_SECRET=your-meta-app-secret              # From Meta App Settings
GOOGLE_CLIENT_ID=your-google-client-id            # From Google Cloud Console
GOOGLE_CLIENT_SECRET=your-google-client-secret    # From Google Cloud Console
```

### 2. Configure Meta OAuth App

**In [Meta for Developers](https://developers.facebook.com/apps/):**

1. **Add Redirect URI:**
   ```
   https://your-service.railway.app/agency-platforms/meta/callback
   ```

2. **Request Permissions:**
   - `ads_management`
   - `ads_read`
   - `business_management`

3. **Add Test Users** (for immediate testing) OR **Publish App** (for production)

### 3. Configure Google OAuth App

**In [Google Cloud Console](https://console.cloud.google.com/):**

1. **Add Redirect URI:**
   ```
   https://your-service.railway.app/agency-platforms/google/callback
   ```

2. **Configure OAuth Consent Screen:**
   - Add required scopes
   - Add privacy policy URL
   - Add test users OR publish app

3. **Enable APIs:**
   - Google Ads API
   - Google Analytics Admin API
   - Google Tag Manager API

### 4. Test the Flow

1. Deploy backend to Railway
2. Deploy frontend to Vercel
3. Test agency platform connection
4. Test client authorization flow

## 📋 Current Status

**Implemented & Ready:**
- ✅ Meta OAuth connector
- ✅ Google OAuth connector (unified - covers all Google products)
- ✅ OAuth state management (Redis)
- ✅ Token storage (Infisical)
- ✅ Token refresh jobs

**Not Yet Implemented:**
- ⏳ TikTok OAuth
- ⏳ LinkedIn OAuth
- ⏳ Snapchat OAuth

## 🔗 Key Callback URLs

**Agency Platform Connections:**
- Meta: `https://your-service.railway.app/agency-platforms/meta/callback`
- Google: `https://your-service.railway.app/agency-platforms/google/callback`

**Client Authorization:**
- Meta: `https://your-app.vercel.app/invite/oauth-callback?platform=meta`
- Google: `https://your-app.vercel.app/invite/oauth-callback?platform=google`

## ⚠️ Important Notes

1. **Use Production Credentials:** Don't use test/dev OAuth app credentials in production
2. **HTTPS Only:** All callback URLs must be HTTPS in production
3. **Exact Match:** OAuth redirect URIs must match exactly (no trailing slashes)
4. **Test Users:** You can use test users for immediate testing without App Review
5. **App Review:** Production apps may require App Review (1-7 days for Meta, 1-2 weeks for Google)

## 📚 Full Documentation

- **Detailed Setup:** [PRODUCTION_OAUTH_SETUP.md](./PRODUCTION_OAUTH_SETUP.md)
- **Quick Checklist:** [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
- **Railway Deployment:** [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- **Vercel Deployment:** [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

