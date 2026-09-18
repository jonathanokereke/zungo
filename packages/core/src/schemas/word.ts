import { z } from 'zod'

export const PartOfSpeech = z.enum([
  'noun', 'verb', 'adjective', 'adverb', 'preposition',
  'conjunction', 'pronoun', 'article', 'other'
])

export const WordSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  german: z.string().min(1),
  translation: z.string().min(1),
  part_of_speech: PartOfSpeech,
  example_sentence: z.string().optional(),
  source_text: z.string().optional(),
  created_at: z.string().datetime(),
})

export type Word = z.infer<typeof WordSchema>

export const CreateWordSchema = WordSchema.omit({ id: true, user_id: true, created_at: true })

export const WordLookupResultSchema = z.object({
  translation: z.string(),
  partOfSpeech: PartOfSpeech,
  exampleSentence: z.string(),
  level: z.string(),
})

export type WordLookupResult = z.infer<typeof WordLookupResultSchema>
