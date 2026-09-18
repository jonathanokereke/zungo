import { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { users, words, reviews, writing_sessions, progress } from '../db/schema'
import { eq, gte, sql, count, and } from 'drizzle-orm'
import { verifyAuth, type Auth0JwtPayload } from '../lib/auth0'

async function getUser(auth0Id: string) {
  const result = await db.select().from(users).where(eq(users.auth0_id, auth0Id)).limit(1)
  return result[0] ?? null
}

export async function progressRoutes(app: FastifyInstance) {
  app.get('/api/progress', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [wordCount] = await db.select({ count: count() }).from(words).where(eq(words.user_id, user.id))
    const [sessionCount] = await db.select({ count: count() }).from(writing_sessions).where(eq(writing_sessions.user_id, user.id))

    const recentReviews = await db.select().from(reviews)
      .where(and(eq(reviews.user_id, user.id), gte(reviews.last_reviewed_at, thirtyDaysAgo)))

    const reviewedCount = recentReviews.length
    const passedCount = recentReviews.filter(r => r.repetition > 0).length
    const retentionRate = reviewedCount > 0 ? Math.round((passedCount / reviewedCount) * 100) : 0

    return reply.send({
      data: {
        user: {
          level: user.level,
          streak: user.streak,
          last_active: user.last_active,
        },
        total_words: wordCount?.count ?? 0,
        total_writing_sessions: sessionCount?.count ?? 0,
        retention_rate_30d: retentionRate,
        reviews_30d: reviewedCount,
      },
    })
  })

  app.patch('/api/users/me', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const body = request.body as Record<string, unknown>
    const updates: Record<string, unknown> = {}
    if (body['level']) updates['level'] = body['level']
    if (body['preferences']) updates['preferences_json'] = body['preferences']

    const [updated] = await db.update(users).set(updates).where(eq(users.id, user.id)).returning()
    return reply.send({ data: updated })
  })
}
