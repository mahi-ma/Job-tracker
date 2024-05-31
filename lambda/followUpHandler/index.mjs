import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const tableName = process.env.tableName;
const snsTopicARN = process.env.SNS_TOPIC_ARN;

const dynamoDbClient = new DynamoDBClient({});
const snsClient = new SNSClient({});

const dynamodb = DynamoDBDocumentClient.from(dynamoDbClient);

export const handler = async (event) => {
  const currentTime = new Date().toISOString();

  const params = {
    TableName: tableName,
    FilterExpression: 'FollowUpTime <= :currentTime',
    ExpressionAttributeValues: {
      ':currentTime': currentTime
    }
  };

  try {
    const scanCommand = new ScanCommand(params);
    const { Items: applications } = await dynamodb.send(scanCommand);
    console.log("here");

    // Process each application
    for (const application of applications) {
      // Send email notification
      const message = `Reminder: Follow up on job application titled "${application.Title}".`;
      const snsParams = {
        Message: message,
        Subject: 'Job Application Follow-Up Reminder',
        TopicArn: snsTopicARN // SNS topic ARN
      };
      const publishCommand = new PublishCommand(snsParams);
      await snsClient.send(publishCommand);

      // Delete item if recurring is false
      if (!application.Recurring) {
        await deleteItem(application.ApplicationId);
      } else {
        // Update follow-up time to next 3 days if recurring is true
        const nextFollowUpTime = new Date();
        nextFollowUpTime.setDate(nextFollowUpTime.getDate() + 3);
        await updateFollowUpTime(application.ApplicationId, nextFollowUpTime.toISOString());
      }
    }

    // Return a success response
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Follow-up check completed', applications: applications })
    };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not scan follow-up applications' })
    };
  }
};

async function deleteItem(applicationId) {
  const params = {
    TableName: tableName,
    Key: {
      'ApplicationId': applicationId
    }
  };
  const deleteCommand = new DeleteCommand(params);
  await dynamodb.send(deleteCommand);
}

async function updateFollowUpTime(applicationId, followUpTime) {
  const params = {
    TableName: tableName,
    Key: {
      'ApplicationId': applicationId
    },
    UpdateExpression: 'SET FollowUpTime = :followUpTime',
    ExpressionAttributeValues: {
      ':followUpTime': followUpTime
    },
    ReturnValues: "UPDATED_NEW"
  };
  const updateCommand = new UpdateCommand(params);
  await dynamodb.send(updateCommand);
}
