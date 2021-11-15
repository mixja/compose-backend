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
  var subscriptions;
  try {
    const subscriptionsData = await client.query({
      TableName: DYNAMODB_TABLE,
      IndexName: DYNAMODB_GSI1_INDEX, // TODO - verify that this gets pulled in correctly
      KeyConditionExpression:
        "name = :name and attribute_not_exists(unsubscribedAt)", // should I add a GSI on unsubscribedAt?
      ExpressionAttributeValues: {
        ":name": name,
      },
    });
    console.log(subscriptionsData); // TODO - remove this after debugging
    subscriptions = subscriptionsData.Items;
  } catch (e) {
    // This really should never error
    console.log(e);
    return { statusCode: 200 }; // don't need to bug the current user about it though
  }

  // send new state to all subscriptions
  const valueJSONText = new TextEncoder().encode(valueJSON);
  Promise.all(
    subscriptions.map((subscription) => {
      const connectionId = subscription.pk.split("#")[1];
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
};

// for local testing:
// handler({
//   requestContext: { connectionId: "local-steve-test" },
//   body: '{"name": "foo"}',
// }).then(console.log);
