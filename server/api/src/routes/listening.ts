import { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { users, articles, listening_sessions } from '../db/schema'
import { eq, and, inArray, desc } from 'drizzle-orm'
import { verifyAuth, type Auth0JwtPayload } from '../lib/auth0'
import { anthropic } from '../lib/anthropic'
import { updateStreak } from '../lib/updateStreak'

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
type Level = typeof LEVEL_ORDER[number]

async function getUser(auth0Id: string) {
  const result = await db.select().from(users).where(eq(users.auth0_id, auth0Id)).limit(1)
  return result[0] ?? null
}

interface MCQ {
  question: string
  options: string[]
  correct: number
  explanation: string
}

export async function listeningRoutes(app: FastifyInstance) {
  // GET /api/listening/tracks — list articles accessible to the user's level
  app.get('/api/listening/tracks', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const userLevelIdx = LEVEL_ORDER.indexOf(user.level as Level)
    const accessibleLevels = LEVEL_ORDER.slice(0, userLevelIdx + 1)

    const query = request.query as Record<string, string>
    let levels = accessibleLevels
    if (query['level']) {
      const req = query['level'].split(',').map(s => s.trim()).filter(s => LEVEL_ORDER.includes(s as Level)) as Level[]
      levels = req.filter(l => accessibleLevels.includes(l))
      if (levels.length === 0) levels = accessibleLevels
    }

    const rows = await db
      .select({
        id: articles.id,
        title: articles.title,
        level: articles.level,
        topic: articles.topic,
        word_count: articles.word_count,
        estimated_minutes: articles.estimated_minutes,
      })
      .from(articles)
      .where(inArray(articles.level, levels))
      .orderBy(articles.level, articles.created_at)

    // Attach best score for each track
    const sessions = await db
      .select()
      .from(listening_sessions)
      .where(eq(listening_sessions.user_id, user.id))
      .orderBy(desc(listening_sessions.pct))

    const bestPct: Record<string, number> = {}
    for (const s of sessions) {
      if (bestPct[s.article_id] == null || s.pct > bestPct[s.article_id]!) {
        bestPct[s.article_id] = s.pct
      }
    }

    const tracks = rows.map(r => ({ ...r, best_pct: bestPct[r.id] ?? null }))

    const topicRows = await db
      .select({ topic: articles.topic })
      .from(articles)
      .where(inArray(articles.level, accessibleLevels))

    const topics = [...new Set(topicRows.map(r => r.topic))].sort()

    return reply.send({ data: { tracks, topics, accessible_levels: accessibleLevels, user_level: user.level } })
  })

  // GET /api/listening/tracks/:id/questions — full article text + AI-generated MCQs
  app.get('/api/listening/tracks/:id/questions', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const { id } = request.params as { id: string }
    const [article] = await db.select().from(articles).where(eq(articles.id, id)).limit(1)
    if (!article) return reply.code(404).send({ error: { code: 'not_found', message: 'Track not found' } })

    const userLevelIdx = LEVEL_ORDER.indexOf(user.level as Level)
    const articleIdx = LEVEL_ORDER.indexOf(article.level)
    if (articleIdx > userLevelIdx) {
      return reply.code(403).send({ error: { code: 'forbidden', message: 'Track above your current level' } })
    }

    const systemPrompt = `You are a German listening comprehension exercise generator for CEFR level ${user.level} learners.

Given a German text, generate exactly 4 multiple-choice comprehension questions.

Questions must:
- Test understanding of the text (main idea, specific details, inference, vocabulary in context)
- Be answerable only from the text — no outside knowledge required
- Be phrased in English
- Have exactly 4 options each (one correct, three plausible distractors)

Return a JSON array of 4 objects, each with:
- question: string (in English)
- options: string[] (4 items)
- correct: number (0-3, index of correct option)
- explanation: string (one sentence in English explaining why)

Return only valid JSON, no extra text.`

    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1800,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Text:\n\n${article.text}` }],
      })

      const raw = response.content[0]?.type === 'text' ? response.content[0].text : '[]'
      const clean = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
      const questions: MCQ[] = JSON.parse(clean)

      return reply.send({
        data: {
          article: {
            id: article.id,
            title: article.title,
            level: article.level,
            topic: article.topic,
            text: article.text,
            word_count: article.word_count,
            estimated_minutes: article.estimated_minutes,
          },
          questions,
        },
      })
    } catch (err) {
      request.log.error({ err }, 'Listening question generation failed')
      return reply.code(500).send({ error: { code: 'ai_error', message: 'Could not generate questions' } })
    }
  })

  // POST /api/listening/session — save score
  app.post('/api/listening/session', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const body = request.body as { article_id: string; score: number; total: number }
    if (!body.article_id || body.score == null || body.total == null) {
      return reply.code(400).send({ error: { code: 'validation_error', message: 'article_id, score, total required' } })
    }

    const pct = body.total > 0 ? Math.round((body.score / body.total) * 100) : 0

    const [session] = await db.insert(listening_sessions).values({
      user_id: user.id,
      article_id: body.article_id,
      score: body.score,
      total: body.total,
      pct,
    }).returning()

    await updateStreak(user)

    return reply.code(201).send({ data: session })
  })

  // GET /api/listening/sessions — recent sessions for the user
  app.get('/api/listening/sessions', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const sessions = await db
      .select()
      .from(listening_sessions)
      .where(eq(listening_sessions.user_id, user.id))
      .orderBy(desc(listening_sessions.created_at))
      .limit(50)

    return reply.send({ data: sessions })
  })
}
