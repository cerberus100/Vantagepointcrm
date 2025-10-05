#!/bin/bash

# Stop any existing container
docker stop vantagepoint-backend 2>/dev/null
docker rm vantagepoint-backend 2>/dev/null

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 337909762852.dkr.ecr.us-east-1.amazonaws.com

# Pull latest image
docker pull 337909762852.dkr.ecr.us-east-1.amazonaws.com/vantagepoint-backend:v2

# Run the container
docker run -d \
  --name vantagepoint-backend \
  --restart always \
  -p 80:8080 \
  -e NODE_ENV=production \
  -e DATABASE_HOST=vantagepoint-production.c6ds4c4qok1n.us-east-1.rds.amazonaws.com \
  -e DATABASE_PORT=5432 \
  -e DATABASE_USERNAME=postgres \
  -e DATABASE_PASSWORD="VantagePoint2024!" \
  -e DATABASE_NAME=vantagepointcrm \
  -e JWT_SECRET="VantagePoint2024!SecretKey" \
  -e JWT_EXPIRES_IN="24h" \
  -e PORT=8080 \
  337909762852.dkr.ecr.us-east-1.amazonaws.com/vantagepoint-backend:v2

echo "Backend container started!"
echo "Check status with: docker ps"
echo "View logs with: docker logs vantagepoint-backend"
