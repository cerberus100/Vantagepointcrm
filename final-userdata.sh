#!/bin/bash
# Log all output
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "Starting deployment at $(date)"

# Update system
yum update -y

# Install Docker
yum install -y docker
service docker start
systemctl enable docker

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# Wait a moment for Docker to be ready
sleep 5

# Run the backend container (using public image)
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
  public.ecr.aws/a8m7d8x7/vantagepoint-backend:latest

# Wait for container to start
sleep 10

# Check if it's running
docker ps
docker logs vantagepoint-backend

echo "Deployment completed at $(date)"
