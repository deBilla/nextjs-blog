---
title: "AWS Lambda Typescript(Charity Web App) — Student service connected to DynamoDB"
date: "2022-10-22"
preview: "Hey Guys !!!, In our last tutorial we handled the basic CRUD operations for the Student service. We wrote some dummy methods which were…"
description: "Replacing hardcoded stubs with real DynamoDB persistence in the TypeScript Lambda student service behind the charity web app."
tags: ["aws", "nodejs", "microservices"]
mediumUrl: "https://medium.com/@billacode/aws-lambda-typescript-charity-web-app-student-service-connected-to-dynamodb-814405a95f3f"
---
Hey Guys !!!, In our last tutorial we handled the basic CRUD operations for the Student service. We wrote some dummy methods which were returning hardcoded values. In this tutorial we are going one step further, and we will connect our service to a DynamoDB. Link to what we have been doing so far.

DynamoDB is a nosql type of database. As our use case is pretty small, I’m going with this. Before doing any logic changes we have to include our new infrastructure in the template.yaml file. So let’s update it.

```
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: serendib-scholarship-ws
Globals:
  Function:
    Timeout: 3

Resources:
  StudentFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: student/
      Handler: app.lambdaHandler
      Runtime: nodejs16.x
      Architectures:
        - x86_64
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref SampleTable
      Environment:
        Variables:
          SAMPLE_TABLE: !Ref SampleTable
      Events:
        Student:
          Type: Api
          Properties:
            Path: /student
            Method: get
    Metadata:
      BuildMethod: esbuild
      BuildProperties:
        Minify: true
        Target: "es2020"
        EntryPoints: 
        - app.ts

  SampleTable:
    Type: AWS::Serverless::SimpleTable
    Properties:
      PrimaryKey:
        Name: id
        Type: String
      ProvisionedThroughput:
        ReadCapacityUnits: 2
        WriteCapacityUnits: 2

Outputs:
  WebEndpoint:
    Description: "API Gateway endpoint URL for Prod stage"
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/"
```

I have removed many of the redundant code. So if you are seeing a big change from previous file, don’t worry. Now as you can see I have created a DynamoTable, Now let’s implement changes in the handler. First of all, you have to update the package.json file to include some dependencies.

```json
{
  "name": "student",
  "version": "1.0.0",
  "description": "Student service for serendib scholarship ws",
  "main": "app.js",
  "repository": "https://github.com/deBilla/serendib-scholarship-ws/student",
  "author": "SAM CLI",
  "license": "MIT",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "3.194.0",
    "@aws-sdk/util-dynamodb": "3.194.0",
    "@aws-sdk/lib-dynamodb": "3.194.0",
    "esbuild": "^0.14.14"
  },
  "scripts": {
    "unit": "jest",
    "lint": "eslint '*.ts' --quiet --fix",
    "compile": "tsc",
    "test": "npm run compile && npm run unit"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.92",
    "@types/jest": "^27.4.0",
    "@types/node": "^17.0.13",
    "@typescript-eslint/eslint-plugin": "^5.10.2",
    "@typescript-eslint/parser": "^5.10.2",
    "esbuild-jest": "^0.5.0",
    "eslint": "^8.8.0",
    "eslint-config-prettier": "^8.3.0",
    "eslint-plugin-prettier": "^4.0.0",
    "jest": "^27.5.0",
    "prettier": "^2.5.1",
    "ts-node": "^10.4.0",
    "typescript": "^4.5.5"
  }
}
```

Remember put these in the dependencies section, not in the devDependencies (I got an error). Now in the handler file first thing we have to do is initialising a DB client for DynamoDB. After that for each of the CRUD operations we can implement the code.

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient,  ScanCommand, PutItemCommand, GetItemCommand, DeleteItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const tableName = process.env.SAMPLE_TABLE;
const client = new DynamoDBClient({ region: "us-east-1" });

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let results: any;
    let response: APIGatewayProxyResult;

    try {
        switch (event.httpMethod) {
            case 'GET':
                if (event.pathParameters.id != null) {
                    results = await getStudent(event.pathParameters.id);
                } else {
                    results = await getStudents();
                }
                
                break;
            case 'POST':
                results = await createStudents(event);
                break;
            case 'PUT':
                results = await updateStudents(event)
                break;
            case 'DELETE':
                results = await deleteStudents(event.pathParameters.id)
                break;
            default:
                throw new Error('Unidentified event!!!');
        }
        
        response = {
            statusCode: 200,
            body: JSON.stringify({
                message: results,
            }),
        };
    } catch (err: unknown) {
        console.log(err);
        response = {
            statusCode: 500,
            body: JSON.stringify({
                message: err instanceof Error ? err.message : 'some error happened',
            }),
        };
    }

    return response;
};

const getStudents = async () => {
    try {
        const params = {
            TableName : tableName
        };
        const { Items } = await client.send(new ScanCommand(params));

        return Items;
    } catch (e) {
        throw e;
    }
}

const getStudent = async (studentId: string) => {
    try {
        const params = {
            TableName: tableName,
            Key: marshall({ id: studentId })
        };

        const { Item } = await client.send(new GetItemCommand(params));

        return (Item) ? unmarshall(Item) : {};
    } catch(e) {
        throw e;
    }
}

const createStudents = async (event: APIGatewayProxyEvent) => {
    try {
        const student = JSON.parse(event.body);
        const studentId = uuidv4();
        student.id = studentId;

        const params = {
            TableName: tableName,
            Item: marshall(student || {})
        };

        return await client.send(new PutItemCommand(params));
    } catch(e) {
        throw e;
    }
}

const updateStudents = async (event: APIGatewayProxyEvent) => {
    try {
        const requestBody = JSON.parse(event.body);
        const objKeys = Object.keys(requestBody);   
    
        const params = {
          TableName: tableName,
          Key: marshall({ id: event.pathParameters.id }),
          UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
          ExpressionAttributeNames: objKeys.reduce((acc, key, index) => ({
              ...acc,
              [`#key${index}`]: key,
          }), {}),
          ExpressionAttributeValues: marshall(objKeys.reduce((acc, key, index) => ({
              ...acc,
              [`:value${index}`]: requestBody[key],
          }), {})),
        };
    
        return await client.send(new UpdateItemCommand(params));
    } catch(e) {
        console.error(e);
        throw e;
    }
}

const deleteStudents = async (studentId: string) => {
    try {
        const params = {
          TableName: tableName,
          Key: marshall({ id: studentId }),
        };
    
        return await client.send(new DeleteItemCommand(params));
    } catch(e) {
        throw e;
    }
}
```

If you carefully look at the app.ts file, you can see we keep the table name in the environment variables. So when doing the local Lambda invoke, this need to be retrieved. For that I created another json file named, env.json.

```json
{
    "StudentFunction": {
        "SAMPLE_TABLE": "serendib-student"
    }
}
```

After this if we don’t deploy our Lambda function to cloud yet, what we can do is just go to AWS account and create a DynamoDB table with the name **serendib-student**.

Before going any further, for your local terminal to access AWS account, you should provide relevant security tokens. The way to create these tokens can be found from one of my earlier medium article. I have bold out the letters for access key description for your convenience.

After setting up access keys and downloading the file, use following commands to export it to environment.

```bash
export AWS_ACCESS_KEY_ID=<YOUR_KEY>
export AWS_SECRET_ACCESS_KEY=<YOUR_SECRET>
export AWS_DEFAULT_REGION=us-east-1
```

After that we invoke the Lambda function like this.

```
sam local invoke StudentFunction --event events/student_post.json --env-vars env.json
```

You can see I have included the env.json in the command. For each CRUD operations I have updated the events. These can be view from this link.

You can try invoking different events, in events files please update the id to one of the ids created in your own database. So this is pretty much everything related to this. Now what is left is to implement the file upload for our application. Will deal it in another tutorial. [Github Link for the app can be found here](https://github.com/deBilla/serendib-scholarship-ws). Until then Happy Coding !!! :p

Deployment issue fixes

;)
