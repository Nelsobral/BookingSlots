'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createBusinessSchema,
  updateBusinessSettingsSchema,
} from '@/lib/validations/business'
import type { ActionResult, Business } from '@/types'

/**
 * Resolve the authenticated user together with the business they belong to.
 * Returns null values when there is no session / no business membership.
 */
export async function getCurrentContext(): Promise<{
  userId: string | null
  email: string | null
  business: Business | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { userId: null, email: null, business: null }
  }

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!membership) {
    return { userId: user.id, email: user.email ?? null, business: null }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', membership.business_id)
    .maybeSingle()

  return { userId: user.id, email: user.email ?? null, business: business ?? null }
}

/**
 * Create a business during onboarding and register the current user as its
 * owner. Also seeds a notification_preferences row.
 */
export async function createBusiness(
  input: unknown
): Promise<ActionResult<{ businessId: string }>> {
  const parsed = createBusinessSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to create a business.' }
  }

  const data = parsed.data

  // Ensure the slug is unique.
  const { data: existing } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', data.slug)
    .maybeSingle()

  if (existing) {
    return { error: 'That slug is already taken. Please choose another.' }
  }

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .insert({
      owner_id: user.id,
      name: data.name,
      slug: data.slug,
      type: data.type,
      timezone: data.timezone,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      description: data.description || null,
      cancellation_hours_notice: data.cancellation_hours_notice,
      reminder_enabled: data.reminder_enabled,
      reminder_hours_before: data.reminder_hours_before,
      reminder_email_from: data.reminder_email_from || null,
    })
    .select('id')
    .single()

  if (businessError || !business) {
    return { error: businessError?.message ?? 'Could not create business.' }
  }

  const { error: memberError } = await supabase.from('business_members').insert({
    business_id: business.id,
    profile_id: user.id,
    role: 'owner',
    is_active: true,
  })

  if (memberError) {
    return { error: memberError.message }
  }

  await supabase.from('notification_preferences').insert({
    business_id: business.id,
    reminder_hours_before: data.reminder_hours_before,
    cancellation_hours_notice: data.cancellation_hours_notice,
    from_email: data.reminder_email_from || null,
  })

  revalidatePath('/app', 'layout')
  return { success: true, data: { businessId: business.id } }
}

/** Update the business profile / notification / cancellation settings. */
export async function updateBusinessSettings(
  input: unknown
): Promise<ActionResult> {
  const parsed = updateBusinessSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { business } = await getCurrentContext()
  if (!business) {
    return { error: 'No business found for the current user.' }
  }

  const supabase = await createClient()
  const data = parsed.data

  const { error } = await supabase
    .from('businesses')
    .update({
      name: data.name,
      description: data.description || null,
      address: data.address || null,
      phone: data.phone || null,
      timezone: data.timezone,
      reminder_enabled: data.reminder_enabled,
      reminder_hours_before: data.reminder_hours_before,
      reminder_email_from: data.reminder_email_from || null,
      cancellation_hours_notice: data.cancellation_hours_notice,
    })
    .eq('id', business.id)

  if (error) {
    return { error: error.message }
  }

  // Keep notification_preferences in sync.
  await supabase
    .from('notification_preferences')
    .update({
      reminder_hours_before: data.reminder_hours_before,
      cancellation_hours_notice: data.cancellation_hours_notice,
      from_email: data.reminder_email_from || null,
    })
    .eq('business_id', business.id)

  revalidatePath('/app/settings')
  return { success: true }
}
