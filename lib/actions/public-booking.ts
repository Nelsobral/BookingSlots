'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createBookingSchema = z.object({
  businessSlug: z.string(),
  serviceId: z.string().uuid(),
  staffMemberId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  clientName: z.string().min(2),
  clientEmail: z.string().email(),
  clientPhone: z.string().optional(),
  notes: z.string().optional(),
});

const ERROR_MESSAGES: Record<string, string> = {
  business_not_found: 'Business not found',
  service_not_found: 'Service not found',
  slot_taken: 'This time slot is no longer available',
  slot_in_past: 'The selected time is in the past',
};

export async function createPublicBooking(formData: z.infer<typeof createBookingSchema>) {
  try {
    const supabase = await createClient();

    // Validate input
    const validated = createBookingSchema.parse(formData);

    // Create the booking atomically via a SECURITY DEFINER function. This runs
    // conflict checking, client upsert and booking insert in a single trusted
    // server-side call, so anonymous visitors never need broad table access.
    const { data, error } = await supabase.rpc('create_public_booking', {
      p_slug: validated.businessSlug,
      p_service_id: validated.serviceId,
      p_staff_member_id: validated.staffMemberId,
      p_date: validated.date,
      p_time: validated.time,
      p_client_name: validated.clientName,
      p_client_email: validated.clientEmail,
      p_client_phone: validated.clientPhone || null,
      p_notes: validated.notes || null,
    });

    if (error) {
      const known = ERROR_MESSAGES[error.message];
      if (known) {
        return { error: known };
      }
      console.error('Error creating booking:', error);
      return { error: 'Failed to create booking' };
    }

    const booking = Array.isArray(data) ? data[0] : data;
    if (!booking) {
      return { error: 'Failed to create booking' };
    }

    return {
      success: true,
      booking: {
        id: booking.booking_id,
        startTime: booking.start_time,
        endTime: booking.end_time,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'Invalid booking data' };
    }
    console.error('Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}
