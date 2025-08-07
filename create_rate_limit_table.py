#!/usr/bin/env python3
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
            BillingMode='PAY_PER_REQUEST'
        )
        
        print(f"✅ Created rate limit table: {table.table_name}")
        print("⏳ Waiting for table to be active...")
        table.wait_until_exists()
        print("✅ Table is ready!")
        
        # Enable TTL after table creation
        client = boto3.client('dynamodb', region_name='us-east-1')
        client.update_time_to_live(
            TableName='vantagepoint-rate-limits',
            TimeToLiveSpecification={
                'Enabled': True,
                'AttributeName': 'ttl'
            }
        )
        print("✅ TTL enabled for automatic cleanup")
        
    except dynamodb.meta.client.exceptions.ResourceInUseException:
        print("ℹ️  Table already exists")

if __name__ == "__main__":
    create_rate_limit_table()
