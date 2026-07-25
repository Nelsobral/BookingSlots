'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAvailableSlots } from '@/lib/actions/availability';
import { Loader2 } from 'lucide-react';

interface TimeSlotPickerProps {
  businessSlug: string;
  serviceId: string;
  staffMemberId: string;
  date: string;
  onSelect: (time: string) => void;
}

export function TimeSlotPicker({
  businessSlug,
  serviceId,
  staffMemberId,
  date,
  onSelect,
}: TimeSlotPickerProps) {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      setError(null);

      const result = await getAvailableSlots({
        businessSlug,
        serviceId,
        staffMemberId,
        date,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSlots(result.slots);
      }

      setLoading(false);
    }

    fetchSlots();
  }, [businessSlug, serviceId, staffMemberId, date]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const groupSlotsByPeriod = (slots: any[]) => {
    const morning: any[] = [];
    const afternoon: any[] = [];
    const evening: any[] = [];

    slots.forEach((slot) => {
      const hour = parseInt(slot.time.split(':')[0]);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (slots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Times</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No available time slots for {formatDate(date)}.</p>
          <p className="text-sm text-gray-400 mt-2">Please try another date.</p>
        </CardContent>
      </Card>
    );
  }

  const { morning, afternoon, evening } = groupSlotsByPeriod(slots);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Times</CardTitle>
        <p className="text-sm text-gray-500">{formatDate(date)}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {morning.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Morning</h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {morning.map((slot) => (
                <Button
                  key={slot.time}
                  variant="outline"
                  onClick={() => onSelect(slot.time)}
                  className="hover:bg-rose-50 hover:border-rose-300"
                >
                  {formatTime(slot.time)}
                </Button>
              ))}
            </div>
          </div>
        )}

        {afternoon.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Afternoon</h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {afternoon.map((slot) => (
                <Button
                  key={slot.time}
                  variant="outline"
                  onClick={() => onSelect(slot.time)}
                  className="hover:bg-rose-50 hover:border-rose-300"
                >
                  {formatTime(slot.time)}
                </Button>
              ))}
            </div>
          </div>
        )}

        {evening.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Evening</h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {evening.map((slot) => (
                <Button
                  key={slot.time}
                  variant="outline"
                  onClick={() => onSelect(slot.time)}
                  className="hover:bg-rose-50 hover:border-rose-300"
                >
                  {formatTime(slot.time)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
