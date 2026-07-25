import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const PLANS = [
  {
    name: 'Starter',
    price: '$0',
    cadence: '/mo',
    description: 'For solo professionals getting started.',
    features: [
      'Up to 50 bookings / month',
      '1 staff member',
      'Email reminders',
      'Client management',
    ],
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$29',
    cadence: '/mo',
    description: 'For growing salons and small teams.',
    features: [
      'Unlimited bookings',
      'Up to 10 staff members',
      'No-show protection',
      'Revenue insights',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: '',
    description: 'For multi-location businesses.',
    features: [
      'Everything in Professional',
      'Unlimited staff',
      'Multi-location support',
      'Dedicated account manager',
      'Custom integrations',
    ],
    highlighted: false,
  },
] as const

export function Pricing() {
  return (
    <section id="pricing" className="bg-gradient-to-b from-white to-rose-50/50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="default" className="mb-4">
            Coming soon
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free while we finalize our plans. Reach out to lock in early
            pricing.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                'relative flex flex-col',
                plan.highlighted &&
                  'border-primary shadow-lg ring-1 ring-primary'
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most popular
                </span>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {plan.cadence}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="mt-6 block">
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? 'default' : 'outline'}
                  >
                    {plan.name === 'Enterprise' ? 'Contact sales' : 'Get started'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
