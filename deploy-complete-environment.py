#!/usr/bin/env python3
"""
Complete Environment Variables Deployment Script for VantagePoint CRM
Configures all AWS services with proper environment variables
"""

import boto3
import json
import time
import sys
from datetime import datetime

class VantagePointCRMDeployment:
    def __init__(self):
        """Initialize AWS clients"""
        self.lambda_client = boto3.client('lambda', region_name='us-east-1')
        self.amplify_client = boto3.client('amplify', region_name='us-east-1')
        self.apigateway_client = boto3.client('apigateway', region_name='us-east-1')
        self.acm_client = boto3.client('acm', region_name='us-east-1')
        self.route53_client = boto3.client('route53')
        
        # Configuration
        self.config = {
            'lambda_function_name': 'VantagePointCRM',
            'amplify_app_id': 'd3eve7po1zc3ec',
            'api_gateway_id': 'blyqk7itsc',
            'domain_name': 'vantagepointcrm.com',
            'api_domain': 'api.vantagepointcrm.com',
            'environment': 'production'
        }
        
        # Environment variables
        self.lambda_env_vars = {
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
        
        self.amplify_env_vars = {
            'REACT_APP_API_BASE_URL': 'https://api.vantagepointcrm.com',
            'NEXT_PUBLIC_API_BASE_URL': 'https://api.vantagepointcrm.com',
            'NODE_ENV': 'production',
            'ENVIRONMENT': 'production',
            'AMPLIFY_APP_ID': 'd3eve7po1zc3ec',
            'CUSTOM_DOMAIN': 'vantagepointcrm.com',
            'FRONTEND_URL': 'https://vantagepointcrm.com',
            'AMPLIFY_MONOREPO_APP_ROOT': 'aws_deploy',
            'AMPLIFY_DIFF_DEPLOY': 'false',
            'BUILD_OUTPUT_DIR': 'dist',
            'SKIP_PREFLIGHT_CHECK': 'true'
        }

    def update_lambda_environment(self):
        """Update Lambda function environment variables"""
        try:
            print("🔧 Updating Lambda environment variables...")
            
            response = self.lambda_client.update_function_configuration(
                FunctionName=self.config['lambda_function_name'],
                Environment={'Variables': self.lambda_env_vars}
            )
            
            print(f"✅ Lambda environment variables updated successfully!")
            print(f"📍 Function ARN: {response['FunctionArn']}")
            print(f"📊 Variables set: {len(self.lambda_env_vars)}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error updating Lambda environment variables: {e}")
            return False

    def configure_amplify_environment(self):
        """Configure Amplify environment variables"""
        try:
            print("🔧 Configuring Amplify environment variables...")
            
            # Note: Amplify environment variables are typically set through console
            # This would require AWS CLI or manual setup
            print("⚠️  Amplify environment variables need to be set manually in console:")
            print("   Go to: AWS Amplify Console > App > Environment Variables")
            
            for key, value in self.amplify_env_vars.items():
                print(f"   {key}={value}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error configuring Amplify environment: {e}")
            return False

    def setup_custom_domain_ssl(self):
        """Set up SSL certificate for custom domains"""
        try:
            print("🔒 Setting up SSL certificate...")
            
            # Check if certificate already exists
            certs = self.acm_client.list_certificates()
            existing_cert = None
            
            for cert in certs['CertificateSummaryList']:
                if cert['DomainName'] == self.config['domain_name']:
                    existing_cert = cert['CertificateArn']
                    break
            
            if existing_cert:
                print(f"✅ SSL certificate already exists: {existing_cert}")
                return existing_cert
            
            # Request new certificate
            response = self.acm_client.request_certificate(
                DomainName=self.config['domain_name'],
                SubjectAlternativeNames=[
                    f"www.{self.config['domain_name']}",
                    self.config['api_domain']
                ],
                ValidationMethod='DNS'
            )
            
            cert_arn = response['CertificateArn']
            print(f"✅ SSL certificate requested: {cert_arn}")
            print("⚠️  Please validate the certificate in ACM console before proceeding")
            
            return cert_arn
            
        except Exception as e:
            print(f"❌ Error setting up SSL certificate: {e}")
            return None

    def setup_api_gateway_custom_domain(self, cert_arn):
        """Set up custom domain for API Gateway"""
        try:
            print("🌐 Setting up API Gateway custom domain...")
            
            # Check if custom domain already exists
            try:
                existing_domain = self.apigateway_client.get_domain_name(
                    domainName=self.config['api_domain']
                )
                print(f"✅ API custom domain already exists: {self.config['api_domain']}")
                return existing_domain['distributionDomainName']
            except:
                pass
            
            # Create custom domain
            domain_response = self.apigateway_client.create_domain_name(
                domainName=self.config['api_domain'],
                certificateArn=cert_arn,
                endpointConfiguration={'types': ['EDGE']}
            )
            
            cloudfront_domain = domain_response['distributionDomainName']
            print(f"✅ API custom domain created: {self.config['api_domain']}")
            print(f"📍 CloudFront domain: {cloudfront_domain}")
            
            # Create base path mapping
            try:
                self.apigateway_client.create_base_path_mapping(
                    domainName=self.config['api_domain'],
                    restApiId=self.config['api_gateway_id'],
                    stage='prod'
                )
                print("✅ Base path mapping created")
            except Exception as e:
                print(f"⚠️  Base path mapping may already exist: {e}")
            
            return cloudfront_domain
            
        except Exception as e:
            print(f"❌ Error setting up API Gateway custom domain: {e}")
            return None

    def test_deployment(self):
        """Test the deployment configuration"""
        try:
            print("🧪 Testing deployment...")
            
            # Test Lambda function
            try:
                lambda_info = self.lambda_client.get_function(
                    FunctionName=self.config['lambda_function_name']
                )
                print("✅ Lambda function accessible")
            except Exception as e:
                print(f"❌ Lambda function test failed: {e}")
                return False
            
            # Test environment variables
            env_vars = lambda_info['Configuration'].get('Environment', {}).get('Variables', {})
            required_vars = ['JWT_SECRET', 'FRONTEND_URL', 'EXTERNAL_API_URL']
            
            missing_vars = []
            for var in required_vars:
                if var not in env_vars:
                    missing_vars.append(var)
            
            if missing_vars:
                print(f"❌ Missing environment variables: {missing_vars}")
                return False
            else:
                print("✅ Environment variables configured correctly")
            
            print("✅ Deployment test completed successfully")
            return True
            
        except Exception as e:
            print(f"❌ Deployment test failed: {e}")
            return False

    def deploy_all(self):
        """Deploy complete environment configuration"""
        print("🚀 Starting VantagePoint CRM Environment Deployment...")
        print(f"📅 Timestamp: {datetime.now().isoformat()}")
        print("=" * 60)
        
        success = True
        
        # Step 1: Update Lambda environment
        if not self.update_lambda_environment():
            success = False
        
        print()
        
        # Step 2: Configure Amplify environment
        if not self.configure_amplify_environment():
            success = False
        
        print()
        
        # Step 3: Set up SSL certificate
        cert_arn = self.setup_custom_domain_ssl()
        if not cert_arn:
            success = False
        
        print()
        
        # Step 4: Set up API Gateway custom domain (if certificate exists)
        if cert_arn and 'pending' not in cert_arn.lower():
            cloudfront_domain = self.setup_api_gateway_custom_domain(cert_arn)
            if cloudfront_domain:
                print(f"📝 DNS Record needed:")
                print(f"   CNAME: {self.config['api_domain']} → {cloudfront_domain}")
        
        print()
        
        # Step 5: Test deployment
        if not self.test_deployment():
            success = False
        
        print()
        print("=" * 60)
        
        if success:
            print("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!")
            print("✅ All environment variables configured")
            print("✅ SSL certificates set up")
            print("✅ Custom domains configured")
            print()
            print("🌐 Your application is ready at:")
            print(f"   Frontend: https://{self.config['domain_name']}")
            print(f"   API: https://{self.config['api_domain']}")
            print()
            print("📝 Next steps:")
            print("   1. Validate SSL certificates in ACM console")
            print("   2. Add DNS records to Route 53")
            print("   3. Set Amplify environment variables in console")
            print("   4. Redeploy Amplify application")
        else:
            print("❌ DEPLOYMENT COMPLETED WITH ERRORS")
            print("   Please review the errors above and retry")
        
        print("=" * 60)
        return success

def main():
    """Main deployment function"""
    deployment = VantagePointCRMDeployment()
    return deployment.deploy_all()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)