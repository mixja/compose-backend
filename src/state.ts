import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'


const dynamodb = new DynamoDB({})
const client = DynamoDBDocument.from(dynamodb)
const TableName = process.env.DYNAMODB_TABLE

export const handler = async (event, context?) => {
  console.log(JSON.stringify(event))
  const key = event.pathParameters.key
  const method = event.requestContext.http.method
  const pk = `state#${key}`
  const sk = `state#${key}`  
  let result
  let item
  switch (method) {
    case 'GET':
      const Key = { pk, sk }
      item = (await client.get({ TableName, Key })).Item
      result = { statusCode: 200, body: JSON.stringify(item) }
      break
    case 'PUT':
      const body = JSON.parse(event.body)
      const Item = { pk, sk, ...body }
      await client.put({ TableName, Item })
      result = { statusCode: 200, body: JSON.stringify(Item) }
      break
    default:
      console.error('Bad method')
      result = { statusCode: 405, body: 'Bad method' }
  }

  return result
}
