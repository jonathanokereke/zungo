import { db } from './index'
import { users, writing_prompts, progress, writing_sessions } from './schema'
import { eq } from 'drizzle-orm'
import { DEV_AUTH0_ID } from '../lib/auth0'
import { seedDevWords } from './seedWords'

const ALL_PROMPTS = [
  // A1
  { prompt: 'Wie heißt du? Woher kommst du? Stell dich vor!', level: 'A1' as const, topic: 'personal' },
  { prompt: 'Beschreibe dein Zimmer. Was steht darin?', level: 'A1' as const, topic: 'daily_life' },
  { prompt: 'Was isst du zum Frühstück? Was trinkst du?', level: 'A1' as const, topic: 'food' },
  { prompt: 'Beschreibe deine Familie. Wie viele Personen sind das?', level: 'A1' as const, topic: 'family' },
  { prompt: 'Was machst du am Wochenende?', level: 'A1' as const, topic: 'leisure' },

  // A2
  { prompt: 'Beschreibe deine Stadt oder dein Dorf. Was gefällt dir daran?', level: 'A2' as const, topic: 'daily_life' },
  { prompt: 'Was ist dein Lieblingsessen? Warum magst du es?', level: 'A2' as const, topic: 'food' },
  { prompt: 'Welche Hobbys hast du? Wie oft machst du sie?', level: 'A2' as const, topic: 'leisure' },
  { prompt: 'Beschreibe deinen Alltag. Was machst du morgens, mittags und abends?', level: 'A2' as const, topic: 'daily_life' },
  { prompt: 'Schreibe über deinen letzten Urlaub. Wohin bist du gefahren?', level: 'A2' as const, topic: 'travel' },

  // B1
  { prompt: 'Beschreibe deinen typischen Morgen. Was machst du als erstes?', level: 'B1' as const, topic: 'daily_life' },
  { prompt: 'Schreibe über deine Lieblingsjahreszeit und warum du sie magst.', level: 'B1' as const, topic: 'nature' },
  { prompt: 'Was würdest du tun, wenn du einen freien Tag hättest?', level: 'B1' as const, topic: 'leisure' },
  { prompt: 'Beschreibe eine Person, die dich inspiriert. Wer ist sie und warum?', level: 'B1' as const, topic: 'people' },
  { prompt: 'Welche Ziele hast du für das nächste Jahr? Was planst du?', level: 'B1' as const, topic: 'personal' },
  { prompt: 'Schreibe über ein Erlebnis, das dich überrascht hat.', level: 'B1' as const, topic: 'personal' },
  { prompt: 'Welche Bedeutung hat Musik in deinem Leben?', level: 'B1' as const, topic: 'culture' },
  { prompt: 'Beschreibe deine ideale Arbeitsstelle. Was ist dir wichtig?', level: 'B1' as const, topic: 'work' },

  // B2
  { prompt: 'Welche Vor- und Nachteile hat das Leben in einer Großstadt?', level: 'B2' as const, topic: 'society' },
  { prompt: 'Diskutiere die Auswirkungen sozialer Medien auf die moderne Kommunikation.', level: 'B2' as const, topic: 'technology' },
  { prompt: 'Welche Maßnahmen sollten gegen den Klimawandel ergriffen werden?', level: 'B2' as const, topic: 'environment' },
  { prompt: 'Sollte das Studium an Universitäten kostenlos sein? Begründe deine Meinung.', level: 'B2' as const, topic: 'education' },
  { prompt: 'Wie hat die Digitalisierung die Arbeitswelt verändert?', level: 'B2' as const, topic: 'work' },
  { prompt: 'Was bedeutet Heimat für dich? Ist es ein Ort oder ein Gefühl?', level: 'B2' as const, topic: 'culture' },
  { prompt: 'Wie wichtig ist kulturelle Vielfalt für eine Gesellschaft?', level: 'B2' as const, topic: 'society' },
  { prompt: 'Sollten Tiere in Zoos gehalten werden? Diskutiere Pro und Contra.', level: 'B2' as const, topic: 'ethics' },

  // C1
  { prompt: 'Inwiefern beeinflusst Sprache unsere Wahrnehmung der Welt?', level: 'C1' as const, topic: 'language' },
  { prompt: 'Analysiere die gesellschaftlichen Folgen der Digitalisierung.', level: 'C1' as const, topic: 'society' },
  { prompt: 'Erörtern Sie, ob Bildung ein Grundrecht oder ein Privileg darstellt.', level: 'C1' as const, topic: 'education' },
  { prompt: 'Welche Rolle spielen Traditionen in einer globalisierten Welt?', level: 'C1' as const, topic: 'culture' },
  { prompt: 'Inwiefern ist Freiheit immer mit Verantwortung verbunden?', level: 'C1' as const, topic: 'philosophy' },
  { prompt: 'Diskutieren Sie die ethischen Implikationen künstlicher Intelligenz.', level: 'C1' as const, topic: 'technology' },
  { prompt: 'Wie lässt sich das Spannungsverhältnis zwischen Individuum und Gesellschaft beschreiben?', level: 'C1' as const, topic: 'society' },
  { prompt: 'Welchen Einfluss haben wirtschaftliche Interessen auf politische Entscheidungen?', level: 'C1' as const, topic: 'politics' },

  // C2
  { prompt: 'Erörtern Sie, inwiefern Sprache die Grenzen unseres Denkens bestimmt.', level: 'C2' as const, topic: 'philosophy' },
  { prompt: 'Analysieren Sie die Paradoxien der modernen Freiheitsgesellschaft.', level: 'C2' as const, topic: 'philosophy' },
  { prompt: 'Inwiefern ist die Unterscheidung zwischen Natur und Kultur haltbar?', level: 'C2' as const, topic: 'philosophy' },
  { prompt: 'Diskutieren Sie die Frage, ob objektives Wissen möglich ist.', level: 'C2' as const, topic: 'epistemology' },
  { prompt: 'Erörtern Sie die Grenzen und Möglichkeiten literarischer Übersetzung.', level: 'C2' as const, topic: 'language' },
]

const SAMPLE_WRITING_SESSIONS = [
  {
    prompt: 'Beschreibe deinen typischen Morgen.',
    user_text: 'Ich wache normalerweise um sieben Uhr auf. Dann dusche ich und esse Frühstück. Ich trinke immer Kaffee am Morgen. Danach fahre ich mit dem Zug zur Arbeit.',
    corrected_text: 'Normalerweise wache ich um sieben Uhr auf. Dann dusche ich mich und frühstücke. Morgens trinke ich immer Kaffee. Anschließend fahre ich mit dem Zug zur Arbeit.',
    feedback_json: { errors: 2, score: 78, highlights: ['Verbstellung im Nebensatz', 'Reflexivverb bei "duschen"'] },
    level: 'B1' as const,
  },
  {
    prompt: 'Welche Vor- und Nachteile hat das Leben in einer Großstadt?',
    user_text: 'In einer Großstadt gibt es viele Möglichkeiten für Arbeit und Freizeit. Man hat Zugang zu guten Restaurants, Museen und kulturellen Veranstaltungen. Allerdings sind die Mieten sehr hoch und es gibt viel Lärm. Die Luft ist oft schlechter als auf dem Land.',
    corrected_text: 'In einer Großstadt gibt es zahlreiche Möglichkeiten für Arbeit und Freizeit. Man hat Zugang zu guten Restaurants, Museen und kulturellen Veranstaltungen. Allerdings sind die Mieten sehr hoch, und es herrscht viel Lärm. Zudem ist die Luftqualität häufig schlechter als auf dem Land.',
    feedback_json: { errors: 1, score: 88, highlights: ['Kommasetzung bei Aufzählung', 'Stilistisch treffendere Ausdrücke'] },
    level: 'B2' as const,
  },
  {
    prompt: 'Inwiefern beeinflusst Sprache unsere Wahrnehmung der Welt?',
    user_text: 'Die Sprache, die wir sprechen, beeinflusst, wie wir denken und die Welt wahrnehmen. Verschiedene Sprachen haben unterschiedliche Konzepte für Zeit, Farben und soziale Beziehungen. Dies kann dazu führen, dass Sprecher verschiedener Sprachen dieselbe Situation unterschiedlich interpretieren.',
    corrected_text: 'Die Sprache, die wir sprechen, beeinflusst, wie wir denken und die Welt wahrnehmen. Verschiedene Sprachen verfügen über unterschiedliche Konzepte von Zeit, Farben und sozialen Beziehungen. Dies kann dazu führen, dass Sprecher verschiedener Sprachen dieselbe Situation unterschiedlich interpretieren und bewerten.',
    feedback_json: { errors: 0, score: 95, highlights: ['Sehr gute Argumentation', 'Präzise Wortwahl'] },
    level: 'C1' as const,
  },
]

export async function seedDevUser() {
  // ── User ──────────────────────────────────────────────────────────────────
  let userId: string
  const existing = await db.select().from(users).where(eq(users.auth0_id, DEV_AUTH0_ID)).limit(1)
  if (!existing.length) {
    const [inserted] = await db.insert(users).values({
      auth0_id: DEV_AUTH0_ID,
      email: 'dev@zungo.local',
      level: 'B1',
      streak: 14,
    }).returning({ id: users.id })
    userId = inserted.id
    console.log('[seed] Dev user created')
  } else {
    userId = existing[0].id
  }

  // ── Writing prompts ───────────────────────────────────────────────────────
  const promptCount = await db.select().from(writing_prompts).limit(1)
  if (!promptCount.length) {
    await db.insert(writing_prompts).values(ALL_PROMPTS)
    console.log(`[seed] ${ALL_PROMPTS.length} writing prompts created`)
  }

  // ── Progress history (28 days) ────────────────────────────────────────────
  const progressCount = await db.select().from(progress).where(eq(progress.user_id, userId)).limit(1)
  if (!progressCount.length) {
    const progressRows = []
    const today = new Date()
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      // simulate realistic activity — some days off, varying intensity
      const active = Math.random() > 0.2
      progressRows.push({
        user_id: userId,
        date: dateStr,
        words_reviewed: active ? 10 + Math.floor(Math.random() * 40) : 0,
        words_learned: active ? Math.floor(Math.random() * 8) : 0,
        writing_sessions: active && Math.random() > 0.5 ? 1 : 0,
        streak_count: Math.max(0, 28 - i - Math.floor(Math.random() * 3)),
      })
    }
    await db.insert(progress).values(progressRows)
    console.log(`[seed] ${progressRows.length} days of progress history created`)
  }

  // ── Writing sessions ──────────────────────────────────────────────────────
  const sessionCount = await db.select().from(writing_sessions).where(eq(writing_sessions.user_id, userId)).limit(1)
  if (!sessionCount.length) {
    const sessionRows = SAMPLE_WRITING_SESSIONS.map((s, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (i * 3 + 1))
      return { ...s, user_id: userId, created_at: d }
    })
    await db.insert(writing_sessions).values(sessionRows)
    console.log(`[seed] ${sessionRows.length} writing sessions created`)
  }

  // ── Vocabulary ────────────────────────────────────────────────────────────
  await seedDevWords()
}
