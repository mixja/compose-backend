import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const dynamodb = new DynamoDB({});
const client = DynamoDBDocument.from(dynamodb);
const { DYNAMODB_TABLE, DYNAMODB_GSI1_INDEX } = process.env;

// TODO: implement TypeScript equivalent of extension method below
Object.defineProperty(Array.prototype, 'chunk', {
  value: function(chunkSize) {
      var that = this;
      return Array(Math.ceil(that.length/chunkSize)).fill().map(function(_,i){
          return that.slice(i*chunkSize,i*chunkSize+chunkSize);
      });
  }
});

export const handler = async (event, context?) => {
  const { connectionId } = event.requestContext;

  // TODO: handle pagination
  try {
    const { Items: items } = await client.query({
      TableName: DYNAMODB_TABLE,
      IndexName: DYNAMODB_GSI1_INDEX,
      KeyConditionExpression: "gsi1pk = :gsi1pk AND begins_with(gsi1sk, :gsi1sk)",
      ExpressionAttributeValues: {
        ":gsi1pk": `connection#${connectionId}`,
        ":gsi1sk": `status#connected`
      }
    });
    await Promise.all(items.chunk(25).map(chunk => {
      client.batchWrite({
        RequestItems: {
          [DYNAMODB_TABLE]: chunk.map(c => ({
            PutRequest: {
              Item: { ...c, gsi1sk: "status#disconnected#" + Date.now() }
            }
          }))
        }
      })
    }));
  } catch (e) {
    console.log(e);
    return { statusCode: 500 };
  }
};
