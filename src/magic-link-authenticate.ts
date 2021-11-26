import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

const dynamodb = new DynamoDB({});
const client = DynamoDBDocument.from(dynamodb);
const { DYNAMODB_TABLE } = process.env;

export const handler = async (event, context?) => {
  const { connectionId } = event.requestContext;
  const email = JSON.parse(event.body).email;

  // TODO - look up email in db

  // TODO - send magic link to email

  return { statusCode: 200 };
};
