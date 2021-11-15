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
  // get current state
  try {
    const { connectionId } = event.requestContext;
    const { name } = JSON.parse(event.body);
    const stateKey = { pk: `state#${name}`, sk: `state#${name}` };
    const { Item: item } = await client.get({
      TableName: DYNAMODB_TABLE,
      Key: stateKey,
    });

    // create subscription
    const startedAt = Date.now();
    const subscription = {
      pk: `state#${name}`,
      sk: `subscription#${connectionId}`,
      gsi1pk: `connection#${connectionId}`,
      gsi1sk: `status#connected#` + startedAt,
      startedAt
    };
    await client.put({ TableName: DYNAMODB_TABLE, Item: subscription });

    // send current state to client
    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: new TextEncoder().encode(item.value),
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
