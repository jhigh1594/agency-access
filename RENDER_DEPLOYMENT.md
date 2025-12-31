# Render Deployment Guide (Alternative to Railway)

This guide covers deploying the backend to Render as an alternative to Railway. **We still recommend Vercel for the frontend** for optimal Next.js performance.

## Architecture Options

### Option 1: Vercel (Frontend) + Render (Backend) - **Recommended**
- **Frontend**: Vercel (Next.js optimized)
- **Backend**: Render (simpler than Railway)
- **Best of both worlds**: Vercel's Next.js optimization + Render's simplicity

### Option 2: Render (Both) - **Not Recommended**
- **Frontend**: Render Web Service
- **Backend**: Render Web Service
- **Trade-off**: Simpler setup but loses Vercel's Next.js optimizations

## Backend Deployment to Render

### Prerequisites

- Render account (sign up at [render.com](https://render.com))
- GitHub repository connected
- PostgreSQL database (Render or Neon)
- Redis instance (Upstash recommended)
- Infisical project configured

### Step 1: Create Web Service

1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure service:
   - **Name**: `agency-platform-api` (or your choice)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: `apps/api`
   - **Runtime**: `Node`
   - **Build Command**: `npm run build --workspace=packages/shared && npm run build`
   - **Start Command**: `npm start`

### Step 2: Add PostgreSQL Database

1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `agency-platform-db`
   - **Database**: `agency_platform`
   - **User**: Auto-generated
   - **Region**: Same as web service
3. Copy the **Internal Database URL** (for Render services) or **External Database URL** (for external access)

**Alternative: Use Neon**
- Create at [neon.tech](https://neon.tech)
- Use external connection string
- Better for development access

### Step 3: Configure Environment Variables

In your Render web service, go to **Environment** tab and add:

#### Core Configuration
```bash
NODE_ENV=production
PORT=10000  # Render uses port from PORT env var or 10000
```

#### Database
```bash
DATABASE_URL=postgresql://user:password@host:port/database
# Use Internal Database URL if using Render PostgreSQL
# Use External Database URL if using Neon
```

#### Redis
```bash
REDIS_URL=redis://default:password@host:port
# Use Upstash (recommended) or Render Redis
```

#### Frontend URL
```bash
FRONTEND_URL=https://your-app.vercel.app
API_URL=https://your-service.onrender.com
```

#### Clerk
```bash
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

#### Infisical
```bash
INFISICAL_CLIENT_ID=your-client-id
INFISICAL_CLIENT_SECRET=your-client-secret
INFISICAL_PROJECT_ID=your-project-id
INFISICAL_ENVIRONMENT=production
```

#### Platform OAuth
```bash
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
```

#### Optional
```bash
RESEND_API_KEY=re_...
LOG_LEVEL=info
```

### Step 4: Configure Build Settings

In **Settings** → **Build & Deploy**:

- **Build Command**: `npm run build --workspace=packages/shared && npm run build`
- **Start Command**: `npm start`
- **Auto-Deploy**: `Yes` (deploys on git push)

### Step 5: Deploy

1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Render will:
   - Install dependencies
   - Build shared package
   - Build API
   - Start server
3. Service will be available at: `https://your-service.onrender.com`

### Step 6: Run Database Migrations

After first deployment:

**Option 1: Via Render Shell**
1. Go to service → **Shell**
2. Run: `npm run db:push`

**Option 2: Via Local Connection**
```bash
export DATABASE_URL="your-render-database-url"
cd apps/api
npm run db:push
```

## Render vs Railway Comparison

| Feature | Render | Railway |
|---------|--------|---------|
| **Setup Complexity** | ⭐⭐⭐ Simple | ⭐⭐ Medium |
| **Dashboard UX** | ⭐⭐⭐ Excellent | ⭐⭐ Good |
| **Auto-Deploy** | ✅ Yes | ✅ Yes |
| **Free Tier** | ✅ Yes (with limitations) | ❌ No |
| **Build Speed** | ⭐⭐ Medium | ⭐⭐⭐ Fast |
| **Cold Starts** | ⭐⭐ Slow (15s+) | ⭐⭐⭐ Fast |
| **Logs** | ⭐⭐⭐ Excellent | ⭐⭐⭐ Excellent |
| **Custom Domains** | ✅ Free | ✅ Free |
| **SSL** | ✅ Auto | ✅ Auto |
| **Scaling** | ⭐⭐ Manual | ⭐⭐⭐ Auto |
| **Cost** | $7/month (Starter) | $5/month (Hobby) |

## Render Free Tier Limitations

- **Spins down after 15 min inactivity** (cold starts ~15-30s)
- **512MB RAM**
- **0.1 CPU**
- **Not suitable for production** (use Starter plan: $7/month)

## Recommended Setup: Vercel + Render

**Best configuration:**
- **Frontend**: Vercel (free tier is excellent for Next.js)
- **Backend**: Render Starter ($7/month)
- **Database**: Render PostgreSQL ($7/month) or Neon (free tier)
- **Redis**: Upstash (free tier)

**Total cost**: ~$7-14/month (vs $5/month for Railway)

## Render-Specific Considerations

### Cold Starts
- Free tier: Services spin down after 15 min
- Starter plan: Always on
- **Solution**: Use Starter plan for production, or implement health checks

### Build Time
- Render builds can be slower than Railway
- **Solution**: Use build cache, optimize dependencies

### Networking
- Services on same account can use internal URLs
- **Example**: `postgres://internal-hostname:5432/dbname`
- Faster than external connections

### Environment Variables
- Can link to other services (database, Redis)
- Auto-injects connection strings
- **Example**: Link PostgreSQL → `DATABASE_URL` auto-set

## Troubleshooting

### "Service won't start"
- Check `PORT` environment variable (Render uses `PORT` or defaults to 10000)
- Verify build completed successfully
- Check logs for errors

### "Database connection failed"
- Use Internal Database URL for Render PostgreSQL
- Use External Database URL for Neon
- Check firewall rules (Neon may require IP whitelist)

### "Build timeout"
- Render has 45-minute build timeout
- Optimize build: reduce dependencies, use build cache
- Consider splitting build steps

### "Cold start too slow"
- Upgrade to Starter plan ($7/month) for always-on
- Or implement health check pinging service

## Migration from Railway to Render

1. **Export environment variables** from Railway
2. **Create Render service** with same configuration
3. **Update OAuth callback URLs** to Render URL
4. **Update frontend** `NEXT_PUBLIC_API_URL`
5. **Test thoroughly** before switching
6. **Update DNS** if using custom domain

## Cost Comparison

### Vercel + Railway
- Vercel: Free (hobby) or $20/month (pro)
- Railway: $5/month (hobby)
- **Total**: $5-25/month

### Vercel + Render
- Vercel: Free (hobby) or $20/month (pro)
- Render: $7/month (starter) or $25/month (standard)
- **Total**: $7-45/month

### Render Only (Both Services)
- Render Web Service: $7/month (starter)
- Render PostgreSQL: $7/month (starter)
- **Total**: $14/month
- **Trade-off**: Loses Vercel's Next.js optimizations

## Recommendation

**For this project, stick with Vercel + Railway:**
- ✅ Best Next.js performance (Vercel)
- ✅ Fast deployments and builds
- ✅ Lower cost ($5/month)
- ✅ Better developer experience

**Consider Render if:**
- You want simpler setup (single platform)
- Cost is less of a concern
- You don't need Vercel's Next.js edge features
- You prefer Render's dashboard UX

