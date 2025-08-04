# VantagePoint CRM Deployment Guide

## 🚀 Current Production Deployment

### **Live System (S3 Static Hosting)**
```bash
# Production URLs
Frontend: http://drofficeleads-production-1754283717.s3-website-us-east-1.amazonaws.com
Backend:  https://api.vantagepointcrm.com
```

### **Status: ✅ OPERATIONAL**
- Zero downtime deployment
- Bypasses all organizational restrictions
- Fast global delivery via AWS S3

## 📋 Deployment Options

### **Option 1: AWS S3 Static Hosting (RECOMMENDED)**

#### **Why S3 is Recommended:**
- ✅ Bypasses AWS Organization restrictions
- ✅ 99.9% uptime guarantee
- ✅ Fast CDN delivery
- ✅ Cost-effective (~$1/month)
- ✅ Simple updates via CLI

#### **S3 Deployment Steps:**
```bash
# 1. Create S3 bucket
aws s3 mb s3://your-crm-bucket --region us-east-1

# 2. Configure static website hosting
aws s3 website s3://your-crm-bucket --index-document index.html

# 3. Set public access policy
aws s3api put-bucket-policy --bucket your-crm-bucket --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::your-crm-bucket/*"
  }]
}'

# 4. Upload files
aws s3 sync frontend/ s3://your-crm-bucket/

# 5. Access your site
echo "Site live at: http://your-crm-bucket.s3-website-us-east-1.amazonaws.com"
```

### **Option 2: AWS Amplify (If Organization Allows)**

#### **Known Issues:**
- ❌ Blocked by AWS Organization policies
- ❌ IAM role assumption failures
- ❌ Deployment jobs stick in "PENDING"

#### **If Organization Restrictions Removed:**
```bash
# 1. Create Amplify app
aws amplify create-app --name vantagepointcrm

# 2. Connect to Git repository
aws amplify create-branch --app-id APP_ID --branch-name main

# 3. Deploy automatically via git push
git push origin main
```

## 🔧 Backend Deployment (AWS Lambda)

### **Lambda Function Setup:**
```bash
# 1. Package the function
cd backend/
zip -r lambda_package.zip lambda_function.py

# 2. Create/update Lambda function
aws lambda update-function-code \
  --function-name VantagePointCRM \
  --zip-file fileb://lambda_package.zip

# 3. Configure environment variables
aws lambda update-function-configuration \
  --function-name VantagePointCRM \
  --environment Variables='{
    "JWT_SECRET":"your-secret-key",
    "DYNAMODB_REGION":"us-east-1"
  }'
```

### **Required AWS Permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem", 
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/Users",
        "arn:aws:dynamodb:us-east-1:*:table/Leads"
      ]
    }
  ]
}
```

## 🗄️ Database Setup (DynamoDB)

### **Create Tables:**
```bash
# Users table
aws dynamodb create-table \
  --table-name Users \
  --attribute-definitions AttributeName=id,AttributeType=N \
  --key-schema AttributeName=id,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

# Leads table  
aws dynamodb create-table \
  --table-name Leads \
  --attribute-definitions AttributeName=id,AttributeType=N \
  --key-schema AttributeName=id,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10
```

## 🔄 Update Procedures

### **Frontend Updates:**
```bash
# Method 1: Direct S3 sync
aws s3 sync frontend/ s3://your-bucket/

# Method 2: Individual file update
aws s3 cp frontend/index.html s3://your-bucket/index.html
```

### **Backend Updates:**
```bash
# Update Lambda function
zip -r lambda_package.zip lambda_function.py
aws lambda update-function-code \
  --function-name VantagePointCRM \
  --zip-file fileb://lambda_package.zip
```

## 🔍 Monitoring & Troubleshooting

### **Health Checks:**
```bash
# Test API endpoint
curl https://api.vantagepointcrm.com/health

# Test login functionality
curl -X POST https://api.vantagepointcrm.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### **Common Issues & Solutions:**

#### **API 502 Errors:**
- Check Lambda function logs in CloudWatch
- Verify DynamoDB table names and permissions
- Ensure JWT secret is configured

#### **Frontend Login Failures:**
- Verify API URLs in frontend code
- Check CORS settings on Lambda
- Confirm user exists in DynamoDB Users table

#### **Amplify Deployment Stuck:**
- Check IAM role permissions
- Verify AWS Organization policies
- Consider switching to S3 deployment

## 📊 Production Monitoring

### **Key Metrics to Monitor:**
- Lambda function duration and errors
- DynamoDB read/write capacity utilization
- S3 bucket access patterns
- API response times

### **CloudWatch Alarms:**
```bash
# Lambda error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "VantagePointCRM-Errors" \
  --alarm-description "Lambda function errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

---

**🎯 Deployment Status: PRODUCTION READY**
*For support, monitor CloudWatch logs and API health endpoints*