/**
 * Imports vocabulary from wortmeister dataset (A1-B2) + curated C1/C2 data.
 * Run: npx tsx src/db/importWordBank.ts
 *
 * Sources:
 * - A1-B2: https://github.com/ismavid/wortmeister (CC0)
 * - Sentences: Tatoeba (CC BY 2.0 FR) — attribution required in app
 * - C1-C2: curated data in src/db/data/c1c2.json
 */

import 'dotenv/config'
import { db } from './index.js'
import { word_bank } from './schema.js'
import { sql } from 'drizzle-orm'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const WORTMEISTER_VOCAB_URL =
  'https://raw.githubusercontent.com/ismavid/wortmeister/main/data/vocab.v1.json'
const WORTMEISTER_SENTENCES_URL =
  'https://raw.githubusercontent.com/ismavid/wortmeister/main/data/sentences.v1.json'

// wortmeister field indices
const F_ID = 0
const F_LEMMA = 1
const F_EN = 2
const F_POS = 3
const F_LEVEL = 4
const F_ARTICLE = 5

type WortmeisterEntry = [
  number,   // id
  string,   // lemma
  string,   // en
  string,   // pos
  string,   // level
  string | null,  // article
  ...unknown[]
]

type SentenceEntry = [string, unknown, unknown, string] // [german, _, _, english]
type SentencesData = { byId: Record<string, SentenceEntry[]> }

const LEVEL_MAP: Record<string, string> = {
  A1: 'A1', A2: 'A2', B1: 'B1', B2: 'B2',
}

const POS_MAP: Record<string, string> = {
  n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb',
  prep: 'preposition', conj: 'conjunction', pron: 'pronoun',
  num: 'numeral', interj: 'interjection', art: 'article',
}

async function fetchJson<T>(url: string): Promise<T> {
  console.log(`[fetch] ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  return res.json() as Promise<T>
}

type WortmeisterData = { words: WortmeisterEntry[]; fields: string[] }

async function importWortmeister(
  sentences: Record<string, SentenceEntry[]>
): Promise<Array<typeof word_bank.$inferInsert>> {
  const data = await fetchJson<WortmeisterData>(WORTMEISTER_VOCAB_URL)
  const vocab = data.words
  console.log(`[wortmeister] ${vocab.length} entries`)

  const rows: Array<typeof word_bank.$inferInsert> = []
  const seen = new Set<string>()

  for (const entry of vocab) {
    const lemma = entry[F_LEMMA]
    const level = LEVEL_MAP[entry[F_LEVEL]]
    if (!level) continue // skip unknown levels

    const article = entry[F_ARTICLE] || null
    const german = article ? `${article} ${lemma}` : lemma
    const dedup = german.toLowerCase()
    if (seen.has(dedup)) continue
    seen.add(dedup)

    const pos = POS_MAP[entry[F_POS]] ?? entry[F_POS]
    const translation = entry[F_EN] || ''

    // Pick first example sentence for this word if available
    const wordSentences = sentences[String(entry[F_ID])]
    const example = wordSentences?.[0]?.[0] ?? null

    rows.push({
      german,
      translation,
      cefr_level: level as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
      part_of_speech: pos,
      example_sentence: example,
    })
  }

  return rows
}

function importC1C2(): Array<typeof word_bank.$inferInsert> {
  const path = join(__dirname, 'data', 'c1c2.json')
  const raw = JSON.parse(readFileSync(path, 'utf-8')) as {
    C1: Array<{ german: string; translation: string; pos: string; example?: string }>
    C2: Array<{ german: string; translation: string; pos: string; example?: string }>
  }

  const rows: Array<typeof word_bank.$inferInsert> = []
  for (const [lvl, words] of Object.entries(raw) as ['C1' | 'C2', typeof raw.C1][]) {
    for (const w of words) {
      rows.push({
        german: w.german,
        translation: w.translation,
        cefr_level: lvl,
        part_of_speech: w.pos,
        example_sentence: w.example ?? null,
      })
    }
  }
  return rows
}

async function main() {
  console.log('[import] Starting word bank import...')

  const sentencesData = await fetchJson<SentencesData>(WORTMEISTER_SENTENCES_URL)
  const sentences = sentencesData.byId
  console.log(`[import] ${Object.keys(sentences).length} sentence entries loaded`)

  const wortmeisterRows = await importWortmeister(sentences)
  const c1c2Rows = importC1C2()
  // Final dedup across both sources (wortmeister can have dup lemma+article combos)
  const dedupMap = new Map<string, typeof wortmeisterRows[0]>()
  for (const row of [...wortmeisterRows, ...c1c2Rows]) {
    dedupMap.set(row.german.toLowerCase(), row)
  }
  const allRows = Array.from(dedupMap.values())

  console.log(`[import] Inserting ${allRows.length} words (${wortmeisterRows.length} A1-B2 + ${c1c2Rows.length} C1-C2)...`)

  // Batch inserts to avoid hitting param limits
  const BATCH = 500
  let inserted = 0
  for (let i = 0; i < allRows.length; i += BATCH) {
    const batch = allRows.slice(i, i + BATCH)
    await db
      .insert(word_bank)
      .values(batch)
      .onConflictDoUpdate({
        target: word_bank.german,
        set: {
          translation: sql`EXCLUDED.translation`,
          cefr_level: sql`EXCLUDED.cefr_level`,
          part_of_speech: sql`EXCLUDED.part_of_speech`,
          example_sentence: sql`EXCLUDED.example_sentence`,
        },
      })
    inserted += batch.length
    console.log(`[import] ${inserted}/${allRows.length}`)
  }

  const levelCounts = allRows.reduce<Record<string, number>>((acc, r) => {
    acc[r.cefr_level] = (acc[r.cefr_level] ?? 0) + 1
    return acc
  }, {})

  console.log('[import] Done! Level breakdown:')
  for (const [level, count] of Object.entries(levelCounts).sort()) {
    console.log(`  ${level}: ${count}`)
  }

  process.exit(0)
}

main().catch(err => {
  console.error('[import] Error:', err)
  process.exit(1)
})
