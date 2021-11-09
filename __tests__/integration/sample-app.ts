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

describe('Sample App', () => {
  it('should complete OK', async () => {
    const api = outputs.SampleApi
    const host = 'headers.jsontest.com'
    const result = await axios.get(`${api}/${host}`)
    expect(result.status).toEqual(200)
    expect(result.data.Host).toEqual(host)
  })
})