# Vercel CLI Guide for Agency Access Platform

Complete guide for deploying and managing the frontend using Vercel CLI.

## Prerequisites

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login
```

## Initial Setup

### 1. Link Project to Vercel

From the repository root:

```bash
# Navigate to web app directory
cd apps/web

# Link project (creates .vercel directory)
vercel link

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No (first time) or Yes (if project exists)
# - Project name? agency-access-platform (or your preferred name)
# - Directory? ./ (Vercel will detect apps/web from rootDirectory setting)
```

**Important:** The `.vercel` directory will be created in `apps/web/`. This is correct for monorepos.

### 2. Set Root Directory (One-time via Dashboard)

The root directory must be set in the Vercel dashboard (not via CLI):

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. **Settings** → **General** → **Root Directory**
4. Set to: `apps/web`
5. Save

Alternatively, you can use the Vercel API or wait for CLI support.

## Deployment

### Deploy to Production

```bash
cd apps/web
vercel --prod
```

### Deploy Preview (for testing)

```bash
cd apps/web
vercel
```

This creates a preview deployment (not production).

### Deploy with Environment Variables

```bash
# Deploy with specific env vars (temporary)
vercel --prod --env NEXT_PUBLIC_API_URL=https://your-api.railway.app
```

## Environment Variables Management

### List Environment Variables

```bash
cd apps/web
vercel env ls
```

### Add Environment Variable

```bash
cd apps/web

# Add for production
vercel env add NEXT_PUBLIC_API_URL production

# Add for preview/development
vercel env add NEXT_PUBLIC_API_URL preview

# Add for all environments
vercel env add NEXT_PUBLIC_API_URL
```

**Interactive prompts:**
- Enter the value when prompted
- Choose environment scope (Production, Preview, Development, or all)

### Add Multiple Environment Variables

```bash
cd apps/web

# Required variables for production
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
vercel env add CLERK_SECRET_KEY production

# Optional
vercel env add NEXT_PUBLIC_BYPASS_AUTH production
```

### Remove Environment Variable

```bash
cd apps/web
vercel env rm NEXT_PUBLIC_API_URL production
```

### Pull Environment Variables (for local development)

```bash
cd apps/web
vercel env pull .env.local
```

This creates/updates `.env.local` with your Vercel environment variables.

## Viewing Logs

### Production Logs

```bash
cd apps/web
vercel logs --prod
```

### Preview Logs

```bash
cd apps/web
vercel logs
```

### Follow Logs (Real-time)

```bash
cd apps/web
vercel logs --follow --prod
```

### Filter Logs

```bash
# Show only errors
vercel logs --prod | grep -i error

# Show last 100 lines
vercel logs --prod --output raw | tail -100
```

## Project Management

### List All Projects

```bash
vercel ls --yes
```

### View Project Info

```bash
cd apps/web
vercel inspect
```

### View Deployment Details

```bash
cd apps/web
vercel inspect [deployment-url]
```

### List Deployments

```bash
cd apps/web
vercel ls
```

## Common Workflows

### Full Deployment Workflow

```bash
# 1. Navigate to web app
cd apps/web

# 2. Pull latest environment variables (optional)
vercel env pull .env.local

# 3. Test locally
npm run dev

# 4. Deploy to preview
vercel

# 5. Test preview deployment
# Visit the preview URL provided

# 6. Deploy to production
vercel --prod
```

### Update Environment Variables

```bash
cd apps/web

# Update API URL
vercel env rm NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_API_URL production
# Enter new value when prompted

# Redeploy to apply changes
vercel --prod
```

### Rollback Deployment

```bash
cd apps/web

# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel promote [deployment-url]
```

## Troubleshooting

### Project Not Linked

```bash
cd apps/web
vercel link
```

### Clear Vercel Cache

```bash
cd apps/web
vercel --force
```

### Check Build Locally

```bash
# From repository root
npm run build:web

# Or from apps/web
cd apps/web
npm run build
```

### View Build Output

```bash
cd apps/web
vercel build
```

This runs the build locally without deploying, useful for debugging.

## Environment Variables Reference

### Required for Production

```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

### Optional

```bash
NEXT_PUBLIC_BYPASS_AUTH=false
```

## Integration with Git

Vercel automatically deploys when you push to your connected Git repository:

- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

You can disable this in Vercel dashboard → Settings → Git.

## CLI vs Dashboard

**Use CLI for:**
- Quick deployments
- Environment variable management
- Viewing logs
- Local testing with production env vars
- CI/CD automation

**Use Dashboard for:**
- Setting root directory (one-time)
- Custom domain configuration
- Team collaboration
- Analytics and monitoring
- Project settings

## Quick Reference

```bash
# Deploy
cd apps/web && vercel --prod

# Add env var
cd apps/web && vercel env add VAR_NAME production

# View logs
cd apps/web && vercel logs --prod

# Pull env vars locally
cd apps/web && vercel env pull .env.local

# List deployments
cd apps/web && vercel ls

# Build locally (test)
cd apps/web && vercel build
```

