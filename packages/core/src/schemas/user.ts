import { z } from 'zod'

export const CefrLevel = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
export type CefrLevel = z.infer<typeof CefrLevel>

export const UserSchema = z.object({
  id: z.string().uuid(),
  auth0_id: z.string(),
  email: z.string().email(),
  level: CefrLevel,
  streak: z.number().int().nonnegative(),
  last_active: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
})

export type User = z.infer<typeof UserSchema>

export const UpdateUserSchema = z.object({
  level: CefrLevel.optional(),
  preferences: z.record(z.unknown()).optional(),
})
