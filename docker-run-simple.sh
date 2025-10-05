#!/bin/bash
# Simple script to run the backend

# Pull the image (no login needed if public)
docker pull 337909762852.dkr.ecr.us-east-1.amazonaws.com/vantagepoint-backend:v2 || {
    echo "If pull fails, run:"
    echo "aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 337909762852.dkr.ecr.us-east-1.amazonaws.com"
    exit 1
}

# Stop and remove old container
docker stop vantagepoint-backend 2>/dev/null
docker rm vantagepoint-backend 2>/dev/null

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

echo "Backend started! Check with: docker logs vantagepoint-backend"
