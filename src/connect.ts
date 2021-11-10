import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'

const dynamodb = new DynamoDB({})
const client = DynamoDBDocument.from(dynamodb)
const { DYNAMODB_TABLE } = process.env

export const handler = async (event, context?) => {
  console.log(JSON.stringify(event))

  // Get connectionId and other properties from event
  const { connectionId , connectedAt, domainName } = event.requestContext
  const pk = `subscription#${connectionId}`
  const sk = `subscription#${connectionId}`

  // Create connection
  const Item = { pk, sk, connectedAt, domainName }
  await client.put({ TableName: DYNAMODB_TABLE, Item })

  return { statusCode: 200, body: 'connected' }
}