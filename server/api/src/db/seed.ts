import { db } from './index'
import { writing_prompts } from './schema'
import { seedWordBank } from './seedWords'

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

export async function seedSystemData() {
  // ── Writing prompts ───────────────────────────────────────────────────────
  const promptCount = await db.select().from(writing_prompts).limit(1)
  if (!promptCount.length) {
    await db.insert(writing_prompts).values(ALL_PROMPTS)
    console.log(`[seed] ${ALL_PROMPTS.length} writing prompts created`)
  }

  // ── Word bank (system vocabulary, shared across all users) ────────────────
  await seedWordBank()
}
