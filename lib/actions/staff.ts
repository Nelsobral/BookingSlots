'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { staffSchema } from '@/lib/validations/staff'
import { getCurrentContext } from '@/lib/actions/business'
import type { ActionResult } from '@/types'

export async function createStaff(input: unknown): Promise<ActionResult> {
  const parsed = staffSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { business } = await getCurrentContext()
  if (!business) return { error: 'No business found for the current user.' }

  const supabase = await createClient()
  const data = parsed.data

  const { error } = await supabase.from('staff_members').insert({
    business_id: business.id,
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    role: data.role || null,
    buffer_minutes_after: data.buffer_minutes_after,
    is_active: data.is_active,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/staff')
  return { success: true }
}

export async function updateStaff(
  id: string,
  input: unknown
): Promise<ActionResult> {
  const parsed = staffSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { business } = await getCurrentContext()
  if (!business) return { error: 'No business found for the current user.' }

  const supabase = await createClient()
  const data = parsed.data

  const { error } = await supabase
    .from('staff_members')
    .update({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      role: data.role || null,
      buffer_minutes_after: data.buffer_minutes_after,
      is_active: data.is_active,
    })
    .eq('id', id)
    .eq('business_id', business.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/staff')
  return { success: true }
}
