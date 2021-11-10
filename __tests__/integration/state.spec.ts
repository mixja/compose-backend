import axios from 'axios'
import { CloudFormation } from "@aws-sdk/client-cloudformation"

const cloudformation = new CloudFormation({})
let outputs

beforeAll(async () => {
  const response = await cloudformation.describeStacks({StackName: process.env.STACK_NAME})
  const [stack] = response.Stacks
  outputs = Object.fromEntries(
    stack.Outputs.map(o => [o.OutputKey, o.OutputValue])
  )
})

describe('State', () => {
  it('should set state', async () => {
    const api = outputs.RestApi
    const key = 'foo'
    const result = await axios.put(`${api}/state/${key}`, { x: 'y' })
    expect(result.status).toEqual(200)
  })

  it('should fetch state', async () => {
    const api = outputs.RestApi
    const key = 'foo'
    const result = await axios.get(`${api}/state/${key}`)
    expect(result.status).toEqual(200)
    expect(result.data.x).toEqual('y')
  })
})