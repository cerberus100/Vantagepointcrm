#!/bin/bash
# Install Docker
yum update -y
yum install -y docker aws-cli
service docker start
systemctl enable docker
usermod -a -G docker ec2-user

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 337909762852.dkr.ecr.us-east-1.amazonaws.com

# Pull and run the backend
docker pull 337909762852.dkr.ecr.us-east-1.amazonaws.com/vantagepoint-backend:v2

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

# Log the status
echo "Backend deployed at $(date)" >> /var/log/backend-deploy.log
docker ps >> /var/log/backend-deploy.log
