import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface StatsCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  hint?: string
  accent?: 'rose' | 'green' | 'blue' | 'purple' | 'amber'
}

const ACCENTS: Record<NonNullable<StatsCardProps['accent']>, string> = {
  rose: 'bg-rose-100 text-rose-600',
  green: 'bg-green-100 text-green-600',
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  amber: 'bg-amber-100 text-amber-600',
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = 'rose',
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${ACCENTS[accent]}`}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
