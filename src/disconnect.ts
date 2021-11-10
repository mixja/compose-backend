import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'

const dynamodb = new DynamoDB({})
const client = DynamoDBDocument.from(dynamodb)
const { DYNAMODB_TABLE } = process.env

export const handler = async (event, context?) => {
  console.log(JSON.stringify(event))

  // Get connectionId from event
  const { connectionId } = event.requestContext
  const pk = `subscription#${connectionId}`
  const sk = `subscription#${connectionId}`

  // Delete connection
  await client.delete({ TableName: DYNAMODB_TABLE, Key: { pk, sk } })

  return { statusCode: 200, body: 'disconnected' }
}