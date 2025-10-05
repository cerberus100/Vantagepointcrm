#!/bin/bash

echo "Checking VantagePoint Backend Status..."
echo "======================================"
echo ""

# Backend URL
BACKEND_URL="http://13.222.236.10"
FRONTEND_URL="https://main.dfh82x9nr61u2.amplifyapp.com"

echo "🖥️  EC2 Instance: 13.222.236.10"
echo "📱 Frontend URL: $FRONTEND_URL"
echo ""

# Check if backend is responding
echo "Testing backend connectivity..."
if curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/api/v1 > /dev/null 2>&1; then
    echo "✅ Backend is RUNNING!"
    echo ""
    echo "Testing login endpoint..."
    response=$(curl -s -X POST $BACKEND_URL/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"VantagePoint2024!"}')
    
    if echo "$response" | grep -q "Invalid credentials"; then
        echo "⚠️  Backend is responding but admin user may not exist"
        echo "   This is normal for first deployment"
    elif echo "$response" | grep -q "access_token"; then
        echo "✅ Login is working!"
    else
        echo "🔍 Response: $response"
    fi
else
    echo "⏳ Backend is still starting up..."
    echo "   Docker container deployment can take 5-10 minutes"
    echo ""
    echo "To check manually:"
    echo "1. Visit: $BACKEND_URL/api/v1"
    echo "2. Or run: curl $BACKEND_URL/api/v1"
fi

echo ""
echo "When backend is ready, login at: $FRONTEND_URL"
