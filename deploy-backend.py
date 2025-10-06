import boto3
import json

def lambda_handler(event, context):
    ec2 = boto3.client('ec2')
    ssm = boto3.client('ssm')
    
    instance_id = 'i-0c01f697a29d26b1a'
    
    # Simple commands without special characters
    commands = [
        'sudo yum update -y',
        'sudo yum install -y docker',
        'sudo service docker start',
        'sudo systemctl enable docker',
        'sleep 5',
        'aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin 337909762852.dkr.ecr.us-east-1.amazonaws.com',
        'sudo docker pull 337909762852.dkr.ecr.us-east-1.amazonaws.com/vantagepoint-backend:v2',
        'sudo docker stop vantagepoint-backend || true',
        'sudo docker rm vantagepoint-backend || true',
        'sudo docker run -d --name vantagepoint-backend --restart always -p 80:8080 -e NODE_ENV=production -e DATABASE_HOST=vantagepoint-production.c6ds4c4qok1n.us-east-1.rds.amazonaws.com -e DATABASE_PORT=5432 -e DATABASE_USERNAME=postgres -e DATABASE_PASSWORD=VantagePoint2024! -e DATABASE_NAME=vantagepointcrm -e JWT_SECRET=VantagePoint2024!SecretKey -e JWT_EXPIRES_IN=24h -e PORT=8080 337909762852.dkr.ecr.us-east-1.amazonaws.com/vantagepoint-backend:v2',
        'sleep 10',
        'sudo docker ps'
    ]
    
    try:
        response = ssm.send_command(
            InstanceIds=[instance_id],
            DocumentName="AWS-RunShellScript",
            Parameters={'commands': commands}
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps('Deployment started')
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(str(e))
        }
