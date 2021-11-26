import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const dynamodb = new DynamoDB({});
const client = DynamoDBDocument.from(dynamodb);
const { DYNAMODB_TABLE, DYNAMODB_GSI1_INDEX } = process.env;
var _ = require("lodash");

export const handler = async (event, context?) => {
  const { connectionId } = event.requestContext;

  // TODO: handle pagination
  // https://aws.amazon.com/blogs/developer/pagination-using-async-iterators-in-modular-aws-sdk-for-javascript/
  // https://github.com/aws/aws-sdk-js-v3/blob/94d0a2d8a0579ee0a742337937ad05735cfbc1ba/clients/client-dynamodb/src/pagination/QueryPaginator.ts#L30
  try {
    const now = Date.now();
    // Get subscriptions
    const { Items: items } = await client.query({
      TableName: DYNAMODB_TABLE,
      IndexName: DYNAMODB_GSI1_INDEX,
      KeyConditionExpression:
        "gsi1pk = :gsi1pk AND begins_with(gsi1sk, :gsi1sk)",
      ExpressionAttributeValues: {
        ":gsi1pk": `connection#${connectionId}`,
        ":gsi1sk": "status#subscribed#",
      },
    });
    // Disconnect connection
    const connectionTask = client.update({
      TableName: DYNAMODB_TABLE,
      Key: {
        pk: `connection#${connectionId}`,
        sk: `connection#${connectionId}`,
      },
      UpdateExpression:
        "SET disconnectedAt = :now",
      ExpressionAttributeValues: {
        ":now": now
      }
    });
    // Disconnect subscriptions
    const subscriptionTasks = _.chunk(items, 25).map((chunk) => {
      client.batchWrite({
        RequestItems: {
          [DYNAMODB_TABLE]: chunk.map((c) => ({
            PutRequest: {
              Item: {
                ...(c as object),
                status: "unsubscribed",
                unsubscribedAt: now,
                gsi1sk: "status#unsubscribed#" + now,
                reason: "connection closed"
              },
            },
          })),
        },
      })
    });
    // Await disconnection tasks
    await Promise.all([connectionTask, ...subscriptionTasks]);
  } catch (e) {
    console.log(e);
    return { statusCode: 500 };
  }
};
