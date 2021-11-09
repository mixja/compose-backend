import axios from 'axios'

export const handler = async (event, context?) => {
  console.log(JSON.stringify(event))
  const host = `http://${event.pathParameters.host}`
  const response = await axios.get(host)
  const body = JSON.stringify(await response.data)
  return { body, statusCode: 200 }
}
