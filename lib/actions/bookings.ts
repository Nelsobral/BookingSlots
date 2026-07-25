'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentContext } from '@/lib/actions/business'
import type { ActionResult, BookingStatus, BookingWithRelations } from '@/types'
import type { Database } from '@/types/database'

type BookingUpdate = Database['public']['Tables']['bookings']['Update']

export interface BookingFilters {
  status?: BookingStatus | 'all'
  from?: string
  to?: string
}

/** List bookings for the current business with optional filters. */
export async function listBookings(
  filters: BookingFilters = {}
): Promise<BookingWithRelations[]> {
  const { business } = await getCurrentContext()
  if (!business) return []

  const supabase = await createClient()

  let query = supabase
    .from('bookings')
    .select(
      `*,
       client:clients ( id, name, email, phone ),
       service:services ( id, name, price, duration_minutes, color ),
       staff_member:staff_members ( id, name )`
    )
    .eq('business_id', business.id)
    .order('start_time', { ascending: true })

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters.from) {
    query = query.gte('start_time', filters.from)
  }
  if (filters.to) {
    query = query.lte('start_time', filters.to)
  }

  const { data, error } = await query
  if (error) {
    console.error('listBookings error:', error.message)
    return []
  }

  return (data ?? []) as unknown as BookingWithRelations[]
}

/** Update a booking's status, maintaining the relevant timestamp columns. */
export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  cancellationReason?: string
): Promise<ActionResult> {
  const { business } = await getCurrentContext()
  if (!business) return { error: 'No business found for the current user.' }

  const supabase = await createClient()

  const patch: BookingUpdate = { status }
  if (status === 'confirmed') {
    patch.confirmed_at = new Date().toISOString()
  }
  if (status === 'cancelled') {
    patch.cancelled_at = new Date().toISOString()
    patch.cancellation_reason = cancellationReason ?? null
  }

  const { error } = await supabase
    .from('bookings')
    .update(patch)
    .eq('id', id)
    .eq('business_id', business.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/bookings')
  revalidatePath('/app/dashboard')
  return { success: true }
}
