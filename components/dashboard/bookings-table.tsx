'use client'

import { useState, useTransition } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { updateBookingStatus } from '@/lib/actions/bookings'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDate, formatTime, formatStatusLabel } from '@/lib/utils'
import type { BookingStatus, BookingWithRelations } from '@/types'

const STATUS_VARIANT: Record<
  BookingStatus,
  'yellow' | 'green' | 'red' | 'blue' | 'gray'
> = {
  pending: 'yellow',
  confirmed: 'green',
  cancelled: 'red',
  completed: 'blue',
  no_show: 'gray',
}

interface BookingsTableProps {
  bookings: BookingWithRelations[]
  timezone?: string
  /** Show confirm/cancel action buttons. */
  showActions?: boolean
  emptyMessage?: string
}

export function BookingsTable({
  bookings,
  timezone,
  showActions = true,
  emptyMessage = 'No bookings found.',
}: BookingsTableProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)

  function handleUpdate(id: string, status: BookingStatus) {
    setActiveId(id)
    startTransition(async () => {
      const result = await updateBookingStatus(id, status)
      if ('error' in result) {
        toast(result.error, 'error')
      } else {
        toast(`Booking ${formatStatusLabel(status).toLowerCase()}.`, 'success')
      }
      setActiveId(null)
    })
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Service</th>
            <th className="px-4 py-3 font-medium">Staff</th>
            <th className="px-4 py-3 font-medium">Date &amp; time</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {showActions && (
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {bookings.map((booking) => {
            const loading = isPending && activeId === booking.id
            return (
              <tr key={booking.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">
                  {booking.client?.name ?? 'Unknown'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {booking.service?.color && (
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: booking.service.color }}
                      />
                    )}
                    <span>{booking.service?.name ?? '—'}</span>
                    {booking.service?.price != null && (
                      <span className="text-xs text-muted-foreground">
                        · {formatCurrency(booking.service.price)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {booking.staff_member?.name ?? '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <div>{formatDate(booking.start_time, timezone)}</div>
                  <div className="text-xs">
                    {formatTime(booking.start_time, timezone)} –{' '}
                    {formatTime(booking.end_time, timezone)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[booking.status]}>
                    {formatStatusLabel(booking.status)}
                  </Badge>
                </td>
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          {booking.status !== 'confirmed' &&
                            booking.status !== 'cancelled' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleUpdate(booking.id, 'confirmed')
                                }
                              >
                                <Check className="h-3.5 w-3.5" />
                                Confirm
                              </Button>
                            )}
                          {booking.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleUpdate(booking.id, 'cancelled')
                              }
                            >
                              <X className="h-3.5 w-3.5" />
                              Cancel
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
