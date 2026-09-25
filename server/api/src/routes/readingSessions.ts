import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index'
import { users, reading_sessions } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { verifyAuth, type Auth0JwtPayload } from '../lib/auth0'

async function getUser(auth0Id: string) {
  const result = await db.select().from(users).where(eq(users.auth0_id, auth0Id)).limit(1)
  return result[0] ?? null
}

const SaveSessionSchema = z.object({
  title: z.string().min(1),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  topic: z.string().min(1),
  words_looked_up: z.number().int().min(0).default(0),
  duration_seconds: z.number().int().min(0).default(0),
})

export async function readingSessionRoutes(app: FastifyInstance) {
  app.post('/api/reading/sessions', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const body = SaveSessionSchema.safeParse(request.body)
    if (!body.success) {
      return reply.code(400).send({ error: { code: 'validation_error', message: body.error.message } })
    }

    const [session] = await db
      .insert(reading_sessions)
      .values({ user_id: user.id, ...body.data })
      .returning()

    return reply.code(201).send({ data: session })
  })

  app.get('/api/reading/sessions', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const sessions = await db
      .select()
      .from(reading_sessions)
      .where(eq(reading_sessions.user_id, user.id))
      .orderBy(desc(reading_sessions.created_at))
      .limit(50)

    return reply.send({ data: sessions })
  })
}
