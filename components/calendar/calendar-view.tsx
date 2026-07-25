'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WeekView } from './week-view';
import { getBookingsByDateRange } from '@/lib/actions/calendar';

interface CalendarViewProps {
  initialBookings: any[];
  staff: any[];
  initialStartDate: string;
}

export function CalendarView({ initialBookings, staff, initialStartDate }: CalendarViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date(initialStartDate));
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadWeek = async (startDate: Date) => {
    setIsLoading(true);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    const { bookings: newBookings } = await getBookingsByDateRange(start, end);
    setBookings(newBookings || []);
    setIsLoading(false);
  };

  const handlePrevWeek = async () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
    await loadWeek(newStart);
  };

  const handleNextWeek = async () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
    await loadWeek(newStart);
  };

  const handleToday = async () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    setCurrentWeekStart(startOfWeek);
    await loadWeek(startOfWeek);
  };

  const getWeekRange = () => {
    const end = new Date(currentWeekStart);
    end.setDate(currentWeekStart.getDate() + 6);
    
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    return `${currentWeekStart.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  // Filter bookings by selected staff
  const filteredBookings = selectedStaffId
    ? bookings.filter((b) => b.staff_member_id === selectedStaffId)
    : bookings;

  return (
    <div>
      {/* Controls */}
      <div className="bg-white rounded-lg border p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevWeek} disabled={isLoading}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday} disabled={isLoading}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextWeek} disabled={isLoading}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="ml-4 font-semibold text-gray-900">{getWeekRange()}</span>
          </div>

          {/* Staff Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Filter by staff:</label>
            <select
              value={selectedStaffId || ''}
              onChange={(e) => setSelectedStaffId(e.target.value || null)}
              className="border rounded-md px-3 py-1.5 text-sm"
            >
              <option value="">All Staff</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Week View */}
      <WeekView
        bookings={filteredBookings}
        weekStart={currentWeekStart}
        isLoading={isLoading}
      />
    </div>
  );
}
