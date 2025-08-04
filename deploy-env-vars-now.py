#!/usr/bin/env python3
"""
Deploy Environment Variables to AWS Lambda NOW
"""
import boto3
import json

def deploy_lambda_env_vars():
    """Deploy all environment variables to Lambda function"""
    
    # AWS Lambda client
    lambda_client = boto3.client('lambda', region_name='us-east-1')
    
    # Environment variables to deploy
    env_vars = {
        # Security & Authentication
        'JWT_SECRET': 'cura-genesis-crm-super-secret-key-change-in-production-2025',
        'JWT_ALGORITHM': 'HS256',
        'ACCESS_TOKEN_EXPIRE_MINUTES': '1440',
        'REFRESH_TOKEN_EXPIRE_DAYS': '7',
        
        # Application Settings
        'APP_NAME': 'VantagePoint CRM',
        'APP_VERSION': '2.0.0',
        'ENVIRONMENT': 'production',
        'DEBUG': 'false',
        'API_V1_STR': '/api/v1',
        
        # CORS Configuration
        'FRONTEND_URL': 'https://vantagepointcrm.com',
        'ALLOWED_ORIGINS': 'https://vantagepointcrm.com,https://www.vantagepointcrm.com,https://main.d3eve7po1zc3ec.amplifyapp.com',
        'ALLOWED_METHODS': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
        'ALLOWED_HEADERS': 'Content-Type,Authorization,X-Requested-With,Accept,Origin,Access-Control-Request-Method,Access-Control-Request-Headers',
        'ALLOW_CREDENTIALS': 'true',
        'CORS_MAX_AGE': '86400',
        
        # External API Integration
        'EXTERNAL_API_URL': 'https://nwabj0qrf1.execute-api.us-east-1.amazonaws.com/Prod/createUserExternal',
        'VENDOR_TOKEN': 'Nb9sQCZnrAxAxS4KrysMLzRUQ2HN21hbZmpshgZYb1cT7sEPdJkNEE_MhfB59pDt',
        'DEFAULT_SALES_REP': 'VantagePoint Sales Team',
        'EXTERNAL_API_TIMEOUT': '30',
        'EXTERNAL_API_RETRIES': '3',
        'EXTERNAL_API_ENABLED': 'true',
        
        # Default values for leads
        'DEFAULT_FACILITY_TYPE': 'Physician Office (11)',
        'DEFAULT_BAA_SIGNED': 'true',
        'DEFAULT_PA_SIGNED': 'true',
        'AUTO_GENERATE_EMAILS': 'true',
        'EMAIL_DOMAIN_SUFFIX': '@vantagepointcrm.com',
        
        # Lead Management Settings
        'AUTO_ASSIGN_LEADS': 'true',
        'DEFAULT_LEADS_PER_AGENT': '20',
        'LEAD_SCORING_ENABLED': 'true',
        'MIN_LEAD_SCORE': '60',
        
        # Feature Toggles
        'ENABLE_SEND_DOCS': 'true',
        'ENABLE_BULK_UPLOAD': 'true',
        'ENABLE_ROLE_BASED_ACCESS': 'true',
        'ENABLE_ANALYTICS': 'true'
    }
    
    function_name = 'cura-genesis-crm-api'
    
    try:
        print(f"🚀 Deploying {len(env_vars)} environment variables to Lambda function: {function_name}")
        print("=" * 70)
        
        # Update Lambda function configuration
        response = lambda_client.update_function_configuration(
            FunctionName=function_name,
            Environment={'Variables': env_vars}
        )
        
        print("✅ ENVIRONMENT VARIABLES DEPLOYED SUCCESSFULLY!")
        print(f"📍 Function ARN: {response['FunctionArn']}")
        print(f"📊 Total variables set: {len(env_vars)}")
        print(f"📅 Last modified: {response['LastModified']}")
        
        print("\n🔧 Environment Variables Configured:")
        for key, value in env_vars.items():
            if 'SECRET' in key or 'TOKEN' in key:
                print(f"   {key}=***HIDDEN***")
            else:
                display_value = value[:50] + "..." if len(value) > 50 else value
                print(f"   {key}={display_value}")
        
        return True
        
    except Exception as e:
        print(f"❌ ERROR deploying environment variables: {e}")
        return False

def test_lambda_deployment():
    """Test that Lambda function is working with new environment variables"""
    
    import requests
    
    print("\n🧪 Testing Lambda deployment...")
    
    try:
        # Test health endpoint
        response = requests.get("https://api.vantagepointcrm.com/health", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Lambda function is responding correctly!")
            print(f"   Status: {data.get('status')}")
            print(f"   Service: {data.get('service')}")
            print(f"   Version: {data.get('version')}")
            return True
        else:
            print(f"⚠️  Lambda responding but with status code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Lambda test failed: {e}")
        print("   Note: This might be expected if custom domain isn't set up yet")
        return False

if __name__ == "__main__":
    print("🚀 VantagePoint CRM - Direct AWS Environment Variable Deployment")
    print("=" * 70)
    
    # Deploy environment variables
    if deploy_lambda_env_vars():
        print("\n" + "=" * 70)
        print("🎉 DEPLOYMENT COMPLETE!")
        print("✅ All environment variables configured in AWS Lambda")
        print("✅ Production settings applied")
        print("✅ CORS configuration set")
        print("✅ External API integration configured")
        
        # Test deployment
        test_lambda_deployment()
        
        print("\n📝 Next Steps:")
        print("   1. Custom domain DNS configuration")
        print("   2. Amplify environment variables (if needed)")
        print("   3. SSL certificate validation")
        
        print("\n🌐 Your API should now work at:")
        print("   Direct URL: https://blyqk7itsc.execute-api.us-east-1.amazonaws.com/prod")
        print("   Custom URL: https://api.vantagepointcrm.com (if DNS configured)")
        
    else:
        print("❌ DEPLOYMENT FAILED - Please check AWS credentials and permissions")