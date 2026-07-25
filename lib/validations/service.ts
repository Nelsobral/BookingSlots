import { z } from 'zod'

export const serviceSchema = z.object({
  name: z.string().min(2, 'Service name is required'),
  category: z.string().optional().or(z.literal('')),
  duration_minutes: z.coerce
    .number()
    .int()
    .min(5, 'Duration must be at least 5 minutes')
    .max(600, 'Duration is too long'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  description: z.string().max(1000).optional().or(z.literal('')),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Enter a valid hex color')
    .optional()
    .or(z.literal('')),
  is_active: z.boolean(),
  staff_ids: z.array(z.string().uuid()).default([]),
})

export type ServiceInput = z.infer<typeof serviceSchema>
