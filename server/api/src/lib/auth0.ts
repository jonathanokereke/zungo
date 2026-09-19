import jwksRsa from 'jwks-rsa'
import { FastifyRequest, FastifyReply } from 'fastify'
import { env } from './env'

export const DEV_AUTH0_ID = 'dev|user'
const DEV_TOKEN = 'dev-token'

export const jwksClient = jwksRsa({
  jwksUri: `https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
})

export type Auth0JwtPayload = {
  sub: string
  email?: string
  'https://german-app.com/email'?: string
}

export function extractAuth0Email(payload: Auth0JwtPayload): string {
  return payload.email ?? payload['https://german-app.com/email'] ?? ''
}

export async function verifyAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // In development, accept a static dev token so the UI works without Auth0 credentials
  if (env.NODE_ENV === 'development') {
    const auth = request.headers['authorization']
    if (auth === `Bearer ${DEV_TOKEN}`) {
      request.user = { sub: DEV_AUTH0_ID } as Auth0JwtPayload
      return
    }
  }
  try {
    await request.jwtVerify()
  } catch {
    reply.code(401).send({ error: { code: 'unauthorized', message: 'Invalid or missing token' } })
  }
}
