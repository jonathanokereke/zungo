import 'dotenv/config'
import * as Sentry from '@sentry/node'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { fastifyJwt as jwt } from '@fastify/jwt'
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
import { seedDevUser } from './db/seed'
import jwksRsa from 'jwks-rsa'

const app = Fastify({ logger: env.NODE_ENV === 'development' })

await app.register(cors, { origin: env.CORS_ORIGIN })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
await app.register(jwt as any, {
  secret: {
    public: async (_request: unknown, token: string) => {
      const decoded = app.jwt.decode<{ header: { kid: string } }>(token)
      if (!decoded || typeof decoded !== 'object' || !('header' in decoded)) {
        throw new Error('Invalid token')
      }
      const header = (decoded as { header: { kid: string } }).header
      const client = jwksRsa({ jwksUri: `https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`, cache: true })
      const key = await client.getSigningKey(header.kid)
      return key.getPublicKey()
    },
  },
  verify: {
    algorithms: ['RS256'],
    issuer: `https://${env.AUTH0_DOMAIN}/`,
  },
})

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

app.get('/health', async () => ({ status: 'ok' }))

if (env.NODE_ENV === 'development') {
  await seedDevUser()
}

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
