# Vercel Deployment Guide

This guide walks you through deploying the Agency Access Platform frontend to Vercel.

## ⚠️ Important: Deployment Order

**Deploy the backend (Railway) FIRST, then deploy Vercel.**

The frontend needs `NEXT_PUBLIC_API_URL` pointing to your deployed backend. You'll get this URL after Railway deployment.

**Deployment Sequence:**
1. ✅ Deploy Railway backend → Get Railway URL
2. ✅ Deploy Vercel frontend → Use Railway URL in environment variables

## Prerequisites

- Vercel account (sign up at [vercel.com](https://vercel.com))
- GitHub repository connected to Vercel
- **Backend API deployed and running** (Railway, Render, or similar) - **REQUIRED FIRST**
- Backend URL from Railway deployment
- Clerk account set up for authentication

## Quick Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect the Next.js framework

### 2. Configure Project Settings

In the project configuration:

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `apps/web` (important for monorepo)
- **Build Command**: (auto-configured via `vercel.json`)
- **Output Directory**: `.next` (auto-configured)

The `vercel.json` file in the root already configures:
- Building the shared package first
- Then building the web app
- Proper output directory

### 3. Set Environment Variables

Add these environment variables in Vercel:

#### Required Variables

```bash
# Backend API URL (your deployed backend)
NEXT_PUBLIC_API_URL=https://your-backend-api.railway.app

# Frontend URL (will be your Vercel URL)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

#### Optional Variables

```bash
# Only for development/testing
NEXT_PUBLIC_BYPASS_AUTH=false
```

### 4. Deploy

1. Click **"Deploy"**
2. Vercel will:
   - Install dependencies from the root
   - Build the shared package
   - Build the Next.js app
   - Deploy to production

### 5. Update Backend Configuration

After deployment, update your backend's `FRONTEND_URL` environment variable:

```bash
FRONTEND_URL=https://your-app.vercel.app
```

This ensures OAuth callbacks and redirects work correctly.

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://api.railway.app` |
| `NEXT_PUBLIC_APP_URL` | Frontend URL (for generating links) | `https://app.vercel.app` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_live_...` |
| `CLERK_SECRET_KEY` | Clerk secret key (server-side) | `sk_live_...` |
| `NEXT_PUBLIC_BYPASS_AUTH` | Skip auth in development | `false` (production) |

## Post-Deployment Checklist

- [ ] Verify deployment is successful
- [ ] Test authentication flow (Clerk)
- [ ] Test API connectivity (check browser console)
- [ ] Update Clerk dashboard with production URLs:
  - Home URL: `https://your-app.vercel.app`
  - Redirect URLs after sign-in/sign-up
- [ ] Update backend `FRONTEND_URL` environment variable
- [ ] Test OAuth flows (if backend is deployed)
- [ ] Set up custom domain (optional)

## Troubleshooting

### "API calls failing"
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend is deployed and accessible
- Check CORS settings on backend

### "Build fails"
- Ensure `rootDirectory` is set to `apps/web`
- Check that `vercel.json` is in the repository root
- Verify all dependencies are in `package.json`

### "Authentication not working"
- Verify Clerk keys are correct (production keys, not test)
- Check Clerk dashboard has correct URLs configured
- Ensure `CLERK_SECRET_KEY` is set (not just publishable key)

### "Monorepo build issues"
- Vercel should auto-detect the monorepo structure
- The `vercel.json` ensures shared package is built first
- If issues persist, check npm workspaces configuration

## Custom Domain Setup

1. Go to your project settings in Vercel
2. Navigate to **Domains**
3. Add your custom domain
4. Follow DNS configuration instructions
5. Update `NEXT_PUBLIC_APP_URL` to your custom domain
6. Update Clerk dashboard with new domain

## Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Deployment Logs**: View build and runtime logs in Vercel dashboard
- **Error Tracking**: Consider adding Sentry for production error tracking

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests get preview deployments
- **Development**: Can configure branch-specific deployments

## Rollback

If you need to rollback:
1. Go to **Deployments** in Vercel dashboard
2. Find the previous working deployment
3. Click **"..."** menu → **"Promote to Production"**

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- Check deployment logs in Vercel dashboard for specific errors

