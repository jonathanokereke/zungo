import { pgTable, uuid, text, timestamp, integer, real, pgEnum, jsonb, date, boolean } from 'drizzle-orm/pg-core'

export const cefrLevelEnum = pgEnum('cefr_level', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  auth0_id: text('auth0_id').notNull().unique(),
  email: text('email').notNull(),
  level: cefrLevelEnum('level').notNull().default('B1'),
  streak: integer('streak').notNull().default(0),
  last_active: timestamp('last_active', { withTimezone: true }),
  preferences_json: jsonb('preferences_json'),
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
