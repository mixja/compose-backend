import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const dynamodb = new DynamoDB({});
const client = DynamoDBDocument.from(dynamodb);
const { DYNAMODB_TABLE } = process.env;

export const handler = async (event, context?) => {
  const { connectionId, connectedAt, domainName, identity } =
    event.requestContext;
  const pk = `connection#${connectionId}`;
  const sk = `connection#${connectionId}`;

  // Create connection
  const Item = { pk, sk, connectionId, connectedAt, domainName, identity };
  await client.put({ TableName: DYNAMODB_TABLE, Item });

  return { statusCode: 200, body: "connected" };
};
