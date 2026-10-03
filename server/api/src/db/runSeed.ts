import 'dotenv/config'
import { seedSystemData } from './seed.js'
import { seedDecks } from './seedDecks.js'

async function main() {
  console.log('[seed] Starting...')
  await seedSystemData()
  await seedDecks()
  console.log('[seed] Done.')
  process.exit(0)
}

main().catch(err => {
  console.error('[seed] Failed:', err)
  process.exit(1)
})
