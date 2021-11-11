import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
// import {
//   ApiGatewayManagementApiClient,
//   PostToConnectionCommand,
// } from "@aws-sdk/client-apigatewaymanagementapi";

const dynamodb = new DynamoDB({});
const client = DynamoDBDocument.from(dynamodb);
const { DYNAMODB_TABLE } = process.env;

export const handler = async (event, context?) => {
  console.log("started");
  console.log(event);
  const { connectionId } = event.requestContext;
  const name = JSON.parse(event.body).name;
  console.log(`parsed ${name}`);
  // create subscription
  const SubscriptionKey = {
    pk: `subscription#${name}`,
    sk: `subscription#${name}`,
  };
  const Subscription = { ...SubscriptionKey, startedAt: Date.now() };
  try {
    console.log(Subscription);
    await client.put({ TableName: DYNAMODB_TABLE, Item: Subscription });
    console.log("successful put");
  } catch (e) {
    console.log(e);
    return { statusCode: 500, body: e.stack };
  }

  // return current state
  try {
    const StateKey = { pk: `state#${name}`, sk: `state#${name}` };
    const State = await client.get({
      TableName: DYNAMODB_TABLE,
      Key: StateKey,
    });
    console.log(State);
    return { statusCode: 200, body: State };
  } catch (e) {
    console.log(e);
    return { statusCode: 500, body: e.stack };
  }

  // const command = new PostToConnectionCommand({
  //   ConnectionId: connectionId,
  //   Data: new TextEncoder().encode(message)
  // })
  // const api = new ApiGatewayManagementApiClient({
  //   endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`
  // })
};
