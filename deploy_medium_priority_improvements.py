#!/usr/bin/env python3
"""
Deploy Medium Priority Improvements to Lambda
- Optimized bulk upload batching
- Request ID tracking
- Tightened CORS policy
"""

import boto3
import json
import zipfile
import os
from datetime import datetime

def create_deployment_package():
    """Create a zip file with the updated Lambda code"""
    print("📦 Creating deployment package with medium priority improvements...")
    
    package_name = 'lambda_medium_priority.zip'
    
    with zipfile.ZipFile(package_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add the main Lambda function with all improvements
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
    print("🚀 Deploying medium priority improvements to AWS Lambda...")
    
    lambda_client = boto3.client('lambda', region_name='us-east-1')
    
    with open(package_name, 'rb') as f:
        zip_data = f.read()
    
    try:
        response = lambda_client.update_function_code(
            FunctionName='cura-genesis-crm-api',
            ZipFile=zip_data
        )
        
        print(f"✅ Lambda function updated with medium priority improvements!")
        print(f"   Function ARN: {response['FunctionArn']}")
        print(f"   Last Modified: {response['LastModified']}")
        print(f"   Code Size: {response['CodeSize']} bytes")
        
        # Log the improvements
        log_data = {
            "deployment_time": datetime.utcnow().isoformat(),
            "medium_priority_improvements": {
                "bulk_upload_optimization": {
                    "description": "Optimized bulk upload batching for better performance",
                    "features": [
                        "Dynamic batch sizing based on total leads",
                        "Parallel processing for uploads >500 leads",
                        "Progress tracking with request IDs",
                        "Better error recovery per batch",
                        "Thread pool executor for concurrent batches"
                    ]
                },
                "request_tracking": {
                    "description": "Request ID tracking for debugging",
                    "features": [
                        "Unique UUID for each request",
                        "Request ID in response headers (X-Request-ID)",
                        "Request ID in response body",
                        "Request ID in all log messages",
                        "Correlation across entire request lifecycle"
                    ]
                },
                "cors_tightening": {
                    "description": "Tightened CORS policy to specific domains",
                    "features": [
                        "Whitelist of allowed origins only",
                        "Dynamic origin validation",
                        "Credentials support enabled",
                        "Localhost allowed for development only",
                        "Default to main domain if origin unknown"
                    ]
                }
            },
            "allowed_origins": [
                "https://vantagepointcrm.com",
                "https://www.vantagepointcrm.com",
                "https://main.d3eve7po1zc3ec.amplifyapp.com",
                "http://localhost:3000 (dev)",
                "http://localhost:8080 (dev)"
            ]
        }
        
        with open('medium_priority_deployment_log.json', 'w') as f:
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
    print("🔧 Medium Priority Improvements Deployment")
    print("=========================================")
    print("Deploying bulk upload optimization, request tracking, and CORS tightening\n")
    
    package_name = create_deployment_package()
    
    if deploy_to_lambda(package_name):
        print("\n✅ DEPLOYMENT SUCCESSFUL!")
        print("\nMedium priority improvements deployed:")
        print("1. 📊 Bulk Upload Optimization - Better performance for large uploads")
        print("2. 🔍 Request Tracking - UUID tracking for debugging")
        print("3. 🌐 CORS Tightening - Only allowed domains can access API")
        print("\n⚡ All improvements are live immediately!")
        print("\nBenefits:")
        print("- Bulk uploads now handle 1000+ leads efficiently")
        print("- Every request has a unique ID for troubleshooting")
        print("- API is protected from unauthorized domain access")
    else:
        print("\n❌ Deployment failed. Please check the error messages above.")

if __name__ == "__main__":
    main()
