#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🚀 Deploy VantagePoint Frontend to AWS Amplify           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Install Amplify CLI (requires sudo)
echo "📦 Step 1: Installing Amplify CLI..."
echo "This requires sudo password..."
sudo npm install -g @aws-amplify/cli

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Amplify CLI"
    exit 1
fi

echo "✅ Amplify CLI installed"
echo ""

# Initialize Amplify
echo "🔧 Step 2: Initializing Amplify..."
amplify init --yes \
  --amplify "{\"projectName\":\"vantagepointcrm\",\"defaultEditor\":\"code\"}" \
  --frontend "{\"frontend\":\"javascript\",\"framework\":\"react\",\"config\":{\"SourceDir\":\"src\",\"DistributionDir\":\".next\",\"BuildCommand\":\"npm run build\",\"StartCommand\":\"npm run dev\"}}"

echo ""

# Add hosting
echo "🌐 Step 3: Adding hosting..."
amplify add hosting --yes

echo ""

# Set environment variables
echo "⚙️  Step 4: Setting environment variables..."
amplify env add prod \
  --env prod \
  --config "{\"NEXT_PUBLIC_API_URL\":\"https://production.eba-nti2hpvd.us-east-1.elasticbeanstalk.com/api/v1\"}"

echo ""

# Publish
echo "🚀 Step 5: Publishing to Amplify..."
amplify publish --yes

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOYMENT COMPLETE!                                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Your new frontend is now live!"
echo ""
echo "Next steps:"
echo "1. Test the Amplify URL"
echo "2. Update your domain (vantagepointcrm.com) to point to Amplify"
echo ""
