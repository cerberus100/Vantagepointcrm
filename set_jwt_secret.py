#!/usr/bin/env python3
"""
Set JWT_SECRET_KEY environment variable in Lambda
"""

import boto3
import secrets
import json
from datetime import datetime

def generate_secure_secret():
    """Generate a cryptographically secure secret key"""
    return secrets.token_urlsafe(32)

def set_jwt_secret():
    """Set JWT_SECRET_KEY environment variable in Lambda"""
    print("🔐 Setting JWT_SECRET_KEY environment variable in Lambda\n")
    
    lambda_client = boto3.client('lambda', region_name='us-east-1')
    function_name = 'cura-genesis-crm-api'
    
    # Generate a secure secret
    jwt_secret = generate_secure_secret()
    print(f"✅ Generated secure JWT secret: {jwt_secret[:8]}... (hidden)")
    
    try:
        # Get current configuration
        response = lambda_client.get_function_configuration(FunctionName=function_name)
        current_env = response.get('Environment', {}).get('Variables', {})
        
        # Add JWT_SECRET_KEY
        current_env['JWT_SECRET_KEY'] = jwt_secret
        
        # Update function configuration
        update_response = lambda_client.update_function_configuration(
            FunctionName=function_name,
            Environment={'Variables': current_env}
        )
        
        print(f"\n✅ JWT_SECRET_KEY successfully set in Lambda!")
        print(f"   Function: {function_name}")
        print(f"   Last Modified: {update_response['LastModified']}")
        
        # Save the secret securely for reference (DO NOT COMMIT THIS FILE)
        secret_data = {
            "jwt_secret": jwt_secret,
            "set_date": datetime.utcnow().isoformat(),
            "function_name": function_name,
            "warning": "DO NOT COMMIT THIS FILE TO GIT!"
        }
        
        with open('.jwt_secret_backup.json', 'w') as f:
            json.dump(secret_data, f, indent=2)
        
        print("\n⚠️  Secret saved to .jwt_secret_backup.json (DO NOT COMMIT THIS FILE)")
        print("    Add .jwt_secret_backup.json to .gitignore immediately!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error setting JWT secret: {e}")
        return False

def main():
    """Main function"""
    if set_jwt_secret():
        print("\n✅ SECURITY UPDATE COMPLETE!")
        print("\nWhat was fixed:")
        print("- Replaced hardcoded JWT secret with secure environment variable")
        print("- Generated cryptographically secure 32-byte secret")
        print("- JWT tokens are now properly secured")
        print("\n⚡ Changes are live immediately!")
    else:
        print("\n❌ Failed to set JWT secret. Please check the error above.")

if __name__ == "__main__":
    main()
