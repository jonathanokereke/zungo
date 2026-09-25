import Fastify from 'fastify'
import { wordRoutes } from '../routes/words'
import { reviewRoutes } from '../routes/reviews'
import { writingRoutes } from '../routes/writing'
import { progressRoutes } from '../routes/progress'
import { authRoutes } from '../routes/auth'
import { pushRoutes } from '../routes/push'
import { readingSessionRoutes } from '../routes/readingSessions'

export async function buildApp() {
  const app = Fastify({ logger: false })

  await app.register(wordRoutes)
  await app.register(reviewRoutes)
  await app.register(writingRoutes)
  await app.register(progressRoutes)
  await app.register(authRoutes)
  await app.register(pushRoutes)
  await app.register(readingSessionRoutes)

  await app.ready()
  return app
}
