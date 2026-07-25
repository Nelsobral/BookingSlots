'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { confirmBooking, cancelBooking } from '@/lib/actions/client-bookings';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BookingCardProps {
  booking: any;
  isUpcoming: boolean;
}

export function BookingCard({ booking, isUpcoming }: BookingCardProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    const result = await confirmBooking(booking.id);
    setIsConfirming(false);

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    const result = await cancelBooking(booking.id, 'Cancelled by client');
    setIsCancelling(false);

    if (result.success) {
      setShowCancelConfirm(false);
      router.refresh();
    } else {
      alert(result.error);
      setShowCancelConfirm(false);
    }
  };

  const service = booking.services as any;
  const staff = booking.staff_members as any;
  const business = booking.businesses as any;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{service?.name}</h3>
              <Badge className={getStatusColor(booking.status)}>
                {booking.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-4">{business?.name}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                {formatDate(booking.start_time)}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                {staff?.name || 'Staff TBD'}
              </div>
              {business?.address && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {business.address}
                </div>
              )}
            </div>

            {booking.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Notes:</strong> {booking.notes}
                </p>
              </div>
            )}
          </div>

          {service?.color && (
            <div
              className="w-3 h-3 rounded-full ml-4"
              style={{ backgroundColor: service.color }}
            />
          )}
        </div>

        {/* Actions */}
        {isUpcoming && !showCancelConfirm && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            {booking.status === 'pending' && (
              <Button
                onClick={handleConfirm}
                disabled={isConfirming}
                size="sm"
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {isConfirming ? 'Confirming...' : 'Confirm'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(true)}
              size="sm"
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <XCircle className="w-4 h-4" />
              Cancel Booking
            </Button>
          </div>
        )}

        {showCancelConfirm && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600 mb-3">
              Are you sure you want to cancel this booking?
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isCancelling}
                size="sm"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(false)}
                size="sm"
              >
                No, Keep It
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
