import { z } from 'zod'

export const ReviewQualitySchema = z.union([
  z.literal(0), z.literal(1), z.literal(2),
  z.literal(3), z.literal(4), z.literal(5),
])

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  word_id: z.string().uuid(),
  user_id: z.string().uuid(),
  due_date: z.string().datetime(),
  interval: z.number().int().nonnegative(),
  repetition: z.number().int().nonnegative(),
  ease_factor: z.number().min(1.3),
  last_reviewed_at: z.string().datetime().nullable(),
})

export type Review = z.infer<typeof ReviewSchema>

export const SubmitReviewSchema = z.object({
  quality: ReviewQualitySchema,
})
