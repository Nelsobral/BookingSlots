import { getBookingsByDateRange, getStaffMembers } from '@/lib/actions/calendar';
import { CalendarView } from '@/components/calendar/calendar-view';

export default async function CalendarPage() {
  // Get current week
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

  const startDate = startOfWeek.toISOString().split('T')[0];
  const endDate = endOfWeek.toISOString().split('T')[0];

  const { bookings } = await getBookingsByDateRange(startDate, endDate);
  const { staff } = await getStaffMembers();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-600 mt-1">View and manage your bookings</p>
      </div>

      <CalendarView
        initialBookings={bookings}
        staff={staff}
        initialStartDate={startDate}
      />
    </div>
  );
}
