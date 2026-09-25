import { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { users, words, reviews, vocab_decks, vocab_deck_words, user_deck_imports } from '../db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { verifyAuth, type Auth0JwtPayload } from '../lib/auth0'

async function getUser(auth0Id: string) {
  const result = await db.select().from(users).where(eq(users.auth0_id, auth0Id)).limit(1)
  return result[0] ?? null
}

export async function deckRoutes(app: FastifyInstance) {
  // GET /api/decks — list all decks with import status for the user
  app.get('/api/decks', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const allDecks = await db.select().from(vocab_decks).orderBy(vocab_decks.level, vocab_decks.title)
    const imports = await db.select({ deck_id: user_deck_imports.deck_id })
      .from(user_deck_imports).where(eq(user_deck_imports.user_id, user.id))

    const importedIds = new Set(imports.map(i => i.deck_id))
    return reply.send({
      data: allDecks.map(d => ({ ...d, imported: importedIds.has(d.id) })),
    })
  })

  // GET /api/decks/:id — deck detail with all words
  app.get('/api/decks/:id', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const { id } = request.params as { id: string }
    const [deck] = await db.select().from(vocab_decks).where(eq(vocab_decks.id, id)).limit(1)
    if (!deck) return reply.code(404).send({ error: { code: 'not_found', message: 'Deck not found' } })

    const deckWords = await db.select().from(vocab_deck_words)
      .where(eq(vocab_deck_words.deck_id, id))
      .orderBy(vocab_deck_words.sort_order)

    const [imported] = await db.select().from(user_deck_imports)
      .where(and(eq(user_deck_imports.user_id, user.id), eq(user_deck_imports.deck_id, id)))
      .limit(1)

    return reply.send({ data: { ...deck, words: deckWords, imported: !!imported } })
  })

  // POST /api/decks/:id/import — import all deck words into the user's vocabulary
  app.post('/api/decks/:id/import', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const { id } = request.params as { id: string }
    const [deck] = await db.select().from(vocab_decks).where(eq(vocab_decks.id, id)).limit(1)
    if (!deck) return reply.code(404).send({ error: { code: 'not_found', message: 'Deck not found' } })

    // Idempotent — skip if already imported
    const [existing] = await db.select().from(user_deck_imports)
      .where(and(eq(user_deck_imports.user_id, user.id), eq(user_deck_imports.deck_id, id)))
      .limit(1)
    if (existing) return reply.send({ data: { added: 0, already_imported: true } })

    const deckWords = await db.select().from(vocab_deck_words)
      .where(eq(vocab_deck_words.deck_id, id))

    // Find existing german words to avoid duplicates
    const existingGerman = await db.select({ german: words.german })
      .from(words).where(eq(words.user_id, user.id))
    const existingSet = new Set(existingGerman.map(w => w.german.toLowerCase()))

    const newWords = deckWords.filter(w => !existingSet.has(w.german.toLowerCase()))

    if (newWords.length > 0) {
      const inserted = await db.insert(words).values(
        newWords.map(w => ({
          user_id: user.id,
          german: w.german,
          translation: w.translation,
          part_of_speech: w.part_of_speech,
          example_sentence: w.example_sentence ?? undefined,
          source_text: `Deck: ${deck.title}`,
        }))
      ).returning()

      await db.insert(reviews).values(
        inserted.map(w => ({ word_id: w.id, user_id: user.id }))
      )
    }

    await db.insert(user_deck_imports).values({ user_id: user.id, deck_id: id })

    return reply.send({ data: { added: newWords.length, already_imported: false } })
  })
}
