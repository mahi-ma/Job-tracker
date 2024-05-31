import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';

export class JobTrackerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create DynamoDB table
    const table = new dynamodb.Table(this, 'JobApplications', {
      partitionKey: { name: 'ApplicationId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY // Not for production use
    });

    // Add GSI for FollowUpTime
    table.addGlobalSecondaryIndex({
      indexName: 'FollowUpTimeIndex',
      partitionKey: { name: 'FollowUpTime', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'ApplicationId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

      // Create SNS topic
      const followUpTopic = new sns.Topic(this, 'FollowUpTopic', {
        displayName: 'Job Application Follow-Up Topic'
      });

      // Export the ARN of the SNS topic
      new cdk.CfnOutput(this, 'FollowUpTopicArn', {
        value: followUpTopic.topicArn
      });

    // Create Lambda function for inserting the data
    const handler = new lambda.Function(this, 'JobApplicationHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: table.tableName
      }
    });

    //create lambda function for trigerring the search and send notification
    const followUpHandler = new lambda.Function(this, 'JobApplicationFollowUpHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda/followUpHandler'), 
      handler: 'index.handler',
      environment: {
        TABLE_NAME: table.tableName,
        SNS_TOPIC_ARN: followUpTopic.topicArn, //SNS topic ARN
        TRIGGER_TIME: '0 0 * * *' // Trigger at 12 AM UTC
      }
    });

    const rule = new events.Rule(this, 'FollowUpRule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '0' }) // Trigger at 12 AM UTC
    });

    // Add the Lambda function as a target for the rule
    rule.addTarget(new targets.LambdaFunction(followUpHandler));

    table.grantReadWriteData(handler);
    // Grant necessary permissions to the follow-up handler
    table.grantReadWriteData(followUpHandler);
    followUpTopic.grantPublish(followUpHandler);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'job-application-api', {
      restApiName: 'Job Application Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS, // this is also the default
      }
    });

    // Integrate Lambda function with API Gateway
    const postJobApplicationIntegration = new apigateway.LambdaIntegration(handler);

    // Create POST method on the /applications resource
    const applicationsResource = api.root.addResource('applications');
    applicationsResource.addMethod('POST', postJobApplicationIntegration);
  }
}
