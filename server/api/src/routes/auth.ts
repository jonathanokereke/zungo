import { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { users } from '../db/schema'
import { eq, sql } from 'drizzle-orm'
import { verifyAuth, extractAuth0Email, extractAuth0Name, type Auth0JwtPayload } from '../lib/auth0'

export async function authRoutes(app: FastifyInstance) {
  // Auto-creates user on first login; updates email/name on subsequent logins
  app.get('/api/users/me', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const email = extractAuth0Email(jwt)
    const name = extractAuth0Name(jwt)

    const [user] = await db
      .insert(users)
      .values({ auth0_id: jwt.sub, email, name })
      .onConflictDoUpdate({
        target: users.auth0_id,
        set: {
          email: sql`EXCLUDED.email`,
          name: sql`CASE WHEN EXCLUDED.name != '' THEN EXCLUDED.name ELSE ${users.name} END`,
        },
      })
      .returning()

    return reply.send({ data: user })
  })

  // Called by mobile after login to sync profile data from the ID token
  app.post('/api/users/profile', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const { name, email } = request.body as { name?: string; email?: string }
    await db.update(users)
      .set({
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
      })
      .where(eq(users.auth0_id, jwt.sub))
    return reply.send({ data: { ok: true } })
  })

  app.patch('/api/users/preferences', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const prefs = request.body as Record<string, unknown>
    const [existing] = await db.select().from(users).where(eq(users.auth0_id, jwt.sub)).limit(1)
    if (!existing) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })
    const merged = { ...(existing.preferences_json as object ?? {}), ...prefs }
    await db.update(users).set({ preferences_json: merged }).where(eq(users.auth0_id, jwt.sub))
    return reply.send({ data: { ok: true } })
  })
}
