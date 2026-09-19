import 'dotenv/config'
import { seedDevUser } from './seed.js'

async function main() {
  console.log('[seed] Starting...')
  await seedDevUser()
  console.log('[seed] Done.')
  process.exit(0)
}

main().catch(err => {
  console.error('[seed] Failed:', err)
  process.exit(1)
})
