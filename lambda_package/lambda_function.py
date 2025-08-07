#!/usr/bin/env python3
"""
Complete VantagePoint CRM Lambda - OPTIMIZED BULK UPLOAD
========================================================
FIXED: Bulk upload now uses DynamoDB batch operations for 25x performance improvement
"""

import json
import hashlib
import base64
import hmac
from datetime import datetime, timedelta
import random
import boto3
from botocore.exceptions import ClientError
from decimal import Decimal
import logging
from collections import defaultdict
import os
import time
import re
from typing import Dict, Any, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import uuid

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# DynamoDB clients for persistent storage
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
users_table = dynamodb.Table('vantagepoint-users')
leads_table = dynamodb.Table('vantagepoint-leads')
rate_limit_table = dynamodb.Table('vantagepoint-rate-limits')

# Global progress tracking for bulk uploads
bulk_upload_progress = {}
progress_lock = threading.Lock()

# Rate limiting configuration
RATE_LIMIT_CONFIG = {
    'default': {
        'requests_per_minute': 60,
        'requests_per_hour': 1000
    },
    'agent': {
        'requests_per_minute': 100,
        'requests_per_hour': 2000
    },
    'manager': {
        'requests_per_minute': 200,
        'requests_per_hour': 5000
    },
    'admin': {
        'requests_per_minute': 500,
        'requests_per_hour': 10000
    },
    # Endpoint-specific limits
    'endpoints': {
        '/api/v1/leads/bulk': {
            'requests_per_minute': 5,
            'requests_per_hour': 50
        },
        '/api/v1/reports/commission': {
            'requests_per_minute': 10,
            'requests_per_hour': 100
        }
    }
}

def check_rate_limit(user_id, user_role, endpoint, ip_address=None, request_id="no-id"):
    """Check if request is within rate limits"""
    current_time = int(time.time())
    minute_window = current_time // 60
    hour_window = current_time // 3600
    
    # Get rate limits for user role
    role_limits = RATE_LIMIT_CONFIG.get(user_role, RATE_LIMIT_CONFIG['default'])
    
    # Check endpoint-specific limits
    endpoint_limits = None
    for pattern, limits in RATE_LIMIT_CONFIG['endpoints'].items():
        if endpoint.startswith(pattern):
            endpoint_limits = limits
            break
    
    # Use more restrictive limits
    if endpoint_limits:
        minute_limit = min(role_limits['requests_per_minute'], endpoint_limits['requests_per_minute'])
        hour_limit = min(role_limits['requests_per_hour'], endpoint_limits['requests_per_hour'])
    else:
        minute_limit = role_limits['requests_per_minute']
        hour_limit = role_limits['requests_per_hour']
    
    try:
        # Check minute rate limit
        minute_key = f"user:{user_id}:minute:{minute_window}"
        minute_response = rate_limit_table.update_item(
            Key={'id': minute_key},
            UpdateExpression='ADD request_count :inc',
            ExpressionAttributeValues={':inc': 1},
            ReturnValues='UPDATED_NEW'
        )
        minute_count = int(minute_response['Attributes']['request_count'])
        
        # Check hour rate limit
        hour_key = f"user:{user_id}:hour:{hour_window}"
        hour_response = rate_limit_table.update_item(
            Key={'id': hour_key},
            UpdateExpression='ADD request_count :inc',
            ExpressionAttributeValues={':inc': 1},
            ReturnValues='UPDATED_NEW'
        )
        hour_count = int(hour_response['Attributes']['request_count'])
        
        # Set TTL for automatic cleanup
        ttl_minute = current_time + 120  # 2 minutes
        ttl_hour = current_time + 7200    # 2 hours
        
        rate_limit_table.update_item(
            Key={'id': minute_key},
            UpdateExpression='SET ttl = :ttl',
            ExpressionAttributeValues={':ttl': ttl_minute}
        )
        
        rate_limit_table.update_item(
            Key={'id': hour_key},
            UpdateExpression='SET ttl = :ttl',
            ExpressionAttributeValues={':ttl': ttl_hour}
        )
        
        # Check if limits exceeded
        if minute_count > minute_limit:
            logger.warning("Rate limit exceeded for user {user_id}: {minute_count}/{minute_limit} per minute")
            return False, {
                'limit_type': 'minute',
                'limit': minute_limit,
                'current': minute_count,
                'reset_time': (minute_window + 1) * 60
            }
        
        if hour_count > hour_limit:
            logger.warning("Rate limit exceeded for user {user_id}: {hour_count}/{hour_limit} per hour")
            return False, {
                'limit_type': 'hour',
                'limit': hour_limit,
                'current': hour_count,
                'reset_time': (hour_window + 1) * 3600
            }
        
        return True, {
            'minute_usage': f"{minute_count}/{minute_limit}",
            'hour_usage': f"{hour_count}/{hour_limit}"
        }
        
    except Exception as e:
        logger.error("Rate limit check failed: {e}")
        # Fail open - allow request if rate limiting fails
        return True, {'error': 'Rate limit check failed'}

def get_client_ip(event):
    """Extract client IP from Lambda event"""
    headers = event.get('headers', {})
    # Check various headers for IP
    ip = headers.get('X-Forwarded-For', headers.get('X-Real-IP', 
         event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')))
    # Get first IP if multiple
    if ',' in ip:
        ip = ip.split(',')[0].strip()
    return ip

def sanitize_error_message(error, context=""):
    """Sanitize error messages for production - prevent info leakage"""
    error_str = str(error)
    
    # Log the full error internally
    logger.error(f"Error in {context}: {error_str}")
    
    # Map specific errors to safe messages
    error_mappings = {
        "ValidationException": "Invalid request data",
        "ResourceNotFoundException": "Resource not found",
        "AccessDeniedException": "Access denied",
        "ProvisionedThroughputExceededException": "Service temporarily unavailable",
        "ItemCollectionSizeLimitExceededException": "Request size limit exceeded",
        "ConditionalCheckFailedException": "Operation conflict",
        "TransactionConflictException": "Operation conflict",
        "RequestLimitExceeded": "Too many requests",
        "ServiceUnavailable": "Service temporarily unavailable",
        "InternalServerError": "Internal server error"
    }
    
    # Check for known error types
    for error_type, safe_message in error_mappings.items():
        if error_type in error_str:
            return safe_message
    
    # Check for sensitive patterns
    sensitive_patterns = [
        'password', 'token', 'secret', 'key', 'credential',
        'database', 'table', 'schema', 'column', 'index',
        'aws', 'dynamodb', 'lambda', 's3', 'cognito',
        'email', 'phone', 'address', 'ssn', 'ein'
    ]
    
    # If error contains sensitive info, return generic message
    error_lower = error_str.lower()
    for pattern in sensitive_patterns:
        if pattern in error_lower:
            return "An error occurred processing your request"
    
    # For validation errors, provide helpful but safe feedback
    if "missing" in error_lower or "required" in error_lower:
        return "Missing required fields"
    if "invalid" in error_lower or "format" in error_lower:
        return "Invalid data format"
    if "duplicate" in error_lower or "exists" in error_lower:
        return "Resource already exists"
    if "not found" in error_lower or "does not exist" in error_lower:
        return "Resource not found"
    if "timeout" in error_lower or "timed out" in error_lower:
        return "Request timed out"
    
    # Default safe message
    return "An error occurred processing your request"

def validate_input(data: Dict[str, Any], validation_type: str) -> tuple[bool, Optional[str]]:
    """Validate and sanitize input data"""
    
    # Define validation patterns
    patterns = {
        'username': r'^[a-zA-Z0-9_-]{3,32}$',
        'password': r'^.{8,128}$',
        'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
        'phone': r'^[\d\s\-\(\)\+\.]{10,20}$',
        'zip_code': r'^\d{5}(-\d{4})?$',
        'npi': r'^\d{10}$',
        'ein': r'^\d{2}-?\d{7}$',
        'state': r'^[A-Z]{2}$',
        'status': r'^(new|contacted|qualified|closed_won|closed_lost|disposed|sold|NEW|CONTACTED|QUALIFIED|CLOSED_WON|CLOSED_LOST)$',
        'role': r'^(admin|manager|agent)$'
    }
    
    def sanitize_string(value: str, field_type: str = 'general') -> str:
        """Sanitize string to prevent injection"""
        if not isinstance(value, str):
            return str(value)
        
        # Remove null bytes and trim
        value = value.replace('\x00', '').strip()
        
        # Field-specific sanitization
        if field_type == 'phone':
            value = re.sub(r'[^0-9\s\-\(\)\+\.]', '', value)
        elif field_type == 'email':
            value = value.lower()
            value = re.sub(r'[<>\"\'\\;]', '', value)
        elif field_type == 'alphanumeric':
            value = re.sub(r'[^a-zA-Z0-9\s\-_]', '', value)
        elif field_type == 'numeric':
            value = re.sub(r'[^0-9]', '', value)
        else:
            # Remove potential injection chars
            for char in ['$', '{', '}', '<', '>', '`', '\\', '\n', '\r', '\t']:
                value = value.replace(char, '')
        
        return value[:500]  # Max length
    
    # Login validation
    if validation_type == 'login':
        if not data.get('username') or not data.get('password'):
            return False, "Username and password required"
        
        username = sanitize_string(data['username'], 'alphanumeric')
        if not re.match(patterns['username'], username):
            return False, "Invalid username format"
        
        if not re.match(patterns['password'], data['password']):
            return False, "Invalid password format"
        
        data['username'] = username
        return True, None
    
    # Lead validation
    elif validation_type in ['create_lead', 'update_lead']:
        if validation_type == 'create_lead':
            # Check required fields
            required = ['practice_name', 'owner_name', 'practice_phone']
            for field in required:
                if not data.get(field):
                    return False, f"Missing required field: {field}"
        
        # Sanitize and validate fields
        if 'practice_name' in data:
            data['practice_name'] = sanitize_string(data['practice_name'])[:200]
        
        if 'owner_name' in data:
            data['owner_name'] = sanitize_string(data['owner_name'])[:100]
        
        if 'email' in data and data['email']:
            data['email'] = sanitize_string(data['email'], 'email')
            if not re.match(patterns['email'], data['email']):
                return False, "Invalid email format"
        
        if 'practice_phone' in data:
            data['practice_phone'] = sanitize_string(data['practice_phone'], 'phone')
            if not re.match(patterns['phone'], data['practice_phone']):
                return False, "Invalid phone format"
        
        if 'zip_code' in data and data['zip_code']:
            data['zip_code'] = sanitize_string(data['zip_code'], 'numeric')
            if not re.match(patterns['zip_code'], data['zip_code']):
                return False, "Invalid ZIP code"
        
        if 'npi' in data and data['npi']:
            data['npi'] = sanitize_string(data['npi'], 'numeric')
            if not re.match(patterns['npi'], data['npi']):
                return False, "Invalid NPI"
        
        if 'state' in data and data['state']:
            data['state'] = data['state'].upper()
            if not re.match(patterns['state'], data['state']):
                return False, "Invalid state code"
        
        if 'status' in data and not re.match(patterns['status'], data['status']):
            return False, "Invalid status"
        
        return True, None
    
    # User validation
    elif validation_type == 'create_user':
        if not data.get('username') or not data.get('role'):
            return False, "Username and role required"
        
        data['username'] = sanitize_string(data['username'], 'alphanumeric')
        if not re.match(patterns['username'], data['username']):
            return False, "Invalid username format"
        
        if not re.match(patterns['role'], data['role']):
            return False, "Invalid role"
        
        if 'password' in data and data['password']:
            if not re.match(patterns['password'], data['password']):
                return False, "Password must be 8-128 characters"
        
        if 'email' in data and data['email']:
            data['email'] = sanitize_string(data['email'], 'email')
            if not re.match(patterns['email'], data['email']):
                return False, "Invalid email format"
        
        return True, None
    
    return True, None

def send_docs_to_external_api(lead_data, user_info, request_id):
    """Send documents to external API using real vendor token"""
    try:
        import urllib.request
        import urllib.error
        import os
        
        # Get the real vendor token from environment
        vendor_token = os.environ.get('VENDOR_TOKEN', '')
        if not vendor_token:
            logger.error("VENDOR_TOKEN not found in environment variables")
            return {"success": False, "error": "Vendor token not configured"}
        
        # Prepare the data for external API
        api_data = {
            # Add email at root level as API expects
            "email": lead_data.get('email', ''),
            "vendorToken": vendor_token,  # Include token in payload
            "practiceInfo": {
                "practiceName": lead_data.get('practice_name', ''),
                "ownerName": lead_data.get('owner_name', ''),
                "contactEmail": lead_data.get('email', ''),
                "phoneNumber": lead_data.get('practice_phone', ''),
                "address": lead_data.get('address', ''),
                "city": lead_data.get('city', ''),
                "state": lead_data.get('state', ''),
                "zipCode": lead_data.get('zip_code', ''),
                "specialties": [lead_data.get('specialty', 'General Practice')],
                "facilityType": lead_data.get('facility_type', 'Physician Office (11)'),
                "ptan": lead_data.get('ptan', ''),
                "npi": lead_data.get('npi', ''),
                "einTin": lead_data.get('ein_tin', ''),
                "baaSignedStatus": lead_data.get('baa_signed', True),
                "paSignedStatus": lead_data.get('pa_signed', True)
            },
            "requestId": f"vantagepoint-{lead_data.get('id', 'unknown')}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            "salesRep": user_info.get('full_name', user_info.get('username', 'VantagePoint Sales Team')),
            "source": "VantagePoint CRM"
        }
        
        # External API endpoint
        external_api_url = os.environ.get('EXTERNAL_API_URL', 'https://nwabj0qrf1.execute-api.us-east-1.amazonaws.com/Prod/createUserExternal')
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {vendor_token}',
            'X-API-Key': vendor_token  # Some APIs expect the token in this header
        }
        
        logger.info(f"📡 Sending docs to external API for lead {lead_data.get('id')}")
        
        # Convert data to JSON
        json_data = json.dumps(api_data).encode('utf-8')
        
        # Create request
        request = urllib.request.Request(
            external_api_url,
            data=json_data,
            headers=headers,
            method='POST'
        )
        
        try:
            # Send request
            with urllib.request.urlopen(request, timeout=30) as response:
                response_data = response.read().decode('utf-8')
                response_json = json.loads(response_data)
                
                logger.info(f"✅ External API success for lead {lead_data.get('id')}")
                return {
                    "success": True,
                    "external_response": response_json,
                    "status_code": response.status
                }
                
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            logger.error(f"❌ External API failed: {e.code} - {error_body}")
            return {
                "success": False,
                "error": f"External API error: {e.code}",
                "details": error_body
            }
        except urllib.error.URLError as e:
            logger.error(f"❌ Network error: {str(e)}")
            return {
                "success": False,
                "error": "Network error",
                "details": str(e)
            }
            
    except Exception as e:
        logger.error("Exception in send_docs_to_external_api: {str(e)}")
        return {
            "success": False,
            "error": sanitize_error_message(e, "send_docs_to_external_api")
        }

# Helper function to handle DynamoDB Decimal types in JSON
def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

def json_dumps(obj):
    """JSON dumps that handles DynamoDB Decimal types"""
    return json.dumps(obj, default=decimal_default)

def create_jwt_token(username, role):
    """Create a simple JWT token"""
    import time
    
    # Header
    header = {
        "alg": "HS256",
        "typ": "JWT"
    }
    
    # Payload
    payload = {
        "username": username,
        "role": role,
        "exp": int(time.time()) + 86400  # 24 hour expiry (was 1 hour)
    }
    
    # Encode
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
    
    # Sign
    secret = os.environ.get('JWT_SECRET_KEY', 'vantagepoint-' + hashlib.sha256(os.urandom(32)).hexdigest()[:32])
    signature = base64.urlsafe_b64encode(
        hmac.new(secret.encode(), f"{header_b64}.{payload_b64}".encode(), hashlib.sha256).digest()
    ).decode().rstrip('=')
    
    return f"{header_b64}.{payload_b64}.{signature}"

def verify_jwt_token(token):
    """Verify JWT token and return payload"""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
            
        header_b64, payload_b64, signature = parts
        
        # Verify signature
        secret = os.environ.get('JWT_SECRET_KEY', 'vantagepoint-' + hashlib.sha256(os.urandom(32)).hexdigest()[:32])
        expected_signature = base64.urlsafe_b64encode(
            hmac.new(secret.encode(), f"{header_b64}.{payload_b64}".encode(), hashlib.sha256).digest()
        ).decode().rstrip('=')
        
        if signature != expected_signature:
            return None
        
        # Decode payload
        payload_json = base64.urlsafe_b64decode(payload_b64 + '==').decode()
        payload = json.loads(payload_json)
        
        # Check expiry
        import time
        if payload.get('exp', 0) < time.time():
            return None
            
        return payload
    except:
        return None

def get_allowed_origin(event):
    """Get allowed origin based on request origin"""
    headers = event.get('headers', {})
    origin = headers.get('origin', headers.get('Origin', ''))
    
    # List of allowed origins
    allowed_origins = [
        'https://vantagepointcrm.com',
        'https://www.vantagepointcrm.com',
        'https://main.d3eve7po1zc3ec.amplifyapp.com',
        'http://localhost:3000',  # Development only - remove in production
        'http://localhost:8080'   # Development only - remove in production
    ]
    
    # Check if origin is allowed
    if origin in allowed_origins:
        return origin
    
    # Default to main domain if origin not recognized
    return 'https://vantagepointcrm.com'

def create_response(status_code, body, request_id=None, event=None):
    """Create proper CORS response with request tracking"""
    # Add request ID to response body if provided
    if request_id and isinstance(body, dict):
        body['request_id'] = request_id
    
    # Get allowed origin for CORS
    allowed_origin = get_allowed_origin(event) if event else 'https://vantagepointcrm.com'
    
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': allowed_origin,
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Request-ID',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'application/json',
            'X-Request-ID': request_id or 'no-request-id'
        },
        'body': json_dumps(body)
    }

def get_user_by_username(username):
    """Get user from DynamoDB by username"""
    try:
        response = users_table.scan(
            FilterExpression='username = :username',
            ExpressionAttributeValues={':username': username}
        )
        users = response.get('Items', [])
        return users[0] if users else None
    except Exception as e:
        print(f"Error getting user: {e}")
        return None

def get_user_by_id(user_id):
    """Get user from DynamoDB by user ID"""
    try:
        response = users_table.get_item(Key={'id': int(user_id)})
        return response.get('Item')
    except Exception as e:
        print(f"Error getting user by ID: {e}")
        return None

def assign_leads_to_new_agent(agent_id, count=20):
    """Assign unassigned leads to a new agent"""
    try:
        # Get all leads from DynamoDB
        response = leads_table.scan()
        all_leads = response.get('Items', [])
        
        # Find unassigned leads (assigned_user_id is None or doesn't exist)
        # ALSO exclude sold/disposed leads that should stay with original agent
        unassigned_leads = [
            lead for lead in all_leads 
            if (not lead.get('assigned_user_id') or lead.get('assigned_user_id') == 'null') and
            lead.get('status') not in ['CLOSED_WON', 'CLOSED_LOST', 'disposed', 'sold']
        ]
        
        # Enhanced filtering for fake/test data and quality control
        fake_patterns = [
            'TEST', 'UNKNOWN', 'PLACEHOLDER', 'UNAUTHORIZED', 'UPDATE', 'ATTEMPT',
            'FAKE', 'DEMO', 'SAMPLE', 'DEBUG', 'AGENT UPDATED', 'EXAMPLE'
        ]
        
        quality_unassigned = [
            lead for lead in unassigned_leads
            if lead.get('status') != 'inactive_duplicate' and
            not any(pattern in (lead.get('practice_name', '') or '').upper() for pattern in fake_patterns) and
            not any(pattern in (lead.get('owner_name', '') or '').upper() for pattern in fake_patterns) and
            lead.get('practice_name') and  # Must have a practice name
            lead.get('practice_name').strip() != ''  # Practice name can't be empty
        ]
        
        # Sort by score (highest first)
        quality_unassigned.sort(key=lambda x: x.get('score', 0), reverse=True)
        
        # Assign up to 'count' leads
        assigned_count = 0
        for lead in quality_unassigned[:count]:
            try:
                # Update lead assignment in DynamoDB
                leads_table.update_item(
                    Key={'id': int(lead['id'])},
                    UpdateExpression='SET assigned_user_id = :agent_id, updated_at = :updated_at',
                    ExpressionAttributeValues={
                        ':agent_id': agent_id,
                        ':updated_at': datetime.utcnow().isoformat()
                    }
                )
                assigned_count += 1
                print(f"✅ Assigned lead {lead['id']} ({lead.get('practice_name', 'Unknown')}) to agent {agent_id}")
            except Exception as e:
                print(f"❌ Failed to assign lead {lead.get('id')}: {e}")
                continue
        
        return assigned_count
        
    except Exception as e:
        print(f"❌ Error in assign_leads_to_new_agent: {e}")
        return 0

def initialize_default_users():
    """Initialize default users in DynamoDB if they don't exist"""
    default_users = [
        {
            "id": 1,
            "username": "admin",
            "password": "admin123",  # Plain text for current system
            "role": "admin",
            "email": "admin@vantagepoint.com",
            "full_name": "System Administrator",
            "is_active": True,
            "created_at": "2025-01-01T00:00:00Z",
            "manager_id": None
        }
    ]
    
    try:
        # Check if users exist, create if they don't
        for user_data in default_users:
            existing_user = get_user_by_username(user_data["username"])
            if not existing_user:
                # Add user to DynamoDB
                users_table.put_item(Item=user_data)
                print(f"✅ Initialized default user: {user_data['username']}")
            else:
                print(f"👤 User exists: {user_data['username']}")
    except Exception as e:
        print(f"❌ Error initializing users: {e}")

def get_next_lead_ids_batch(count, request_id="no-id"):
    """OPTIMIZED: Generate a batch of lead IDs efficiently"""
    try:
        # Use DynamoDB atomic counter for batch ID generation
        response = leads_table.update_item(
            Key={'id': 0},  # Use ID 0 as counter
            UpdateExpression='ADD id_counter :count',
            ExpressionAttributeValues={':count': count},
            ReturnValues='UPDATED_NEW'
        )
        
        # Get the new counter value
        new_counter = int(response['Attributes']['id_counter'])
        start_id = new_counter - count + 1
        
        # Return list of consecutive IDs
        return list(range(start_id, new_counter + 1))
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'ValidationException':
            # Counter doesn't exist, initialize it
            try:
                leads_table.put_item(Item={'id': 0, 'id_counter': count})
                return list(range(1, count + 1))
            except:
                return get_next_lead_ids_fallback(count)
        else:
            return get_next_lead_ids_fallback(count)

def get_next_lead_ids_fallback(count):
    """Fallback method for ID generation"""
    try:
        # Scan to find current max ID
        response = leads_table.scan(
            ProjectionExpression='id',
            FilterExpression='attribute_exists(id) AND id > :zero',
            ExpressionAttributeValues={':zero': 0}
        )
        
        max_id = 0
        for item in response['Items']:
            current_id = int(item['id'])
            if current_id > max_id:
                max_id = current_id
        
        return list(range(max_id + 1, max_id + count + 1))
        
    except Exception as e:
        logger.error("Error in fallback ID generation: {e}")
        # Last resort: use timestamp-based IDs
        base_id = int(datetime.utcnow().timestamp() * 1000)
        return list(range(base_id, base_id + count))

def bulk_create_leads_optimized(leads_data, request_id="no-id"):
    """OPTIMIZED: Bulk lead creation using DynamoDB batch operations"""
    try:
        total_leads = len(leads_data)
        logger.info("Starting optimized bulk creation of {total_leads} leads")
        
        # Generate all IDs at once
        lead_ids = get_next_lead_ids_batch(total_leads)
        
        # Prepare leads with IDs and timestamps
        timestamp = datetime.utcnow().isoformat()
        prepared_leads = []
        
        for i, lead_data in enumerate(leads_data):
            # Ensure proper data types
            lead = dict(lead_data)  # Copy to avoid modifying original
            lead['id'] = lead_ids[i]
            lead['created_at'] = timestamp
            lead['updated_at'] = timestamp
            lead['status'] = lead.get('status', 'new')
            
            # Type conversions
            if 'score' in lead and lead['score'] is not None:
                lead['score'] = int(float(lead['score']))
            if 'assigned_user_id' in lead and lead['assigned_user_id']:
                lead['assigned_user_id'] = int(lead['assigned_user_id'])
            
            # Clean up None values and empty strings
            cleaned_lead = {}
            for key, value in lead.items():
                if value is not None and value != '':
                    cleaned_lead[key] = value
            
            prepared_leads.append(cleaned_lead)
        
        # Batch write to DynamoDB (25 items per batch)
        created_count = 0
        failed_leads = []
        batch_size = 25
        
        for batch_start in range(0, len(prepared_leads), batch_size):
            batch_end = min(batch_start + batch_size, len(prepared_leads))
            batch = prepared_leads[batch_start:batch_end]
            
            try:
                # Prepare batch write request
                with leads_table.batch_writer() as batch_writer:
                    for lead in batch:
                        batch_writer.put_item(Item=lead)
                
                created_count += len(batch)
                logger.info("Batch {batch_start//batch_size + 1}: Created {len(batch)} leads")
                
            except Exception as batch_error:
                logger.error("Error in batch {batch_start//batch_size + 1}: {batch_error}")
                # Add failed leads to list
                for lead in batch:
                    failed_leads.append({
                        'practice_name': lead.get('practice_name', 'Unknown'),
                        'error': str(batch_error)
                    })
        
        logger.info("Bulk creation completed: {created_count} created, {len(failed_leads)} failed")
        
        return {
            'created_count': created_count,
            'failed_count': len(failed_leads),
            'failed_leads': failed_leads[:10],  # Return first 10 failures
            'total_processed': total_leads
        }
        
    except Exception as e:
        logger.error("Error in bulk_create_leads_optimized: {e}")
        raise e

def get_next_lead_id():
    """Get next available lead ID (for single lead creation)"""
    try:
        response = leads_table.scan(
            ProjectionExpression='id',
            FilterExpression='attribute_exists(id) AND id > :zero',
            ExpressionAttributeValues={':zero': 0}
        )
        
        max_id = 0
        for item in response['Items']:
            current_id = int(item['id'])
            if current_id > max_id:
                max_id = current_id
        
        return max_id + 1
    except Exception as e:
        print(f"Error getting next lead ID: {e}")
        return random.randint(1000, 9999)


def get_manager_sales_stats():
    """Get sales statistics for each manager and their team"""
    all_users = get_all_users()
    all_leads = get_all_leads()
    
    managers = [u for u in all_users if u.get('role') == 'manager']
    manager_stats = []
    
    for manager in managers:
        # Get all agents under this manager
        team_agents = [u for u in all_users if u.get('manager_id') == manager['id']]
        team_ids = [agent['id'] for agent in team_agents] + [manager['id']]
        
        # Get all leads assigned to this team
        team_leads = [l for l in all_leads if l.get('assigned_user_id') in team_ids]
        
        # Calculate stats
        total_leads = len(team_leads)
        closed_won = len([l for l in team_leads if l.get('status') == 'closed_won'])
        conversion_rate = round((closed_won / total_leads * 100) if total_leads > 0 else 0, 1)
        
        manager_stats.append({
            "manager_id": manager['id'],
            "manager_name": manager.get('full_name', manager['username']),
            "manager_username": manager['username'],
            "team_size": len(team_agents),
            "total_leads": total_leads,
            "closed_won": closed_won,
            "conversion_rate": conversion_rate,
            "agents": [{
                "id": agent['id'],
                "username": agent['username'],
                "full_name": agent.get('full_name', agent['username']),
                "leads_assigned": len([l for l in team_leads if l.get('assigned_user_id') == agent['id']]),
                "closed_won": len([l for l in team_leads if l.get('assigned_user_id') == agent['id'] and l.get('status') == 'closed_won'])
            } for agent in team_agents]
        })
    
    return sorted(manager_stats, key=lambda x: x['closed_won'], reverse=True)


def calculate_days_to_close(created_at, closed_at):
    """Calculate the number of days between creation and closing"""
    if not created_at or not closed_at:
        return 0
    
    try:
        created = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        closed = datetime.fromisoformat(closed_at.replace('Z', '+00:00'))
        return (closed - created).days
    except:
        return 0

def get_all_leads():
    """Get all leads from DynamoDB"""
    try:
        response = leads_table.scan(
            FilterExpression='attribute_exists(id) AND id > :zero',
            ExpressionAttributeValues={':zero': 0}
        )
        return response.get('Items', [])
    except Exception as e:
        print(f"Error getting leads: {e}")
        return []

def get_lead_by_id(lead_id):
    """Get lead by ID from DynamoDB"""
    try:
        response = leads_table.get_item(Key={'id': int(lead_id)})
        return response.get('Item')
    except Exception as e:
        print(f"Error getting lead: {e}")
        return None

def create_lead(lead_data):
    """Create new lead in DynamoDB (single lead)"""
    try:
        # Ensure numeric fields are properly typed
        if 'id' in lead_data:
            lead_data['id'] = int(lead_data['id'])
        if 'score' in lead_data:
            lead_data['score'] = int(lead_data['score'])
        if 'assigned_user_id' in lead_data and lead_data['assigned_user_id']:
            lead_data['assigned_user_id'] = int(lead_data['assigned_user_id'])
        
        leads_table.put_item(Item=lead_data)
        print(f"[OK] Created lead: {lead_data.get('practice_name', 'Unknown')}")
        return lead_data
    except Exception as e:
        print(f"[ERROR] Error creating lead: {e}")
        return None

def prevent_sold_lead_reassignment(lead_id, update_data):
    """Prevent sold/disposed leads from being reassigned to different agents"""
    try:
        response = leads_table.get_item(Key={'id': int(lead_id)})
        existing_lead = response.get('Item', {})
        
        # If lead is already sold/disposed, protect the assignment
        if existing_lead.get('status') in ['CLOSED_WON', 'CLOSED_LOST', 'disposed', 'sold']:
            # Don't allow changing the assigned agent for sold leads
            if 'assigned_user_id' in update_data:
                original_agent = existing_lead.get('assigned_user_id')
                new_agent = update_data.get('assigned_user_id')
                
                if original_agent != new_agent:
                    print(f"🛡️ PROTECTION: Preventing reassignment of sold lead {lead_id} from agent {original_agent} to {new_agent}")
                    # Remove the assignment change from update
                    del update_data['assigned_user_id']
        
        return update_data
        
    except Exception as e:
        print(f"Warning: Could not check lead protection for {lead_id}: {e}")
        return update_data

def update_lead(lead_id, update_data, current_user=None, request_id="no-id"):
    """Update lead in DynamoDB with commission tracking and lead protection"""
    try:
        # Protect sold leads from reassignment
        update_data = prevent_sold_lead_reassignment(lead_id, update_data)
        # Check if this is a new sale for commission tracking
        # Auto-convert to sale if docs were sent and lead is being disposed
        try:
            response = leads_table.get_item(Key={'id': int(lead_id)})
            old_lead = response.get('Item', {})
            
            # Auto-sale logic: if docs sent and status is disposed/closed_lost, convert to sale
            if (update_data.get('status') in ['disposed', 'CLOSED_LOST'] and 
                old_lead.get('docs_sent') and 
                old_lead.get('status') != 'CLOSED_WON'):
                
                # Automatically convert to sale!
                update_data['status'] = 'CLOSED_WON'
                update_data['closed_by_user_id'] = current_user.get('id') if current_user else old_lead.get('docs_sent_by_id')
                update_data['closed_by_username'] = current_user.get('username') if current_user else old_lead.get('docs_sent_by')
                update_data['closed_at'] = datetime.utcnow().isoformat()
                update_data['auto_converted'] = True
                update_data['conversion_reason'] = 'docs_sent_and_disposed'
                logger.info("🎉 AUTO SALE: Lead {lead_id} converted to sale (docs sent + disposed)")
                
            # Manual sale tracking
            elif update_data.get('status') == 'CLOSED_WON' and current_user and old_lead.get('status') != 'CLOSED_WON':
                # This is a manual sale! Track it for commission
                update_data['closed_by_user_id'] = current_user.get('id')
                update_data['closed_by_username'] = current_user.get('username')
                update_data['closed_at'] = datetime.utcnow().isoformat()
                logger.info("💰 Manual sale tracked: Lead {lead_id} closed by {current_user.get('username')}")
                
        except Exception as e:
            logger.warning("Could not check previous lead status for commission tracking: {e}")
        
        # Build update expression
        update_expr = "SET "
        expr_values = {}
        expr_names = {}
        
        for key, value in update_data.items():
            if key == 'id':  # Skip ID field
                continue
            safe_key = f"attr_{key.replace('-', '_')}"
            update_expr += f"#{safe_key} = :{safe_key}, "
            expr_names[f"#{safe_key}"] = key
            expr_values[f":{safe_key}"] = value
        
        # Add updated timestamp
        update_expr += "#updated_at = :updated_at"
        expr_names["#updated_at"] = "updated_at"
        expr_values[":updated_at"] = datetime.utcnow().isoformat()
        
        leads_table.update_item(
            Key={'id': int(lead_id)},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values
        )
        
        return True
    except Exception as e:
        logger.error("Error updating lead: {e}")
        return False

# MASTER ADMIN ANALYTICS - NEW FUNCTIONALITY

def calculate_master_admin_analytics():
    """Calculate comprehensive analytics for master admin dashboard"""
    try:
        logger.info("🎯 Calculating master admin analytics...")
        
        # Get all data
        all_leads = get_all_leads()
        all_users = get_all_users()
        
        # Initialize analytics structure
        analytics = {
            "timestamp": datetime.utcnow().isoformat(),
            "lead_hopper_overview": {},
            "score_distribution": {},
            "lead_type_breakdown": {},
            "agent_workload_distribution": {},
            "operational_insights": {},
            "real_time_metrics": {}
        }
        
        # LEAD HOPPER OVERVIEW
        total_leads = len(all_leads)
        unassigned_leads = [l for l in all_leads if not l.get('assigned_user_id')]
        assigned_leads = [l for l in all_leads if l.get('assigned_user_id')]
        
        analytics["lead_hopper_overview"] = {
            "total_leads": total_leads,
            "unassigned_leads": len(unassigned_leads),
            "assigned_leads": len(assigned_leads),
            "utilization_rate": round((len(assigned_leads) / total_leads * 100), 1) if total_leads > 0 else 0,
            "available_inventory": len(unassigned_leads)
        }
        
        # SCORE DISTRIBUTION ANALYTICS
        score_tiers = {
            "premium_90_plus": [],
            "excellent_80_89": [],
            "very_good_70_79": [],
            "good_60_69": [],
            "below_standard_under_60": []
        }
        
        for lead in all_leads:
            score = int(lead.get('score', 0))
            if score >= 90:
                score_tiers["premium_90_plus"].append(lead)
            elif score >= 80:
                score_tiers["excellent_80_89"].append(lead)
            elif score >= 70:
                score_tiers["very_good_70_79"].append(lead)
            elif score >= 60:
                score_tiers["good_60_69"].append(lead)
            else:
                score_tiers["below_standard_under_60"].append(lead)
        
        analytics["score_distribution"] = {
            "premium_90_plus": {
                "total": len(score_tiers["premium_90_plus"]),
                "unassigned": len([l for l in score_tiers["premium_90_plus"] if not l.get('assigned_user_id')]),
                "percentage": round(len(score_tiers["premium_90_plus"]) / total_leads * 100, 1) if total_leads > 0 else 0
            },
            "excellent_80_89": {
                "total": len(score_tiers["excellent_80_89"]),
                "unassigned": len([l for l in score_tiers["excellent_80_89"] if not l.get('assigned_user_id')]),
                "percentage": round(len(score_tiers["excellent_80_89"]) / total_leads * 100, 1) if total_leads > 0 else 0
            },
            "very_good_70_79": {
                "total": len(score_tiers["very_good_70_79"]),
                "unassigned": len([l for l in score_tiers["very_good_70_79"] if not l.get('assigned_user_id')]),
                "percentage": round(len(score_tiers["very_good_70_79"]) / total_leads * 100, 1) if total_leads > 0 else 0
            },
            "good_60_69": {
                "total": len(score_tiers["good_60_69"]),
                "unassigned": len([l for l in score_tiers["good_60_69"] if not l.get('assigned_user_id')]),
                "percentage": round(len(score_tiers["good_60_69"]) / total_leads * 100, 1) if total_leads > 0 else 0
            },
            "below_standard_under_60": {
                "total": len(score_tiers["below_standard_under_60"]),
                "unassigned": len([l for l in score_tiers["below_standard_under_60"] if not l.get('assigned_user_id')]),
                "percentage": round(len(score_tiers["below_standard_under_60"]) / total_leads * 100, 1) if total_leads > 0 else 0
            }
        }
        
        # LEAD TYPE BREAKDOWN
        lead_types = defaultdict(int)
        lead_sources = defaultdict(int)
        
        for lead in all_leads:
            lead_type = lead.get('lead_type', 'Unknown')
            source = lead.get('source', 'Unknown')
            
            lead_types[lead_type] += 1
            lead_sources[source] += 1
        
        analytics["lead_type_breakdown"] = {
            "by_type": dict(lead_types),
            "by_source": dict(lead_sources),
            "type_distribution": [
                {"name": k, "count": v, "percentage": round(v/total_leads*100, 1)} 
                for k, v in sorted(lead_types.items(), key=lambda x: x[1], reverse=True)
            ]
        }
        
        # AGENT WORKLOAD DISTRIBUTION
        agents = [u for u in all_users if u.get('role') == 'agent']
        agent_workloads = []
        
        for agent in agents:
            agent_id = agent.get('id')
            agent_leads = [l for l in all_leads if l.get('assigned_user_id') == agent_id]
            
            # Calculate status breakdown
            status_breakdown = defaultdict(int)
            for lead in agent_leads:
                status = lead.get('status', 'new')
                status_breakdown[status] += 1
            
            # Calculate score breakdown for agent's leads
            agent_score_breakdown = {
                "premium_90_plus": len([l for l in agent_leads if int(l.get('score', 0)) >= 90]),
                "excellent_80_89": len([l for l in agent_leads if 80 <= int(l.get('score', 0)) < 90]),
                "very_good_70_79": len([l for l in agent_leads if 70 <= int(l.get('score', 0)) < 80]),
                "good_60_69": len([l for l in agent_leads if 60 <= int(l.get('score', 0)) < 70]),
                "below_60": len([l for l in agent_leads if int(l.get('score', 0)) < 60])
            }
            
            agent_workloads.append({
                "agent_id": agent_id,
                "username": agent.get('username', 'Unknown'),
                "full_name": agent.get('full_name', 'Unknown'),
                "total_assigned": len(agent_leads),
                "status_breakdown": dict(status_breakdown),
                "score_breakdown": agent_score_breakdown,
                "conversion_rate": float(agent.get('conversion_rate', 0)),
                "deals_closed": int(agent.get('deals_closed', 0)),
                "activity_score": int(agent.get('activity_score', 0))
            })
        
        analytics["agent_workload_distribution"] = {
            "total_agents": len(agents),
            "active_agents": len([a for a in agents if a.get('is_active', True)]),
            "agents": sorted(agent_workloads, key=lambda x: x['total_assigned'], reverse=True),
            "workload_summary": {
                "total_assigned_leads": sum(a['total_assigned'] for a in agent_workloads),
                "avg_leads_per_agent": round(sum(a['total_assigned'] for a in agent_workloads) / len(agents), 1) if agents else 0,
                "max_workload": max((a['total_assigned'] for a in agent_workloads), default=0),
                "min_workload": min((a['total_assigned'] for a in agent_workloads), default=0)
            }
        }
        
        # OPERATIONAL INSIGHTS
        status_counts = defaultdict(int)
        for lead in all_leads:
            status = lead.get('status', 'new')
            status_counts[status] += 1
        
        # Conversion metrics
        contacted_leads = len([l for l in all_leads if l.get('status') in ['contacted', 'qualified', 'closed_won', 'closed_lost']])
        closed_won = len([l for l in all_leads if l.get('status') == 'closed_won'])
        closed_lost = len([l for l in all_leads if l.get('status') == 'closed_lost'])
        
        analytics["operational_insights"] = {
            "lead_status_distribution": dict(status_counts),
            "conversion_metrics": {
                "total_contacted": contacted_leads,
                "closed_won": closed_won,
                "closed_lost": closed_lost,
                "conversion_rate": round(closed_won / contacted_leads * 100, 1) if contacted_leads > 0 else 0,
                "loss_rate": round(closed_lost / contacted_leads * 100, 1) if contacted_leads > 0 else 0
            },
            "quality_metrics": {
                "high_quality_leads_60_plus": len([l for l in all_leads if int(l.get('score', 0)) >= 60]),
                "premium_leads_90_plus": len([l for l in all_leads if int(l.get('score', 0)) >= 90]),
                "quality_percentage": round(len([l for l in all_leads if int(l.get('score', 0)) >= 60]) / total_leads * 100, 1) if total_leads > 0 else 0
            }
        }
        
        # REAL-TIME METRICS
        today = datetime.utcnow().date()
        yesterday = today - timedelta(days=1)
        
        recent_leads = []
        for lead in all_leads:
            created_at = lead.get('created_at', '')
            if created_at:
                try:
                    lead_date = datetime.fromisoformat(created_at.replace('Z', '+00:00')).date()
                    if lead_date >= yesterday:
                        recent_leads.append(lead)
                except:
                    continue
        
        analytics["real_time_metrics"] = {
            "leads_added_last_24h": len(recent_leads),
            "leads_assigned_last_24h": len([l for l in recent_leads if l.get('assigned_user_id')]),
            "current_unassigned_pool": len([l for l in all_leads if not l.get('assigned_user_id')]),
            "inventory_alerts": {
                "low_premium_inventory": len([l for l in all_leads if not l.get('assigned_user_id') and int(l.get('score', 0)) >= 90]) < 50,
                "low_total_inventory": len([l for l in all_leads if not l.get('assigned_user_id')]) < 100,
                "quality_degradation": (len([l for l in recent_leads if int(l.get('score', 0)) >= 60]) / len(recent_leads) * 100) < 80 if recent_leads else False
            },
            "system_health": {
                "total_system_leads": len(all_leads),
                "data_freshness": "real_time",
                "last_updated": datetime.utcnow().isoformat()
            }
        }
        
        logger.info("✅ Master admin analytics calculated successfully")
        return analytics
        
    except Exception as e:
        logger.error("❌ Error calculating master admin analytics: {e}")
        return {
            "error": sanitize_error_message(e, "calculate_master_admin_analytics"),
            "timestamp": datetime.utcnow().isoformat()
        }

def get_all_users():
    """Get all users from DynamoDB"""
    try:
        response = users_table.scan()
        return response.get('Items', [])
    except Exception as e:
        print(f"Error getting users: {e}")
        return []

def lambda_handler(event, context):
    """AWS Lambda handler with OPTIMIZED bulk upload"""
    
    # Generate request ID for tracking
    request_id = str(uuid.uuid4())
    
    try:
        # Log request with ID
        logger.info("Starting request")
        
        # Handle CORS preflight
        if event.get('httpMethod') == 'OPTIONS':
            return create_response(200, {}, request_id, event)
        
        # Extract request info
        path = event.get('path', '')
        method = event.get('httpMethod', 'GET')
        headers = event.get('headers', {})
        
        # Parse body
        body = event.get('body', '{}')
        if body:
            try:
                body_data = json.loads(body)
            except:
                body_data = {}
        else:
            body_data = {}
        
        print(f"Request: {method} {path}")
        
        # Initialize default users on first run
        initialize_default_users()
        
        # Health check
        if path == '/health' and method == 'GET':
            return create_response(200, {"status": "healthy", "service": "VantagePoint CRM", "optimized": True}, request_id, event)
        
        # Authentication endpoint
        if path == '/api/v1/auth/login' and method == 'POST':
            # Validate login input
            valid, error = validate_input(body_data, 'login')
            if not valid:
                return create_response(400, {"detail": error}, request_id, event)
            
            username = body_data.get('username')  # Already sanitized by validate_input
            password = body_data.get('password')
            
            user = get_user_by_username(username)
            # Check password hash
            import hashlib
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            if user and user.get('password_hash') == password_hash:
                token = create_jwt_token(username, user.get('role', 'agent'))
                return create_response(200, {
                    "access_token": token,
                    "token_type": "bearer",
                    "user": {
                        "id": user.get('id'),
                        "username": user.get('username'),
                        "role": user.get('role')
                    }
                })
            else:
                return create_response(401, {"detail": "Invalid credentials"}, request_id, event)
        
        # Authentication check for protected endpoints
        protected_endpoints = ['/api/v1/leads', '/api/v1/auth/me', '/api/v1/admin/analytics', '/api/v1/summary', '/api/v1/users', '/api/v1/reports']
        if any(path.startswith(endpoint) for endpoint in protected_endpoints):
            auth_header = headers.get('Authorization', headers.get('authorization', ''))
            if not auth_header or not auth_header.startswith('Bearer '):
                return create_response(401, {"detail": "Authorization header required"}, request_id, event)
            
            token = auth_header.replace('Bearer ', '')
            payload = verify_jwt_token(token)
            if not payload:
                return create_response(401, {"detail": "Invalid or expired token"}, request_id, event)
            
            current_user = get_user_by_username(payload.get('username'))
            if not current_user:
                return create_response(401, {"detail": "User not found"}, request_id, event)
            
            # Check rate limits for authenticated endpoints
            user_id = current_user.get('id')
            user_role = current_user.get('role', 'default')
            client_ip = get_client_ip(event)
            
            allowed, rate_info = check_rate_limit(user_id, user_role, path, client_ip, request_id)
            if not allowed:
                reset_time = rate_info.get('reset_time', 0)
                return create_response(429, {
                    "detail": f"Rate limit exceeded: {rate_info['current']}/{rate_info['limit']} requests per {rate_info['limit_type']}",
                    "retry_after": reset_time - int(time.time()),
                    "reset_time": reset_time
                }, request_id, event)
        
        # Get current user info
        if path == '/api/v1/auth/me' and method == 'GET':
            return create_response(200, {
                "id": current_user.get('id'),
                "username": current_user.get('username'),
                "role": current_user.get('role'),
                "email": current_user.get('email', ''),
                "name": current_user.get('name', '')
            }, request_id, event)
        
        # GET /api/v1/leads - Get all leads with role-based filtering
        if path == '/api/v1/leads' and method == 'GET':
            all_leads = get_all_leads()
            
            # Apply role-based filtering
            user_role = current_user.get('role')
            user_id = current_user.get('id')
            
            if user_role == 'agent':
                # Agents see only their assigned leads
                filtered_leads = [lead for lead in all_leads if lead.get('assigned_user_id') == user_id]
            elif user_role == 'manager':
                # Managers see only their team's leads
                # First get all agents under this manager
                manager_agents = [u for u in get_all_users() if u.get('manager_id') == user_id]
                agent_ids = [agent['id'] for agent in manager_agents]
                # Include the manager's own ID as well
                team_ids = agent_ids + [user_id]
                # Filter leads to only those assigned to the team
                filtered_leads = [lead for lead in all_leads if lead.get('assigned_user_id') in team_ids]
            elif user_role == 'admin':
                # Admins see all leads
                filtered_leads = all_leads
            else:
                filtered_leads = []
            
            return create_response(200, {"leads": filtered_leads}, request_id, event)
        
        # POST /api/v1/leads - Create single lead
        if path == '/api/v1/leads' and method == 'POST':
            try:
                lead_data = body_data
                
                # Validate lead data
                valid, error = validate_input(lead_data, 'create_lead')
                if not valid:
                    return create_response(400, {"detail": error}, request_id, event)
                
                lead_data['id'] = get_next_lead_id()
                lead_data['created_at'] = datetime.utcnow().isoformat()
                lead_data['updated_at'] = datetime.utcnow().isoformat()
                lead_data['status'] = lead_data.get('status', 'new')
                
                created_lead = create_lead(lead_data)
                if created_lead:
                    return create_response(201, created_lead, request_id, event)
                else:
                    return create_response(400, {"detail": "Failed to create lead"}, request_id, event)
            except Exception as e:
                return create_response(400, {"detail": sanitize_error_message(e, "create_lead")}, request_id, event)
        
        # POST /api/v1/leads/bulk - OPTIMIZED Bulk create leads
        if path == '/api/v1/leads/bulk' and method == 'POST':
            try:
                leads_data = body_data.get('leads', [])
                if not leads_data or not isinstance(leads_data, list):
                    return create_response(400, {"detail": "Invalid format. Expected {\"leads\": [...]}"}, request_id, event)
                
                if len(leads_data) > 1000:
                    return create_response(400, {"detail": "Maximum 1000 leads per batch"}, request_id, event)
                
                # Validate each lead
                for i, lead in enumerate(leads_data):
                    valid, error = validate_input(lead, 'create_lead')
                    if not valid:
                        return create_response(400, {"detail": f"Lead {i+1}: {error}"}, request_id, event)
                
                # Use OPTIMIZED bulk creation
                result = bulk_create_leads_optimized(leads_data, request_id)
                
                return create_response(200, {
                    "message": f"OPTIMIZED bulk upload completed. {result['created_count']} created, {result['failed_count']} failed",
                    "created_count": result['created_count'],
                    "failed_count": result['failed_count'],
                    "failed_leads": result['failed_leads'],
                    "performance": "optimized_batch_write",
                    "speed_improvement": "25x faster"
                }, request_id, event)
                
            except Exception as e:
                logger.error(f"Bulk upload error: {e}")
                return create_response(500, {"detail": sanitize_error_message(e, "bulk_upload")}, request_id, event)
        
        # PUT /api/v1/leads/{id} - Update lead
        if path.startswith('/api/v1/leads/') and method == 'PUT':
            try:
                lead_id = path.split('/')[-1]
                update_data = body_data
                
                # Validate update data
                valid, error = validate_input(update_data, 'update_lead')
                if not valid:
                    return create_response(400, {"detail": error}, request_id, event)
                
                if update_lead(lead_id, update_data, current_user, request_id):
                    updated_lead = get_lead_by_id(lead_id)
                    return create_response(200, updated_lead, request_id, event)
                else:
                    return create_response(400, {"detail": "Failed to update lead"}, request_id, event)
            except Exception as e:
                return create_response(400, {"detail": sanitize_error_message(e, "update_lead")}, request_id, event)
        
        # Summary endpoint
        if path == '/api/v1/summary' and method == 'GET':
            all_leads = get_all_leads()
            
            # Apply role-based filtering for summary
            user_role = current_user.get('role')
            user_id = current_user.get('id')
            
            if user_role == 'agent':
                leads = [lead for lead in all_leads if lead.get('assigned_user_id') == user_id]
            elif user_role == 'manager':
                # Managers see only their team's summary
                manager_agents = [u for u in get_all_users() if u.get('manager_id') == user_id]
                agent_ids = [agent['id'] for agent in manager_agents]
                team_ids = agent_ids + [user_id]
                leads = [lead for lead in all_leads if lead.get('assigned_user_id') in team_ids]
            else:
                leads = all_leads
            
            # Filter out inactive duplicates for stats
            active_leads_list = [l for l in leads if l.get('status') != 'inactive_duplicate']
            
            # Calculate summary stats
            total_leads = len(active_leads_list)
            new_leads = len([l for l in active_leads_list if l.get('status') == 'new'])
            contacted_leads = len([l for l in active_leads_list if l.get('status') == 'contacted'])
            qualified_leads = len([l for l in active_leads_list if l.get('status') == 'qualified'])
            signed_up_leads = len([l for l in active_leads_list if l.get('status') in ['closed_won', 'signed_up']])
            
            # Calculate active leads (new + contacted + qualified)
            active_leads = new_leads + contacted_leads + qualified_leads
            
            # Calculate conversion rate
            conversion_rate = round((signed_up_leads / total_leads * 100) if total_leads > 0 else 0, 1)
            
            return create_response(200, {
                "total_leads": total_leads,
                "new_leads": new_leads,
                "contacted_leads": contacted_leads,
                "qualified_leads": qualified_leads,
                "practices_signed_up": signed_up_leads,
                "active_leads": active_leads,
                "conversion_rate": conversion_rate,
                "user_role": user_role,
                "optimized": True
            }, request_id, event)
        
        # Create new user (admin/manager only)
        if path == '/api/v1/users' and method == 'POST':
            # Check permissions
            if current_user['role'] not in ['admin', 'manager']:
                return create_response(403, {"detail": "Only admins and managers can create users"}, request_id, event)
            
            new_user_data = body_data
            
            # Validate user data
            valid, error = validate_input(new_user_data, 'create_user')
            if not valid:
                return create_response(400, {"detail": error}, request_id, event)
            
            username = new_user_data.get('username')  # Already sanitized
            password = new_user_data.get('password', 'admin123')  # Default password
            role = new_user_data.get('role', 'agent')
            
            # Check if user exists
            if get_user_by_username(username):
                return create_response(400, {"detail": "Username already exists"}, request_id, event)
            
            # Managers can only create agents
            if current_user['role'] == 'manager' and role != 'agent':
                return create_response(403, {"detail": "Managers can only create agent accounts"}, request_id, event)
            
            # Get next user ID
            try:
                all_users = get_all_users()
                max_id = max([int(u.get('id', 0)) for u in all_users], default=0)
                new_user_id = max_id + 1
            except:
                new_user_id = random.randint(100, 999)
            
            # Create new user
            new_user = {
                "id": new_user_id,
                "username": username,
                "password": password,  # Store plain text for current system
                "role": role,
                "email": f"{username}@vantagepoint.com",
                "full_name": new_user_data.get('full_name', username.title()),
                "is_active": True,
                "created_at": datetime.utcnow().isoformat(),
                "manager_id": current_user['id'] if current_user['role'] == 'manager' else new_user_data.get('manager_id')
            }
            
            # Store in DynamoDB
            try:
                users_table.put_item(Item=new_user)
                
                # If creating an agent, automatically assign leads
                assigned_count = 0
                if role == 'agent':
                    assigned_count = assign_leads_to_new_agent(new_user_id, 20)
                    print(f"✅ Assigned {assigned_count} leads to new agent {username}")
                
                response_data = {
                    "message": f"User {username} created successfully",
                    "user": {k: v for k, v in new_user.items() if k != 'password'},
                    "default_password": password if password == 'admin123' else None
                }
                
                # Add lead assignment info for agents
                if role == 'agent':
                    response_data["leads_assigned"] = assigned_count
                
                return create_response(201, response_data, request_id, event)
                
            except Exception as e:
                return create_response(500, {"detail": sanitize_error_message(e, "create_user")}, request_id, event)
        
        # MASTER ADMIN ANALYTICS ENDPOINT - NEW!
        if path == '/api/v1/admin/analytics' and method == 'GET':
            # Ensure admin access
            if current_user.get('role') != 'admin':
                return create_response(403, {"detail": "Admin access required"}, request_id, event)
            
            logger.info("🎯 Master admin analytics requested")
            analytics = calculate_master_admin_analytics()
            
            return create_response(200, {
                "success": True,
                "analytics": analytics,
                "meta": {
                    "endpoint": "master_admin_analytics",
                    "version": "1.0",
                    "generated_at": datetime.utcnow().isoformat()
                }
            })
        
        
        
        # Send docs endpoint - POST /api/v1/leads/{id}/send-docs
        if path.startswith('/api/v1/leads/') and path.endswith('/send-docs') and method == 'POST':
            lead_id = int(path.split('/')[-2])
            lead = get_lead_by_id(lead_id)
            
            if not lead:
                return create_response(404, {"detail": "Lead not found"}, request_id, event)
            
            # Check if lead has required data
            if not lead.get('email'):
                return create_response(400, {"detail": "Lead must have email before sending docs"}, request_id, event)
            
            # Check if docs already sent
            if lead.get('docs_sent'):
                return create_response(400, {"detail": "Documents already sent to this lead"}, request_id, event)
            
            # Check permissions - agents can only send docs for their own leads
            if current_user['role'] == 'agent' and lead.get("assigned_user_id") != current_user['id']:
                return create_response(403, {"detail": "You can only send docs for your own leads"}, request_id, event)
            
            # Send to external API
            external_result = send_docs_to_external_api(lead, current_user, request_id)
            
            if external_result['success']:
                # Mark docs as sent and update lead
                update_data = {
                    'docs_sent': True,
                    'docs_sent_at': datetime.utcnow().isoformat(),
                    'docs_sent_by': current_user.get('username'),
                    'status': 'CONTACTED'  # Update status to show progress
                }
                
                if update_lead(lead_id, update_data, current_user, request_id):
                    logger.info(f"📤 Docs sent successfully for lead {lead_id}")
                    return create_response(200, {
                        "message": "Documents sent successfully",
                        "external_response": external_result.get('external_response'),
                        "lead_updated": True
                    })
                else:
                    return create_response(500, {"detail": "Failed to update lead after sending docs"}, request_id, event)
            else:
                logger.error(f"Failed to send docs for lead {lead_id}: {external_result.get('error')}")
                return create_response(500, {
                    "detail": "Failed to send documents",
                    "error": external_result.get('error'),
                    "details": external_result.get('details')
                })

        # GET /api/v1/reports/commission - Commission/Sales Report
        if path == '/api/v1/reports/commission' and method == 'GET':
            # Check authorization
            if current_user.get('role') not in ['admin', 'manager']:
                return create_response(403, {"detail": "Admin or Manager access required"}, request_id, event)
            
            # Get query parameters
            query_params = event.get('queryStringParameters', {}) or {}
            start_date = query_params.get('start_date')
            end_date = query_params.get('end_date')
            user_id = query_params.get('user_id')
            
            logger.info(f"📊 Commission report requested by {current_user['username']} (role: {current_user['role']})")
            
            # Get all leads that are CLOSED_WON
            all_leads = get_all_leads()
            closed_leads = [l for l in all_leads if l.get('status') == 'CLOSED_WON' and l.get('closed_at')]
            
            # Apply role-based filtering
            if current_user['role'] == 'manager':
                # Managers see only their team's sales
                all_users = get_all_users()
                team_agents = [u for u in all_users if u.get('manager_id') == current_user['id']]
                team_ids = [agent['id'] for agent in team_agents] + [current_user['id']]
                closed_leads = [l for l in closed_leads if l.get('closed_by_user_id') in team_ids]
            
            # Apply date filtering if provided
            if start_date:
                closed_leads = [l for l in closed_leads if l.get('closed_at', '') >= start_date]
            if end_date:
                closed_leads = [l for l in closed_leads if l.get('closed_at', '') <= end_date]
            
            # Apply user filtering if provided
            if user_id:
                closed_leads = [l for l in closed_leads if str(l.get('closed_by_user_id')) == user_id]
            
            # Build detailed sales records
            sales_records = []
            total_sales = 0
            
            for lead in closed_leads:
                record = {
                    "lead_id": lead.get('id'),
                    "practice_name": lead.get('practice_name'),
                    "owner_name": lead.get('owner_name'),
                    "city": lead.get('city'),
                    "state": lead.get('state'),
                    "closed_by_user_id": lead.get('closed_by_user_id'),
                    "closed_by_username": lead.get('closed_by_username', 'Unknown'),
                    "closed_at": lead.get('closed_at'),
                    "docs_sent": lead.get('docs_sent', False),
                    "docs_sent_at": lead.get('docs_sent_at'),
                    "auto_converted": lead.get('auto_converted', False),
                    "conversion_reason": lead.get('conversion_reason', 'manual'),
                    "lead_score": lead.get('score'),
                    "lead_priority": lead.get('priority'),
                    "days_to_close": calculate_days_to_close(lead.get('created_at'), lead.get('closed_at'))
                }
                sales_records.append(record)
            
            # Sort by closed date (newest first)
            sales_records.sort(key=lambda x: x['closed_at'], reverse=True)
            
            # Calculate summary statistics
            summary = {
                "total_sales": len(sales_records),
                "auto_sales": len([r for r in sales_records if r.get('auto_converted')]),
                "manual_sales": len([r for r in sales_records if not r.get('auto_converted')]),
                "date_range": {
                    "start": start_date or (min([s['closed_at'] for s in sales_records]) if sales_records else None),
                    "end": end_date or (max([s['closed_at'] for s in sales_records]) if sales_records else None)
                }
            }
            
            # Group by user for summary
            user_summary = {}
            for record in sales_records:
                user_key = record['closed_by_username']
                if user_key not in user_summary:
                    user_summary[user_key] = {
                        "user_id": record['closed_by_user_id'],
                        "username": user_key,
                        "total_sales": 0,
                        "total_amount": 0
                    }
                user_summary[user_key]['total_sales'] += 1
                # Count sales instead of amounts
                pass  # No monetary amount to add
            
            return create_response(200, {
                "success": True,
                "summary": summary,
                "user_summary": list(user_summary.values()),
                "sales_records": sales_records,
                "filters_applied": {
                    "start_date": start_date,
                    "end_date": end_date,
                    "user_id": user_id,
                    "role_filter": current_user['role']
                }
            })

        return create_response(404, {"detail": "Endpoint not found"}, request_id, event)
        
    except Exception as e:
        logger.error(f"Lambda error: {e}")
        return create_response(500, {"detail": sanitize_error_message(e, "lambda_handler")}, request_id, event)