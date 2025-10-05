#!/bin/bash

# Deploy VantagePoint Frontend to AWS Amplify

echo "🚀 Deploying VantagePoint Frontend..."

echo "📦 Building frontend..."
npm run build

echo "✅ Frontend built successfully!"
echo ""
echo "🔗 To connect to your existing Amplify domain:"
echo ""
echo "1. Go to AWS Amplify Console"
echo "2. Find your existing app (or create new one)"
echo "3. Connect to this GitHub repository"
echo "4. Set build settings:"
echo "   - Build command: npm run build"
echo "   - Output directory: .next"
echo "5. Add environment variables:"
echo "   - NEXT_PUBLIC_API_URL=https://production.eba-nti2hpvd.us-east-1.elasticbeanstalk.com/api/v1"
echo ""
echo "🎯 Your domain will be available at your configured domain once deployed!"
echo ""
echo "🔧 Manual deployment alternative:"
echo "   npx aws-amplify@latest publish --region us-east-1"
