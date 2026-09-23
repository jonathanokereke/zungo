import 'fastify'
import type { Auth0JwtPayload } from '../lib/auth'

declare module 'fastify' {
  interface FastifyRequest {
    user: Auth0JwtPayload
  }
}
