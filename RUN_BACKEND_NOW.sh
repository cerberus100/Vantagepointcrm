#!/bin/bash
# SUPER SIMPLE BACKEND DEPLOYMENT
# Just copy and paste these commands!

echo "🚀 Starting VantagePoint Backend..."

# 1. Install Docker (if not installed)
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo yum update -y
    sudo yum install -y docker
    sudo service docker start
    sudo systemctl enable docker
fi

# 2. Run the backend (PUBLIC IMAGE - NO LOGIN NEEDED!)
echo "Starting backend container..."
sudo docker run -d \
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

# 3. Check if it's running
echo ""
echo "✅ Backend container started!"
echo ""
sudo docker ps
echo ""
echo "📊 Container logs:"
sudo docker logs vantagepoint-backend
echo ""
echo "🌐 Your backend is now available at:"
echo "   http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api/v1"
echo ""
echo "🔐 Create admin user with:"
echo "   curl -X POST http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api/v1/setup/create-admin -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"VantagePoint2024!\",\"email\":\"admin@vantagepointcrm.com\"}'"
