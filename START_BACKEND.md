# Quick Backend Start Guide

## Your EC2 Instance
- IP: 13.221.145.77
- Instance ID: i-0c01f697a29d26b1a

## SSH Command
```bash
ssh -i vantagepoint-backend-key.pem ec2-user@13.221.145.77
```

## Once Connected, Run This Single Command:

```bash
sudo yum install -y docker && sudo service docker start && aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin 337909762852.dkr.ecr.us-east-1.amazonaws.com && sudo docker run -d --name vantagepoint-backend --restart always -p 80:8080 -e NODE_ENV=production -e DATABASE_HOST=vantagepoint-production.c6ds4c4qok1n.us-east-1.rds.amazonaws.com -e DATABASE_PORT=5432 -e DATABASE_USERNAME=postgres -e DATABASE_PASSWORD="VantagePoint2024!" -e DATABASE_NAME=vantagepointcrm -e JWT_SECRET="VantagePoint2024!SecretKey" -e JWT_EXPIRES_IN="24h" -e PORT=8080 337909762852.dkr.ecr.us-east-1.amazonaws.com/vantagepoint-backend:v2 && sleep 5 && curl -X POST http://localhost/api/v1/setup/create-admin -H "Content-Type: application/json" -d '{"username":"admin","password":"VantagePoint2024!","email":"admin@vantagepointcrm.com"}' && echo "Backend is ready!"
```

## That's It!
Once you run that command, your backend will be live and you can login at:
https://main.dfh82x9nr61u2.amplifyapp.com

Username: admin
Password: VantagePoint2024!
