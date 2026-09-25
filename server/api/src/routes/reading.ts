import { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { users, articles } from '../db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { verifyAuth, type Auth0JwtPayload } from '../lib/auth0'

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
type Level = typeof LEVEL_ORDER[number]

async function getUser(auth0Id: string) {
  const result = await db.select().from(users).where(eq(users.auth0_id, auth0Id)).limit(1)
  return result[0] ?? null
}

export async function readingRoutes(app: FastifyInstance) {
  // GET /api/reading/library
  // Query params:
  //   level  — comma-separated subset of A1..C2, or omitted for all accessible levels
  //   topic  — exact topic string filter (optional)
  app.get('/api/reading/library', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const query = request.query as Record<string, string>

    // Default accessible levels: A1 up to and including user's level
    const userLevelIdx = LEVEL_ORDER.indexOf(user.level as Level)
    const accessibleLevels = LEVEL_ORDER.slice(0, userLevelIdx + 1)

    let requestedLevels: Level[]
    if (query['level']) {
      const requested = query['level'].split(',').map(s => s.trim()).filter(s => LEVEL_ORDER.includes(s as Level)) as Level[]
      // Only allow levels the user has access to
      requestedLevels = requested.filter(l => accessibleLevels.includes(l))
      if (requestedLevels.length === 0) requestedLevels = accessibleLevels
    } else {
      requestedLevels = accessibleLevels
    }

    const conditions = [inArray(articles.level, requestedLevels)]
    if (query['topic']) {
      conditions.push(eq(articles.topic, query['topic']))
    }

    const rows = await db
      .select({
        id: articles.id,
        title: articles.title,
        level: articles.level,
        topic: articles.topic,
        word_count: articles.word_count,
        estimated_minutes: articles.estimated_minutes,
        preview: articles.text,
      })
      .from(articles)
      .where(and(...conditions))
      .orderBy(articles.level, articles.created_at)

    // Return preview (first 200 chars) not full text in listing
    const listing = rows.map(r => ({
      ...r,
      preview: r.preview.slice(0, 200),
    }))

    // Collect unique topics for filter UI
    const allTopicRows = await db
      .select({ topic: articles.topic })
      .from(articles)
      .where(inArray(articles.level, accessibleLevels))

    const topics = [...new Set(allTopicRows.map(r => r.topic))].sort()

    return reply.send({
      data: {
        articles: listing,
        topics,
        accessible_levels: accessibleLevels,
        user_level: user.level,
      },
    })
  })

  // GET /api/reading/library/:id  — full article text
  app.get('/api/reading/library/:id', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const { id } = request.params as { id: string }
    const [article] = await db.select().from(articles).where(eq(articles.id, id)).limit(1)
    if (!article) return reply.code(404).send({ error: { code: 'not_found', message: 'Article not found' } })

    // Only serve levels the user has access to
    const userLevelIdx = LEVEL_ORDER.indexOf(user.level as Level)
    const articleIdx = LEVEL_ORDER.indexOf(article.level)
    if (articleIdx > userLevelIdx) {
      return reply.code(403).send({ error: { code: 'forbidden', message: 'Article above your current level' } })
    }

    return reply.send({ data: article })
  })

  // Legacy route — kept for backwards compatibility with current ReadScreen
  app.get('/api/reading/texts', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const userLevelIdx = LEVEL_ORDER.indexOf(user.level as Level)
    const minIdx = Math.max(0, userLevelIdx - 1)
    const levels = LEVEL_ORDER.slice(minIdx, userLevelIdx + 1)

    const rows = await db
      .select()
      .from(articles)
      .where(inArray(articles.level, levels))
      .orderBy(articles.level, articles.created_at)

    return reply.send({ data: { texts: rows, level: user.level } })
  })
}
