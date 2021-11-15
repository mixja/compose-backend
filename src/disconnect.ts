import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const dynamodb = new DynamoDB({});
const client = DynamoDBDocument.from(dynamodb);
const { DYNAMODB_TABLE } = process.env;

export const handler = async (event, context?) => {
  const { connectionId } = event.requestContext;

  // TODO - do this in a transaction instead
  try {
    await Promise.all([
      client.update({
        TableName: DYNAMODB_TABLE,
        Key: {
          pk: `subscription#${connectionId}`,
          sk: `subscription#${connectionId}`,
        },
        ConditionExpression: "attribute_not_exists(unsubscribedAt)", // should I add a GSI on unsubscribedAt?
        UpdateExpression: "SET unsubscribedAt = :t",
        ExpressionAttributeValues: { ":t": Date.now() },
      }),
      client.update({
        TableName: DYNAMODB_TABLE,
        Key: {
          pk: `connection#${connectionId}`,
          sk: `connection#${connectionId}`,
        },
        UpdateExpression: "SET disconnectedAt = :t",
        ExpressionAttributeValues: { ":t": Date.now() },
      }),
    ]);
    return { statusCode: 200 };
  } catch (e) {
    console.log(e);
    return { statusCode: 500 };
  }
};
