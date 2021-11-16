import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

const dynamodb = new DynamoDB({});
const client = DynamoDBDocument.from(dynamodb);
const { DYNAMODB_TABLE, DYNAMODB_GSI1_INDEX } = process.env;

export const handler = async (event, context?) => {
  const { connectionId } = event.requestContext;
  const { name, value } = JSON.parse(event.body);
  const valueJSON = JSON.stringify(value);

  // set current state
  try {
    const StateKey = { pk: `state#${name}`, sk: `state#${name}` };
    await client.put({
      TableName: DYNAMODB_TABLE,
      Item: {
        pk: `state#${name}`,
        sk: `state#${name}`,
        value: JSON.stringify(value),
        lastModifierConnectionId: connectionId,
        lastModifiedAt: Date.now(),
      },
    });
  } catch (e) {
    console.log(e);
    return { statusCode: 500 };
  }

  // get all clients by state name
  try {
    // TODO: add pagination
    const { Items: subscriptions } = await client.query({
      TableName: DYNAMODB_TABLE,
      KeyConditionExpression:
        "pk = :name and begins_with(sk, :subscription)",
      // Filter to only connected subscriptions
      FilterExpression:
        "begins_with(gsi1sk, :gsi1sk)",
      ExpressionAttributeValues: {
        ":name": `state#${name}`,
        ":subscription": "subscription#",
        ":gsi1sk": "status#connected#",
      },
    });
    // send new state to all subscriptions
    const valueJSONText = new TextEncoder().encode(valueJSON);
    await Promise.all(
      subscriptions.map((subscription) => {
        const connectionId = subscription.sk.split("#")[1];
        const command = new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: valueJSONText,
        });
        const api = new ApiGatewayManagementApiClient({
          endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
        });
        return api.send(command).catch((e) => {
          // TODO - depending on the error: retry or end subscription and connection
        });
      })
    );

    return { statusCode: 200 };
  } catch (e) {
    // This really should never error
    console.log(e);
    return { statusCode: 200 }; // don't need to bug the current user about it though
  }
};

// for local testing:
// handler({
//   requestContext: { connectionId: "local-steve-test" },
//   body: '{"name": "foo"}',
// }).then(console.log);
