'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database';

type DayOfWeek = Database['public']['Enums']['day_of_week'];

export interface TimeSlot {
  time: string; // "HH:MM" format
  available: boolean;
  staffMemberId?: string;
}

export interface AvailabilityParams {
  businessSlug: string;
  serviceId: string;
  staffMemberId?: string; // if null, check "any available staff"
  date: string; // YYYY-MM-DD format
}

/**
 * Calculate available time slots for a given service, date, and optionally staff member.
 * Returns an array of time slots with availability status.
 */
export async function getAvailableSlots(params: AvailabilityParams): Promise<{
  slots: TimeSlot[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { businessSlug, serviceId, staffMemberId, date } = params;

    // Get business
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id, timezone')
      .eq('slug', businessSlug)
      .eq('is_active', true)
      .single();

    if (bizError || !business) {
      return { slots: [], error: 'Business not found' };
    }

    // Get service
    const { data: service, error: svcError } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .eq('business_id', business.id)
      .single();

    if (svcError || !service) {
      return { slots: [], error: 'Service not found' };
    }

    // Determine which staff to check
    let staffIds: string[] = [];
    if (staffMemberId) {
      staffIds = [staffMemberId];
    } else {
      // Get all staff who can perform this service
      const { data: serviceStaff } = await supabase
        .from('service_staff')
        .select('staff_member_id')
        .eq('service_id', serviceId);
      
      staffIds = serviceStaff?.map((ss) => ss.staff_member_id) || [];
    }

    if (staffIds.length === 0) {
      return { slots: [], error: 'No staff available for this service' };
    }

    // Get day of week from date
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
      dateObj.getDay()
    ] as DayOfWeek;

    // Get all availability rules for these staff on this day
    const { data: rules } = await supabase
      .from('availability_rules')
      .select('*')
      .eq('business_id', business.id)
      .in('staff_member_id', staffIds)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (!rules || rules.length === 0) {
      return { slots: [], error: 'No availability for this date' };
    }

    // Get exceptions for this date
    const { data: exceptions } = await supabase
      .from('availability_exceptions')
      .select('*')
      .eq('business_id', business.id)
      .in('staff_member_id', staffIds)
      .eq('date', date);

    // Get existing bookings for this date via a SECURITY DEFINER function so
    // anonymous visitors can detect conflicts without reading booking PII.
    const { data: takenSlots } = await supabase.rpc('get_taken_slots', {
      p_business_id: business.id,
      p_date: date,
    });

    // Calculate slots
    const slots: TimeSlot[] = [];
    const serviceDuration = service.duration_minutes;

    for (const rule of rules) {
      const staffId = rule.staff_member_id;
      if (!staffId) continue;

      // Check if staff has an exception for this date
      const exception = exceptions?.find((ex: any) => ex.staff_member_id === staffId);
      if (exception && !exception.is_available) {
        // Staff is unavailable this day
        continue;
      }

      // Use exception times if available, otherwise use rule times
      const startTime = exception?.start_time || rule.start_time;
      const endTime = exception?.end_time || rule.end_time;

      // Generate slots from start to end time
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);

      // Get staff buffer time
      const { data: staffData } = await supabase
        .from('staff_members')
        .select('buffer_minutes_after')
        .eq('id', staffId)
        .single();

      const bufferTime = staffData?.buffer_minutes_after || 0;

      for (let minutes = startMinutes; minutes + serviceDuration <= endMinutes; minutes += 30) {
        const slotTime = minutesToTime(minutes);
        const slotEnd = minutes + serviceDuration;

        // Check if this slot conflicts with existing bookings
        const hasConflict = takenSlots?.some((booking) => {
          if (booking.staff_member_id !== staffId) return false;

          const bookingStart = timeToMinutes(
            new Date(booking.start_time).toISOString().split('T')[1].substring(0, 5)
          );
          const bookingEnd = timeToMinutes(
            new Date(booking.end_time).toISOString().split('T')[1].substring(0, 5)
          );
          const bookingBuffer = booking.buffer_minutes_after || 0;

          // Check if slot overlaps with booking + buffer
          return !(slotEnd + bufferTime <= bookingStart || minutes >= bookingEnd + bookingBuffer);
        });

        if (!hasConflict) {
          // Check if we already have this slot (from another staff member)
          const existing = slots.find((s) => s.time === slotTime);
          if (!existing) {
            slots.push({
              time: slotTime,
              available: true,
              staffMemberId: staffId,
            });
          }
        }
      }
    }

    // Sort slots by time
    slots.sort((a, b) => a.time.localeCompare(b.time));

    return { slots };
  } catch (error) {
    console.error('Error calculating availability:', error);
    return { slots: [], error: 'Failed to calculate availability' };
  }
}

/**
 * Convert HH:MM time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to HH:MM time string
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get business details by slug (public endpoint)
 */
export async function getBusinessBySlug(slug: string) {
  const supabase = await createClient();

  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, name, slug, type, description, address, phone, email, timezone')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    return { business: null, error: 'Business not found' };
  }

  // Get services
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', business.id)
    .eq('is_active', true)
    .order('name');

  // Get staff
  const { data: staff } = await supabase
    .from('staff_members')
    .select('id, name, role, email')
    .eq('business_id', business.id)
    .eq('is_active', true)
    .order('name');

  return {
    business,
    services: services || [],
    staff: staff || [],
  };
}
