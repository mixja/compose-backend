import { handler } from '../../src/app'
import { rest } from 'msw'
import { setupServer } from 'msw/node'

const data = { data: 'example' }
const server = setupServer(
  rest.get('http://example.com', (req, res, ctx) => {
    return res(ctx.json(data))
  })
)

// Enable API mocking before tests.
beforeAll(() => server.listen())

// Reset any runtime request handlers we may add during the tests.
afterEach(() => server.resetHandlers())

// Disable API mocking after the tests are done.
afterAll(() => server.close())

describe('Sample App', () => {
  it('should complete OK', async () => {
    const host = 'example.com'
    const result = await handler({
      pathParameters: { host }
    })
    expect(result.statusCode).toEqual(200)
  })

  it('should return the body', async () => {
    const host = 'example.com'
    const result = await handler({
      pathParameters: { host }
    })
    expect(result.body).toEqual(JSON.stringify(data))
  })
})