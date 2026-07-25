'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { serviceSchema } from '@/lib/validations/service'
import { getCurrentContext } from '@/lib/actions/business'
import type { ActionResult } from '@/types'

/** Replace the staff assignments for a service. */
async function syncServiceStaff(serviceId: string, staffIds: string[]) {
  const supabase = await createClient()
  await supabase.from('service_staff').delete().eq('service_id', serviceId)
  if (staffIds.length > 0) {
    await supabase.from('service_staff').insert(
      staffIds.map((staff_member_id) => ({
        service_id: serviceId,
        staff_member_id,
      }))
    )
  }
}

export async function createService(input: unknown): Promise<ActionResult> {
  const parsed = serviceSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { business } = await getCurrentContext()
  if (!business) return { error: 'No business found for the current user.' }

  const supabase = await createClient()
  const data = parsed.data

  const { data: service, error } = await supabase
    .from('services')
    .insert({
      business_id: business.id,
      name: data.name,
      category: data.category || null,
      duration_minutes: data.duration_minutes,
      price: data.price,
      description: data.description || null,
      color: data.color || '#e11d48',
      is_active: data.is_active,
    })
    .select('id')
    .single()

  if (error || !service) {
    return { error: error?.message ?? 'Could not create service.' }
  }

  await syncServiceStaff(service.id, data.staff_ids)

  revalidatePath('/app/services')
  return { success: true }
}

export async function updateService(
  id: string,
  input: unknown
): Promise<ActionResult> {
  const parsed = serviceSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { business } = await getCurrentContext()
  if (!business) return { error: 'No business found for the current user.' }

  const supabase = await createClient()
  const data = parsed.data

  const { error } = await supabase
    .from('services')
    .update({
      name: data.name,
      category: data.category || null,
      duration_minutes: data.duration_minutes,
      price: data.price,
      description: data.description || null,
      color: data.color || '#e11d48',
      is_active: data.is_active,
    })
    .eq('id', id)
    .eq('business_id', business.id)

  if (error) {
    return { error: error.message }
  }

  await syncServiceStaff(id, data.staff_ids)

  revalidatePath('/app/services')
  return { success: true }
}

/** Soft delete: mark the service inactive. */
export async function deleteService(id: string): Promise<ActionResult> {
  const { business } = await getCurrentContext()
  if (!business) return { error: 'No business found for the current user.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('services')
    .update({ is_active: false })
    .eq('id', id)
    .eq('business_id', business.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/services')
  return { success: true }
}
