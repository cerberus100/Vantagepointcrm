import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
export interface VantagePointStackProps extends cdk.StackProps {
    environment: string;
    domainName?: string;
}
export declare class VantagePointStack extends cdk.Stack {
    readonly vpc: ec2.Vpc;
    readonly database: rds.DatabaseInstance;
    readonly redis: elasticache.CfnCacheCluster;
    readonly s3Bucket: s3.Bucket;
    readonly userPool: cognito.UserPool;
    readonly apiGateway: apigateway.RestApi;
    readonly lambdaFunction: lambda.Function;
    constructor(scope: Construct, id: string, props: VantagePointStackProps);
}
