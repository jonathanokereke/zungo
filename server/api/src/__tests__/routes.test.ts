import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from './app'

// ── DB mock — must use vi.hoisted so the factory can reference these ──────────
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../db/index', () => ({ db: mockDb }))
vi.mock('../lib/anthropic', () => ({
  lookupWord: vi.fn(),
  streamWritingCorrection: vi.fn(),
}))

import { lookupWord, streamWritingCorrection } from '../lib/anthropic'
import { db } from '../db/index'

// ── Fixtures ─────────────────────────────────────────────────────────────────
const DEV_TOKEN = 'Bearer dev-token'

const fakeUser = {
  id: 'user-uuid',
  auth0_id: 'dev|user',
  email: 'test@example.com',
  level: 'B1' as const,
  streak: 5,
  last_active: new Date('2026-09-18'),
  preferences_json: null,
  created_at: new Date(),
}

const fakeWord = {
  id: 'word-uuid',
  user_id: fakeUser.id,
  german: 'das Haus',
  translation: 'the house',
  part_of_speech: 'noun',
  example_sentence: 'Das Haus ist groß.',
  source_text: null,
  created_at: new Date(),
}

const fakeReview = {
  id: 'review-uuid',
  word_id: fakeWord.id,
  user_id: fakeUser.id,
  due_date: new Date(),
  interval: 1,
  repetition: 1,
  ease_factor: 2.5,
  last_reviewed_at: null,
}

// ── Drizzle chainable query builder helper ────────────────────────────────────
// Drizzle uses method chaining: db.select().from().where().limit()
// This factory returns an object that satisfies any chain and resolves to `result`.
function chainReturning(result: unknown) {
  const chain: Record<string, unknown> = {}
  const methods = ['from', 'where', 'limit', 'offset', 'orderBy', 'innerJoin', 'returning', 'values', 'set']
  methods.forEach(m => { chain[m] = vi.fn(() => chain) })
  // Make it thenable so `await db.select()...` returns result
  chain['then'] = (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve)
  return chain
}

function setupDbUser(user: typeof fakeUser | null) {
  vi.mocked(db.select).mockReturnValue(chainReturning(user ? [user] : []) as never)
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
let app: FastifyInstance

beforeAll(async () => { app = await buildApp() })
afterAll(async () => { await app.close() })
beforeEach(() => { vi.clearAllMocks() })

// ─────────────────────────────────────────────────────────────────────────────
// Words
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/words', () => {
  it('returns word list for authenticated user', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(chainReturning([fakeUser]) as never)
      .mockReturnValueOnce(chainReturning([fakeWord]) as never)

    const res = await app.inject({ method: 'GET', url: '/api/words', headers: { authorization: DEV_TOKEN } })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
    expect(res.json().data[0].german).toBe('das Haus')
  })

  it('returns 404 when user not found', async () => {
    setupDbUser(null)

    const res = await app.inject({ method: 'GET', url: '/api/words', headers: { authorization: DEV_TOKEN } })

    expect(res.statusCode).toBe(404)
    expect(res.json().error.code).toBe('not_found')
  })

  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/words' })
    expect(res.statusCode).toBe(401)
  })
})

describe('POST /api/words', () => {
  const validBody = { german: 'der Hund', translation: 'the dog', part_of_speech: 'noun' }

  it('creates a word and returns 201', async () => {
    vi.mocked(db.select).mockReturnValueOnce(chainReturning([fakeUser]) as never)
    vi.mocked(db.insert).mockReturnValue(chainReturning([fakeWord]) as never)

    const res = await app.inject({
      method: 'POST', url: '/api/words',
      headers: { authorization: DEV_TOKEN, 'content-type': 'application/json' },
      body: JSON.stringify(validBody),
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data.german).toBe('das Haus')
  })

  it('returns 400 for invalid body', async () => {
    setupDbUser(fakeUser)

    const res = await app.inject({
      method: 'POST', url: '/api/words',
      headers: { authorization: DEV_TOKEN, 'content-type': 'application/json' },
      body: JSON.stringify({ german: 'der Hund' }), // missing translation + part_of_speech
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('validation_error')
  })

  it('returns 404 when user not found', async () => {
    setupDbUser(null)

    const res = await app.inject({
      method: 'POST', url: '/api/words',
      headers: { authorization: DEV_TOKEN, 'content-type': 'application/json' },
      body: JSON.stringify(validBody),
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /api/words/:id', () => {
  it('deletes word and returns success', async () => {
    setupDbUser(fakeUser)
    vi.mocked(db.delete).mockReturnValue(chainReturning([]) as never)

    const res = await app.inject({
      method: 'DELETE', url: '/api/words/word-uuid',
      headers: { authorization: DEV_TOKEN },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.deleted).toBe(true)
  })

  it('returns 404 when user not found', async () => {
    setupDbUser(null)

    const res = await app.inject({
      method: 'DELETE', url: '/api/words/word-uuid',
      headers: { authorization: DEV_TOKEN },
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('GET /api/words/lookup', () => {
  it('returns AI lookup result for a valid word', async () => {
    setupDbUser(fakeUser)
    const mockResult = {
      translation: 'mischievous', partOfSpeech: 'adjective' as const,
      exampleSentence: 'Er lächelte verschmitzt.', level: 'B2',
    }
    vi.mocked(lookupWord).mockResolvedValue(mockResult as never)

    const res = await app.inject({
      method: 'GET', url: '/api/words/lookup?word=verschmitzt',
      headers: { authorization: DEV_TOKEN },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.translation).toBe('mischievous')
  })

  it('returns 400 when word param is missing', async () => {
    setupDbUser(fakeUser)

    const res = await app.inject({
      method: 'GET', url: '/api/words/lookup',
      headers: { authorization: DEV_TOKEN },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('validation_error')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Reviews
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/reviews/due', () => {
  it('returns due reviews with word data', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(chainReturning([fakeUser]) as never)
      .mockReturnValueOnce(chainReturning([{ review: fakeReview, word: fakeWord }]) as never)

    const res = await app.inject({
      method: 'GET', url: '/api/reviews/due',
      headers: { authorization: DEV_TOKEN },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
    expect(res.json().data[0].word.german).toBe('das Haus')
  })

  it('returns 404 when user not found', async () => {
    setupDbUser(null)

    const res = await app.inject({
      method: 'GET', url: '/api/reviews/due',
      headers: { authorization: DEV_TOKEN },
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('POST /api/reviews/:wordId', () => {
  it('updates review with SM-2 result', async () => {
    const updatedReview = { ...fakeReview, interval: 6, repetition: 2, ease_factor: 2.6 }

    vi.mocked(db.select)
      .mockReturnValueOnce(chainReturning([fakeUser]) as never)
      .mockReturnValueOnce(chainReturning([fakeReview]) as never)
    vi.mocked(db.update)
      .mockReturnValueOnce(chainReturning([updatedReview]) as never)
      .mockReturnValueOnce(chainReturning([]) as never)

    const res = await app.inject({
      method: 'POST', url: '/api/reviews/word-uuid',
      headers: { authorization: DEV_TOKEN, 'content-type': 'application/json' },
      body: JSON.stringify({ quality: 4 }),
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.interval).toBe(6)
  })

  it('returns 400 for invalid quality value', async () => {
    setupDbUser(fakeUser)

    const res = await app.inject({
      method: 'POST', url: '/api/reviews/word-uuid',
      headers: { authorization: DEV_TOKEN, 'content-type': 'application/json' },
      body: JSON.stringify({ quality: 9 }), // out of 0-5 range
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('validation_error')
  })

  it('returns 404 when review record not found', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(chainReturning([fakeUser]) as never)
      .mockReturnValueOnce(chainReturning([]) as never) // no review

    const res = await app.inject({
      method: 'POST', url: '/api/reviews/missing-word',
      headers: { authorization: DEV_TOKEN, 'content-type': 'application/json' },
      body: JSON.stringify({ quality: 4 }),
    })

    expect(res.statusCode).toBe(404)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Progress
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/progress', () => {
  it('returns progress stats for the user', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(chainReturning([fakeUser]) as never)
      .mockReturnValueOnce(chainReturning([{ count: 42 }]) as never)   // word count
      .mockReturnValueOnce(chainReturning([{ count: 8 }]) as never)    // session count
      .mockReturnValueOnce(chainReturning([fakeReview]) as never)       // recent reviews

    const res = await app.inject({
      method: 'GET', url: '/api/progress',
      headers: { authorization: DEV_TOKEN },
    })

    expect(res.statusCode).toBe(200)
    const data = res.json().data
    expect(data.total_words).toBe(42)
    expect(data.total_writing_sessions).toBe(8)
    expect(data.user.level).toBe('B1')
  })

  it('returns 404 when user not found', async () => {
    setupDbUser(null)

    const res = await app.inject({
      method: 'GET', url: '/api/progress',
      headers: { authorization: DEV_TOKEN },
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('PATCH /api/users/me', () => {
  it('updates user level', async () => {
    const updated = { ...fakeUser, level: 'B2' as const }
    vi.mocked(db.select).mockReturnValueOnce(chainReturning([fakeUser]) as never)
    vi.mocked(db.update).mockReturnValueOnce(chainReturning([updated]) as never)

    const res = await app.inject({
      method: 'PATCH', url: '/api/users/me',
      headers: { authorization: DEV_TOKEN, 'content-type': 'application/json' },
      body: JSON.stringify({ level: 'B2' }),
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.level).toBe('B2')
  })

  it('returns 404 when user not found', async () => {
    setupDbUser(null)

    const res = await app.inject({
      method: 'PATCH', url: '/api/users/me',
      headers: { authorization: DEV_TOKEN, 'content-type': 'application/json' },
      body: JSON.stringify({ level: 'B2' }),
    })

    expect(res.statusCode).toBe(404)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Writing
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/writing/prompt', () => {
  it('returns a writing prompt matching user level', async () => {
    const fakePrompt = { id: 'p1', level: 'B1', prompt: 'Beschreibe deinen Tag.', created_at: new Date() }
    vi.mocked(db.select)
      .mockReturnValueOnce(chainReturning([fakeUser]) as never)
      .mockReturnValueOnce(chainReturning([fakePrompt]) as never)

    const res = await app.inject({
      method: 'GET', url: '/api/writing/prompt',
      headers: { authorization: DEV_TOKEN },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.prompt).toBe('Beschreibe deinen Tag.')
  })

  it('returns fallback prompt when none found in DB', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(chainReturning([fakeUser]) as never)
      .mockReturnValueOnce(chainReturning([]) as never) // no prompts

    const res = await app.inject({
      method: 'GET', url: '/api/writing/prompt',
      headers: { authorization: DEV_TOKEN },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.prompt).toBeTruthy()
  })

  it('returns 404 when user not found', async () => {
    setupDbUser(null)

    const res = await app.inject({
      method: 'GET', url: '/api/writing/prompt',
      headers: { authorization: DEV_TOKEN },
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('POST /api/writing/correct', () => {
  const validBody = {
    prompt: 'Beschreibe deinen Tag.',
    user_text: 'Ich habe heute sehr viel gelernt und war den ganzen Tag produktiv und fleißig.',
  }

  it('streams SSE events and returns 200', async () => {
    vi.mocked(db.select).mockReturnValueOnce(chainReturning([fakeUser]) as never)
    vi.mocked(db.insert).mockReturnValue(chainReturning([]) as never)

    const feedback = JSON.stringify({
      corrected_text: 'Ich habe heute sehr viel gelernt.',
      corrections: [],
      overall_feedback: 'Gut gemacht!',
      level_assessment: 'at_level',
    })
    vi.mocked(streamWritingCorrection).mockImplementation(async (_text, _prompt, _level, onChunk, _onError) => {
      onChunk(feedback)
    })

    const res = await app.inject({
      method: 'POST', url: '/api/writing/correct',
      headers: { authorization: DEV_TOKEN, 'content-type': 'application/json' },
      body: JSON.stringify(validBody),
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/event-stream')
    expect(res.body).toContain('data:')
    expect(res.body).toContain('[DONE]')
  })

  it('returns 400 for missing required fields', async () => {
    setupDbUser(fakeUser)

    const res = await app.inject({
      method: 'POST', url: '/api/writing/correct',
      headers: { authorization: DEV_TOKEN, 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'only prompt, no user_text' }),
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('validation_error')
  })

  it('returns 404 when user not found', async () => {
    setupDbUser(null)

    const res = await app.inject({
      method: 'POST', url: '/api/writing/correct',
      headers: { authorization: DEV_TOKEN, 'content-type': 'application/json' },
      body: JSON.stringify(validBody),
    })

    expect(res.statusCode).toBe(404)
  })
})
