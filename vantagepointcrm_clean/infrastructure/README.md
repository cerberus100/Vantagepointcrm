# VantagePoint CRM Infrastructure

This directory contains the AWS CDK infrastructure code for the VantagePoint CRM system.

## 🏗️ Architecture Overview

The infrastructure includes:

- **VPC**: Multi-AZ VPC with public, private, and isolated subnets
- **RDS PostgreSQL**: Managed database with encryption and backups
- **ElastiCache Redis**: In-memory caching layer
- **Lambda**: Serverless API backend
- **API Gateway**: RESTful API with WAF protection
- **Cognito**: User authentication and authorization
- **S3**: File storage with encryption
- **CloudTrail**: Audit logging
- **GuardDuty**: Threat detection
- **Security Hub**: Security posture management
- **CloudWatch**: Monitoring and alerting

## 🚀 Quick Start

### Prerequisites

1. **AWS CLI configured**:
   ```bash
   aws configure
   ```

2. **Node.js and npm installed**

3. **AWS CDK installed**:
   ```bash
   npm install -g aws-cdk
   ```

### Deployment

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Deploy development environment**:
   ```bash
   ./scripts/deploy.sh dev deploy
   ```

3. **Deploy production environment**:
   ```bash
   ./scripts/deploy.sh production deploy
   ```

## 📁 Project Structure

```
infrastructure/
├── bin/
│   └── infrastructure.ts          # CDK app entry point
├── lib/
│   └── infrastructure-stack.ts    # Main infrastructure stack
├── config/
│   ├── dev.json                   # Development configuration
│   └── production.json            # Production configuration
├── scripts/
│   └── deploy.sh                  # Deployment script
├── test/
│   └── infrastructure.test.ts     # Infrastructure tests
├── cdk.json                       # CDK configuration
├── package.json                   # Dependencies
└── README.md                      # This file
```

## 🔧 Configuration

### Environment Variables

The stack uses the following context variables:

- `environment`: Environment name (dev, staging, production)
- `domainName`: Custom domain name (optional)

### Configuration Files

Environment-specific settings are stored in `config/` directory:

- **dev.json**: Development environment settings
- **production.json**: Production environment settings

## 🛠️ Available Commands

### CDK Commands

```bash
# Deploy infrastructure
cdk deploy --context environment=dev

# Show differences
cdk diff --context environment=dev

# Synthesize CloudFormation template
cdk synth --context environment=dev

# List all stacks
cdk list --context environment=dev

# Destroy infrastructure
cdk destroy --context environment=dev
```

### Deployment Script

```bash
# Deploy development environment
./scripts/deploy.sh dev deploy

# Show differences
./scripts/deploy.sh dev diff

# Destroy development environment
./scripts/deploy.sh dev destroy

# Synthesize template
./scripts/deploy.sh dev synth
```

## 🔒 Security Features

### Network Security
- VPC with isolated database subnets
- Security groups with least-privilege access
- NAT Gateway for outbound internet access

### Data Protection
- KMS encryption for all data at rest
- SSL/TLS encryption in transit
- Database encryption with customer-managed keys

### Access Control
- Cognito User Pool for authentication
- IAM roles with least-privilege permissions
- WAF protection against common attacks

### Monitoring & Compliance
- CloudTrail for audit logging
- GuardDuty for threat detection
- Security Hub for security posture
- CloudWatch alarms for monitoring

## 💰 Cost Optimization

### Development Environment
- Single NAT Gateway
- t3.micro instances
- Minimal storage allocation
- No Multi-AZ deployment

### Production Environment
- Multi-AZ deployment
- Larger instance types
- Extended backup retention
- Enhanced monitoring

## 🔄 Environment Management

### Development
- Quick deployment/destruction
- Cost-optimized resources
- Local development support

### Production
- High availability
- Data protection
- Compliance features
- Monitoring and alerting

## 📊 Monitoring

### CloudWatch Alarms
- Database CPU utilization
- Lambda error rates
- API Gateway 4xx/5xx errors

### Logs
- Application logs in CloudWatch
- Access logs in S3
- Audit trail in CloudTrail

## 🚨 Troubleshooting

### Common Issues

1. **Bootstrap Required**:
   ```bash
   cdk bootstrap
   ```

2. **Permissions Error**:
   Ensure your AWS credentials have sufficient permissions

3. **Resource Limits**:
   Check AWS service limits in your account

### Getting Help

1. Check CloudFormation console for stack events
2. Review CloudWatch logs for application errors
3. Check AWS Service Health Dashboard

## 🔄 Updates and Maintenance

### Regular Tasks
- Review and update dependencies
- Monitor cost and usage
- Update security patches
- Review access logs

### Scaling
- Adjust instance sizes based on usage
- Add/remove cache nodes as needed
- Scale Lambda concurrency limits

## 📝 Best Practices

1. **Use environment-specific configurations**
2. **Enable all security features in production**
3. **Monitor costs regularly**
4. **Keep dependencies updated**
5. **Use least-privilege IAM policies**
6. **Enable all logging and monitoring**

## 🔗 Related Documentation

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [VantagePoint Backend README](../backend-nestjs/README.md)
- [VantagePoint Frontend README](../frontend-nextjs/README.md)