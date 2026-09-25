import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { word_bank } from './schema.js'
import { sql } from 'drizzle-orm'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const expandedData = JSON.parse(readFileSync(join(__dirname, 'data/c1c2_expanded.json'), 'utf8'))
const supplementData = JSON.parse(readFileSync(join(__dirname, 'data/c1c2_supplement.json'), 'utf8'))

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client)

type WordEntry = { german: string; translation: string; pos: string; example?: string }

function buildRows(entries: WordEntry[], level: 'C1' | 'C2') {
  return entries.map(e => ({
    german: e.german,
    translation: e.translation,
    part_of_speech: e.pos,
    example_sentence: e.example ?? null,
    cefr_level: level as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
  }))
}

async function run() {
  const allRows = [
    ...buildRows(expandedData.C1 as WordEntry[], 'C1'),
    ...buildRows(expandedData.C2 as WordEntry[], 'C2'),
    ...buildRows(supplementData.C1 as WordEntry[], 'C1'),
    ...buildRows(supplementData.C2 as WordEntry[], 'C2'),
  ]

  console.log(`Inserting ${allRows.length} rows (skip duplicates on german)…`)

  const BATCH = 200
  for (let i = 0; i < allRows.length; i += BATCH) {
    const batch = allRows.slice(i, i + BATCH)
    await db
      .insert(word_bank)
      .values(batch)
      .onConflictDoNothing({ target: word_bank.german })
    process.stdout.write(`  batch ${Math.floor(i / BATCH) + 1}: sent\n`)
  }

  console.log(`\nDone.`)

  // Print new totals
  const counts = await db.execute(
    sql`SELECT cefr_level, COUNT(*) AS count FROM word_bank GROUP BY cefr_level ORDER BY cefr_level`
  )
  console.log('\nWord counts by level:')
  for (const row of counts) {
    console.log(`  ${(row as any).cefr_level}: ${(row as any).count}`)
  }

  await client.end()
}

run().catch(err => { console.error(err); process.exit(1) })
