#!/bin/bash
# Diana AI PWA — One-Click Deploy Script
# Run this on your local machine to fully automate Vercel + MongoDB Atlas setup
# Usage: chmod +x deploy.sh && ./deploy.sh

set -e

echo "🚀 Diana AI PWA — Automated Deployment"
echo "========================================="

# ─── Step 1: Install Vercel CLI if needed ──────────────────────
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm i -g vercel
fi

echo ""
echo "📋 Step 1: Vercel Login"
echo "   A browser window will open. Log in with your Vercel account."
echo "   (Free tier works perfectly)"
vercel login

echo ""
echo "📋 Step 2: Deploying to Vercel..."
echo "   Linking project and deploying..."
cd "$(dirname "$0")"
vercel link --yes
vercel deploy --prod --yes

echo ""
echo "📋 Step 3: Setting up MongoDB Atlas..."
echo ""
echo "   ⚠️  MongoDB Atlas requires account creation."
echo "   Go to: https://cloud.mongodb.com/register"
echo "   1. Sign up (free)"
echo "   2. Create a Free M0 Cluster"
echo "   3. Database Access → Create User (note username & password)"
echo "   4. Network Access → Add IP Address → Allow All (0.0.0.0/0)"
echo "   5. Databases → Browse → Get Connection String"
echo ""
read -p "   Paste your MongoDB connection string here: " MONGODB_URI

if [ -n "$MONGODB_URI" ]; then
    echo ""
    echo "   Setting MONGODB_URI on Vercel..."
    vercel env add MONGODB_URI production <<< "$MONGODB_URI"
    echo "   Redeploying with MongoDB connected..."
    vercel deploy --prod --yes
fi

echo ""
echo "========================================="
echo "✅ Diana AI PWA is LIVE!"
echo ""
echo "   Your app URL will be shown above."
echo "   It's also a PWA — install it on your phone!"
echo ""
echo "   📱 iPhone: Safari → Share → Add to Home Screen"
echo "   📱 Android: Chrome → Menu → Install App"
echo "   🖥️ Desktop: Chrome → Install icon in address bar"
echo ""
