# Railway Quick Setup for adequate-curiosity

## Step 1: Authenticate Railway CLI

Run this command (it will prompt for authentication):

```bash
railway login
```

Or if you have a Railway token:

```bash
railway login --browserless
# Follow the prompts to enter your token
```

## Step 2: Link to Project

Once authenticated, run:

```bash
railway link --project adequate-curiosity
```

## Step 3: Create Service (if needed)

If the service doesn't exist yet, you can create it via Railway dashboard or CLI:

**Via Dashboard:**
1. Go to https://railway.app/project/adequate-curiosity
2. Click "+ New" → "GitHub Repo"
3. Select your repository
4. Set Root Directory to: `apps/api`

**Via CLI (if service creation is supported):**
```bash
railway service
```

## Step 4: Configure Service

The `railway.json` file is already configured with:
- Build command: Builds shared package, generates Prisma client, then builds API
- Start command: Starts from `apps/api` directory
- Restart policy: ON_FAILURE with 10 retries

## Step 5: Set Environment Variables

You'll need to add these environment variables in Railway dashboard:

### Required Variables

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=your-neon-connection-string
REDIS_URL=your-upstash-redis-url
FRONTEND_URL=https://your-app.vercel.app  # Set after Vercel deployment
API_URL=https://your-service.railway.app  # Set after first deployment
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
INFISICAL_CLIENT_ID=...
INFISICAL_CLIENT_SECRET=...
INFISICAL_PROJECT_ID=...
INFISICAL_ENVIRONMENT=production
META_APP_ID=...
META_APP_SECRET=...
GOOGLE_CLIENT_ID=...  # Optional
GOOGLE_CLIENT_SECRET=...  # Optional
LOG_LEVEL=info
```

## Step 6: Deploy

Railway will automatically deploy when you:
- Push to the connected branch
- Or manually trigger via dashboard

## Quick Commands

```bash
# Check status
railway status

# View logs
railway logs

# Open dashboard
railway open

# Run database migrations
railway run npm run db:push
```

