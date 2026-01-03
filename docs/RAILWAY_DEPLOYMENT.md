# Railway Backend Deployment Guide

This guide walks you through deploying the Agency Access Platform backend API to Railway.

## ⚠️ Important: Deploy This First

**Deploy the backend to Railway BEFORE deploying the frontend to Vercel.**

The frontend needs your Railway URL for the `NEXT_PUBLIC_API_URL` environment variable.

**After Railway deployment:**
1. Copy your Railway service URL (e.g., `https://your-service.railway.app`)
2. Use this URL when setting up Vercel environment variables
3. See `VERCEL_DEPLOYMENT.md` for frontend deployment

## Prerequisites

- Railway account (sign up at [railway.app](https://railway.app))
- GitHub repository connected to Railway
- PostgreSQL database (Neon recommended)
- Redis instance (Upstash recommended)
- Infisical project configured
- Clerk account set up

## Quick Deployment Steps

### 1. Create Railway Project

1. Go to [railway.app/dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository

### 2. Configure Service

1. Railway will create a new service
2. Click on the service to open settings
3. Go to **Settings** → **Service Settings**
4. Set **Root Directory** to: `apps/api`
5. Railway will auto-detect the build and start commands from `package.json`
6. The `railway.json` file in the root configures the monorepo build process

**Note:** Railway uses Nixpacks by default to detect and build your application. The `railway.json` file ensures the shared package is built before the API.

### 3. Set Up PostgreSQL Database

You have two options for PostgreSQL:

#### Option 1: Use Neon (Recommended) ✅

**Why Neon?**
- Serverless PostgreSQL (scales to zero)
- Branching (create database branches like git)
- Better for development and production
- Free tier available
- Global edge network

**Steps:**
1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the **Connection String** (looks like: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)
4. Use this as your `DATABASE_URL` environment variable in Railway

**Neon Connection String Format:**
```
postgresql://[user]:[password]@[hostname]/[dbname]?sslmode=require
```

**Important:** Neon requires SSL, so make sure your connection string includes `?sslmode=require` or `?sslmode=prefer`.

#### Option 2: Use Railway PostgreSQL

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will create a PostgreSQL instance
4. Railway automatically creates a `DATABASE_URL` environment variable
5. The connection string is automatically linked to your service

**Which to Choose?**
- **Neon**: Better for serverless, branching, global distribution
- **Railway PostgreSQL**: Simpler setup, everything in one place, good for traditional deployments

### 4. Add Redis (Upstash)

1. Go to [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the **REDIS_URL** connection string

**Note:** Railway also offers Redis, but Upstash is recommended for better performance and global distribution.

### 5. Set Environment Variables

In Railway service settings, go to **Variables** and add:

#### Core Configuration

```bash
NODE_ENV=production
PORT=3001  # Railway will set $PORT automatically, but you can override
```

**Important:** Railway automatically sets the `$PORT` environment variable. Your Fastify server should listen on `process.env.PORT` (which your code already does).

#### Database & Cache

```bash
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://default:password@host:port
```

#### Frontend URL

```bash
# Set this after deploying frontend to Vercel
FRONTEND_URL=https://your-app.vercel.app

# Backend API URL (Railway will provide this after deployment)
API_URL=https://your-service.railway.app
```

#### Clerk Authentication

```bash
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

#### Infisical (Secrets Management)

```bash
INFISICAL_CLIENT_ID=your-client-id
INFISICAL_CLIENT_SECRET=your-client-secret
INFISICAL_PROJECT_ID=your-project-id
INFISICAL_ENVIRONMENT=production
```

#### Platform OAuth Credentials

```bash
# Meta (Facebook/Instagram)
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret

# Google (Ads, GA4, etc.)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token  # Optional, for Google Ads API
```

#### Optional

```bash
# Email notifications (Resend)
RESEND_API_KEY=re_...  # Optional

# Logging
LOG_LEVEL=info  # Options: debug, info, warn, error
```

### 6. Deploy

1. Railway will automatically detect the build and start commands from `package.json`
2. The build process will:
   - Install dependencies (including shared package)
   - Build TypeScript (`npm run build`)
   - Start the server (`npm start`)
3. Railway will provide a public URL (e.g., `https://your-service.railway.app`)

### 7. Run Database Migrations

After first deployment, you may need to run Prisma migrations:

**Option 1: Via Railway CLI**
```bash
railway run npm run db:push
```

**Option 2: Via Railway Dashboard**
1. Go to your service
2. Click **"Deployments"** → **"View Logs"**
3. Use the terminal to run: `npm run db:push`

**Option 3: Local connection**
```bash
# Set DATABASE_URL locally to your production database
export DATABASE_URL="your-production-database-url"
cd apps/api
npm run db:push
```

### 8. Verify Deployment

1. Check health endpoint: `https://your-service.railway.app/health`
2. Should return: `{ "status": "ok", "timestamp": "..." }`
3. Check root endpoint: `https://your-service.railway.app/`
4. Should return API information

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `PORT` | Yes | Server port | `3001` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://...` |
| `REDIS_URL` | Yes | Redis connection string | `redis://...` |
| `FRONTEND_URL` | Yes | Frontend URL for CORS | `https://app.vercel.app` |
| `API_URL` | Yes | Backend API URL (for OAuth callbacks) | `https://api.railway.app` |
| `CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key | `pk_live_...` |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key | `sk_live_...` |
| `INFISICAL_CLIENT_ID` | Yes | Infisical client ID | Machine Identity ID |
| `INFISICAL_CLIENT_SECRET` | Yes | Infisical client secret | Machine Identity secret |
| `INFISICAL_PROJECT_ID` | Yes | Infisical project ID | Project UUID |
| `INFISICAL_ENVIRONMENT` | Yes | Infisical environment | `production` |
| `META_APP_ID` | Yes | Meta App ID | `123456789` |
| `META_APP_SECRET` | Yes | Meta App Secret | `abc123...` |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID | `...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret | `GOCSPX-...` |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Optional | Google Ads API token | `...` |
| `RESEND_API_KEY` | Optional | Resend email API key | `re_...` |
| `LOG_LEVEL` | Optional | Logging level | `info` |

## Build Process

Railway will automatically:
1. Install dependencies from root (`npm install`)
2. Build shared package (`npm run build --workspace=packages/shared`)
3. Build API (`npm run build` in `apps/api`)
4. Start server (`npm start`)

The build process uses:
- **Build Command**: Auto-detected from `package.json` (`npm run build`)
- **Start Command**: Auto-detected from `package.json` (`npm start`)
- **Root Directory**: `apps/api` (set in Railway settings)

## Database Setup

### First-time setup

1. **Generate Prisma Client** (happens automatically during build)
2. **Push Schema** to database:
   ```bash
   railway run npm run db:push
   ```

### Production Migrations

For production, consider using Prisma migrations instead of `db:push`:

```bash
# Generate migration
railway run npx prisma migrate dev --name init

# Apply migration
railway run npx prisma migrate deploy
```

## OAuth Callback URLs

After deployment, update your OAuth applications with the Railway URL:

### Meta (Facebook/Instagram)
- Callback URL: `https://your-service.railway.app/agency-platforms/meta/callback`
- Valid OAuth Redirect URIs: Add the callback URL in Meta App Settings

### Google
- Callback URL: `https://your-service.railway.app/agency-platforms/google/callback`
- Authorized redirect URIs: Add in Google Cloud Console

### Other Platforms
Update callback URLs for:
- TikTok
- LinkedIn
- Snapchat
- Any other platforms you've configured

## Monitoring & Logs

### Railway Dashboard
- **Logs**: Real-time logs in Railway dashboard
- **Metrics**: CPU, memory, network usage
- **Deployments**: Deployment history and rollback

### Health Checks
- Endpoint: `/health`
- Returns: `{ "status": "ok", "timestamp": "..." }`
- Use for monitoring/uptime checks

### Error Tracking
Consider adding:
- **Sentry**: Error tracking and performance monitoring
- **Logtail**: Centralized logging
- **Better Stack**: Uptime monitoring

## Troubleshooting

### "Build fails"
- Check that `Root Directory` is set to `apps/api`
- Verify all environment variables are set
- Check build logs for specific errors
- Ensure `package.json` has correct build/start scripts

### "Database connection failed"
- Verify `DATABASE_URL` is correct
- Check database is accessible (not IP-restricted)
- Ensure database is running and not paused
- Check SSL requirements (Neon requires SSL)

### "Redis connection failed"
- Verify `REDIS_URL` is correct
- Check Redis instance is running
- Verify network connectivity
- Check if Redis requires TLS (Upstash uses TLS by default)

### "Infisical authentication failed"
- Verify Machine Identity credentials are correct
- Check `INFISICAL_PROJECT_ID` and `INFISICAL_ENVIRONMENT`
- Ensure Machine Identity has proper permissions
- Verify Infisical project is active

### "OAuth callbacks not working"
- Verify `API_URL` is set to your Railway URL
- Check OAuth apps have correct callback URLs
- Ensure `FRONTEND_URL` is set correctly
- Check CORS settings

### "Port already in use"
- Railway automatically sets `$PORT` environment variable
- Your Fastify server already uses `env.PORT` (configured in `src/index.ts`)
- Don't hardcode port numbers - always use `process.env.PORT`
- Railway binds to `0.0.0.0:$PORT` automatically

## Scaling

### Horizontal Scaling
Railway supports:
- Multiple instances (auto-scaling)
- Load balancing
- Health checks

### Vertical Scaling
- Upgrade service plan for more resources
- Monitor CPU/memory usage in dashboard

## Custom Domain

1. Go to Railway service settings
2. Click **"Settings"** → **"Networking"**
3. Add custom domain
4. Configure DNS records as instructed
5. Update `API_URL` environment variable
6. Update OAuth callback URLs

## Cost Optimization

- **Database**: 
  - **Neon Free Tier**: 0.5GB storage, 1 project, perfect for development
  - **Neon Pro**: $19/month for production (3GB storage, better performance)
  - **Railway PostgreSQL**: Included in Hobby plan, but simpler setup
- **Redis**: Use Upstash free tier (10K commands/day)
- **Railway**: Use Hobby plan ($5/month) for small projects
- **Monitoring**: Use free tiers of monitoring services

**Recommendation:** Start with Neon free tier for development, upgrade to Neon Pro ($19/month) for production. Total: ~$24/month (Railway $5 + Neon $19).

## Security Checklist

- [ ] All environment variables set (no defaults in production)
- [ ] Database uses SSL connection
- [ ] Redis uses TLS (Upstash default)
- [ ] Clerk keys are production keys (not test)
- [ ] Infisical environment is `production`
- [ ] OAuth callback URLs are HTTPS only
- [ ] CORS is restricted to frontend URL only
- [ ] Log level set to `info` or `warn` (not `debug`)
- [ ] Database backups enabled (Neon auto-backups)
- [ ] Secrets stored in Railway (not in code)

## Post-Deployment

1. **Test API endpoints**
   - Health check: `/health`
   - Root: `/`
   - Test authentication flow

2. **Update Frontend**
   - Set `NEXT_PUBLIC_API_URL` to Railway URL
   - Redeploy frontend

3. **Update OAuth Apps**
   - Add callback URLs
   - Test OAuth flows

4. **Monitor**
   - Check logs for errors
   - Monitor performance
   - Set up alerts

## Railway Configuration Files

### railway.json

The project includes a `railway.json` file in the root that configures the build and deployment:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build --workspace=packages/shared && cd apps/api && npm run db:generate && npm run build"
  },
  "deploy": {
    "startCommand": "cd apps/api && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

This ensures:
- Shared package is built first
- Prisma client is generated before TypeScript compilation
- API is built with all dependencies available
- Server starts from the correct directory

**How it works:**
- Railway uses **Nixpacks** (default builder) to detect Node.js/TypeScript
- The `buildCommand` runs from the repository root (monorepo-aware)
- The `startCommand` runs from `apps/api` directory
- Railway automatically handles workspace dependencies

### Alternative: nixpacks.toml

You can also use a `nixpacks.toml` file for more granular control, but `railway.json` is simpler for this use case.

## Support

- [Railway Documentation](https://docs.railway.app)
- [Railway CLI Guide](https://docs.railway.com/guides/cli)
- [Railway Context7 Docs](https://context7.com/websites/railway/llms.txt)
- [Railway Discord](https://discord.gg/railway)
- Check deployment logs in Railway dashboard

