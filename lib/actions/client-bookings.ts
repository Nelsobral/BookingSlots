'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Get all bookings for the current authenticated client
 */
export async function getClientBookings() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get client record for this user
  const { data: client } = await supabase
    .from('clients')
    .select('id, business_id')
    .eq('profile_id', user.id)
    .single();

  if (!client) {
    return { upcoming: [], past: [] };
  }

  // Get upcoming bookings
  const { data: upcoming } = await supabase
    .from('bookings')
    .select(`
      *,
      services(name, duration_minutes, price, color),
      staff_members(name, role),
      businesses(name, address, phone)
    `)
    .eq('client_id', client.id)
    .gte('start_time', new Date().toISOString())
    .neq('status', 'cancelled')
    .order('start_time', { ascending: true });

  // Get past bookings
  const { data: past } = await supabase
    .from('bookings')
    .select(`
      *,
      services(name, duration_minutes, price, color),
      staff_members(name, role),
      businesses(name, address, phone)
    `)
    .eq('client_id', client.id)
    .lt('start_time', new Date().toISOString())
    .order('start_time', { ascending: false })
    .limit(10);

  return {
    upcoming: upcoming || [],
    past: past || [],
  };
}

/**
 * Confirm a booking
 */
export async function confirmBooking(bookingId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'You must be logged in to confirm a booking' };
    }

    // Verify this booking belongs to the current user
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, client_id, clients(profile_id)')
      .eq('id', bookingId)
      .single();

    if (!booking || (booking.clients as any)?.profile_id !== user.id) {
      return { error: 'Booking not found or access denied' };
    }

    // Update booking status
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (error) {
      console.error('Error confirming booking:', error);
      return { error: 'Failed to confirm booking' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string, reason?: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'You must be logged in to cancel a booking' };
    }

    // Get booking and verify ownership
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, client_id, start_time, business_id, clients(profile_id), businesses(cancellation_hours_notice)')
      .eq('id', bookingId)
      .single();

    if (!booking || (booking.clients as any)?.profile_id !== user.id) {
      return { error: 'Booking not found or access denied' };
    }

    // Check cancellation policy
    const business = booking.businesses as any;
    const hoursNotice = business?.cancellation_hours_notice || 24;
    const startTime = new Date(booking.start_time);
    const now = new Date();
    const hoursUntilBooking = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking < hoursNotice) {
      return {
        error: `Bookings must be cancelled at least ${hoursNotice} hours in advance`,
      };
    }

    // Cancel booking
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || 'Cancelled by client',
      })
      .eq('id', bookingId);

    if (error) {
      console.error('Error cancelling booking:', error);
      return { error: 'Failed to cancel booking' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Get client profile
 */
export async function getClientProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: clients } = await supabase
    .from('clients')
    .select('*, businesses(name, slug)')
    .eq('profile_id', user.id);

  return {
    profile: profile || null,
    clients: clients || [],
  };
}

/**
 * Update client profile
 */
export async function updateClientProfile(data: {
  full_name?: string;
  phone?: string;
}) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'You must be logged in' };
    }

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      return { error: 'Failed to update profile' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}
