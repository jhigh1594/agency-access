# Railway Fresh Start Guide

## Option 1: Delete and Recreate Service (Recommended)

### Steps:

1. **Delete Current Service:**
   - Go to Railway dashboard: https://railway.app/project/adequate-curiosity
   - Click on `@agency-platform/api` service
   - Go to Settings → Danger Zone
   - Delete the service

2. **Create New Service:**
   - In the same project, click "+ New"
   - Select "GitHub Repo"
   - Choose your repository
   - Railway will auto-detect it's a monorepo

3. **Configure Service:**
   - Set **Root Directory**: `apps/api`
   - Railway will use `railway.json` and `nixpacks.toml` for build config
   - The build command will automatically:
     - Build shared package
     - Clean dist folder
     - Generate Prisma client
     - Build TypeScript

4. **Set Environment Variables:**
   - All your environment variables are already set at the project level
   - They'll be inherited by the new service
   - Verify in the Variables tab

5. **Deploy:**
   - Railway will automatically deploy
   - Monitor the build logs
   - Should succeed with all `.js` extensions fixed

## Option 2: Create New Service (Keep Old One)

Same as Option 1, but keep the old service for reference. You can delete it later.

## Option 3: New Project

1. Create new Railway project
2. Link to GitHub repo
3. Create service with root directory `apps/api`
4. Copy all environment variables from old project
5. Deploy

## After Fresh Start

Once the new service is deployed:
- Test health endpoint: `https://your-service.railway.app/health`
- Update `API_URL` environment variable if domain changed
- Update OAuth callback URLs in Meta/Google apps if needed

