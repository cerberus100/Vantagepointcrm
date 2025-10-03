#!/bin/bash

# VantagePoint Infrastructure Cost Estimation
# This script provides rough cost estimates for different environments

set -e

ENVIRONMENT=${1:-dev}

echo "💰 VantagePoint Infrastructure Cost Estimation"
echo "Environment: $ENVIRONMENT"
echo "=============================================="

# AWS Pricing (approximate, as of 2024)
# These are rough estimates and actual costs may vary

case $ENVIRONMENT in
    "dev")
        echo "📊 Development Environment Monthly Costs:"
        echo ""
        echo "RDS PostgreSQL (t3.micro, 20GB):     ~$15/month"
        echo "ElastiCache Redis (t3.micro):        ~$12/month"
        echo "Lambda (512MB, 1M requests):         ~$5/month"
        echo "API Gateway (1M requests):           ~$3.50/month"
        echo "S3 Storage (10GB):                   ~$0.25/month"
        echo "CloudWatch Logs (1GB):               ~$0.50/month"
        echo "NAT Gateway:                         ~$32/month"
        echo "VPC Endpoints:                       ~$7/month"
        echo "CloudTrail:                          ~$2/month"
        echo "GuardDuty:                           ~$0/month (free tier)"
        echo "Security Hub:                        ~$0/month (free tier)"
        echo "WAF:                                 ~$1/month"
        echo ""
        echo "🎯 Total Estimated Monthly Cost: ~$78"
        echo ""
        echo "💡 Cost Optimization Tips:"
        echo "- Use Spot Instances for non-critical workloads"
        echo "- Implement auto-scaling policies"
        echo "- Use S3 Intelligent Tiering"
        echo "- Schedule dev environment shutdown during off-hours"
        ;;
    "production")
        echo "📊 Production Environment Monthly Costs:"
        echo ""
        echo "RDS PostgreSQL (t3.small, 100GB, Multi-AZ): ~$85/month"
        echo "ElastiCache Redis (t3.small, 2 nodes):      ~$50/month"
        echo "Lambda (1024MB, 10M requests):              ~$20/month"
        echo "API Gateway (10M requests):                 ~$35/month"
        echo "S3 Storage (100GB):                         ~$2.50/month"
        echo "CloudWatch Logs (10GB):                     ~$5/month"
        echo "NAT Gateway (2 AZs):                        ~$64/month"
        echo "VPC Endpoints:                              ~$14/month"
        echo "CloudTrail:                                 ~$5/month"
        echo "GuardDuty:                                  ~$30/month"
        echo "Security Hub:                               ~$10/month"
        echo "WAF:                                        ~$5/month"
        echo "Application Load Balancer:                  ~$18/month"
        echo ""
        echo "🎯 Total Estimated Monthly Cost: ~$343"
        echo ""
        echo "💡 Cost Optimization Tips:"
        echo "- Use Reserved Instances for predictable workloads"
        echo "- Implement auto-scaling based on demand"
        echo "- Use S3 Intelligent Tiering for long-term storage"
        echo "- Monitor and optimize Lambda cold starts"
        echo "- Use CloudFront for static content delivery"
        ;;
    *)
        echo "❌ Unknown environment: $ENVIRONMENT"
        echo "Available environments: dev, production"
        exit 1
        ;;
esac

echo ""
echo "📈 Scaling Considerations:"
echo "- Costs scale with usage (requests, storage, compute)"
echo "- Consider implementing cost alerts and budgets"
echo "- Use AWS Cost Explorer for detailed analysis"
echo "- Implement resource tagging for cost allocation"

echo ""
echo "🔍 Cost Monitoring:"
echo "- Set up AWS Budgets with alerts"
echo "- Use AWS Cost Explorer for analysis"
echo "- Implement resource tagging strategy"
echo "- Regular cost reviews and optimization"

echo ""
echo "⚠️  Disclaimer:"
echo "These are rough estimates based on typical usage patterns."
echo "Actual costs may vary based on:"
echo "- Actual usage patterns"
echo "- Data transfer costs"
echo "- Regional pricing differences"
echo "- Reserved instance discounts"
echo "- Spot instance usage"
