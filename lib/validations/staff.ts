import { z } from 'zod'

export const staffSchema = z.object({
  name: z.string().min(2, 'Staff name is required'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  role: z.string().optional().or(z.literal('')),
  buffer_minutes_after: z.coerce.number().int().min(0).max(240),
  is_active: z.boolean(),
})

export type StaffInput = z.infer<typeof staffSchema>
