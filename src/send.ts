import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi'

const dynamodb = new DynamoDB({})
const client = DynamoDBDocument.from(dynamodb)
const { DYNAMODB_TABLE } = process.env

export const handler = async (event, context?) => {
  console.log(JSON.stringify(event))
  
  // Get connectionId and message from event
  const { connectionId } = event.requestContext
  const message = JSON.parse(event.body).data

  // Create command to reply to message
  const command = new PostToConnectionCommand({
    ConnectionId: connectionId,
    Data: new TextEncoder().encode(message)
  })

  // Construct api client and send reply
  const api = new ApiGatewayManagementApiClient({
    endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`
  })
  await api.send(command)

  return { statusCode: 200, body: 'data sent' }
}