# AWS Lambda Environment Variables Configuration

## Required Environment Variables for Lambda Function

Configure these in: **AWS Lambda Console > Functions > VantagePointCRM > Configuration > Environment Variables**

### Core Application Variables
```
# Security & Authentication
JWT_SECRET=cura-genesis-crm-super-secret-key-change-in-production-2025
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=7

# Application Settings
APP_NAME=VantagePoint CRM
APP_VERSION=2.0.0
ENVIRONMENT=production
DEBUG=false
API_V1_STR=/api/v1

# CORS Configuration
FRONTEND_URL=https://vantagepointcrm.com
ALLOWED_ORIGINS=https://vantagepointcrm.com,https://main.d3eve7po1zc3ec.amplifyapp.com

# External API Integration
EXTERNAL_API_URL=https://nwabj0qrf1.execute-api.us-east-1.amazonaws.com/Prod/createUserExternal
VENDOR_TOKEN=Nb9sQCZnrAxAxS4KrysMLzRUQ2HN21hbZmpshgZYb1cT7sEPdJkNEE_MhfB59pDt
DEFAULT_SALES_REP=VantagePoint Sales Team

# Lead Management Settings
AUTO_ASSIGN_LEADS=true
DEFAULT_LEADS_PER_AGENT=20
LEAD_SCORING_ENABLED=true
MIN_LEAD_SCORE=60

# Feature Toggles
ENABLE_SEND_DOCS=true
ENABLE_BULK_UPLOAD=true
ENABLE_ROLE_BASED_ACCESS=true
ENABLE_ANALYTICS=true
```

### DynamoDB Configuration (Optional - for future persistence)
```
# Database Configuration (if using DynamoDB)
DYNAMODB_REGION=us-east-1
DYNAMODB_USERS_TABLE=Users
DYNAMODB_LEADS_TABLE=Leads
DYNAMODB_ENDPOINT=dynamodb.us-east-1.amazonaws.com
```

### Email Configuration (Optional)
```
# Email Settings (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@vantagepointcrm.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@vantagepointcrm.com
ENABLE_EMAIL_NOTIFICATIONS=false
```

## How to Set These in AWS Lambda Console:

### Method 1: AWS Console
1. Go to **AWS Lambda Console**
2. Find function: **VantagePointCRM** or similar
3. Go to **Configuration > Environment variables**
4. Click **Edit**
5. Add each variable above
6. Click **Save**

### Method 2: AWS CLI Command
```bash
aws lambda update-function-configuration \
  --function-name VantagePointCRM \
  --environment Variables='{
    "JWT_SECRET":"cura-genesis-crm-super-secret-key-change-in-production-2025",
    "JWT_ALGORITHM":"HS256", 
    "ACCESS_TOKEN_EXPIRE_MINUTES":"1440",
    "APP_NAME":"VantagePoint CRM",
    "APP_VERSION":"2.0.0",
    "ENVIRONMENT":"production",
    "DEBUG":"false",
    "FRONTEND_URL":"https://vantagepointcrm.com",
    "ALLOWED_ORIGINS":"https://vantagepointcrm.com,https://main.d3eve7po1zc3ec.amplifyapp.com",
    "EXTERNAL_API_URL":"https://nwabj0qrf1.execute-api.us-east-1.amazonaws.com/Prod/createUserExternal",
    "VENDOR_TOKEN":"Nb9sQCZnrAxAxS4KrysMLzRUQ2HN21hbZmpshgZYb1cT7sEPdJkNEE_MhfB59pDt",
    "AUTO_ASSIGN_LEADS":"true",
    "DEFAULT_LEADS_PER_AGENT":"20",
    "ENABLE_SEND_DOCS":"true"
  }'
```

### Method 3: Automated Script
Create `deploy-env-vars.py`:
```python
import boto3

def update_lambda_env_vars():
    lambda_client = boto3.client('lambda', region_name='us-east-1')
    
    env_vars = {
        'JWT_SECRET': 'cura-genesis-crm-super-secret-key-change-in-production-2025',
        'JWT_ALGORITHM': 'HS256',
        'ACCESS_TOKEN_EXPIRE_MINUTES': '1440',
        'APP_NAME': 'VantagePoint CRM',
        'APP_VERSION': '2.0.0',
        'ENVIRONMENT': 'production',
        'DEBUG': 'false',
        'FRONTEND_URL': 'https://vantagepointcrm.com',
        'ALLOWED_ORIGINS': 'https://vantagepointcrm.com,https://main.d3eve7po1zc3ec.amplifyapp.com',
        'EXTERNAL_API_URL': 'https://nwabj0qrf1.execute-api.us-east-1.amazonaws.com/Prod/createUserExternal',
        'VENDOR_TOKEN': 'Nb9sQCZnrAxAxS4KrysMLzRUQ2HN21hbZmpshgZYb1cT7sEPdJkNEE_MhfB59pDt',
        'AUTO_ASSIGN_LEADS': 'true',
        'DEFAULT_LEADS_PER_AGENT': '20',
        'ENABLE_SEND_DOCS': 'true'
    }
    
    try:
        response = lambda_client.update_function_configuration(
            FunctionName='VantagePointCRM',
            Environment={'Variables': env_vars}
        )
        print("✅ Lambda environment variables updated successfully!")
        print(f"Function ARN: {response['FunctionArn']}")
        return True
    except Exception as e:
        print(f"❌ Error updating Lambda environment variables: {e}")
        return False

if __name__ == "__main__":
    update_lambda_env_vars()
```

## Verification
Test the environment variables are working:
```bash
# Test health endpoint
curl https://api.vantagepointcrm.com/health

# Expected response should include environment info
{
  "status": "healthy",
  "service": "VantagePoint CRM API",
  "environment": "production",
  "version": "2.0.0"
}
```