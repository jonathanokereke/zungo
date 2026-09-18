import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index'
import { words, users, reviews } from '../db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { verifyAuth, type Auth0JwtPayload } from '../lib/auth0'
import { lookupWord } from '../lib/anthropic'
import { CreateWordSchema, WordLookupResultSchema } from '@german-app/core'

async function getUser(auth0Id: string) {
  const result = await db.select().from(users).where(eq(users.auth0_id, auth0Id)).limit(1)
  return result[0] ?? null
}

export async function wordRoutes(app: FastifyInstance) {
  app.get('/api/words', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const query = request.query as { page?: string; limit?: string }
    const page = Math.max(1, Number(query.page ?? 1))
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)))
    const offset = (page - 1) * limit

    const result = await db.select().from(words)
      .where(eq(words.user_id, user.id))
      .orderBy(desc(words.created_at))
      .limit(limit)
      .offset(offset)

    return reply.send({ data: result })
  })

  app.post('/api/words', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const body = CreateWordSchema.safeParse(request.body)
    if (!body.success) {
      return reply.code(400).send({ error: { code: 'validation_error', message: body.error.message } })
    }

    const [word] = await db.insert(words).values({ ...body.data, user_id: user.id }).returning()
    await db.insert(reviews).values({ word_id: word.id, user_id: user.id })

    return reply.code(201).send({ data: word })
  })

  app.delete('/api/words/:id', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const { id } = request.params as { id: string }
    await db.delete(words).where(and(eq(words.id, id), eq(words.user_id, user.id)))
    return reply.code(200).send({ data: { deleted: true } })
  })

  app.get('/api/words/lookup', { preHandler: verifyAuth }, async (request, reply) => {
    const query = request.query as { word?: string; context?: string }
    if (!query.word) {
      return reply.code(400).send({ error: { code: 'validation_error', message: 'word is required' } })
    }

    const result = await lookupWord(query.word, query.context ?? '')
    const parsed = WordLookupResultSchema.safeParse(result)
    if (!parsed.success) {
      return reply.code(500).send({ error: { code: 'ai_error', message: 'Invalid AI response' } })
    }

    return reply.send({ data: parsed.data })
  })
}
