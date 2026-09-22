import { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { users, writing_sessions, writing_prompts } from '../db/schema'
import { eq, sql } from 'drizzle-orm'
import { verifyAuth, type Auth0JwtPayload } from '../lib/auth0'
import { streamWritingCorrection } from '../lib/anthropic'
import { SubmitWritingSchema, WritingFeedbackSchema } from '@zungo/core'

async function getUser(auth0Id: string) {
  const result = await db.select().from(users).where(eq(users.auth0_id, auth0Id)).limit(1)
  return result[0] ?? null
}

export async function writingRoutes(app: FastifyInstance) {
  app.get('/api/writing/prompt', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const [promptRow] = await db.select().from(writing_prompts)
      .where(eq(writing_prompts.level, user.level))
      .orderBy(sql`RANDOM()`)
      .limit(1)

    if (!promptRow) {
      return reply.send({ data: { prompt: 'Beschreibe deinen letzten Urlaub.', level: user.level } })
    }

    return reply.send({ data: promptRow })
  })

  app.post('/api/writing/correct', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const body = SubmitWritingSchema.safeParse(request.body)
    if (!body.success) {
      return reply.code(400).send({ error: { code: 'validation_error', message: body.error.message } })
    }

    reply.hijack()
    reply.raw.setHeader('Content-Type', 'text/event-stream')
    reply.raw.setHeader('Cache-Control', 'no-cache')
    reply.raw.setHeader('Connection', 'keep-alive')
    reply.raw.setHeader('Access-Control-Allow-Origin', '*')
    reply.raw.writeHead(200)

    let fullText = ''

    await streamWritingCorrection(
      body.data.user_text,
      body.data.prompt,
      user.level,
      (chunk) => {
        fullText += chunk
        reply.raw.write(`data: ${JSON.stringify({ chunk })}\n\n`)
      },
      (err) => {
        reply.raw.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
      },
    )

    // Parse and save the session
    try {
      const clean = fullText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
      const feedback = WritingFeedbackSchema.parse(JSON.parse(clean))
      await db.insert(writing_sessions).values({
        user_id: user.id,
        prompt: body.data.prompt,
        user_text: body.data.user_text,
        corrected_text: feedback.corrected_text,
        feedback_json: feedback,
        level: user.level,
      })
    } catch {
      // Log but don't fail the stream response
    }

    reply.raw.write('data: [DONE]\n\n')
    reply.raw.end()
  })
}
