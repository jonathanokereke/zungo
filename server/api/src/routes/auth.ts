import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth, extractAuth0Email, type Auth0JwtPayload } from '../lib/auth0'

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/sync', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const auth0Id = jwt.sub
    const email = extractAuth0Email(jwt)

    const existing = await db.select().from(users).where(eq(users.auth0_id, auth0Id)).limit(1)
    if (existing.length > 0) {
      return reply.code(200).send({ data: existing[0] })
    }

    const [created] = await db.insert(users).values({ auth0_id: auth0Id, email }).returning()
    return reply.code(201).send({ data: created })
  })
}
