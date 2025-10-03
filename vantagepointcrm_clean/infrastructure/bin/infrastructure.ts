#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VantagePointStack } from '../lib/infrastructure-stack';

const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = app.node.tryGetContext('environment') || 'dev';
const domainName = app.node.tryGetContext('domainName');

// Development environment
new VantagePointStack(app, `VantagePoint-${environment}`, {
  environment,
  domainName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Environment: environment,
    Application: 'VantagePoint',
    ManagedBy: 'CDK',
  },
});

// Production environment (commented out - uncomment when ready)
// new VantagePointStack(app, 'VantagePoint-production', {
//   environment: 'production',
//   domainName: 'your-domain.com',
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: 'us-east-1',
//   },
//   tags: {
//     Environment: 'production',
//     Application: 'VantagePoint',
//     ManagedBy: 'CDK',
//   },
// });