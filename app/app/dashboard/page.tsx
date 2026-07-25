import { unstable_noStore as noStore } from 'next/cache'
import {
  CalendarClock,
  CalendarDays,
  DollarSign,
  XCircle,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentContext } from '@/lib/actions/business'
import { Header } from '@/components/dashboard/header'
import { StatsCard } from '@/components/dashboard/stats-card'
import { BookingsTable } from '@/components/dashboard/bookings-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { BookingWithRelations, DashboardStats } from '@/types'

const BOOKING_SELECT = `*,
  client:clients ( id, name, email, phone ),
  service:services ( id, name, price, duration_minutes, color ),
  staff_member:staff_members ( id, name )`

export default async function DashboardPage() {
  noStore()

  const { business } = await getCurrentContext()
  if (!business) return null

  const supabase = await createClient()
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(startOfToday)
  endOfToday.setDate(endOfToday.getDate() + 1)
  const in7Days = new Date(startOfToday)
  in7Days.setDate(in7Days.getDate() + 7)
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - 7)

  // Upcoming bookings (next 7 days, not cancelled) — also used for revenue.
  const { data: upcoming } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('business_id', business.id)
    .neq('status', 'cancelled')
    .gte('start_time', now.toISOString())
    .lte('start_time', in7Days.toISOString())
    .order('start_time', { ascending: true })

  const upcomingBookings = (upcoming ?? []) as unknown as BookingWithRelations[]

  // Today's bookings.
  const { data: today } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('business_id', business.id)
    .gte('start_time', startOfToday.toISOString())
    .lt('start_time', endOfToday.toISOString())
    .order('start_time', { ascending: true })

  const todaysBookings = (today ?? []) as unknown as BookingWithRelations[]

  // Cancelled this week.
  const { count: cancelledCount } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .eq('status', 'cancelled')
    .gte('start_time', startOfWeek.toISOString())

  // Client count.
  const { count: clientCount } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', business.id)

  const stats: DashboardStats = {
    upcomingCount: upcomingBookings.length,
    todayCount: todaysBookings.length,
    estimatedRevenue: upcomingBookings.reduce(
      (sum, b) => sum + (b.service?.price ?? 0),
      0
    ),
    cancelledThisWeek: cancelledCount ?? 0,
    clientCount: clientCount ?? 0,
  }

  return (
    <>
      <Header
        title="Dashboard"
        description={`Welcome back — here's what's happening at ${business.name}.`}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Upcoming (7 days)"
            value={stats.upcomingCount}
            icon={CalendarClock}
            accent="rose"
          />
          <StatsCard
            label="Today's bookings"
            value={stats.todayCount}
            icon={CalendarDays}
            accent="purple"
          />
          <StatsCard
            label="Est. revenue (7 days)"
            value={formatCurrency(stats.estimatedRevenue)}
            icon={DollarSign}
            accent="green"
          />
          <StatsCard
            label="Cancelled this week"
            value={stats.cancelledThisWeek}
            icon={XCircle}
            accent="amber"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Total clients"
            value={stats.clientCount}
            icon={Users}
            accent="blue"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingsTable
              bookings={todaysBookings}
              timezone={business.timezone}
              emptyMessage="No appointments scheduled for today."
            />
          </CardContent>
        </Card>
      </main>
    </>
  )
}
