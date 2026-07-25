'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentContext } from './business';

export async function getBookingsByDateRange(startDate: string, endDate: string) {
  const supabase = await createClient();
  const { business } = await getCurrentContext();

  if (!business) {
    return { bookings: [], error: 'No business found' };
  }

  const businessId = business.id;

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      clients(name, email, phone),
      services(name, duration_minutes, price, color),
      staff_members(name, role)
    `)
    .eq('business_id', businessId)
    .gte('start_time', `${startDate}T00:00:00`)
    .lte('start_time', `${endDate}T23:59:59`)
    .neq('status', 'cancelled')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching bookings:', error);
    return { bookings: [], error: 'Failed to fetch bookings' };
  }

  return { bookings: bookings || [] };
}

export async function getStaffMembers() {
  const supabase = await createClient();
  const { business } = await getCurrentContext();

  if (!business) {
    return { staff: [], error: 'No business found' };
  }

  const businessId = business.id;

  const { data: staff, error } = await supabase
    .from('staff_members')
    .select('id, name, role')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    return { staff: [], error: 'Failed to fetch staff' };
  }

  return { staff: staff || [] };
}
