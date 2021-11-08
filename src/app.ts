import fetch from 'node-fetch'

export const handler = async (event, context?) => {
  console.log(JSON.stringify(event))
  const host = `http://${event.pathParameters.host}`
  const response = await fetch(host)
  const body = await response.text()
  return { body, statusCode: 200 }
}
