import type { BusinessType } from '@/types'

/** A curated list of common timezones for onboarding / settings dropdowns. */
export const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Lisbon',
  'Australia/Sydney',
  'UTC',
] as const

/** Reminder lead-time options (hours before appointment). */
export const REMINDER_HOURS_OPTIONS = [1, 2, 6, 12, 24, 48, 72] as const

/** Human-readable labels for business types. */
export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  esthetician: 'Esthetician',
  massage_therapist: 'Massage therapist',
  hairdresser: 'Hairdresser',
  salon: 'Salon',
  other: 'Other',
}
