#!/usr/bin/env python3
"""
Deploy JWT Token Fix to Lambda
- Extends JWT token expiry from 1 hour to 24 hours
- Fixes authentication timeout issues for agents
"""

import boto3
import json
import zipfile
import os
from datetime import datetime

def create_deployment_package():
    """Create a zip file with the updated Lambda code"""
    print("📦 Creating deployment package...")
    
    # Create a temporary deployment package
    package_name = 'lambda_jwt_fix.zip'
    
    with zipfile.ZipFile(package_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add the main Lambda function
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
    print("🚀 Deploying to AWS Lambda...")
    
    lambda_client = boto3.client('lambda', region_name='us-east-1')
    
    # Read the deployment package
    with open(package_name, 'rb') as f:
        zip_data = f.read()
    
    try:
        # Update the Lambda function code
        response = lambda_client.update_function_code(
            FunctionName='cura-genesis-crm-api',
            ZipFile=zip_data
        )
        
        print(f"✅ Lambda function updated successfully!")
        print(f"   Function ARN: {response['FunctionArn']}")
        print(f"   Last Modified: {response['LastModified']}")
        print(f"   Code Size: {response['CodeSize']} bytes")
        
        # Log the fix details
        log_data = {
            "deployment_time": datetime.utcnow().isoformat(),
            "fix_description": "Extended JWT token expiry from 1 hour to 24 hours",
            "issues_fixed": [
                "Agents getting logged out after 1 hour",
                "Failed to update lead: Invalid or expired token",
                "Authentication timeouts during lead editing"
            ],
            "code_changes": {
                "file": "lambda_function.py",
                "line": 130,
                "old_value": "int(time.time()) + 3600  # 1 hour expiry",
                "new_value": "int(time.time()) + 86400  # 24 hour expiry (was 1 hour)"
            }
        }
        
        with open('jwt_fix_deployment_log.json', 'w') as f:
            json.dump(log_data, f, indent=2)
        
        print("\n📝 Deployment log saved to jwt_fix_deployment_log.json")
        
        return True
        
    except Exception as e:
        print(f"❌ Error deploying to Lambda: {e}")
        return False
    
    finally:
        # Clean up the deployment package
        if os.path.exists(package_name):
            os.remove(package_name)
            print("🧹 Cleaned up deployment package")

def main():
    print("🔧 JWT Token Fix Deployment Script")
    print("=================================")
    print("This will fix the authentication timeout issue by extending JWT tokens to 24 hours\n")
    
    # Create and deploy the package
    package_name = create_deployment_package()
    
    if deploy_to_lambda(package_name):
        print("\n✅ DEPLOYMENT SUCCESSFUL!")
        print("\nWhat this fixes:")
        print("- Agents will stay logged in for 24 hours instead of just 1 hour")
        print("- No more 'Invalid or expired token' errors when saving leads")
        print("- Smoother workflow without constant re-authentication")
        print("\n⚡ Changes are live immediately!")
    else:
        print("\n❌ Deployment failed. Please check the error messages above.")

if __name__ == "__main__":
    main()
