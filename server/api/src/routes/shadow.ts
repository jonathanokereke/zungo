import { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { users, shadowing_sessions } from '../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth, type Auth0JwtPayload } from '../lib/auth0'
import { updateStreak } from '../lib/updateStreak'

async function getUser(auth0Id: string) {
  const result = await db.select().from(users).where(eq(users.auth0_id, auth0Id)).limit(1)
  return result[0] ?? null
}

export async function shadowRoutes(app: FastifyInstance) {
  app.post('/api/shadow/session', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const body = request.body as {
      article_id?: string
      sentences_completed?: number
      duration_seconds?: number
    }

    const [session] = await db.insert(shadowing_sessions).values({
      user_id: user.id,
      article_id: body.article_id ?? null,
      sentences_completed: body.sentences_completed ?? 0,
      duration_seconds: body.duration_seconds ?? 0,
    }).returning()

    await updateStreak(user)

    return reply.code(201).send({ data: session })
  })
}
