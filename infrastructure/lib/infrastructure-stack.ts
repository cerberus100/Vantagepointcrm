import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as config from 'aws-cdk-lib/aws-config';
import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import { Construct } from 'constructs';

export interface VantagePointStackProps extends cdk.StackProps {
  environment: string;
  domainName?: string;
}

export class VantagePointStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly database: rds.DatabaseInstance;
  public readonly redis: elasticache.CfnCacheCluster;
  public readonly s3Bucket: s3.Bucket;
  public readonly userPool: cognito.UserPool;
  public readonly apiGateway: apigateway.RestApi;
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: VantagePointStackProps) {
    super(scope, id, props);

    // KMS Key for encryption
    const encryptionKey = new kms.Key(this, 'VantagePointEncryptionKey', {
      description: 'KMS key for VantagePoint CRM encryption',
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
        ],
      }),
    });

    // VPC with private subnets for database
    this.vpc = new ec2.Vpc(this, 'VantagePointVPC', {
      maxAzs: 2,
      natGateways: 1, // Cost optimization - single NAT gateway
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Groups
    const databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Lambda functions',
      allowAllOutbound: true,
    });

    // Allow Lambda to access database
    databaseSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to access PostgreSQL'
    );

    // RDS PostgreSQL Database
    this.database = new rds.DatabaseInstance(this, 'VantagePointDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [databaseSecurityGroup],
      databaseName: 'vantagepoint',
      credentials: rds.Credentials.fromGeneratedSecret('postgres', {
        secretName: 'vantagepoint/database/credentials',
      }),
      storageEncrypted: true,
      storageEncryptionKey: encryptionKey,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: false,
      deletionProtection: props.environment === 'production',
      multiAz: props.environment === 'production',
      storageType: rds.StorageType.GP2,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      enablePerformanceInsights: true,
      monitoringInterval: cdk.Duration.seconds(60),
    });

    // ElastiCache Redis for caching
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis cluster',
      subnetIds: this.vpc.privateSubnets.map(subnet => subnet.subnetId),
    });

    this.redis = new elasticache.CfnCacheCluster(this, 'VantagePointRedis', {
      cacheNodeType: 'cache.t3.micro',
      engine: 'redis',
      numCacheNodes: 1,
      vpcSecurityGroupIds: [lambdaSecurityGroup.securityGroupId],
      cacheSubnetGroupName: redisSubnetGroup.ref,
    });

    // S3 Bucket for file storage
    this.s3Bucket = new s3.Bucket(this, 'VantagePointStorage', {
      bucketName: `vantagepoint-storage-${props.environment}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: props.environment === 'production' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // Cognito User Pool for authentication
    this.userPool = new cognito.UserPool(this, 'VantagePointUserPool', {
      userPoolName: `vantagepoint-users-${props.environment}`,
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
        username: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: props.environment === 'production' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'VantagePointUserPoolClient', {
      userPool: this.userPool,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: true,
      refreshTokenValidity: cdk.Duration.days(30),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
    });

    // Lambda Function for API
    this.lambdaFunction = new lambda.Function(this, 'VantagePointAPI', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'dist/main.handler',
      code: lambda.Code.fromAsset('../backend-nestjs/dist'),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      environment: {
        NODE_ENV: props.environment,
        DATABASE_URL: this.database.instanceEndpoint.socketAddress,
        REDIS_URL: `redis://${this.redis.attrRedisEndpointAddress}:6379`,
        JWT_SECRET: 'your-jwt-secret-here', // Should be from Secrets Manager
        S3_BUCKET: this.s3Bucket.bucketName,
        USER_POOL_ID: this.userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // Grant permissions
    this.database.secret?.grantRead(this.lambdaFunction);
    this.s3Bucket.grantReadWrite(this.lambdaFunction);
    encryptionKey.grantEncryptDecrypt(this.lambdaFunction);

    // API Gateway
    this.apiGateway = new apigateway.RestApi(this, 'VantagePointAPIGateway', {
      restApiName: `VantagePoint API (${props.environment})`,
      description: 'VantagePoint CRM API',
      defaultCorsPreflightOptions: {
        allowOrigins: props.environment === 'production' 
          ? [`https://${props.domainName}`] 
          : ['http://localhost:3000'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        stageName: props.environment,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(this.lambdaFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // API Gateway routes
    this.apiGateway.root.addMethod('ANY', lambdaIntegration);
    this.apiGateway.root.addResource('{proxy+}').addMethod('ANY', lambdaIntegration);

    // WAF for API protection
    const waf = new wafv2.CfnWebACL(this, 'VantagePointWAF', {
      name: `vantagepoint-waf-${props.environment}`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
          },
        },
        {
          name: 'RateLimitRule',
          priority: 2,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'VantagePointWAF',
      },
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'WAFAssociation', {
      resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${this.apiGateway.restApiId}/stages/${props.environment}`,
      webAclArn: waf.attrArn,
    });

    // CloudTrail for audit logging
    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `vantagepoint-cloudtrail-${props.environment}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    new cloudtrail.Trail(this, 'VantagePointCloudTrail', {
      trailName: `vantagepoint-trail-${props.environment}`,
      bucket: cloudTrailBucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
    });

    // GuardDuty for threat detection
    new guardduty.CfnDetector(this, 'VantagePointGuardDuty', {
      enable: true,
      findingPublishingFrequency: 'FIFTEEN_MINUTES',
    });

    // Security Hub
    new securityhub.CfnHub(this, 'VantagePointSecurityHub', {
      tags: {
        Environment: props.environment,
        Application: 'VantagePoint',
      },
    });

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'DatabaseCPUAlarm', {
      metric: this.database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      metric: this.lambdaFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      description: 'RDS instance endpoint',
    });

    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: this.redis.attrRedisEndpointAddress,
      description: 'Redis cluster endpoint',
    });

    new cdk.CfnOutput(this, 'APIGatewayURL', {
      value: this.apiGateway.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.s3Bucket.bucketName,
      description: 'S3 bucket name',
    });
  }
}