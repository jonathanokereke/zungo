import { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { users, words, reviews, writing_sessions, grammar_sessions, reading_sessions, listening_sessions, chat_sessions, shadowing_sessions } from '../db/schema'
import { eq, gte, count, and, gt, isNotNull, sql } from 'drizzle-orm'
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
    // Words reviewed at least once (repetition > 0 means SM-2 has been applied)
    const [masteredCount] = await db.select({ count: count() }).from(reviews)
      .where(and(eq(reviews.user_id, user.id), gt(reviews.repetition, 0)))

    // Only count reviews the user has actually completed (last_reviewed_at set by SM-2 update)
    const [totalReviewCount] = await db.select({ count: count() }).from(reviews)
      .where(and(eq(reviews.user_id, user.id), isNotNull(reviews.last_reviewed_at)))
    const [writingCount] = await db.select({ count: count() }).from(writing_sessions).where(eq(writing_sessions.user_id, user.id))
    const [grammarCount] = await db.select({ count: count() }).from(grammar_sessions).where(eq(grammar_sessions.user_id, user.id))
    const [readingCount] = await db.select({ count: count() }).from(reading_sessions).where(eq(reading_sessions.user_id, user.id))
    const [listeningCount] = await db.select({ count: count() }).from(listening_sessions).where(eq(listening_sessions.user_id, user.id))
    const [chatCount] = await db.select({ count: count() }).from(chat_sessions).where(eq(chat_sessions.user_id, user.id))

    // Today's session counts per activity (for dashboard plan card progress bars)
    const todayStart = new Date(new Date().toISOString().split('T')[0]! + 'T00:00:00.000Z')
    const [todayGrammar, todayReading, todayListening, todayChat, todayShadowing, todayWriting, todayReviews] = await Promise.all([
      db.select({ count: count() }).from(grammar_sessions).where(and(eq(grammar_sessions.user_id, user.id), gte(grammar_sessions.created_at, todayStart))),
      db.select({ count: count() }).from(reading_sessions).where(and(eq(reading_sessions.user_id, user.id), gte(reading_sessions.created_at, todayStart))),
      db.select({ count: count() }).from(listening_sessions).where(and(eq(listening_sessions.user_id, user.id), gte(listening_sessions.created_at, todayStart))),
      db.select({ count: count() }).from(chat_sessions).where(and(eq(chat_sessions.user_id, user.id), gte(chat_sessions.created_at, todayStart))),
      db.select({ count: count() }).from(shadowing_sessions).where(and(eq(shadowing_sessions.user_id, user.id), gte(shadowing_sessions.created_at, todayStart))),
      db.select({ count: count() }).from(writing_sessions).where(and(eq(writing_sessions.user_id, user.id), gte(writing_sessions.created_at, todayStart))),
      db.select({ count: count() }).from(reviews).where(and(eq(reviews.user_id, user.id), gte(reviews.last_reviewed_at, todayStart), isNotNull(reviews.last_reviewed_at))),
    ])

    const recentReviews = await db.select().from(reviews)
      .where(and(eq(reviews.user_id, user.id), gte(reviews.last_reviewed_at, thirtyDaysAgo)))

    const reviewedCount = recentReviews.length
    const passedCount = recentReviews.filter(r => r.repetition > 0).length
    const retentionRate = reviewedCount > 0 ? Math.round((passedCount / reviewedCount) * 100) : 0

    // XP: 10 per review, 50 per writing, 20 per grammar, 30 per reading, 25 per listening, 15 per chat
    const totalXp =
      (totalReviewCount?.count ?? 0) * 10 +
      (writingCount?.count ?? 0) * 50 +
      (grammarCount?.count ?? 0) * 20 +
      (readingCount?.count ?? 0) * 30 +
      (listeningCount?.count ?? 0) * 25 +
      (chatCount?.count ?? 0) * 15

    return reply.send({
      data: {
        user: {
          level: user.level,
          streak: user.streak,
          last_active: user.last_active,
        },
        total_words: wordCount?.count ?? 0,
        mastered_words: masteredCount?.count ?? 0,
        total_writing_sessions: writingCount?.count ?? 0,
        total_xp: totalXp,
        retention_rate_30d: retentionRate,
        reviews_30d: reviewedCount,
        today_activity: {
          vocab_reviews: todayReviews[0]?.count ?? 0,
          grammar: todayGrammar[0]?.count ?? 0,
          reading: todayReading[0]?.count ?? 0,
          listening: todayListening[0]?.count ?? 0,
          chat: todayChat[0]?.count ?? 0,
          shadowing: todayShadowing[0]?.count ?? 0,
          writing: todayWriting[0]?.count ?? 0,
        },
      },
    })
  })

  // GET /api/progress/details — enriched data for the enhanced dashboard
  app.get('/api/progress/details', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const now = Date.now()
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)

    // ── 1. Activity heatmap — last 30 days ────────────────────────────────────
    // Count events per calendar day across all activity types
    const [writingDays, reviewDays, grammarDays, readingDays, listeningDays, chatDays] = await Promise.all([
      db.select({
        day: sql<string>`to_char(${writing_sessions.created_at} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
        cnt: count(),
      }).from(writing_sessions)
        .where(and(eq(writing_sessions.user_id, user.id), gte(writing_sessions.created_at, thirtyDaysAgo)))
        .groupBy(sql`to_char(${writing_sessions.created_at} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`),

      db.select({
        day: sql<string>`to_char(${reviews.last_reviewed_at} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
        cnt: count(),
      }).from(reviews)
        .where(and(eq(reviews.user_id, user.id), gte(reviews.last_reviewed_at, thirtyDaysAgo)))
        .groupBy(sql`to_char(${reviews.last_reviewed_at} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`),

      db.select({
        day: sql<string>`to_char(${grammar_sessions.created_at} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
        cnt: count(),
      }).from(grammar_sessions)
        .where(and(eq(grammar_sessions.user_id, user.id), gte(grammar_sessions.created_at, thirtyDaysAgo)))
        .groupBy(sql`to_char(${grammar_sessions.created_at} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`),

      db.select({
        day: sql<string>`to_char(${reading_sessions.created_at} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
        cnt: count(),
      }).from(reading_sessions)
        .where(and(eq(reading_sessions.user_id, user.id), gte(reading_sessions.created_at, thirtyDaysAgo)))
        .groupBy(sql`to_char(${reading_sessions.created_at} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`),

      db.select({
        day: sql<string>`to_char(${listening_sessions.created_at} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
        cnt: count(),
      }).from(listening_sessions)
        .where(and(eq(listening_sessions.user_id, user.id), gte(listening_sessions.created_at, thirtyDaysAgo)))
        .groupBy(sql`to_char(${listening_sessions.created_at} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`),

      db.select({
        day: sql<string>`to_char(${chat_sessions.created_at} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
        cnt: count(),
      }).from(chat_sessions)
        .where(and(eq(chat_sessions.user_id, user.id), gte(chat_sessions.created_at, thirtyDaysAgo)))
        .groupBy(sql`to_char(${chat_sessions.created_at} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`),
    ])

    const activityMap = new Map<string, number>()
    for (const { day, cnt } of [...writingDays, ...reviewDays, ...grammarDays, ...readingDays, ...listeningDays, ...chatDays]) {
      activityMap.set(day, (activityMap.get(day) ?? 0) + Number(cnt))
    }

    const activity_30d: { date: string; count: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86_400_000)
      const dateStr = d.toISOString().split('T')[0]!
      activity_30d.push({ date: dateStr, count: activityMap.get(dateStr) ?? 0 })
    }

    // ── 2. Weekly XP per day (last 7 days) ───────────────────────────────────
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]!
    const xpMap = new Map<string, number>()
    const xpSources: [{ day: string; cnt: string | number }[], number][] = [
      [writingDays,   50],
      [reviewDays,    10],
      [grammarDays,   20],
      [readingDays,   30],
      [listeningDays, 25],
      [chatDays,      15],
    ]
    for (const [rows, perUnit] of xpSources) {
      for (const { day, cnt } of rows.filter(r => r.day >= sevenDaysAgoStr)) {
        xpMap.set(day, (xpMap.get(day) ?? 0) + Number(cnt) * perUnit)
      }
    }

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weekly_xp: { date: string; day_label: string; xp: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86_400_000)
      const dateStr = d.toISOString().split('T')[0]!
      weekly_xp.push({
        date: dateStr,
        day_label: i === 0 ? 'Today' : DAYS[d.getDay()]!,
        xp: xpMap.get(dateStr) ?? 0,
      })
    }

    // ── 3. Reading stats ──────────────────────────────────────────────────────
    const allReadingSessions = await db.select().from(reading_sessions).where(eq(reading_sessions.user_id, user.id))
    const reading_stats = {
      total_sessions: allReadingSessions.length,
      total_words_looked_up: allReadingSessions.reduce((s, r) => s + r.words_looked_up, 0),
      total_minutes: Math.round(allReadingSessions.reduce((s, r) => s + r.duration_seconds, 0) / 60),
    }

    // ── 4. Weak grammar topics (avg score < 70%, min 1 session) ──────────────
    const allGrammarSessions = await db.select().from(grammar_sessions).where(eq(grammar_sessions.user_id, user.id))
    const topicMap = new Map<string, { total_pct: number; count: number }>()
    for (const g of allGrammarSessions) {
      const existing = topicMap.get(g.topic) ?? { total_pct: 0, count: 0 }
      topicMap.set(g.topic, { total_pct: existing.total_pct + g.pct, count: existing.count + 1 })
    }
    const weak_grammar_topics = [...topicMap.entries()]
      .map(([topic, { total_pct, count }]) => ({ topic, avg_pct: Math.round(total_pct / count), sessions: count }))
      .filter(t => t.avg_pct < 70)
      .sort((a, b) => a.avg_pct - b.avg_pct)
      .slice(0, 5)

    // ── 5. Writing level breakdown ────────────────────────────────────────────
    const allWritingSessions = await db.select({ feedback_json: writing_sessions.feedback_json })
      .from(writing_sessions).where(eq(writing_sessions.user_id, user.id))

    const writing_stats = { total: allWritingSessions.length, above_level: 0, at_level: 0, below_level: 0 }
    for (const s of allWritingSessions) {
      const assessment = (s.feedback_json as any)?.level_assessment
      if (assessment === 'above_level') writing_stats.above_level++
      else if (assessment === 'at_level') writing_stats.at_level++
      else if (assessment === 'below_level') writing_stats.below_level++
    }

    // ── 6. Listening stats ────────────────────────────────────────────────────
    const allListeningSessions = await db.select().from(listening_sessions).where(eq(listening_sessions.user_id, user.id))
    const listening_stats = {
      total_sessions: allListeningSessions.length,
      avg_pct: allListeningSessions.length > 0
        ? Math.round(allListeningSessions.reduce((s, l) => s + l.pct, 0) / allListeningSessions.length)
        : 0,
    }

    // ── 7. Shadowing stats ────────────────────────────────────────────────────
    const [shadowCount] = await db.select({ count: count() }).from(shadowing_sessions).where(eq(shadowing_sessions.user_id, user.id))
    const shadowing_stats = { total_sessions: shadowCount?.count ?? 0 }

    return reply.send({
      data: { weekly_xp, activity_30d, reading_stats, weak_grammar_topics, writing_stats, listening_stats, shadowing_stats },
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
