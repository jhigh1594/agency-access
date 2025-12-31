#!/bin/bash
# Railway Deployment Automation Script
# Run this AFTER authenticating with: railway login

set -e

PROJECT_NAME="adequate-curiosity"
ROOT_DIR="/Users/jhigh/agency-access-platform"

cd "$ROOT_DIR"

echo "🚂 Railway Deployment Setup for $PROJECT_NAME"
echo "=============================================="
echo ""

# Check authentication
echo "🔐 Checking Railway authentication..."
if ! railway whoami &>/dev/null; then
    echo "❌ Not authenticated. Please run: railway login"
    exit 1
fi

echo "✅ Authenticated as: $(railway whoami)"
echo ""

# Link to project
echo "📎 Linking to project: $PROJECT_NAME"
if railway link --project "$PROJECT_NAME" 2>&1 | grep -q "already linked\|Linked"; then
    echo "✅ Project linked"
else
    echo "⚠️  Project linking - check if project exists"
fi
echo ""

# Show current status
echo "📋 Current Railway status:"
railway status
echo ""

# Check if service exists
echo "🔍 Checking for existing services..."
SERVICES=$(railway status 2>&1 | grep -i "service" || echo "No services found")
echo "$SERVICES"
echo ""

# Display configuration
echo "⚙️  Configuration (from railway.json):"
echo "   Root Directory: apps/api"
echo "   Build Command: npm run build --workspace=packages/shared && cd apps/api && npm run db:generate && npm run build"
echo "   Start Command: cd apps/api && npm start"
echo ""

# Environment variables checklist
echo "📝 Required Environment Variables:"
echo "   [ ] NODE_ENV=production"
echo "   [ ] DATABASE_URL (Neon connection string)"
echo "   [ ] REDIS_URL (Upstash connection string)"
echo "   [ ] CLERK_PUBLISHABLE_KEY"
echo "   [ ] CLERK_SECRET_KEY"
echo "   [ ] INFISICAL_CLIENT_ID"
echo "   [ ] INFISICAL_CLIENT_SECRET"
echo "   [ ] INFISICAL_PROJECT_ID"
echo "   [ ] INFISICAL_ENVIRONMENT=production"
echo "   [ ] META_APP_ID"
echo "   [ ] META_APP_SECRET"
echo "   [ ] FRONTEND_URL (set after Vercel deployment)"
echo "   [ ] API_URL (set after first deployment)"
echo ""

echo "✅ Setup script complete!"
echo ""
echo "Next steps:"
echo "1. Add environment variables in Railway dashboard"
echo "2. Ensure service has Root Directory set to: apps/api"
echo "3. Push to GitHub to trigger deployment (or deploy manually)"
echo ""
echo "Useful commands:"
echo "  railway logs          # View deployment logs"
echo "  railway open          # Open Railway dashboard"
echo "  railway run npm run db:push  # Run database migrations"

