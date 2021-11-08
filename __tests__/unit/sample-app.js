import { handler } from '../../src/app'

describe('Sample App', () => {
  it('should complete OK', async () => {
    const host = 'ip.jsontest.com'
    const result = await handler({
      pathParameters: { host }
    })
    expect(result.statusCode).toEqual(200)
  })
})