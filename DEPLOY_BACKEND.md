# Deploy Backend on EC2 Instance

Your EC2 instance is running at: **44.201.214.118**

## Quick Deploy (Copy & Paste)

SSH into your instance and run these commands:

```bash
# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo systemctl enable docker

# Run the backend (PUBLIC IMAGE - NO LOGIN NEEDED!)
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

# Check if it's running
sudo docker ps
sudo docker logs vantagepoint-backend
```

## Test the Backend

```bash
curl http://44.201.214.118/api/v1
```

Your backend will be live at: http://44.201.214.118/api/v1
