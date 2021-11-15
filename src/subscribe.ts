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
  const { name } = JSON.parse(event.body);

  // create subscription
  const SubscriptionKey = {
    pk: `subscription#${connectionId}`,
    sk: `subscription#${connectionId}`,
  };
  const Subscription = { ...SubscriptionKey, startedAt: Date.now(), name };
  try {
    await client.put({ TableName: DYNAMODB_TABLE, Item: Subscription });
  } catch (e) {
    console.log(e);
    return { statusCode: 500 };
  }

  // get current state
  try {
    const StateKey = { pk: `state#${name}`, sk: `state#${name}` };
    const State = await client.get({
      TableName: DYNAMODB_TABLE,
      Key: StateKey,
    });

    // send current state to client
    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: new TextEncoder().encode(State.Item.value),
    });
    const api = new ApiGatewayManagementApiClient({
      endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
    });
    await api.send(command);
    return { statusCode: 200 };
  } catch (e) {
    console.log(e);
    return { statusCode: 500 };
  }
};

// for local testing:
// handler({
//   requestContext: { connectionId: "local-steve-test" },
//   body: '{"name": "foo"}',
// }).then(console.log);
