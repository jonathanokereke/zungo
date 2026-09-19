import { db } from './index'
import { users, writing_prompts } from './schema'
import { eq } from 'drizzle-orm'
import { DEV_AUTH0_ID } from '../lib/auth0'

export async function seedDevUser() {
  const existing = await db.select().from(users).where(eq(users.auth0_id, DEV_AUTH0_ID)).limit(1)
  if (!existing.length) {
    await db.insert(users).values({
      auth0_id: DEV_AUTH0_ID,
      email: 'dev@zungo.local',
      level: 'B1',
      streak: 5,
    })
    console.log('[seed] Dev user created')
  }

  const promptCount = await db.select().from(writing_prompts).limit(1)
  if (!promptCount.length) {
    await db.insert(writing_prompts).values([
      { prompt: 'Beschreibe deinen typischen Morgen. Was machst du als erstes?', level: 'B1', topic: 'daily_life' },
      { prompt: 'Schreibe über deine Lieblingsjahreszeit und warum du sie magst.', level: 'B1', topic: 'nature' },
      { prompt: 'Was würdest du tun, wenn du einen freien Tag hättest?', level: 'B1', topic: 'leisure' },
      { prompt: 'Beschreibe eine Person, die dich inspiriert. Wer ist sie und warum?', level: 'B1', topic: 'people' },
      { prompt: 'Welche Vor- und Nachteile hat das Leben in einer Großstadt?', level: 'B2', topic: 'society' },
      { prompt: 'Diskutiere die Auswirkungen sozialer Medien auf die moderne Kommunikation.', level: 'B2', topic: 'technology' },
      { prompt: 'Welche Maßnahmen sollten gegen den Klimawandel ergriffen werden?', level: 'B2', topic: 'environment' },
      { prompt: 'Inwiefern beeinflusst Sprache unsere Wahrnehmung der Welt?', level: 'C1', topic: 'language' },
      { prompt: 'Analysiere die gesellschaftlichen Folgen der Digitalisierung.', level: 'C1', topic: 'society' },
      { prompt: 'Erörtern Sie, ob Bildung ein Grundrecht oder ein Privileg darstellt.', level: 'C1', topic: 'education' },
    ])
    console.log('[seed] Writing prompts created')
  }
}
