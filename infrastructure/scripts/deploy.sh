#!/bin/bash

# VantagePoint Infrastructure Deployment Script
# Usage: ./scripts/deploy.sh [environment] [action]
# Example: ./scripts/deploy.sh dev deploy

set -e

ENVIRONMENT=${1:-dev}
ACTION=${2:-deploy}

echo "🚀 VantagePoint Infrastructure Deployment"
echo "Environment: $ENVIRONMENT"
echo "Action: $ACTION"
echo "=========================================="

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "❌ AWS CDK not installed. Installing..."
    npm install -g aws-cdk
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Bootstrap CDK (only needed once per account/region)
echo "🥾 Bootstrapping CDK (if needed)..."
cdk bootstrap --context environment=$ENVIRONMENT

case $ACTION in
    "deploy")
        echo "🚀 Deploying infrastructure..."
        cdk deploy --context environment=$ENVIRONMENT --require-approval never
        ;;
    "destroy")
        echo "💥 Destroying infrastructure..."
        read -p "Are you sure you want to destroy the $ENVIRONMENT environment? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            cdk destroy --context environment=$ENVIRONMENT --force
        else
            echo "❌ Deployment cancelled."
            exit 1
        fi
        ;;
    "diff")
        echo "📊 Showing differences..."
        cdk diff --context environment=$ENVIRONMENT
        ;;
    "synth")
        echo "📝 Synthesizing CloudFormation template..."
        cdk synth --context environment=$ENVIRONMENT
        ;;
    "list")
        echo "📋 Listing stacks..."
        cdk list --context environment=$ENVIRONMENT
        ;;
    *)
        echo "❌ Unknown action: $ACTION"
        echo "Available actions: deploy, destroy, diff, synth, list"
        exit 1
        ;;
esac

echo "✅ Operation completed successfully!"
