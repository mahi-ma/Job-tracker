import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Create DynamoDB client
const dynamoDbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);

export const handler = async (event) => {
  const body = JSON.parse(event.body);
  const { title, link, followUpTime, recurring } = body;
  const applicationId = uuidv4();

  const params = {
    TableName: process.env.TABLE_NAME,
    Item: {
      ApplicationId: applicationId,
      Title: title,
      Link: link,
      CreatedTime: new Date().toISOString(),
      FollowUpTime: followUpTime,
      Recurring: recurring
    }
  };

  try {
    const command = new PutCommand(params);
    await ddbDocClient.send(command);

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ message: 'Job application added successfully', applicationId: applicationId })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ error: 'Could not add job application' })
    };
  }
};
