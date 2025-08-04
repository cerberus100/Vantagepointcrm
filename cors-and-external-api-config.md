# CORS & External API Configuration

## CORS (Cross-Origin Resource Sharing) Configuration

### Required CORS Environment Variables

#### Lambda Environment Variables
```
# CORS Origins - All domains that can access the API
ALLOWED_ORIGINS=https://vantagepointcrm.com,https://www.vantagepointcrm.com,https://main.d3eve7po1zc3ec.amplifyapp.com

# CORS Methods
ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS,PATCH

# CORS Headers
ALLOWED_HEADERS=Content-Type,Authorization,X-Requested-With,Accept,Origin,Access-Control-Request-Method,Access-Control-Request-Headers

# CORS Credentials
ALLOW_CREDENTIALS=true

# CORS Max Age (cache preflight responses)
CORS_MAX_AGE=86400

# Frontend URL for redirects
FRONTEND_URL=https://vantagepointcrm.com
```

### CORS Implementation in Lambda Function

Update your Lambda function to use environment variables:

```python
import os

def create_response(status_code, body, cors_origin=None):
    """Create HTTP response with proper CORS headers"""
    
    # Get allowed origins from environment
    allowed_origins = os.environ.get('ALLOWED_ORIGINS', 'https://vantagepointcrm.com').split(',')
    
    # Determine CORS origin
    if cors_origin and cors_origin in allowed_origins:
        origin = cors_origin
    else:
        origin = allowed_origins[0]  # Default to first allowed origin
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': os.environ.get('ALLOWED_METHODS', 'GET,POST,PUT,DELETE,OPTIONS'),
        'Access-Control-Allow-Headers': os.environ.get('ALLOWED_HEADERS', 'Content-Type,Authorization,X-Requested-With'),
        'Access-Control-Allow-Credentials': os.environ.get('ALLOW_CREDENTIALS', 'true'),
        'Access-Control-Max-Age': os.environ.get('CORS_MAX_AGE', '86400')
    }
    
    return {
        'statusCode': status_code,
        'headers': headers,
        'body': json.dumps(body)
    }

def handle_options_request(event):
    """Handle CORS preflight OPTIONS requests"""
    
    origin = event.get('headers', {}).get('origin') or event.get('headers', {}).get('Origin')
    
    return create_response(200, {
        "message": "CORS preflight successful"
    }, cors_origin=origin)
```

## External API Integration Configuration

### Current External API Details
- **URL**: `https://nwabj0qrf1.execute-api.us-east-1.amazonaws.com/Prod/createUserExternal`
- **Vendor Token**: `Nb9sQCZnrAxAxS4KrysMLzRUQ2HN21hbZmpshgZYb1cT7sEPdJkNEE_MhfB59pDt`
- **Purpose**: Send lead documents to external company

### External API Environment Variables
```
# External API Configuration
EXTERNAL_API_URL=https://nwabj0qrf1.execute-api.us-east-1.amazonaws.com/Prod/createUserExternal
VENDOR_TOKEN=Nb9sQCZnrAxAxS4KrysMLzRUQ2HN21hbZmpshgZYb1cT7sEPdJkNEE_MhfB59pDt
DEFAULT_SALES_REP=VantagePoint Sales Team

# External API Settings
EXTERNAL_API_TIMEOUT=30
EXTERNAL_API_RETRIES=3
EXTERNAL_API_ENABLED=true

# Default values for missing lead data
DEFAULT_FACILITY_TYPE=Physician Office (11)
DEFAULT_BAA_SIGNED=true
DEFAULT_PA_SIGNED=true

# Email settings for leads without email
AUTO_GENERATE_EMAILS=true
EMAIL_DOMAIN_SUFFIX=@vantagepointcrm.com
```

### External API Implementation Updates

Update your send_docs function to use environment variables:

```python
import os

# External API Configuration from environment
EXTERNAL_API_CONFIG = {
    "url": os.environ.get('EXTERNAL_API_URL', 'https://nwabj0qrf1.execute-api.us-east-1.amazonaws.com/Prod/createUserExternal'),
    "vendor_token": os.environ.get('VENDOR_TOKEN', 'Nb9sQCZnrAxAxS4KrysMLzRUQ2HN21hbZmpshgZYb1cT7sEPdJkNEE_MhfB59pDt'),
    "default_sales_rep": os.environ.get('DEFAULT_SALES_REP', 'VantagePoint Sales Team'),
    "timeout": int(os.environ.get('EXTERNAL_API_TIMEOUT', '30')),
    "retries": int(os.environ.get('EXTERNAL_API_RETRIES', '3')),
    "enabled": os.environ.get('EXTERNAL_API_ENABLED', 'true').lower() == 'true'
}

def send_docs_to_external_api(lead_data, user_info):
    """Send lead data to external createUserExternal API"""
    
    if not EXTERNAL_API_CONFIG['enabled']:
        return {
            "success": False,
            "message": "External API integration is disabled",
            "error": "EXTERNAL_API_DISABLED"
        }
    
    try:
        # Generate email if missing
        if not lead_data.get('email'):
            if os.environ.get('AUTO_GENERATE_EMAILS', 'true').lower() == 'true':
                practice_name = lead_data.get('practice_name', 'practice')
                email_domain = os.environ.get('EMAIL_DOMAIN_SUFFIX', '@vantagepointcrm.com')
                lead_data['email'] = f"{practice_name.lower().replace(' ', '.')}{email_domain}"
        
        # Map our CRM data to their API format
        payload = {
            "email": lead_data.get('email', f"contact{email_domain}"),
            "baaSigned": os.environ.get('DEFAULT_BAA_SIGNED', 'true').lower() == 'true',
            "paSigned": os.environ.get('DEFAULT_PA_SIGNED', 'true').lower() == 'true',
            "facilityName": lead_data['practice_name'],
            "selectedFacility": os.environ.get('DEFAULT_FACILITY_TYPE', 'Physician Office (11)'),
            "facilityAddress": {
                "street": lead_data.get('address', ''),
                "city": lead_data.get('city', ''),
                "state": lead_data.get('state', ''),
                "zip": lead_data.get('zip_code', ''),
                "npi": lead_data.get('npi', ''),
                "fax": lead_data.get('fax', lead_data.get('practice_phone', ''))
            },
            "facilityNPI": lead_data.get('npi', ''),
            "facilityTIN": lead_data.get('ein_tin', ''),
            "facilityPTAN": lead_data.get('ptan', ''),
            "shippingContact": lead_data.get('owner_name', ''),
            "primaryContactName": lead_data.get('owner_name', ''),
            "primaryContactEmail": lead_data.get('email', f"contact{email_domain}"),
            "primaryContactPhone": lead_data.get('owner_phone', lead_data.get('practice_phone', '')),
            "shippingAddresses": [
                {
                    "street": lead_data.get('address', ''),
                    "city": lead_data.get('city', ''),
                    "state": lead_data.get('state', ''),
                    "zip": lead_data.get('zip_code', '')
                }
            ],
            "salesRepresentative": user_info.get('full_name', EXTERNAL_API_CONFIG['default_sales_rep']),
            "physicianInfo": {
                "physicianFirstName": lead_data.get('owner_name', '').split()[0] if lead_data.get('owner_name') else '',
                "physicianLastName": ' '.join(lead_data.get('owner_name', '').split()[1:]) if len(lead_data.get('owner_name', '').split()) > 1 else '',
                "specialty": lead_data.get('specialty', ''),
                "npi": lead_data.get('npi', ''),
                "street": lead_data.get('address', ''),
                "city": lead_data.get('city', ''),
                "state": lead_data.get('state', ''),
                "zip": lead_data.get('zip_code', ''),
                "contactName": lead_data.get('owner_name', ''),
                "fax": lead_data.get('fax', lead_data.get('practice_phone', '')),
                "phone": lead_data.get('owner_phone', lead_data.get('practice_phone', ''))
            },
            "additionalPhysicians": []
        }
        
        # Create HTTP client
        http = urllib3.PoolManager()
        
        # Prepare headers
        headers = {
            "Content-Type": "application/json",
            "x-vendor-token": EXTERNAL_API_CONFIG['vendor_token']
        }
        
        # Make the API call with retries
        for attempt in range(EXTERNAL_API_CONFIG['retries']):
            try:
                response = http.request(
                    'POST',
                    EXTERNAL_API_CONFIG['url'],
                    body=json.dumps(payload),
                    headers=headers,
                    timeout=EXTERNAL_API_CONFIG['timeout']
                )
                
                if response.status == 200:
                    result = json.loads(response.data.decode('utf-8'))
                    if result.get('success'):
                        return {
                            "success": True,
                            "user_id": result.get('userId'),
                            "message": "Documents sent successfully to external company",
                            "external_response": result
                        }
                    else:
                        return {
                            "success": False,
                            "message": f"External API returned error: {result.get('message', 'Unknown error')}",
                            "external_response": result
                        }
                else:
                    if attempt < EXTERNAL_API_CONFIG['retries'] - 1:
                        continue
                    return {
                        "success": False,
                        "message": f"External API returned status {response.status}",
                        "status_code": response.status
                    }
                    
            except Exception as e:
                if attempt < EXTERNAL_API_CONFIG['retries'] - 1:
                    continue
                return {
                    "success": False,
                    "message": f"Error calling external API: {str(e)}",
                    "error": str(e)
                }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Error preparing external API call: {str(e)}",
            "error": str(e)
        }
```

## Complete Environment Variables List

### Combined Environment Variables for Lambda
```bash
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
ALLOWED_ORIGINS=https://vantagepointcrm.com,https://www.vantagepointcrm.com,https://main.d3eve7po1zc3ec.amplifyapp.com
ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS,PATCH
ALLOWED_HEADERS=Content-Type,Authorization,X-Requested-With,Accept,Origin,Access-Control-Request-Method,Access-Control-Request-Headers
ALLOW_CREDENTIALS=true
CORS_MAX_AGE=86400

# External API Integration
EXTERNAL_API_URL=https://nwabj0qrf1.execute-api.us-east-1.amazonaws.com/Prod/createUserExternal
VENDOR_TOKEN=Nb9sQCZnrAxAxS4KrysMLzRUQ2HN21hbZmpshgZYb1cT7sEPdJkNEE_MhfB59pDt
DEFAULT_SALES_REP=VantagePoint Sales Team
EXTERNAL_API_TIMEOUT=30
EXTERNAL_API_RETRIES=3
EXTERNAL_API_ENABLED=true

# Default values for leads
DEFAULT_FACILITY_TYPE=Physician Office (11)
DEFAULT_BAA_SIGNED=true
DEFAULT_PA_SIGNED=true
AUTO_GENERATE_EMAILS=true
EMAIL_DOMAIN_SUFFIX=@vantagepointcrm.com

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

## Testing CORS Configuration

### Test CORS from Browser Console
```javascript
// Test CORS from vantagepointcrm.com
fetch('https://api.vantagepointcrm.com/health', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
})
.then(response => response.json())
.then(data => console.log('CORS test successful:', data))
.catch(error => console.error('CORS test failed:', error));
```

### Test CORS with cURL
```bash
# Test preflight request
curl -H "Origin: https://vantagepointcrm.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     https://api.vantagepointcrm.com/api/v1/auth/login

# Expected headers in response:
# Access-Control-Allow-Origin: https://vantagepointcrm.com
# Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS,PATCH
# Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With
```

## Testing External API Integration

### Test Send Docs Endpoint
```bash
# Login first to get token
TOKEN=$(curl -X POST https://api.vantagepointcrm.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.access_token')

# Test send docs for a lead
curl -X POST https://api.vantagepointcrm.com/api/v1/leads/1/send-docs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Expected response:
{
  "success": true,
  "message": "Documents sent successfully to external company",
  "user_id": "generated-user-id"
}
```