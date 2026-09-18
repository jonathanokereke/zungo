import { z } from 'zod'
import { CefrLevel } from './user'

export const CorrectionSchema = z.object({
  original: z.string(),
  corrected: z.string(),
  explanation: z.string(),
  rule: z.string(),
})

export const WritingFeedbackSchema = z.object({
  corrected_text: z.string(),
  corrections: z.array(CorrectionSchema),
  overall_feedback: z.string(),
  level_assessment: z.enum(['below_level', 'at_level', 'above_level']),
})

export const WritingSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  prompt: z.string(),
  user_text: z.string(),
  corrected_text: z.string(),
  feedback_json: WritingFeedbackSchema,
  level: CefrLevel,
  created_at: z.string().datetime(),
})

export type WritingSession = z.infer<typeof WritingSessionSchema>
export type WritingFeedback = z.infer<typeof WritingFeedbackSchema>
export type Correction = z.infer<typeof CorrectionSchema>

export const SubmitWritingSchema = z.object({
  prompt: z.string(),
  user_text: z.string().min(50, 'Text must be at least 50 characters'),
})
