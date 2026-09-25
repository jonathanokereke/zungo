import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth, type Auth0JwtPayload } from '../lib/auth0'

const RegisterTokenSchema = z.object({
  token: z.string().min(1),
})

export async function pushRoutes(app: FastifyInstance) {
  // Register or update the Expo push token for this user
  app.post('/api/push/token', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload

    const body = RegisterTokenSchema.safeParse(request.body)
    if (!body.success) {
      return reply.code(400).send({ error: { code: 'validation_error', message: body.error.message } })
    }

    await db
      .update(users)
      .set({ push_token: body.data.token })
      .where(eq(users.auth0_id, jwt.sub))

    return reply.send({ data: { ok: true } })
  })

  // Remove the push token (called on sign out)
  app.delete('/api/push/token', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    await db.update(users).set({ push_token: null }).where(eq(users.auth0_id, jwt.sub))
    return reply.send({ data: { ok: true } })
  })
}
