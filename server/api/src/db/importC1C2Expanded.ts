/**
 * Imports additional C1/C2 vocabulary from c1c2_expanded.json.
 * Run: npx tsx src/db/importC1C2Expanded.ts
 */

import 'dotenv/config'
import { db } from './index.js'
import { word_bank } from './schema.js'
import { sql } from 'drizzle-orm'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

type Entry = { german: string; translation: string; pos: string; example?: string }
type Data = { C1: Entry[]; C2: Entry[] }

function load(): Array<typeof word_bank.$inferInsert> {
  const raw = JSON.parse(
    readFileSync(join(__dirname, 'data', 'c1c2_expanded.json'), 'utf-8')
  ) as Data

  const rows: Array<typeof word_bank.$inferInsert> = []
  for (const [lvl, words] of Object.entries(raw) as ['C1' | 'C2', Entry[]][]) {
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
  const raw = load()
  // Deduplicate by german word (case-insensitive)
  const seen = new Set<string>()
  const rows = raw.filter(r => {
    const key = r.german.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  console.log(`[import] ${rows.length} C1/C2 entries to upsert (${raw.length - rows.length} duplicates removed)`)

  const BATCH = 500
  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
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
    console.log(`[import] ${inserted}/${rows.length}`)
  }

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.cefr_level!] = (acc[r.cefr_level!] ?? 0) + 1
    return acc
  }, {})
  console.log('[import] Done:', counts)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
