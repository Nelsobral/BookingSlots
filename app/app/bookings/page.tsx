import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { getCurrentContext } from '@/lib/actions/business'
import { listBookings, type BookingFilters } from '@/lib/actions/bookings'
import { Header } from '@/components/dashboard/header'
import { BookingsTable } from '@/components/dashboard/bookings-table'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { BookingStatus } from '@/types'

const STATUS_FILTERS: { value: BookingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No-show' },
]

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string }>
}) {
  noStore()

  const { business } = await getCurrentContext()
  if (!business) return null

  const params = await searchParams
  const status = (params.status as BookingStatus | 'all') || 'all'

  const filters: BookingFilters = {
    status,
    from: params.from,
    to: params.to,
  }

  const bookings = await listBookings(filters)

  return (
    <>
      <Header
        title="Bookings"
        description="View and manage all your appointments."
      />
      <main className="flex-1 space-y-6 p-6">
        <Card>
          <CardContent className="p-6">
            {/* Filters */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((f) => {
                const query = new URLSearchParams()
                if (f.value !== 'all') query.set('status', f.value)
                if (params.from) query.set('from', params.from)
                if (params.to) query.set('to', params.to)
                const href = `/app/bookings${
                  query.toString() ? `?${query.toString()}` : ''
                }`
                const active = status === f.value
                return (
                  <Link
                    key={f.value}
                    href={href}
                    className={cn(
                      'rounded-full border px-3 py-1 text-sm transition-colors',
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-accent'
                    )}
                  >
                    {f.label}
                  </Link>
                )
              })}
            </div>

            {/* Date range filter */}
            <form
              className="mb-6 flex flex-wrap items-end gap-3"
              action="/app/bookings"
              method="get"
            >
              {status !== 'all' && (
                <input type="hidden" name="status" value={status} />
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  From
                </label>
                <input
                  type="date"
                  name="from"
                  defaultValue={params.from ?? ''}
                  className="block h-9 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  To
                </label>
                <input
                  type="date"
                  name="to"
                  defaultValue={params.to ?? ''}
                  className="block h-9 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <button
                type="submit"
                className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Apply
              </button>
              <Link
                href="/app/bookings"
                className="h-9 rounded-md border border-border px-4 text-sm font-medium leading-9 text-muted-foreground hover:bg-accent"
              >
                Reset
              </Link>
            </form>

            <BookingsTable
              bookings={bookings}
              timezone={business.timezone}
              emptyMessage="No bookings match these filters."
            />
          </CardContent>
        </Card>
      </main>
    </>
  )
}
