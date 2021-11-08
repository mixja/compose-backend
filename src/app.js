const fetch = require('node-fetch')

exports.handler =  async function(event, _) {
  console.log(JSON.stringify(event))
  const host = `http://${event.pathParameters.host}`
  const response = await fetch(host)
  const body = await response.text()
  return { body, statusCode: 200 }
}
