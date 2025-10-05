#!/bin/bash

# Deploy VantagePoint Backend to AWS

echo "🚀 Deploying VantagePoint Backend..."

# Build and push Docker image
echo "📦 Building Docker image..."
docker buildx build --platform linux/amd64 -t 337909762852.dkr.ecr.us-east-1.amazonaws.com/vantagepoint-backend:latest --push .

# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 337909762852.dkr.ecr.us-east-1.amazonaws.com

# Pull latest image
docker pull 337909762852.dkr.ecr.us-east-1.amazonaws.com/vantagepoint-backend:latest

echo "✅ Backend deployed successfully!"
echo "🔗 Backend URL: https://production.eba-nti2hpvd.us-east-1.elasticbeanstalk.com"
