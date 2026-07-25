'use client';

import { BookingEvent } from './booking-event';
import { Loader2 } from 'lucide-react';

interface WeekViewProps {
  bookings: any[];
  weekStart: Date;
  isLoading: boolean;
}

export function WeekView({ bookings, weekStart, isLoading }: WeekViewProps) {
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getBookingsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.start_time).toISOString().split('T')[0];
      return bookingDate === dateStr;
    });
  };

  const getBookingPosition = (startTime: string) => {
    const date = new Date(startTime);
    const hour = date.getHours();
    const minute = date.getMinutes();
    
    // Position relative to 8 AM
    const topPosition = ((hour - 8) * 60 + minute) / 60;
    return topPosition;
  };

  const getBookingHeight = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return durationMinutes / 60; // Convert to hours
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header with days */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-3 border-r bg-gray-50" /> {/* Time column */}
            {days.map((day, index) => {
              const isToday =
                day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={index}
                  className={`p-3 text-center border-r ${
                    isToday ? 'bg-rose-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-xs text-gray-600">{dayNames[day.getDay()]}</div>
                  <div
                    className={`text-lg font-semibold ${
                      isToday ? 'text-rose-600' : 'text-gray-900'
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="relative">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b" style={{ height: '60px' }}>
                <div className="p-2 border-r text-xs text-gray-500 text-right pr-3">
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </div>
                {days.map((_, dayIndex) => (
                  <div key={dayIndex} className="border-r relative" />
                ))}
              </div>
            ))}

            {/* Bookings overlay */}
            {days.map((day, dayIndex) => {
              const dayBookings = getBookingsForDay(day);
              return (
                <div
                  key={dayIndex}
                  className="absolute top-0"
                  style={{
                    left: `${((dayIndex + 1) / 8) * 100}%`,
                    width: `${100 / 8}%`,
                    height: '100%',
                  }}
                >
                  {dayBookings.map((booking) => {
                    const top = getBookingPosition(booking.start_time);
                    const height = getBookingHeight(booking.start_time, booking.end_time);
                    
                    // Skip bookings outside our view (before 8 AM or after 8 PM)
                    if (top < 0 || top > 12) return null;

                    return (
                      <div
                        key={booking.id}
                        className="absolute left-1 right-1"
                        style={{
                          top: `${top * 60}px`,
                          height: `${height * 60}px`,
                        }}
                      >
                        <BookingEvent booking={booking} />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
