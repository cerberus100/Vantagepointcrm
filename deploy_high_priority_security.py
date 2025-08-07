#!/usr/bin/env python3
"""
Deploy High Priority Security Improvements to Lambda
- Rate limiting with DynamoDB
- Sanitized error messages  
- Input validation
"""

import boto3
import json
import zipfile
import os
from datetime import datetime

def create_deployment_package():
    """Create a zip file with the updated Lambda code"""
    print("📦 Creating deployment package with security improvements...")
    
    package_name = 'lambda_security_high_priority.zip'
    
    with zipfile.ZipFile(package_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add the main Lambda function with all security fixes
        zipf.write('lambda_package/lambda_function.py', 'lambda_function.py')
        
        # Add JWT library files
        jwt_files = [
            '__init__.py', 'algorithms.py', 'api_jwk.py', 'api_jws.py',
            'api_jwt.py', 'exceptions.py', 'help.py', 'jwk_set_cache.py',
            'jwks_client.py', 'py.typed', 'types.py', 'utils.py', 'warnings.py'
        ]
        
        for jwt_file in jwt_files:
            source_path = f'lambda_package/jwt/{jwt_file}'
            if os.path.exists(source_path):
                zipf.write(source_path, f'jwt/{jwt_file}')
    
    return package_name

def deploy_to_lambda(package_name):
    """Deploy the package to AWS Lambda"""
    print("🚀 Deploying high priority security fixes to AWS Lambda...")
    
    lambda_client = boto3.client('lambda', region_name='us-east-1')
    
    with open(package_name, 'rb') as f:
        zip_data = f.read()
    
    try:
        response = lambda_client.update_function_code(
            FunctionName='cura-genesis-crm-api',
            ZipFile=zip_data
        )
        
        print(f"✅ Lambda function updated with security improvements!")
        print(f"   Function ARN: {response['FunctionArn']}")
        print(f"   Last Modified: {response['LastModified']}")
        print(f"   Code Size: {response['CodeSize']} bytes")
        
        # Log the security improvements
        log_data = {
            "deployment_time": datetime.utcnow().isoformat(),
            "security_improvements": {
                "rate_limiting": {
                    "description": "Added rate limiting to prevent DDoS",
                    "features": [
                        "Role-based rate limits (admin: 500/min, manager: 200/min, agent: 100/min)",
                        "Endpoint-specific limits for bulk operations",
                        "DynamoDB-based distributed rate limiting",
                        "Automatic TTL cleanup"
                    ]
                },
                "error_sanitization": {
                    "description": "Sanitized error messages to prevent info leakage",
                    "features": [
                        "Generic error messages for production",
                        "Full error logging internally",
                        "Sensitive pattern detection",
                        "Safe error mappings"
                    ]
                },
                "input_validation": {
                    "description": "Added comprehensive input validation",
                    "features": [
                        "Pattern validation for all fields",
                        "Length limits to prevent buffer overflows",
                        "Input sanitization to prevent injection",
                        "Field-specific validation rules"
                    ]
                }
            },
            "endpoints_protected": [
                "/api/v1/auth/login - Login validation",
                "/api/v1/leads - Lead creation validation",
                "/api/v1/leads/{id} - Lead update validation",
                "/api/v1/leads/bulk - Bulk upload validation",
                "/api/v1/users - User creation validation"
            ]
        }
        
        with open('high_priority_security_deployment_log.json', 'w') as f:
            json.dump(log_data, f, indent=2)
        
        print("\n📝 Deployment log saved")
        
        return True
        
    except Exception as e:
        print(f"❌ Error deploying to Lambda: {e}")
        return False
    
    finally:
        # Clean up
        if os.path.exists(package_name):
            os.remove(package_name)
            print("🧹 Cleaned up deployment package")

def main():
    print("🔒 High Priority Security Deployment")
    print("====================================")
    print("Deploying rate limiting, error sanitization, and input validation\n")
    
    package_name = create_deployment_package()
    
    if deploy_to_lambda(package_name):
        print("\n✅ DEPLOYMENT SUCCESSFUL!")
        print("\nSecurity improvements deployed:")
        print("1. ⚡ Rate Limiting - Prevents DDoS and controls API usage")
        print("2. 🔐 Error Sanitization - No more sensitive info leakage")
        print("3. 🛡️ Input Validation - Protection against injection attacks")
        print("\n⚡ All improvements are live immediately!")
        print("\nNext steps:")
        print("- Monitor rate limit metrics in CloudWatch")
        print("- Test rate limiting with multiple requests")
        print("- Verify error messages are sanitized")
        print("- Test input validation with edge cases")
    else:
        print("\n❌ Deployment failed. Please check the error messages above.")

if __name__ == "__main__":
    main()
