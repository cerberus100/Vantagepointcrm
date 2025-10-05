# VantagePoint CRM Deployment Guide

This guide provides step-by-step instructions for deploying the VantagePoint CRM infrastructure using AWS CDK.

## 🎯 Prerequisites

### Required Tools

1. **AWS CLI** (v2.0+)
   ```bash
   aws --version
   aws configure
   ```

2. **Node.js** (v18+)
   ```bash
   node --version
   npm --version
   ```

3. **AWS CDK** (v2.0+)
   ```bash
   npm install -g aws-cdk
   cdk --version
   ```

4. **Git**
   ```bash
   git --version
   ```

### AWS Account Setup

1. **Create AWS Account**
   - Sign up at [aws.amazon.com](https://aws.amazon.com)
   - Complete account verification

2. **Configure AWS CLI**
   ```bash
   aws configure
   # Enter your Access Key ID
   # Enter your Secret Access Key
   # Enter your default region (e.g., us-east-1)
   # Enter your default output format (json)
   ```

3. **Verify Access**
   ```bash
   aws sts get-caller-identity
   ```

## 🚀 Quick Deployment

### 1. Clone Repository
```bash
git clone <repository-url>
cd vantagepointcrm_clean
```

### 2. Install Dependencies
```bash
cd infrastructure
npm install
```

### 3. Deploy Development Environment
```bash
./scripts/deploy.sh dev deploy
```

### 4. Deploy Production Environment
```bash
./scripts/deploy.sh production deploy
```

## 📋 Detailed Deployment Steps

### Step 1: Environment Preparation

1. **Set Environment Variables**
   ```bash
   export AWS_DEFAULT_REGION=us-east-1
   export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
   export CDK_DEFAULT_REGION=us-east-1
   ```

2. **Bootstrap CDK** (First time only)
   ```bash
   cdk bootstrap
   ```

### Step 2: Configuration

1. **Review Configuration**
   ```bash
   # Development
   cat config/dev.json
   
   # Production
   cat config/production.json
   ```

2. **Customize Settings**
   - Update domain names
   - Adjust instance sizes
   - Modify security settings

### Step 3: Deployment

1. **Synthesize Template**
   ```bash
   cdk synth --context environment=dev
   ```

2. **Review Changes**
   ```bash
   cdk diff --context environment=dev
   ```

3. **Deploy Stack**
   ```bash
   cdk deploy --context environment=dev
   ```

### Step 4: Verification

1. **Check Stack Status**
   ```bash
   aws cloudformation describe-stacks --stack-name VantagePoint-dev
   ```

2. **Test Endpoints**
   ```bash
   # Get API Gateway URL
   aws cloudformation describe-stacks \
     --stack-name VantagePoint-dev \
     --query 'Stacks[0].Outputs[?OutputKey==`APIGatewayURL`].OutputValue' \
     --output text
   ```

3. **Verify Resources**
   ```bash
   # Check RDS instance
   aws rds describe-db-instances --db-instance-identifier vantagepoint-dev-database
   
   # Check Lambda function
   aws lambda get-function --function-name VantagePoint-dev-VantagePointAPI
   ```

## 🔧 Environment-Specific Deployment

### Development Environment

**Purpose**: Local development and testing

**Configuration**:
- Single AZ deployment
- t3.micro instances
- Minimal storage
- Cost-optimized

**Deployment**:
```bash
./scripts/deploy.sh dev deploy
```

**Estimated Cost**: ~$78/month

### Staging Environment

**Purpose**: Pre-production testing

**Configuration**:
- Multi-AZ deployment
- t3.small instances
- Production-like setup
- Enhanced monitoring

**Deployment**:
```bash
./scripts/deploy.sh staging deploy
```

**Estimated Cost**: ~$200/month

### Production Environment

**Purpose**: Live production system

**Configuration**:
- Multi-AZ deployment
- t3.medium+ instances
- Maximum security
- Full monitoring

**Deployment**:
```bash
./scripts/deploy.sh production deploy
```

**Estimated Cost**: ~$343/month

## 🔄 Update Deployment

### 1. Code Changes
```bash
# Make changes to infrastructure code
# Test locally
npm run build
npm test
```

### 2. Deploy Updates
```bash
# Review changes
cdk diff --context environment=dev

# Deploy updates
cdk deploy --context environment=dev
```

### 3. Verify Updates
```bash
# Check deployment status
aws cloudformation describe-stacks --stack-name VantagePoint-dev

# Test functionality
curl -X GET https://your-api-gateway-url/dev/health
```

## 🗑️ Cleanup Deployment

### Development Environment
```bash
./scripts/deploy.sh dev destroy
```

### Production Environment
```bash
# ⚠️ WARNING: This will delete all data!
./scripts/deploy.sh production destroy
```

## 🔍 Troubleshooting

### Common Issues

1. **Bootstrap Required**
   ```bash
   Error: This stack uses assets, so the toolkit stack must be deployed
   Solution: cdk bootstrap
   ```

2. **Permissions Error**
   ```bash
   Error: User is not authorized to perform: cloudformation:CreateStack
   Solution: Ensure IAM user has sufficient permissions
   ```

3. **Resource Limits**
   ```bash
   Error: You have requested more vCPU capacity than your current vCPU limit
   Solution: Request limit increase in AWS Support Center
   ```

4. **Region Mismatch**
   ```bash
   Error: Stack is in region us-west-2, but you are in us-east-1
   Solution: Set correct region: aws configure set region us-west-2
   ```

### Debug Commands

1. **Check CDK Version**
   ```bash
   cdk --version
   ```

2. **List Stacks**
   ```bash
   cdk list --context environment=dev
   ```

3. **Show Stack Details**
   ```bash
   aws cloudformation describe-stacks --stack-name VantagePoint-dev
   ```

4. **Check CloudFormation Events**
   ```bash
   aws cloudformation describe-stack-events --stack-name VantagePoint-dev
   ```

## 📊 Monitoring Deployment

### CloudFormation Console
1. Go to AWS CloudFormation console
2. Select your stack
3. Review events and resources

### CloudWatch Logs
1. Go to CloudWatch console
2. Check Lambda function logs
3. Review API Gateway logs

### Cost Monitoring
```bash
# Run cost estimation
./scripts/cost-estimate.sh dev
./scripts/cost-estimate.sh production
```

## 🔐 Security Considerations

### Pre-Deployment
- [ ] Review security groups
- [ ] Verify encryption settings
- [ ] Check IAM permissions
- [ ] Validate network configuration

### Post-Deployment
- [ ] Test authentication
- [ ] Verify encryption
- [ ] Check audit logging
- [ ] Validate access controls

## 📈 Scaling Considerations

### Horizontal Scaling
- Lambda concurrency limits
- RDS read replicas
- ElastiCache cluster mode
- API Gateway throttling

### Vertical Scaling
- Instance size increases
- Memory allocation
- Storage capacity
- Network bandwidth

## 🔄 Backup and Recovery

### Automated Backups
- RDS automated backups (7-30 days)
- S3 versioning enabled
- CloudTrail log retention

### Manual Backups
```bash
# Create RDS snapshot
aws rds create-db-snapshot \
  --db-instance-identifier vantagepoint-dev-database \
  --db-snapshot-identifier vantagepoint-dev-backup-$(date +%Y%m%d)
```

### Disaster Recovery
- Multi-AZ deployment (production)
- Cross-region backups
- Infrastructure as Code
- Automated recovery procedures

## 📞 Support

### Getting Help
- Check AWS documentation
- Review CloudFormation events
- Contact AWS support
- Check community forums

### Emergency Contacts
- **AWS Support**: [support.aws.amazon.com](https://support.aws.amazon.com)
- **CDK Documentation**: [docs.aws.amazon.com/cdk](https://docs.aws.amazon.com/cdk)
- **Stack Overflow**: Tag `aws-cdk`

---

**Last Updated**: October 2024  
**Next Review**: January 2025  
**Document Owner**: DevOps Team
