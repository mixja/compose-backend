import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const dynamodb = new DynamoDB({});
const client = DynamoDBDocument.from(dynamodb);
const { DYNAMODB_TABLE } = process.env;

export const handler = async (event, context?) => {
  const { connectionId } = event.requestContext;
  const name = JSON.parse(event.body).name;

  // Mark subscription as no longer active
  try {
    const now = Date.now()
    await client.update({
      TableName: DYNAMODB_TABLE,
      Key: {
        pk: `state#${name}`,
        sk: `subscription#${connectionId}`,
      },
      ConditionExpression: 
        "attribute_not_exists(unsubscribedAt)", 
      UpdateExpression: 
        "SET unsubscribedAt = :t, gsi1sk = :gsi1sk",
      ExpressionAttributeValues: {
        ":t": now,
        ":gsi1sk": `status#disconnected#${now}`
      },
    });
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
