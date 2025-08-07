#!/usr/bin/env python3
"""
Implement Rate Limiting for Lambda Function
- Prevents DDoS attacks
- Controls API usage per user
- Uses DynamoDB for distributed rate limiting
"""

rate_limiting_code = '''
# Add this to the imports section
from collections import defaultdict
import time

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

# DynamoDB table for rate limiting
rate_limit_table = dynamodb.Table('vantagepoint-rate-limits')

def check_rate_limit(user_id, user_role, endpoint, ip_address=None):
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
            logger.warning(f"Rate limit exceeded for user {user_id}: {minute_count}/{minute_limit} per minute")
            return False, {
                'limit_type': 'minute',
                'limit': minute_limit,
                'current': minute_count,
                'reset_time': (minute_window + 1) * 60
            }
        
        if hour_count > hour_limit:
            logger.warning(f"Rate limit exceeded for user {user_id}: {hour_count}/{hour_limit} per hour")
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
        logger.error(f"Rate limit check failed: {e}")
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
'''

# Create the rate limit table creation script
create_table_script = '''#!/usr/bin/env python3
"""
Create DynamoDB table for rate limiting
"""
import boto3

def create_rate_limit_table():
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    
    try:
        table = dynamodb.create_table(
            TableName='vantagepoint-rate-limits',
            KeySchema=[
                {
                    'AttributeName': 'id',
                    'KeyType': 'HASH'
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'id',
                    'AttributeType': 'S'
                }
            ],
            BillingMode='PAY_PER_REQUEST',
            # Enable TTL for automatic cleanup
            TimeToLiveSpecification={
                'Enabled': True,
                'AttributeName': 'ttl'
            }
        )
        
        print(f"✅ Created rate limit table: {table.table_name}")
        print("⏳ Waiting for table to be active...")
        table.wait_until_exists()
        print("✅ Table is ready!")
        
    except dynamodb.meta.client.exceptions.ResourceInUseException:
        print("ℹ️  Table already exists")

if __name__ == "__main__":
    create_rate_limit_table()
'''

# Save the rate limiting code to be added to Lambda
with open('rate_limiting_code.py', 'w') as f:
    f.write(rate_limiting_code)

# Save the table creation script
with open('create_rate_limit_table.py', 'w') as f:
    f.write(create_table_script)

print("✅ Rate limiting implementation files created!")
print("\nNext steps:")
print("1. Run: python3 create_rate_limit_table.py")
print("2. Add rate limiting code to Lambda function")
print("3. Update Lambda handler to check rate limits")
