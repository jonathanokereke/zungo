import Fastify, { FastifyRequest } from 'fastify'
import { wordRoutes } from '../routes/words'
import { reviewRoutes } from '../routes/reviews'
import { writingRoutes } from '../routes/writing'
import { progressRoutes } from '../routes/progress'

// Minimal Fastify instance for tests — no JWT plugin needed because
// NODE_ENV=test triggers the dev-token bypass in verifyAuth.
export async function buildApp() {
  const app = Fastify({ logger: false })

  // Stub jwtVerify: succeed only when an Authorization header is present
  app.decorateRequest('jwtVerify', async function (this: FastifyRequest) {
    if (!this.headers['authorization']) {
      const err = new Error('Unauthorized') as Error & { statusCode: number }
      err.statusCode = 401
      throw err
    }
    this.user = { sub: 'dev|user' }
  })

  await app.register(wordRoutes)
  await app.register(reviewRoutes)
  await app.register(writingRoutes)
  await app.register(progressRoutes)

  await app.ready()
  return app
}
