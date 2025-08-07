#!/usr/bin/env python3
"""
Deploy Security Fixes to Lambda
- JWT secret now uses environment variable
- Removed hardcoded secrets
"""

import boto3
import json
import zipfile
import os
from datetime import datetime

def create_deployment_package():
    """Create a zip file with the updated Lambda code"""
    print("📦 Creating deployment package with security fixes...")
    
    package_name = 'lambda_security_fix.zip'
    
    with zipfile.ZipFile(package_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add the main Lambda function with security fixes
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
    print("🚀 Deploying security fixes to AWS Lambda...")
    
    lambda_client = boto3.client('lambda', region_name='us-east-1')
    
    with open(package_name, 'rb') as f:
        zip_data = f.read()
    
    try:
        response = lambda_client.update_function_code(
            FunctionName='cura-genesis-crm-api',
            ZipFile=zip_data
        )
        
        print(f"✅ Lambda function updated with security fixes!")
        print(f"   Function ARN: {response['FunctionArn']}")
        print(f"   Last Modified: {response['LastModified']}")
        print(f"   Code Size: {response['CodeSize']} bytes")
        
        # Log the security fixes
        log_data = {
            "deployment_time": datetime.utcnow().isoformat(),
            "security_fixes": [
                "JWT secret now uses JWT_SECRET_KEY environment variable",
                "Removed hardcoded 'your-secret-key'",
                "Added os import for environment variable access",
                "Fallback generates secure random secret if env var missing"
            ],
            "code_changes": {
                "file": "lambda_function.py",
                "changes": [
                    {
                        "line": 138,
                        "old": 'secret = "your-secret-key"',
                        "new": "secret = os.environ.get('JWT_SECRET_KEY', 'vantagepoint-' + hashlib.sha256(os.urandom(32)).hexdigest()[:32])"
                    },
                    {
                        "line": 155,
                        "old": 'secret = "your-secret-key"',
                        "new": "secret = os.environ.get('JWT_SECRET_KEY', 'vantagepoint-' + hashlib.sha256(os.urandom(32)).hexdigest()[:32])"
                    }
                ]
            }
        }
        
        with open('security_fix_deployment_log.json', 'w') as f:
            json.dump(log_data, f, indent=2)
        
        print("\n📝 Deployment log saved to security_fix_deployment_log.json")
        
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
    print("🔒 Security Fix Deployment Script")
    print("=================================")
    print("Deploying JWT secret security fix to production\n")
    
    package_name = create_deployment_package()
    
    if deploy_to_lambda(package_name):
        print("\n✅ DEPLOYMENT SUCCESSFUL!")
        print("\nSecurity improvements:")
        print("- JWT secrets are now secure and environment-based")
        print("- No more hardcoded secrets in code")
        print("- Cryptographically secure fallback if env var missing")
        print("\n⚡ Changes are live immediately!")
    else:
        print("\n❌ Deployment failed. Please check the error messages above.")

if __name__ == "__main__":
    main()
