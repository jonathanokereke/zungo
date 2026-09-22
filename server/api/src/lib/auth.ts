import type { FastifyRequest, FastifyReply } from 'fastify'
import jwksRsa from 'jwks-rsa'
import jwt from 'jsonwebtoken'
import { env } from './env'

let _jwksClient: jwksRsa.JwksClient | null = null
function getJwksClient() {
  if (!_jwksClient) {
    _jwksClient = jwksRsa({
      jwksUri: `https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`,
      cache: true,
      cacheMaxAge: 10 * 60 * 1000,
    })
  }
  return _jwksClient
}

async function getSigningKey(header: jwt.JwtHeader): Promise<string> {
  return new Promise((resolve, reject) => {
    getJwksClient().getSigningKey(header.kid!, (err, key) => {
      if (err) return reject(err)
      resolve(key!.getPublicKey())
    })
  })
}

export type Auth0JwtPayload = {
  sub: string
  email?: string
  name?: string
  nickname?: string
  'https://zungo.app/email'?: string
  'https://zungo.app/name'?: string
}

export function extractAuth0Email(payload: Auth0JwtPayload): string {
  return payload.email ?? payload['https://zungo.app/email'] ?? ''
}

export function extractAuth0Name(payload: Auth0JwtPayload): string {
  return payload.name ?? payload['https://zungo.app/name'] ?? payload.nickname ?? ''
}

export async function verifyAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: { code: 'unauthorized', message: 'Missing Bearer token' } })
  }

  const token = authHeader.slice(7)
  try {
    const decoded = await new Promise<jwt.JwtPayload>((resolve, reject) => {
      jwt.verify(
        token,
        (header, cb) => getSigningKey(header).then(k => cb(null, k)).catch(cb),
        {
          audience: env.AUTH0_AUDIENCE,
          issuer: `https://${env.AUTH0_DOMAIN}/`,
          algorithms: ['RS256'],
        },
        (err, payload) => {
          if (err) reject(err)
          else resolve(payload as jwt.JwtPayload)
        }
      )
    })
    ;(request as any).user = decoded
  } catch (err) {
    request.log.error({ err }, 'JWT verification failed')
    return reply.code(401).send({ error: { code: 'unauthorized', message: 'Invalid or missing token' } })
  }
}
