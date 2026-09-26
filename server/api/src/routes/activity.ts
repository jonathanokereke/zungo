import { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { users, writing_sessions, reviews, words, grammar_sessions, reading_sessions, listening_sessions, chat_sessions, articles } from '../db/schema'
import { eq, desc, gte, and } from 'drizzle-orm'
import { verifyAuth, type Auth0JwtPayload } from '../lib/auth0'

async function getUser(auth0Id: string) {
  const result = await db.select().from(users).where(eq(users.auth0_id, auth0Id)).limit(1)
  return result[0] ?? null
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  if (d === 1) return 'Yesterday'
  return `${d}d ago`
}

export async function activityRoutes(app: FastifyInstance) {
  app.get('/api/activity', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [sessions, recentReviews, grammarSess, readingSess, listeningSess, chatSess] = await Promise.all([
      db.select().from(writing_sessions)
        .where(eq(writing_sessions.user_id, user.id))
        .orderBy(desc(writing_sessions.created_at))
        .limit(3),
      db.select({ review: reviews, word: words })
        .from(reviews)
        .innerJoin(words, eq(reviews.word_id, words.id))
        .where(and(eq(reviews.user_id, user.id), gte(reviews.last_reviewed_at, sevenDaysAgo)))
        .orderBy(desc(reviews.last_reviewed_at))
        .limit(5),
      db.select().from(grammar_sessions)
        .where(and(eq(grammar_sessions.user_id, user.id), gte(grammar_sessions.created_at, sevenDaysAgo)))
        .orderBy(desc(grammar_sessions.created_at))
        .limit(3),
      db.select().from(reading_sessions)
        .where(and(eq(reading_sessions.user_id, user.id), gte(reading_sessions.created_at, sevenDaysAgo)))
        .orderBy(desc(reading_sessions.created_at))
        .limit(3),
      db.select({ session: listening_sessions, article: articles })
        .from(listening_sessions)
        .innerJoin(articles, eq(listening_sessions.article_id, articles.id))
        .where(and(eq(listening_sessions.user_id, user.id), gte(listening_sessions.created_at, sevenDaysAgo)))
        .orderBy(desc(listening_sessions.created_at))
        .limit(3),
      db.select().from(chat_sessions)
        .where(and(eq(chat_sessions.user_id, user.id), gte(chat_sessions.created_at, sevenDaysAgo)))
        .orderBy(desc(chat_sessions.created_at))
        .limit(3),
    ])

    type ActivityItem = {
      type: string
      title: string
      sub: string
      time: string
      ts: number
    }

    const items: ActivityItem[] = []

    for (const s of sessions) {
      const fb = s.feedback_json as { corrections?: unknown[]; level_assessment?: string } | null
      const correctionCount = fb?.corrections?.length ?? 0
      const levelLabel = fb?.level_assessment === 'above_level' ? 'Above level'
        : fb?.level_assessment === 'at_level' ? 'At level'
        : fb?.level_assessment === 'below_level' ? 'Below level'
        : null
      items.push({
        type: 'writing',
        title: `Writing — ${s.prompt.length > 40 ? s.prompt.slice(0, 38) + '…' : s.prompt}`,
        sub: levelLabel ? `${levelLabel} · ${correctionCount} correction${correctionCount !== 1 ? 's' : ''}` : 'Completed',
        time: timeAgo(new Date(s.created_at)),
        ts: new Date(s.created_at).getTime(),
      })
    }

    for (const gs of grammarSess) {
      items.push({
        type: 'grammar',
        title: `Grammar — ${gs.topic}`,
        sub: `${gs.pct}% · ${gs.score}/${gs.total} correct`,
        time: timeAgo(new Date(gs.created_at)),
        ts: new Date(gs.created_at).getTime(),
      })
    }

    for (const rs of readingSess) {
      items.push({
        type: 'reading',
        title: `Reading — ${rs.title.length > 40 ? rs.title.slice(0, 38) + '…' : rs.title}`,
        sub: `${rs.words_looked_up} word${rs.words_looked_up !== 1 ? 's' : ''} looked up · ${Math.round(rs.duration_seconds / 60)}m`,
        time: timeAgo(new Date(rs.created_at)),
        ts: new Date(rs.created_at).getTime(),
      })
    }

    for (const { session: ls, article: art } of listeningSess) {
      items.push({
        type: 'listening',
        title: `Listening — ${art.title.length > 40 ? art.title.slice(0, 38) + '…' : art.title}`,
        sub: `${ls.pct}% · ${ls.score}/${ls.total} correct`,
        time: timeAgo(new Date(ls.created_at)),
        ts: new Date(ls.created_at).getTime(),
      })
    }

    for (const cs of chatSess) {
      items.push({
        type: 'chat',
        title: `Conversation — ${cs.scenario}`,
        sub: `${cs.message_count} message${cs.message_count !== 1 ? 's' : ''}`,
        time: timeAgo(new Date(cs.created_at)),
        ts: new Date(cs.created_at).getTime(),
      })
    }

    // Group recent reviews into a single "Vocab review" entry per day
    if (recentReviews.length > 0) {
      const reviewsByDay = new Map<string, typeof recentReviews>()
      for (const r of recentReviews) {
        if (!r.review.last_reviewed_at) continue
        const day = new Date(r.review.last_reviewed_at).toISOString().split('T')[0]!
        if (!reviewsByDay.has(day)) reviewsByDay.set(day, [])
        reviewsByDay.get(day)!.push(r)
      }
      for (const [day, group] of reviewsByDay) {
        const passed = group.filter(r => r.review.repetition > 0).length
        const pct = Math.round((passed / group.length) * 100)
        items.push({
          type: 'review',
          title: `Vocab — ${group.length} cards reviewed`,
          sub: `${pct}% retention · ${group.length} cards`,
          time: timeAgo(new Date(day)),
          ts: new Date(day).getTime(),
        })
      }
    }

    items.sort((a, b) => b.ts - a.ts)

    return reply.send({ data: items.slice(0, 5) })
  })
}
