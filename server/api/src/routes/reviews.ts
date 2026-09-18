import { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { reviews, words, users, progress } from '../db/schema'
import { eq, and, lte, sql } from 'drizzle-orm'
import { verifyAuth, type Auth0JwtPayload } from '../lib/auth0'
import { calculateNextReview, SubmitReviewSchema } from '@zungo/core'

async function getUser(auth0Id: string) {
  const result = await db.select().from(users).where(eq(users.auth0_id, auth0Id)).limit(1)
  return result[0] ?? null
}

export async function reviewRoutes(app: FastifyInstance) {
  app.get('/api/reviews/due', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const now = new Date()
    const due = await db
      .select({ review: reviews, word: words })
      .from(reviews)
      .innerJoin(words, eq(reviews.word_id, words.id))
      .where(and(eq(reviews.user_id, user.id), lte(reviews.due_date, now)))
      .limit(20)

    return reply.send({ data: due })
  })

  app.post('/api/reviews/:wordId', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const { wordId } = request.params as { wordId: string }
    const body = SubmitReviewSchema.safeParse(request.body)
    if (!body.success) {
      return reply.code(400).send({ error: { code: 'validation_error', message: body.error.message } })
    }

    const [existing] = await db.select().from(reviews)
      .where(and(eq(reviews.word_id, wordId), eq(reviews.user_id, user.id)))
      .limit(1)

    if (!existing) return reply.code(404).send({ error: { code: 'not_found', message: 'Review not found' } })

    const result = calculateNextReview(
      { interval: existing.interval, repetition: existing.repetition, easeFactor: existing.ease_factor },
      body.data.quality,
    )

    const [updated] = await db.update(reviews)
      .set({
        interval: result.interval,
        repetition: result.repetition,
        ease_factor: result.easeFactor,
        due_date: result.nextDueDate,
        last_reviewed_at: new Date(),
      })
      .where(eq(reviews.id, existing.id))
      .returning()

    // Update user streak
    const today = new Date().toISOString().split('T')[0]!
    const lastActive = user.last_active ? new Date(user.last_active).toISOString().split('T')[0] : null
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const newStreak = lastActive === today
      ? user.streak
      : lastActive === yesterday ? user.streak + 1 : 1

    await db.update(users).set({ streak: newStreak, last_active: new Date() }).where(eq(users.id, user.id))

    return reply.send({ data: updated })
  })
}
