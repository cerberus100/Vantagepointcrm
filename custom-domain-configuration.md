# Custom Domain Configuration for VantagePoint CRM

## DNS & Domain Configuration

### Current Domain Setup
- **Frontend**: `vantagepointcrm.com` → AWS Amplify
- **Backend API**: `api.vantagepointcrm.com` → API Gateway → Lambda
- **Direct Amplify URL**: `main.d3eve7po1zc3ec.amplifyapp.com` (working)
- **Old API Gateway**: `blyqk7itsc.execute-api.us-east-1.amazonaws.com/prod`

## Required DNS Records in Route 53

### 1. Frontend Domain (vantagepointcrm.com)
```
Type: A (Alias)
Name: vantagepointcrm.com
Value: main.d3eve7po1zc3ec.amplifyapp.com
TTL: 300

Type: A (Alias) 
Name: www.vantagepointcrm.com
Value: main.d3eve7po1zc3ec.amplifyapp.com
TTL: 300
```

### 2. Backend API Domain (api.vantagepointcrm.com)
```
Type: CNAME
Name: api.vantagepointcrm.com
Value: [CloudFront Distribution Domain]
TTL: 300
```

## AWS Amplify Domain Configuration

### Set Custom Domain in Amplify Console:
1. Go to **AWS Amplify Console**
2. Select app: **vantagepointcrm**  
3. Go to **App settings > Domain management**
4. Click **Add domain**
5. Enter: `vantagepointcrm.com`
6. Add subdomains:
   - `vantagepointcrm.com` → `main` branch
   - `www.vantagepointcrm.com` → `main` branch

### Required SSL Certificate
```bash
# Request SSL certificate for both domains
aws acm request-certificate \
    --domain-name vantagepointcrm.com \
    --subject-alternative-names www.vantagepointcrm.com api.vantagepointcrm.com \
    --validation-method DNS \
    --region us-east-1
```

## API Gateway Custom Domain Setup

### 1. Create Custom Domain for API
```bash
# Get certificate ARN (after validation)
CERT_ARN=$(aws acm list-certificates --query 'CertificateSummaryList[?DomainName==`vantagepointcrm.com`].CertificateArn' --output text)

# Create custom domain in API Gateway
aws apigateway create-domain-name \
    --domain-name api.vantagepointcrm.com \
    --certificate-arn $CERT_ARN \
    --endpoint-configuration types=EDGE \
    --region us-east-1
```

### 2. Create Base Path Mapping
```bash
# Map custom domain to existing API Gateway
aws apigateway create-base-path-mapping \
    --domain-name api.vantagepointcrm.com \
    --rest-api-id blyqk7itsc \
    --stage prod \
    --region us-east-1
```

### 3. Get CloudFront Domain for DNS
```bash
# Get the CloudFront distribution domain
aws apigateway get-domain-name \
    --domain-name api.vantagepointcrm.com \
    --query 'distributionDomainName' \
    --output text
```

## Environment Variables for Domain Configuration

### Amplify Environment Variables
```
CUSTOM_DOMAIN=vantagepointcrm.com
API_DOMAIN=api.vantagepointcrm.com
CERT_ARN=arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID
CLOUDFRONT_DOMAIN=d1a2b3c4d5e6f7.cloudfront.net
```

### Lambda Environment Variables  
```
FRONTEND_URL=https://vantagepointcrm.com
API_BASE_URL=https://api.vantagepointcrm.com
ALLOWED_ORIGINS=https://vantagepointcrm.com,https://www.vantagepointcrm.com,https://main.d3eve7po1zc3ec.amplifyapp.com
```

## Automated Setup Script

Create `setup-custom-domains.py`:
```python
import boto3
import json
import time

def setup_custom_domains():
    """Complete custom domain setup for VantagePoint CRM"""
    
    # AWS clients
    acm = boto3.client('acm', region_name='us-east-1')
    apigateway = boto3.client('apigateway', region_name='us-east-1')
    route53 = boto3.client('route53')
    amplify = boto3.client('amplify', region_name='us-east-1')
    
    domain_name = "vantagepointcrm.com"
    api_domain = "api.vantagepointcrm.com"
    app_id = "d3eve7po1zc3ec"
    api_id = "blyqk7itsc"
    
    try:
        print("🔒 Step 1: Request SSL Certificate...")
        
        # Request certificate
        cert_response = acm.request_certificate(
            DomainName=domain_name,
            SubjectAlternativeNames=[f"www.{domain_name}", api_domain],
            ValidationMethod='DNS'
        )
        
        cert_arn = cert_response['CertificateArn']
        print(f"✅ Certificate requested: {cert_arn}")
        
        print("⏳ Waiting for certificate validation...")
        print("🔧 Please validate the certificate in ACM console")
        
        # Note: Manual validation required here
        input("Press Enter after certificate is validated...")
        
        print("🌐 Step 2: Setup API Gateway Custom Domain...")
        
        # Create custom domain
        domain_response = apigateway.create_domain_name(
            domainName=api_domain,
            certificateArn=cert_arn,
            endpointConfiguration={'types': ['EDGE']}
        )
        
        cloudfront_domain = domain_response['distributionDomainName']
        print(f"✅ API custom domain created: {api_domain}")
        print(f"📍 CloudFront domain: {cloudfront_domain}")
        
        # Create base path mapping
        apigateway.create_base_path_mapping(
            domainName=api_domain,
            restApiId=api_id,
            stage='prod'
        )
        
        print("✅ Base path mapping created")
        
        print("📝 Step 3: DNS Records Configuration")
        print(f"Add these DNS records to Route 53:")
        print(f"CNAME: {api_domain} → {cloudfront_domain}")
        
        print("🚀 Step 4: Setup Amplify Custom Domain...")
        
        # Add custom domain to Amplify
        try:
            amplify.create_domain_association(
                appId=app_id,
                domainName=domain_name,
                subDomainSettings=[
                    {
                        'prefix': '',
                        'branchName': 'main'
                    },
                    {
                        'prefix': 'www',
                        'branchName': 'main'
                    }
                ]
            )
            print(f"✅ Amplify domain association created for {domain_name}")
        except Exception as e:
            print(f"⚠️ Amplify domain may already exist: {e}")
        
        print("\n" + "=" * 60)
        print("🎉 CUSTOM DOMAIN SETUP COMPLETE!")
        print(f"✅ Frontend: https://{domain_name}")
        print(f"✅ API: https://{api_domain}")
        print("✅ SSL certificates configured")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error during setup: {e}")
        return False

if __name__ == "__main__":
    setup_custom_domains()
```

## Testing Domain Configuration

### 1. Test Frontend Domain
```bash
# Should redirect to Amplify app
curl -I https://vantagepointcrm.com

# Expected: 200 OK or 301/302 redirect
```

### 2. Test API Domain
```bash
# Should hit Lambda function
curl https://api.vantagepointcrm.com/health

# Expected response:
{
  "status": "healthy",
  "service": "VantagePoint CRM API",
  "version": "2.0.0"
}
```

### 3. Test CORS
```bash
# Test CORS headers from frontend domain
curl -H "Origin: https://vantagepointcrm.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     https://api.vantagepointcrm.com/api/v1/auth/login
```

## Troubleshooting

### Common Issues:

1. **Certificate Validation Fails**
   - Check Route 53 hosted zone exists
   - Verify DNS validation records are created
   - Wait up to 30 minutes for validation

2. **Domain Not Resolving**
   - Check DNS propagation (up to 48 hours)
   - Verify CNAME/A records are correct
   - Test with `dig` or `nslookup`

3. **SSL Certificate Errors**
   - Ensure certificate is in `us-east-1` region
   - Verify certificate covers all domains
   - Check certificate status in ACM

4. **API Gateway 403 Errors**
   - Verify base path mapping exists
   - Check API Gateway deployment status
   - Confirm Lambda permissions

### DNS Propagation Check
```bash
# Check if domains resolve correctly
dig vantagepointcrm.com
dig api.vantagepointcrm.com

# Check from different DNS servers
dig @8.8.8.8 vantagepointcrm.com
dig @1.1.1.1 api.vantagepointcrm.com
```