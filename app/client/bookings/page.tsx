import { getClientBookings } from '@/lib/actions/client-bookings';
import { BookingCard } from '@/components/client/booking-card';

export default async function ClientBookingsPage() {
  const { upcoming, past } = await getClientBookings();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Upcoming Bookings */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Appointments</h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center">
            <p className="text-gray-500">You have no upcoming appointments.</p>
            <p className="text-sm text-gray-400 mt-2">
              Book your next appointment to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((booking: any) => (
              <BookingCard key={booking.id} booking={booking} isUpcoming={true} />
            ))}
          </div>
        )}
      </section>

      {/* Past Bookings */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Past Appointments</h2>
        {past.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center">
            <p className="text-gray-500">No past appointments to show.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {past.map((booking: any) => (
              <BookingCard key={booking.id} booking={booking} isUpcoming={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
