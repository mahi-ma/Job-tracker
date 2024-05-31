# A portal to track and follow up on your job applications on time

Remember a time when you forgot to follow up on a application on time and now after many days, it feels awkward. Well, not anymore, with this tool, you will get thenotifications right in your email to follow up on applications

## project Description
- using AWS CDK, the project is creating API Gateway, 2 lambda functions, SNS topic and DynamoDB table
- Function of first lambda function is to insert data into dynamodb table when api is being called from frontend
- Function of second lambda function is to check for the data in dynamo table and send email notifications for job whom follow up time has passed, or update follow up time when recurring is set true
- Recurring flag enables the user to get recurring notifications for some jobs, just set flag to true from frontend when making api call
- The API gateway is responsible to direct the api request to appropriate lambda function
- The lambda can be run manually or with event bridge rule to get the notifications and run the script every day at some decided time

### To run the backend code and create AWS stack, just run the command "cdk deploy"

### To run the frontend, update API_URL from API gateway from AWS in index.html file and run the file

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
