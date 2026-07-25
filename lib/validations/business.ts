import { z } from 'zod'

export const businessTypeEnum = z.enum([
  'esthetician',
  'massage_therapist',
  'hairdresser',
  'salon',
  'other',
])

export const createBusinessSchema = z.object({
  name: z.string().min(2, 'Business name is required'),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug can only contain lowercase letters, numbers and hyphens'
    ),
  type: businessTypeEnum,
  timezone: z.string().min(1, 'Timezone is required'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
  cancellation_hours_notice: z.coerce.number().int().min(0).max(168),
  reminder_enabled: z.boolean(),
  reminder_hours_before: z.coerce.number().int().min(1).max(168),
  reminder_email_from: z
    .string()
    .email('Please enter a valid email')
    .optional()
    .or(z.literal('')),
})

export const updateBusinessSettingsSchema = z.object({
  name: z.string().min(2, 'Business name is required'),
  description: z.string().max(1000).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  timezone: z.string().min(1, 'Timezone is required'),
  reminder_enabled: z.boolean(),
  reminder_hours_before: z.coerce.number().int().min(1).max(168),
  reminder_email_from: z
    .string()
    .email('Please enter a valid email')
    .optional()
    .or(z.literal('')),
  cancellation_hours_notice: z.coerce.number().int().min(0).max(168),
})

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>
export type UpdateBusinessSettingsInput = z.infer<typeof updateBusinessSettingsSchema>
