import jwksRsa from 'jwks-rsa'
import { FastifyRequest, FastifyReply } from 'fastify'
import { env } from './env'

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
  try {
    await request.jwtVerify()
  } catch {
    reply.code(401).send({ error: { code: 'unauthorized', message: 'Invalid or missing token' } })
  }
}
