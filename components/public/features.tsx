import {
  CalendarClock,
  ShieldCheck,
  BellRing,
  Users,
  UserCog,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const FEATURES = [
  {
    icon: CalendarClock,
    title: 'Smart Scheduling',
    description:
      'Availability rules, buffers and per-staff calendars keep your bookings conflict-free.',
  },
  {
    icon: ShieldCheck,
    title: 'No-Show Protection',
    description:
      'Track no-shows, enforce cancellation windows and protect your revenue automatically.',
  },
  {
    icon: BellRing,
    title: 'Automated Reminders',
    description:
      'Email reminders go out before every appointment so clients always show up.',
  },
  {
    icon: Users,
    title: 'Client Management',
    description:
      'A tidy client book with history, notes and contact details in one place.',
  },
  {
    icon: UserCog,
    title: 'Staff Coordination',
    description:
      'Assign services to staff, set individual buffers and manage the whole team.',
  },
  {
    icon: TrendingUp,
    title: 'Revenue Insights',
    description:
      'See upcoming revenue and booking trends at a glance from your dashboard.',
  },
] as const

const STATS = [
  { value: '500+', label: 'businesses' },
  { value: '50,000+', label: 'bookings managed' },
  { value: '35%', label: 'fewer no-shows' },
] as const

export function Features() {
  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to run your bookings
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Purpose-built tools for salons, estheticians, massage therapists and
            hairdressers.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="transition-shadow hover:shadow-md"
            >
              <CardContent className="p-6">
                <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                  <feature.icon className="h-6 w-6" />
                </span>
                <h3 className="text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Social proof stat bar */}
        <div className="mt-20 grid grid-cols-1 gap-8 rounded-2xl bg-gradient-to-r from-rose-600 to-purple-600 px-8 py-12 text-center sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl font-extrabold text-white">
                {stat.value}
              </div>
              <div className="mt-1 text-sm font-medium uppercase tracking-wide text-rose-100">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
