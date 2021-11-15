import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const dynamodb = new DynamoDB({});
const client = DynamoDBDocument.from(dynamodb);
const { DYNAMODB_TABLE } = process.env;

export const handler = async (event, context?) => {
  const { connectionId } = event.requestContext;
  const name = JSON.parse(event.body).name;

  // delete subscription
  const Key = {
    pk: `subscription#${connectionId}`,
    sk: `subscription#${connectionId}`,
  };
  try {
    await client.update({
      TableName: DYNAMODB_TABLE,
      Key,
      ConditionExpression:
        "name = :name and attribute_not_exists(unsubscribedAt)", // should I add a GSI on unsubscribedAt?
      UpdateExpression: "SET unsubscribedAt = :t",
      ExpressionAttributeValues: { ":t": Date.now(), ":name": name },
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
