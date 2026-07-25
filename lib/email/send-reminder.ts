'use server';

import { getResendClient } from './resend-client';
import { generateBookingToken } from './generate-token';
import { BookingReminderEmail } from './templates/booking-reminder';
import { createClient } from '@/lib/supabase/server';

export async function sendBookingReminder(bookingId: string) {
  try {
    const supabase = await createClient();
    const resend = getResendClient();

    // Get booking details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        start_time,
        end_time,
        notes,
        clients(name, email),
        services(name, duration_minutes),
        staff_members(name),
        businesses(name, address, reminder_email_from)
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      console.error('Booking not found:', error);
      return { error: 'Booking not found' };
    }

    const client = booking.clients as any;
    const service = booking.services as any;
    const staff = booking.staff_members as any;
    const business = booking.businesses as any;

    if (!client?.email) {
      return { error: 'Client email not found' };
    }

    // Generate secure tokens
    const token = generateBookingToken(bookingId);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const confirmUrl = `${baseUrl}/api/booking-action?action=confirm&token=${token}`;
    const cancelUrl = `${baseUrl}/api/booking-action?action=cancel&token=${token}`;

    // Format date and time
    const startDate = new Date(booking.start_time);
    const formattedDate = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Send email
    const fromEmail = business.reminder_email_from || process.env.DEFAULT_FROM_EMAIL || 'hello@bookingservice.com';
    
    const { data, error: sendError } = await resend.emails.send({
      from: `${business.name} <${fromEmail}>`,
      to: client.email,
      subject: `Reminder: Your appointment at ${business.name}`,
      react: BookingReminderEmail({
        clientName: client.name,
        businessName: business.name,
        serviceName: service.name,
        staffName: staff.name,
        date: formattedDate,
        time: formattedTime,
        duration: service.duration_minutes,
        address: business.address,
        confirmUrl,
        cancelUrl,
      }),
    });

    if (sendError) {
      console.error('Failed to send email:', sendError);
      
      // Log failed reminder
      await supabase.from('reminder_events').insert({
        booking_id: bookingId,
        channel: 'email',
        status: 'failed',
        scheduled_at: new Date().toISOString(),
        error_message: sendError.message,
      });

      return { error: 'Failed to send reminder email' };
    }

    // Log successful reminder
    await supabase.from('reminder_events').insert({
      booking_id: bookingId,
      channel: 'email',
      status: 'sent',
      scheduled_at: new Date().toISOString(),
      sent_at: new Date().toISOString(),
    });

    // Update booking reminder_sent_at
    await supabase
      .from('bookings')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', bookingId);

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('Unexpected error sending reminder:', error);
    return { error: error.message || 'Unexpected error occurred' };
  }
}
