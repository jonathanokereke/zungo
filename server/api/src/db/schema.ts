import { pgTable, uuid, text, timestamp, integer, real, pgEnum, jsonb, date, boolean } from 'drizzle-orm/pg-core'

export const cefrLevelEnum = pgEnum('cefr_level', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  auth0_id: text('auth0_id').notNull().unique(),
  email: text('email').notNull().default(''),
  name: text('name').notNull().default(''),
  preferred_name: text('preferred_name').notNull().default(''),
  level: cefrLevelEnum('level').notNull().default('A1'),
  streak: integer('streak').notNull().default(0),
  last_active: timestamp('last_active', { withTimezone: true }),
  preferences_json: jsonb('preferences_json'),
  push_token: text('push_token'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const words = pgTable('words', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  german: text('german').notNull(),
  translation: text('translation').notNull(),
  part_of_speech: text('part_of_speech').notNull(),
  example_sentence: text('example_sentence'),
  source_text: text('source_text'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  word_id: uuid('word_id').notNull().references(() => words.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  due_date: timestamp('due_date', { withTimezone: true }).notNull().defaultNow(),
  interval: integer('interval').notNull().default(0),
  repetition: integer('repetition').notNull().default(0),
  ease_factor: real('ease_factor').notNull().default(2.5),
  last_reviewed_at: timestamp('last_reviewed_at', { withTimezone: true }),
})

export const writing_sessions = pgTable('writing_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  user_text: text('user_text').notNull(),
  corrected_text: text('corrected_text').notNull(),
  feedback_json: jsonb('feedback_json').notNull(),
  level: cefrLevelEnum('level').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const progress = pgTable('progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  words_reviewed: integer('words_reviewed').notNull().default(0),
  words_learned: integer('words_learned').notNull().default(0),
  writing_sessions: integer('writing_sessions').notNull().default(0),
  streak_count: integer('streak_count').notNull().default(0),
})

export const writing_prompts = pgTable('writing_prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  prompt: text('prompt').notNull(),
  level: cefrLevelEnum('level').notNull(),
  topic: text('topic').notNull(),
})

export const word_bank = pgTable('word_bank', {
  id: uuid('id').primaryKey().defaultRandom(),
  german: text('german').notNull().unique(),
  translation: text('translation').notNull(),
  part_of_speech: text('part_of_speech').notNull(),
  example_sentence: text('example_sentence'),
  cefr_level: cefrLevelEnum('cefr_level').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const chat_sessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  scenario: text('scenario').notNull(),
  messages_json: jsonb('messages_json').notNull(),
  message_count: integer('message_count').notNull().default(0),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const grammar_sessions = pgTable('grammar_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  topic: text('topic').notNull(),
  score: integer('score').notNull(),
  total: integer('total').notNull(),
  pct: integer('pct').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const reading_sessions = pgTable('reading_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  level: cefrLevelEnum('level').notNull(),
  topic: text('topic').notNull(),
  words_looked_up: integer('words_looked_up').notNull().default(0),
  duration_seconds: integer('duration_seconds').notNull().default(0),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const articles = pgTable('articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  level: cefrLevelEnum('level').notNull(),
  topic: text('topic').notNull(),
  text: text('text').notNull(),
  word_count: integer('word_count').notNull().default(0),
  estimated_minutes: integer('estimated_minutes').notNull().default(1),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const vocab_decks = pgTable('vocab_decks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  level: cefrLevelEnum('level').notNull(),
  topic: text('topic').notNull(),
  word_count: integer('word_count').notNull().default(0),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const vocab_deck_words = pgTable('vocab_deck_words', {
  id: uuid('id').primaryKey().defaultRandom(),
  deck_id: uuid('deck_id').notNull().references(() => vocab_decks.id, { onDelete: 'cascade' }),
  german: text('german').notNull(),
  translation: text('translation').notNull(),
  part_of_speech: text('part_of_speech').notNull(),
  example_sentence: text('example_sentence'),
  sort_order: integer('sort_order').notNull().default(0),
})

export const user_deck_imports = pgTable('user_deck_imports', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  deck_id: uuid('deck_id').notNull().references(() => vocab_decks.id, { onDelete: 'cascade' }),
  imported_at: timestamp('imported_at', { withTimezone: true }).notNull().defaultNow(),
})
