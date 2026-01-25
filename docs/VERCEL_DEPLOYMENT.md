This guide walks you through deploying the Agency Access Platform frontend to Render.

## ⚠️ Important: Deployment Order

**Deploy the backend (Render) FIRST, then deploy the frontend service.**

The frontend needs `NEXT_PUBLIC_API_URL` pointing to your deployed backend.

**Deployment Sequence:**
1. ✅ Deploy Render backend → Get Render URL
2. ✅ Deploy Render frontend → Use Render URL in environment variables

## Prerequisites

- Render account (sign up at [render.com](https://render.com))
- GitHub repository connected to Render
- **Backend API deployed and running** (Render) - **REQUIRED FIRST**
- Backend URL from Render deployment
- Clerk account set up for authentication

## Quick Deployment Steps

### 1. Create Render Project (Blueprint)

1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click **"New"** → **"Blueprint"**
3. Select your GitHub repository
4. Render will read `render.yaml` and create both services

### 2. Configure Environment Variables

Add these environment variables for the frontend service:

#### Required Variables

```bash
# Backend API URL (your deployed backend)
NEXT_PUBLIC_API_URL=https://your-backend-api.onrender.com

# Frontend URL (your Render web service URL)
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

### 3. Deploy

1. Click **"Deploy"** for the frontend service
2. Render will:
   - Install dependencies from the root
   - Build the shared package
   - Build the Next.js app
   - Deploy to production

### 4. Update Backend Configuration

After frontend deployment, update your backend's `FRONTEND_URL` environment variable:

```bash
FRONTEND_URL=https://your-app.onrender.com
```

This ensures OAuth callbacks and redirects work correctly.

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://api.onrender.com` |
| `NEXT_PUBLIC_APP_URL` | Frontend URL (for generating links) | `https://app.onrender.com` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_live_...` |
| `CLERK_SECRET_KEY` | Clerk secret key (server-side) | `sk_live_...` |

## Post-Deployment Checklist

- [ ] Verify deployment is successful
- [ ] Test authentication flow (Clerk)
- [ ] Test API connectivity (check browser console)
- [ ] Update Clerk dashboard with production URLs:
  - Home URL: `https://your-app.onrender.com`
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
- Ensure Render is building from the repo root
- Check that `render.yaml` is in the repository root
- Verify all dependencies are in `package.json`

### "Authentication not working"
- Verify Clerk keys are correct (production keys, not test)
- Check Clerk dashboard has correct URLs configured
- Ensure `CLERK_SECRET_KEY` is set (not just publishable key)

## Custom Domain Setup

1. Go to your service settings in Render
2. Navigate to **Custom Domains**
3. Add your custom domain and follow DNS instructions
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain
5. Update Clerk dashboard with the new domain

## Monitoring

- **Render Logs**: Build and runtime logs in Render dashboard
- **Metrics**: CPU/Memory charts per service
- **Error Tracking**: Consider adding Sentry for production error tracking

## Support

- [Render Documentation](https://render.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- Check deployment logs in Render dashboard for specific errors
