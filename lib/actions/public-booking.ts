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

export async function createPublicBooking(formData: z.infer<typeof createBookingSchema>) {
  try {
    const supabase = await createClient();

    // Validate input
    const validated = createBookingSchema.parse(formData);

    // Get business
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', validated.businessSlug)
      .eq('is_active', true)
      .single();

    if (bizError || !business) {
      return { error: 'Business not found' };
    }

    // Get service to get duration
    const { data: service, error: svcError } = await supabase
      .from('services')
      .select('duration_minutes')
      .eq('id', validated.serviceId)
      .eq('business_id', business.id)
      .single();

    if (svcError || !service) {
      return { error: 'Service not found' };
    }

    // Calculate end time
    const startDateTime = new Date(`${validated.date}T${validated.time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + service.duration_minutes * 60000);

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let clientId: string | null = null;

    // Find or create client
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('business_id', business.id)
      .eq('email', validated.clientEmail)
      .single();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      // Create new client
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          business_id: business.id,
          profile_id: user?.id || null,
          name: validated.clientName,
          email: validated.clientEmail,
          phone: validated.clientPhone || null,
        })
        .select('id')
        .single();

      if (clientError) {
        console.error('Error creating client:', clientError);
        return { error: 'Failed to create client record' };
      }

      clientId = newClient.id;
    }

    // Double-check availability (race condition protection)
    const { data: conflicts } = await supabase
      .from('bookings')
      .select('id')
      .eq('business_id', business.id)
      .eq('staff_member_id', validated.staffMemberId)
      .gte('start_time', startDateTime.toISOString())
      .lt('end_time', endDateTime.toISOString())
      .in('status', ['pending', 'confirmed']);

    if (conflicts && conflicts.length > 0) {
      return { error: 'This time slot is no longer available' };
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        business_id: business.id,
        client_id: clientId,
        staff_member_id: validated.staffMemberId,
        service_id: validated.serviceId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'pending',
        notes: validated.notes || null,
      })
      .select('id, start_time, end_time')
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return { error: 'Failed to create booking' };
    }

    return {
      success: true,
      booking: {
        id: booking.id,
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
