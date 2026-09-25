import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index'
import { words, users, reviews } from '../db/schema'
import { eq, and, desc, count, sql } from 'drizzle-orm'
import { verifyAuth, type Auth0JwtPayload } from '../lib/auth0'
import { lookupWord } from '../lib/anthropic'
import { CreateWordSchema, WordLookupResultSchema } from '@zungo/core'

async function getUser(auth0Id: string) {
  const result = await db.select().from(users).where(eq(users.auth0_id, auth0Id)).limit(1)
  return result[0] ?? null
}

export async function wordRoutes(app: FastifyInstance) {
  app.get('/api/words', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const query = request.query as { page?: string; limit?: string; pos?: string }
    const page = Math.max(1, Number(query.page ?? 1))
    // When filtering by pos, return all matching words (deck-browsing use case)
    // When no pos, cap at 200 for performance (recent words view)
    const defaultLimit = query.pos ? 5000 : 200
    const limit = Math.min(5000, Math.max(1, Number(query.limit ?? defaultLimit)))
    const offset = (page - 1) * limit

    const where = query.pos
      ? and(eq(words.user_id, user.id), eq(words.part_of_speech, query.pos))
      : eq(words.user_id, user.id)

    const result = await db.select().from(words)
      .where(where)
      .orderBy(desc(words.created_at))
      .limit(limit)
      .offset(offset)

    return reply.send({ data: result })
  })

  // Returns word counts grouped by part_of_speech for all words in the user's deck
  app.get('/api/words/counts', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const rows = await db.select({ pos: words.part_of_speech, count: count() })
      .from(words)
      .where(eq(words.user_id, user.id))
      .groupBy(words.part_of_speech)

    const counts: Record<string, number> = {}
    for (const row of rows) counts[row.pos] = row.count

    return reply.send({ data: counts })
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

  // Returns a deterministic word of the day — stable for the calendar date per user
  app.get('/api/words/wotd', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const allWords = await db.select().from(words)
      .where(eq(words.user_id, user.id))
      .orderBy(words.created_at)

    if (!allWords.length) return reply.send({ data: null })

    const dayIndex = Math.floor(Date.now() / 86_400_000)
    const word = allWords[dayIndex % allWords.length]!
    return reply.send({ data: word })
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
