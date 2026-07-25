import Link from 'next/link'
import { ArrowRight, CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Soft gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-rose-50 via-purple-50/40 to-white" />
      <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-rose-200/40 via-pink-200/30 to-purple-200/30 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-rose-700 shadow-sm">
            <CalendarCheck className="h-4 w-4" />
            Built for beauty professionals
          </span>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            The smart booking platform for{' '}
            <span className="bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
              beauty professionals
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Fill your calendar, cut no-shows by up to 35% with automated
            reminders, and manage your staff, services and clients — all from one
            beautiful dashboard.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start your free trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                See how it works
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required · Set up in minutes
          </p>
        </div>
      </div>
    </section>
  )
}
