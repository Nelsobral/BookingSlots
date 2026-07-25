import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyBookingToken } from '@/lib/email/generate-token';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const token = searchParams.get('token');

  if (!action || !token) {
    return NextResponse.redirect(new URL('/?error=invalid-link', request.url));
  }

  // Verify token
  const bookingId = verifyBookingToken(token);
  if (!bookingId) {
    return NextResponse.redirect(new URL('/?error=expired-link', request.url));
  }

  const supabase = await createClient();

  try {
    // Get booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, status, businesses(name, slug)')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.redirect(new URL('/?error=booking-not-found', request.url));
    }

    const business = booking.businesses as any;

    if (action === 'confirm') {
      // Confirm booking
      await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      return NextResponse.redirect(
        new URL(`/booking-confirmed?business=${business.name}`, request.url)
      );
    } else if (action === 'cancel') {
      // Cancel booking
      await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Cancelled via email link',
        })
        .eq('id', bookingId);

      return NextResponse.redirect(
        new URL(`/booking-cancelled?business=${business.name}`, request.url)
      );
    } else {
      return NextResponse.redirect(new URL('/?error=invalid-action', request.url));
    }
  } catch (error) {
    console.error('Error processing booking action:', error);
    return NextResponse.redirect(new URL('/?error=server-error', request.url));
  }
}
