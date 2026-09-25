import { db } from '../db/index'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

type UserRow = { id: string; streak: number; last_active: Date | null }

export async function updateStreak(user: UserRow): Promise<number> {
  const today = new Date().toISOString().split('T')[0]!
  const lastActive = user.last_active ? new Date(user.last_active).toISOString().split('T')[0] : null
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]!

  const newStreak =
    lastActive === today ? user.streak
    : lastActive === yesterday ? user.streak + 1
    : 1

  await db.update(users)
    .set({ streak: newStreak, last_active: new Date() })
    .where(eq(users.id, user.id))

  return newStreak
}
