import { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { users, chat_sessions } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { verifyAuth, type Auth0JwtPayload } from '../lib/auth0'

async function getUser(auth0Id: string) {
  const result = await db.select().from(users).where(eq(users.auth0_id, auth0Id)).limit(1)
  return result[0] ?? null
}

export async function chatSessionRoutes(app: FastifyInstance) {
  app.post('/api/chat/sessions', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const body = request.body as { scenario: string; messages: unknown[]; message_count: number }
    if (!body.scenario || !Array.isArray(body.messages)) {
      return reply.code(400).send({ error: { code: 'validation_error', message: 'scenario and messages required' } })
    }

    const [session] = await db.insert(chat_sessions).values({
      user_id: user.id,
      scenario: body.scenario,
      messages_json: body.messages,
      message_count: body.message_count ?? body.messages.length,
    }).returning()

    return reply.code(201).send({ data: session })
  })

  app.get('/api/chat/sessions', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const sessions = await db.select({
      id: chat_sessions.id,
      scenario: chat_sessions.scenario,
      message_count: chat_sessions.message_count,
      created_at: chat_sessions.created_at,
    }).from(chat_sessions)
      .where(eq(chat_sessions.user_id, user.id))
      .orderBy(desc(chat_sessions.created_at))
      .limit(20)

    return reply.send({ data: sessions })
  })
}
