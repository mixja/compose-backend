import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const dynamodb = new DynamoDB({});
const client = DynamoDBDocument.from(dynamodb);
const { DYNAMODB_TABLE } = process.env;

export const handler = async (event, context?) => {
  console.log(JSON.stringify(event));
  // Get key and method
  const { name } = event.pathParameters;
  const { method } = event.requestContext.http;
  let result;

  // Process request
  switch (method) {
    // Get request
    case 'GET':
      const { Item: { pk, sk, gsi1pk, gsi1sk, ...item } } = await client.get({
        TableName: DYNAMODB_TABLE,
        Key: {
          pk: `state#${name}`,
          sk: `state#${name}`
        }
      });
      result = { statusCode: 200, body: JSON.stringify(item) };
      break;
    // Put request
    case 'PUT':
      const body = { ...JSON.parse(event.body), name }
      await client.put({
        TableName: DYNAMODB_TABLE,
        Item: {
          pk: `state#${name}`,
          sk: `state#${name}`,
          ...body
        }
      });
      result = { statusCode: 200, body: JSON.stringify(body) };
      break;
    default:
      console.error('Bad method');
      result = { statusCode: 405, body: 'Bad method' };
  }

  return result;
}
