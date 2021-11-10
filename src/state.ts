import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'

const dynamodb = new DynamoDB({})
const client = DynamoDBDocument.from(dynamodb)
const { DYNAMODB_TABLE } = process.env

export const handler = async (event, context?) => {
  console.log(JSON.stringify(event))
  // Get key and method
  const { key } = event.pathParameters
  const { method } = event.requestContext.http
  const pk = `state#${key}`
  const sk = `state#${key}`  
  let result
  let item

  // Process request
  switch (method) {
    // Get request
    case 'GET':
      const Key = { pk, sk }
      item = (await client.get({ TableName: DYNAMODB_TABLE, Key })).Item
      result = { statusCode: 200, body: JSON.stringify(item) }
      break
    // Put request
    case 'PUT':
      const body = JSON.parse(event.body)
      const Item = { pk, sk, ...body }
      await client.put({ TableName: DYNAMODB_TABLE, Item })
      result = { statusCode: 200, body: JSON.stringify(Item) }
      break
    default:
      console.error('Bad method')
      result = { statusCode: 405, body: 'Bad method' }
  }

  return result
}
