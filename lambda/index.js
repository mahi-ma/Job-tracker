const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
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
    await dynamodb.put(params).promise();
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ message: 'Job application added successfully', applicationId: applicationId })
    };
  } catch (error) {
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
