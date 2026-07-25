'use client';

import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface BookingEventProps {
  booking: any;
}

export function BookingEvent({ booking }: BookingEventProps) {
  const [showDetails, setShowDetails] = useState(false);

  const service = booking.services as any;
  const client = booking.clients as any;
  const staff = booking.staff_members as any;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'no_show':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const backgroundColor = service?.color || '#e11d48';

  return (
    <div
      className="rounded-md p-2 text-xs cursor-pointer border-l-4 hover:shadow-md transition-shadow overflow-hidden h-full"
      style={{
        backgroundColor: `${backgroundColor}15`,
        borderLeftColor: backgroundColor,
      }}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="font-semibold text-gray-900 truncate">{service?.name || 'Service'}</div>
      <div className="text-gray-600 truncate">{client?.name || 'Client'}</div>
      <div className="text-gray-500 text-[10px] mt-1">
        {formatTime(booking.start_time)}
      </div>
      
      {showDetails && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-gray-600">
            <strong>Staff:</strong> {staff?.name || 'TBD'}
          </div>
          <div className="text-gray-600">
            <strong>Status:</strong>{' '}
            <span className="capitalize">{booking.status}</span>
          </div>
          {booking.notes && (
            <div className="text-gray-600 mt-1">
              <strong>Notes:</strong> {booking.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
