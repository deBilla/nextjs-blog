---
title: "Chaos faced while deploying lambda with AWS SAM"
date: "2023-03-25"
preview: "Hi Guys, If you have being following me for a while, you should know, I did an article series on creating a web backend for a charity…"
description: "The deployment problems that hit while shipping a charity web app on AWS SAM, Lambda, and DynamoDB, and how each one was resolved."
tags: ["aws", "nodejs", "devops"]
mediumUrl: "https://medium.com/@billacode/chaos-faced-while-deploying-lambda-with-aws-sam-614691b75bcc"
---
Hi Guys, If you have being following me for a while, you should know, I did an article series on creating a web backend for a charity application using AWS SAM, lambda and DynamoDB. Thing is I never actually deployed any of these because AWS SAM has this functionality to invoke from local and test. But after a while, when I was starting to connect my front end app and this backend, I got stuck big time.

![Chaos faced while deploying lambda with AWS SAM — figure 1](./images/chaos-faced-while-deploying-lambda-with-aws-sam/1.jpg)

Well, now I should clear the road for any person who followed that series. In this article I will specifically touch every problem I faced and solutions I applied. For more visibility I would add links to article series here.

Now before discussing problems, I will post the previous template.yaml file here.

```yaml
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
        - S3CrudPolicy:
            BucketName: !Ref FileBucket
      Environment:
        Variables:
          SAMPLE_TABLE: !Ref SampleTable
          FILE_BUCKET: !Ref FileBucket
      Events:
        Student:
          Type: Api
          Properties:
            Path: /student
            Method: get
        FileUpload:
          Type: S3
          Properties:
            Bucket: !Ref FileBucket
            Events:
              - 's3:ObjectCreated:*'

    Metadata:
      BuildMethod: esbuild
      BuildProperties:
        Minify: true
        Target: "es2020"
        EntryPoints: 
        - app.ts

  FileBucket:
    Type: 'AWS::S3::Bucket'

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

So the first problem I faced is related to the S3 bucket defined in the template. As the way I have defined it, it gives a circular dependency error. So I checked what are the necessary fields we need to handle the FileUpload event. Accordingly, I have changed the template file and issue was solved.

Now the code got deployed. But when I tried to access it. GET student endpoint worked fine but POST, PUT, DELETE they were giving a 408 response.

Now first thing I did was to go to the AWS api gateway service from web and checked the created REST api. So under the methods there, I could only find GET. That’s when I realised template file is all wrong. In the previous template file, we have only 1 event and for all 4 REST methods I should create 4 events. So that was the second change. Now everything seemed to work but I was more comfortable passing params, compared to the path parameters we used in the code. So as the third change, I did that. Now app was responding properly in Postman but obviously when it connected to the UI, it started giving CORS errors. For the GET requests adding authorisation headers in the app.ts file worked fine but for PUT, POST, DELETE, I had to add them to the end point configs. For this I had to edit the template file. Now with all these changes new template.yaml file look like this.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: serendib-scholarship-ws
Globals:
  Function:
    Timeout: 3
  Api:
    Cors:
      AllowMethods: "'GET,POST,OPTIONS'"
      AllowHeaders: "'content-type'"
      AllowOrigin: "'*'"

Resources:
  SampleTable:
    Type: AWS::Serverless::SimpleTable
    Properties:
      PrimaryKey:
        Name: id
        Type: String
      ProvisionedThroughput:
        ReadCapacityUnits: 2
        WriteCapacityUnits: 2

  SponsorTable:
    Type: AWS::Serverless::SimpleTable
    Properties:
      PrimaryKey:
        Name: id
        Type: String
      ProvisionedThroughput:
        ReadCapacityUnits: 2
        WriteCapacityUnits: 2

  FileBucket:
    Type: 'AWS::S3::Bucket'

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
        GetStudent:
          Type: Api
          Properties:
            Path: /student
            Method: get
        CreateStudent:
          Type: Api
          Properties:
            Path: /student
            Method: post
        UpdateStudent:
          Type: Api
          Properties:
            Path: /student
            Method: put
        DeleteStudent:
          Type: Api
          Properties:
            Path: /student
            Method: delete
        FileUpload:
          Type: S3
          Properties:
            Bucket: !Ref FileBucket
            Events:
              - 's3:ObjectCreated:*'

    Metadata:
      BuildMethod: esbuild
      BuildProperties:
        Minify: true
        Target: "es2020"
        EntryPoints: 
        - app.ts

  SponsorFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: sponsor/
      Handler: app.lambdaHandler
      Runtime: nodejs16.x
      Architectures:
        - x86_64
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref SponsorTable
      Environment:
        Variables:
          SPONSOR_TABLE: !Ref SponsorTable
      Events:
        GetStudent:
          Type: Api
          Properties:
            Path: /sponsor
            Method: get
        CreateStudent:
          Type: Api
          Properties:
            Path: /sponsor
            Method: post
        UpdateStudent:
          Type: Api
          Properties:
            Path: /sponsor
            Method: put
        DeleteStudent:
          Type: Api
          Properties:
            Path: /sponsor
            Method: delete

    Metadata:
      BuildMethod: esbuild
      BuildProperties:
        Minify: true
        Target: "es2020"
        EntryPoints: 
        - app.ts

Outputs:
  WebEndpoint:
    Description: "API Gateway endpoint URL for Prod stage"
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/"
```

And the app.ts file look like this,

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient,  ScanCommand, PutItemCommand, GetItemCommand, DeleteItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const tableName = process.env.SAMPLE_TABLE;
const client = new DynamoDBClient({ region: "us-east-1" });

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let results: any;
    let response: APIGatewayProxyResult;

    try {
        if (event.httpMethod) {
            switch (event.httpMethod) {
                case 'GET':
                    if (event.queryStringParameters && event.queryStringParameters.id != null) {
                        results = await getStudent(event.queryStringParameters.id);
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
                    results = await deleteStudents(event.queryStringParameters.id)
                    break;
                default:
                    throw new Error('Unidentified event!!!');
            }
        } else if (event['Records'][0]['s3']) {
            const key = event['Records'][0]['s3']['object']['key'];
            const id = "f682386e-e34f-4d9f-b6f4-9398fb6a131d";
            results = await updateStudentFileName(key, id);
        }
        
        response = {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*"
            },
            body: JSON.stringify({
                message: results,
            }),
        };
    } catch (err: unknown) {
        console.log(err);
        response = {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
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

        return (Items) ? Items.map((s: any) => unmarshall(s)) : [];
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
          Key: marshall({ id: event.queryStringParameters.id }),
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

const updateStudentFileName = async (key: string, id: string) => {
    console.log(key);

    try {
        const paramsGet = {
            TableName: tableName,
            Key: marshall({ id: id })
        };

        const { Item } = await client.send(new GetItemCommand(paramsGet));
        const item = unmarshall(Item);
        console.log(item.files);
        const files = item.files ? [...item.files, {name: key}] : [{name: key}]

        const params = {
          TableName: tableName,
          Item: {
            id: id,
            files: files,
            name: item.name,
            age: item.age
          }
        };

        const docClient = DynamoDBDocumentClient.from(client);

        let res = await docClient.send(new PutCommand(params));
        console.log(res)
    
        return res;
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

Now what you have to do is first build the project using sam and then deploy.

```bash
sam build
sam deploy --guided
```

Now there will be few questions asked when deploying using guided option, just answer them. If any issue please post the issue as a comment. Now after doing your tests and all you can delete the stack. Use the following command for that

```
sam delete
```

For me this deleted whole stack but leaved the s3 bucket used for cloudformation not deleted. Without hesitation, I manually delete that folder. Then in another time, when I retry deploying, Deploying stopped with an error saying it can’t find the s3 bucket. So I had to create an empty bucket with same name. I’m pretty sure there might be a problem with the access key I was using, may be they didn’t have enough permission or something but it was easy fix.

As usual I will leave the source code here.

That’s for now. Sorry for any inconvinience caused. If there are any issues please post a comment here. Thanks Guys !!!!

Happy Coding ;)
