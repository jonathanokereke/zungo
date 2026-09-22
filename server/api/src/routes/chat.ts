import { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth, type Auth0JwtPayload } from '../lib/auth0'
import { anthropic } from '../lib/anthropic'

async function getUser(auth0Id: string) {
  const result = await db.select().from(users).where(eq(users.auth0_id, auth0Id)).limit(1)
  return result[0] ?? null
}

function chatSystemPrompt(scenario: string, level: string): string {
  return `You are Zungo AI, a German language conversation partner for a language learning app.

The learner is at CEFR level ${level}. You are role-playing the scenario: "${scenario}".

Rules:
- Speak ONLY in German — stay in character for the scenario
- Keep responses short (1–3 sentences) and natural
- Match the complexity of your German to level ${level}
- After each of your responses, optionally add one line starting with "[Correction: " if the user made a grammar or vocabulary mistake in their most recent message, e.g.: [Correction: "kosted" → "kostet" — 3rd person singular adds -t]
- Be encouraging and keep the conversation flowing naturally
- Do not switch to English unless absolutely necessary for a correction`
}

export async function chatRoutes(app: FastifyInstance) {
  app.post('/api/chat', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const body = request.body as {
      messages: { role: 'user' | 'assistant'; text: string }[]
      scenario: string
    }

    if (!body.messages?.length || !body.scenario) {
      return reply.code(400).send({ error: { code: 'validation_error', message: 'messages and scenario required' } })
    }

    reply.hijack()
    reply.raw.setHeader('Content-Type', 'text/event-stream')
    reply.raw.setHeader('Cache-Control', 'no-cache')
    reply.raw.setHeader('Connection', 'keep-alive')
    reply.raw.setHeader('Access-Control-Allow-Origin', '*')
    reply.raw.writeHead(200)

    try {
      const stream = await anthropic.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: chatSystemPrompt(body.scenario, user.level),
        messages: body.messages.map(m => ({ role: m.role, content: m.text })),
      })

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          reply.raw.write(`data: ${JSON.stringify({ chunk: chunk.delta.text })}\n\n`)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      reply.raw.write(`data: ${JSON.stringify({ error: msg })}\n\n`)
    }

    reply.raw.write('data: [DONE]\n\n')
    reply.raw.end()
  })

  // Get scenario-specific opening message
  app.get('/api/chat/opening', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const query = request.query as { scenario?: string }
    const scenario = query.scenario ?? 'Beim Bäcker'

    const OPENINGS: Record<string, string> = {
      'Beim Bäcker': 'Guten Morgen! Willkommen in unserer Bäckerei. Was darf es für Sie sein? 🥐',
      'Beim Arzt': 'Guten Tag! Was kann ich für Sie tun? Wo haben Sie Beschwerden? 🏥',
      'Am Bahnhof': 'Guten Tag! Wie kann ich Ihnen helfen? Wohin möchten Sie reisen? 🚆',
      'Vorstellungsgespräch': 'Guten Morgen! Schön, Sie kennenzulernen. Erzählen Sie uns bitte etwas über sich. 💼',
      'Smalltalk': 'Hallo! Schönes Wetter heute, oder? Wie geht es Ihnen? 🤝',
    }

    return reply.send({ data: { text: OPENINGS[scenario] ?? `Guten Tag! Willkommen. Wie kann ich Ihnen helfen?` } })
  })
}
