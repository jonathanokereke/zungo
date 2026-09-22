import type { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { users, word_bank, words, reviews } from '../db/schema'
import { eq, inArray } from 'drizzle-orm'
import { verifyAuth, type Auth0JwtPayload } from '../lib/auth0'

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

interface OnboardingBody {
  preferred_name: string
  level: CefrLevel
  daily_goal_minutes: number
  reminder_hour: number
  reminder_minute: number
}

// Seed all word_bank entries for the user's level into their personal words + SRS reviews
async function seedWordsForUser(userId: string, level: CefrLevel) {
  const bankWords = await db
    .select()
    .from(word_bank)
    .where(eq(word_bank.cefr_level, level))

  if (bankWords.length === 0) return

  // Insert in batches of 500 to avoid query size limits
  const BATCH = 500
  for (let i = 0; i < bankWords.length; i += BATCH) {
    const batch = bankWords.slice(i, i + BATCH)
    const inserted = await db
      .insert(words)
      .values(batch.map(w => ({
        user_id: userId,
        german: w.german,
        translation: w.translation,
        part_of_speech: w.part_of_speech,
        example_sentence: w.example_sentence ?? undefined,
      })))
      .onConflictDoNothing()
      .returning({ id: words.id })

    if (inserted.length > 0) {
      await db.insert(reviews).values(
        inserted.map(w => ({
          word_id: w.id,
          user_id: userId,
          due_date: new Date(),
        }))
      ).onConflictDoNothing()
    }
  }
}

export async function onboardingRoutes(app: FastifyInstance) {
  app.post<{ Body: OnboardingBody }>('/api/onboarding/complete', {
    preHandler: verifyAuth,
    schema: {
      body: {
        type: 'object',
        required: ['preferred_name', 'level', 'daily_goal_minutes', 'reminder_hour', 'reminder_minute'],
        properties: {
          preferred_name: { type: 'string', minLength: 1 },
          level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
          daily_goal_minutes: { type: 'number', minimum: 5, maximum: 120 },
          reminder_hour: { type: 'number', minimum: 0, maximum: 23 },
          reminder_minute: { type: 'number', minimum: 0, maximum: 59 },
        },
      },
    },
  }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const { preferred_name, level, daily_goal_minutes, reminder_hour, reminder_minute } = request.body

    await db.update(users)
      .set({
        preferred_name,
        level,
        preferences_json: {
          onboarding_complete: true,
          daily_goal_minutes,
          reminder_hour,
          reminder_minute,
        },
      })
      .where(eq(users.auth0_id, jwt.sub))

    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.auth0_id, jwt.sub))
    if (user) {
      await seedWordsForUser(user.id, level)
    }

    return reply.send({ data: { ok: true } })
  })
}
