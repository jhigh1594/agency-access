# Railway Environment Variables Setup

## ✅ Already Configured

- `NODE_ENV=production`
- `LOG_LEVEL=info`
- `DATABASE_URL` (from Railway Postgres service)

## ⚠️ Required Variables (Need Your Values)

You need to add these environment variables in Railway. You can do this via:

1. **Railway Dashboard**: Go to your service → Variables tab
2. **Railway CLI**: Use the commands below

### Required Variables:

```bash
# Redis (Upstash or Railway Redis)
REDIS_URL=redis://your-redis-url

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Infisical (Secrets Management)
INFISICAL_CLIENT_ID=your-client-id
INFISICAL_CLIENT_SECRET=your-client-secret
INFISICAL_PROJECT_ID=your-project-id
INFISICAL_ENVIRONMENT=production

# Meta OAuth
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret

# Google OAuth (Optional but recommended)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# URLs (Set after deployment)
FRONTEND_URL=https://your-app.vercel.app  # Set after Vercel deployment
API_URL=https://your-service.railway.app   # Set after first deployment
```

### Optional Variables:

```bash
# Google Ads (if using Google Ads API)
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token

# Email notifications (if using Resend)
RESEND_API_KEY=re_...
```

## Quick Setup Commands

Once you have the values, you can set them all at once:

```bash
cd /Users/jhigh/agency-access-platform
railway variables set \
  REDIS_URL="your-redis-url" \
  CLERK_PUBLISHABLE_KEY="pk_live_..." \
  CLERK_SECRET_KEY="sk_live_..." \
  INFISICAL_CLIENT_ID="..." \
  INFISICAL_CLIENT_SECRET="..." \
  INFISICAL_PROJECT_ID="..." \
  INFISICAL_ENVIRONMENT="production" \
  META_APP_ID="..." \
  META_APP_SECRET="..."
```

## Current Status

- ✅ Project linked: adequate-curiosity
- ✅ Service linked: @agency-platform/api
- ✅ Basic config set (NODE_ENV, LOG_LEVEL)
- ✅ DATABASE_URL configured from Postgres service
- ⏳ Waiting for: Redis, Clerk, Infisical, Meta, and Google credentials

