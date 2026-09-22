import 'dotenv/config'
import * as Sentry from '@sentry/node'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { env } from './lib/env'

if (env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.2,
  })
}

import { authRoutes } from './routes/auth'
import { wordRoutes } from './routes/words'
import { reviewRoutes } from './routes/reviews'
import { writingRoutes } from './routes/writing'
import { progressRoutes } from './routes/progress'
import { chatRoutes } from './routes/chat'
import { grammarRoutes } from './routes/grammar'
import { activityRoutes } from './routes/activity'
import { readingRoutes } from './routes/reading'
import { chatSessionRoutes } from './routes/chatSessions'
import { onboardingRoutes } from './routes/onboarding'
import { seedSystemData } from './db/seed'

const app = Fastify({ logger: env.NODE_ENV === 'development' })

await app.register(cors, { origin: env.CORS_ORIGIN })

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error)
  if (env.NODE_ENV === 'production') Sentry.captureException(error)
  if (error.validation) {
    return reply.code(400).send({ error: { code: 'validation_error', message: error.message } })
  }
  reply.code(error.statusCode ?? 500).send({
    error: { code: 'server_error', message: env.NODE_ENV === 'production' ? 'Internal server error' : error.message },
  })
})

await authRoutes(app)
await wordRoutes(app)
await reviewRoutes(app)
await writingRoutes(app)
await progressRoutes(app)
await chatRoutes(app)
await grammarRoutes(app)
await activityRoutes(app)
await readingRoutes(app)
await chatSessionRoutes(app)
await onboardingRoutes(app)

app.get('/health', async () => ({ status: 'ok' }))

if (env.NODE_ENV === 'development') {
  await seedSystemData()
}

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
