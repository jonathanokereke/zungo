import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index'
import { users } from '../db/schema'
import { eq, isNotNull } from 'drizzle-orm'
import { verifyAuth, type Auth0JwtPayload } from '../lib/auth0'
import { sendPushNotifications } from '../lib/pushNotifications'
import { env } from '../lib/env'

const RegisterTokenSchema = z.object({
  token: z.string().min(1),
})

export async function pushRoutes(app: FastifyInstance) {
  // Register or update the Expo push token for this user
  app.post('/api/push/token', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload

    const body = RegisterTokenSchema.safeParse(request.body)
    if (!body.success) {
      return reply.code(400).send({ error: { code: 'validation_error', message: body.error.message } })
    }

    await db
      .update(users)
      .set({ push_token: body.data.token })
      .where(eq(users.auth0_id, jwt.sub))

    return reply.send({ data: { ok: true } })
  })

  // Remove the push token (called on sign out)
  app.delete('/api/push/token', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    await db.update(users).set({ push_token: null }).where(eq(users.auth0_id, jwt.sub))
    return reply.send({ data: { ok: true } })
  })

  // POST /api/push/send-reminders — send daily reminder to all users with a push token.
  // Protected by a shared secret header (X-Cron-Secret) so only Railway/cron can call it.
  app.post('/api/push/send-reminders', async (request, reply) => {
    const secret = request.headers['x-cron-secret']
    if (!secret || secret !== env.CRON_SECRET) {
      return reply.code(401).send({ error: { code: 'unauthorized', message: 'Invalid cron secret' } })
    }

    const targets = await db
      .select({ push_token: users.push_token, streak: users.streak })
      .from(users)
      .where(isNotNull(users.push_token))

    const messages = targets
      .filter(u => u.push_token)
      .map(u => ({
        token: u.push_token!,
        title: 'Zeit zum Lernen! 🇩🇪',
        body: u.streak > 1
          ? `${u.streak}-day streak — keep it going!`
          : 'Your daily German practice is waiting.',
        data: { screen: 'Review' },
      }))

    await sendPushNotifications(messages)
    return reply.send({ data: { sent: messages.length } })
  })
}
