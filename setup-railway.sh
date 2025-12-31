#!/bin/bash
# Railway Deployment Setup Script
# Run this after authenticating with Railway CLI

set -e

echo "🚂 Setting up Railway deployment for adequate-curiosity project..."

# Check if logged in
if ! railway whoami &>/dev/null; then
    echo "❌ Not logged in to Railway. Please run: railway login"
    echo "   This will open a browser for authentication."
    exit 1
fi

echo "✅ Logged in to Railway"

# Link to project
echo "📎 Linking to project: adequate-curiosity"
railway link --project adequate-curiosity

# Check current services
echo "📋 Checking existing services..."
railway status

# Create service if it doesn't exist
echo "🔧 Setting up service configuration..."
echo "   Root Directory: apps/api"
echo "   Build Command: (configured in railway.json)"
echo "   Start Command: (configured in railway.json)"

# Note: Service creation might need to be done via Railway dashboard
# or the service might already exist. Let's check.

echo ""
echo "✅ Railway project linked!"
echo ""
echo "Next steps:"
echo "1. Go to Railway dashboard: https://railway.app/project/adequate-curiosity"
echo "2. Create a new service (or use existing)"
echo "3. Set Root Directory to: apps/api"
echo "4. Add environment variables (see RAILWAY_DEPLOYMENT.md)"
echo "5. Deploy!"

