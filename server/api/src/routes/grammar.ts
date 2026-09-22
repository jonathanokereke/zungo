import { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { users, grammar_sessions } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { verifyAuth, type Auth0JwtPayload } from '../lib/auth0'
import { anthropic } from '../lib/anthropic'

async function getUser(auth0Id: string) {
  const result = await db.select().from(users).where(eq(users.auth0_id, auth0Id)).limit(1)
  return result[0] ?? null
}

// All grammar topics with the minimum CEFR level required to encounter them
const ALL_TOPICS = [
  { title: 'Artikel & Genus',        subtitle: 'Definite and indefinite articles',    minLevel: 'A1', color: '#16A34A' },
  { title: 'Präsens',                subtitle: 'Present tense conjugation',            minLevel: 'A1', color: '#2563EB' },
  { title: 'Verneinung',             subtitle: 'Negation with nicht & kein',           minLevel: 'A1', color: '#7C3AED' },
  { title: 'Modalverben',            subtitle: 'Modal verbs: können, müssen, wollen',  minLevel: 'A2', color: '#B45309' },
  { title: 'Der Dativ',              subtitle: 'Indirect object case',                 minLevel: 'A2', color: '#16A34A' },
  { title: 'Perfekt',                subtitle: 'Present perfect with haben & sein',    minLevel: 'A2', color: '#DC2626' },
  { title: 'Adjektivdeklination',    subtitle: 'Adjective endings by case & gender',       minLevel: 'B1', color: '#6366F1' },
  { title: 'Konjunktiv II',          subtitle: 'Subjunctive mood for hypotheticals',       minLevel: 'B1', color: '#B45309' },
  { title: 'Passiv Konstruktionen',  subtitle: 'Passive voice with werden',                minLevel: 'B1', color: '#3730A3' },
  { title: 'Nebensätze',             subtitle: 'Subordinate clauses: weil, dass, wenn',    minLevel: 'B1', color: '#0891B2' },
  { title: 'Verben mit Präpositionen', subtitle: 'Verbs that govern specific prepositions', minLevel: 'B1', color: '#DC2626' },
  { title: 'Wechselpräpositionen',   subtitle: 'Two-way prepositions: Akkusativ & Dativ',  minLevel: 'B1', color: '#16A34A' },
  { title: 'Reflexive Verben',       subtitle: 'Reflexive verbs with sich',                minLevel: 'B1', color: '#7C3AED' },
  { title: 'Futur I',                subtitle: 'Future tense with werden + Infinitiv',     minLevel: 'B1', color: '#2563EB' },
  { title: 'Komparativ & Superlativ', subtitle: 'Comparative and superlative adjectives',  minLevel: 'B1', color: '#B45309' },
  { title: 'Trennbare Verben',       subtitle: 'Separable and inseparable prefix verbs',   minLevel: 'B1', color: '#16A34A' },
  { title: 'Relativsätze',           subtitle: 'Relative clauses with der/die/das',    minLevel: 'B2', color: '#DC2626' },
  { title: 'Genitiv',                subtitle: 'Possessive case',                      minLevel: 'B2', color: '#6366F1' },
  { title: 'Infinitivkonstruktionen',subtitle: 'Infinitive clauses with zu',           minLevel: 'B2', color: '#0891B2' },
  { title: 'Erweiterte Partizipien', subtitle: 'Extended participial phrases',          minLevel: 'C1', color: '#7C3AED' },
  { title: 'Konjunktiv I',           subtitle: 'Reported speech subjunctive',          minLevel: 'C1', color: '#B45309' },
  { title: 'Doppelkonjunktionen',    subtitle: 'Correlative conjunctions',             minLevel: 'C1', color: '#16A34A' },
  { title: 'Nominalstil',            subtitle: 'Nominalisation in formal German',      minLevel: 'C2', color: '#DC2626' },
  { title: 'Stilistische Mittel',    subtitle: 'Rhetorical and stylistic devices',     minLevel: 'C2', color: '#2563EB' },
]

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function topicsForLevel(level: string) {
  return ALL_TOPICS.filter(t => t.minLevel === level)
}

export async function grammarRoutes(app: FastifyInstance) {
  // Returns topics appropriate for the user's CEFR level
  app.get('/api/grammar/topics', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const sessions = await db.select().from(grammar_sessions)
      .where(eq(grammar_sessions.user_id, user.id))
      .orderBy(desc(grammar_sessions.created_at))
      .limit(200)

    // Compute per-topic average mastery
    const masteryMap: Record<string, number[]> = {}
    for (const s of sessions) {
      if (!masteryMap[s.topic]) masteryMap[s.topic] = []
      masteryMap[s.topic]!.push(s.pct)
    }

    const topics = topicsForLevel(user.level).map(def => {
      const pcts = masteryMap[def.title]
      const mastery = pcts && pcts.length > 0
        ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
        : 0
      return { ...def, mastery }
    })

    return reply.send({ data: { topics, level: user.level } })
  })

  // Generates 5 exercise questions for a given topic at the user's level using Claude
  app.get('/api/grammar/exercises', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const query = request.query as { topic?: string }
    const topic = query.topic ?? 'Präsens'

    const systemPrompt = `You are a German grammar exercise generator for CEFR level ${user.level} learners.
Generate exactly 5 multiple-choice questions for the topic: "${topic}".

Return a JSON array of 5 objects, each with:
- sentence: German sentence with a blank marked as ___
- options: array of exactly 4 strings (possible answers)
- correct: index (0-3) of the correct option
- explanation: one sentence in English explaining why the answer is correct and which grammar rule applies

Ensure questions are appropriate for level ${user.level}. Return only valid JSON array, no extra text.`

    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Generate 5 ${topic} exercises for CEFR ${user.level}` }],
      })

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '[]'
      // Strip markdown code fences if present
      const clean = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
      const questions = JSON.parse(clean)

      return reply.send({ data: { questions, topic, level: user.level } })
    } catch (err) {
      request.log.error({ err }, 'Grammar exercise generation failed')
      return reply.code(500).send({ error: { code: 'ai_error', message: 'Could not generate exercises' } })
    }
  })

  app.post('/api/grammar/session', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const body = request.body as { topic: string; score: number; total: number }
    if (!body.topic || body.score == null || body.total == null) {
      return reply.code(400).send({ error: { code: 'validation_error', message: 'topic, score, total required' } })
    }

    const pct = body.total > 0 ? Math.round((body.score / body.total) * 100) : 0

    const [session] = await db.insert(grammar_sessions).values({
      user_id: user.id,
      topic: body.topic,
      score: body.score,
      total: body.total,
      pct,
    }).returning()

    return reply.code(201).send({ data: session })
  })

  app.get('/api/grammar/sessions', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const sessions = await db.select().from(grammar_sessions)
      .where(eq(grammar_sessions.user_id, user.id))
      .orderBy(desc(grammar_sessions.created_at))
      .limit(50)

    return reply.send({ data: sessions })
  })
}
