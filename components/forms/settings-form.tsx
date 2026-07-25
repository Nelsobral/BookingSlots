'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import {
  updateBusinessSettingsSchema,
  type UpdateBusinessSettingsInput,
} from '@/lib/validations/business'
import { updateBusinessSettings } from '@/lib/actions/business'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { COMMON_TIMEZONES, REMINDER_HOURS_OPTIONS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Business } from '@/types'

type Tab = 'profile' | 'notifications' | 'cancellation'

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Business Profile' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'cancellation', label: 'Cancellation Policy' },
]

export function SettingsForm({ business }: { business: Business }) {
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('profile')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateBusinessSettingsInput>({
    resolver: zodResolver(updateBusinessSettingsSchema),
    defaultValues: {
      name: business.name,
      description: business.description ?? '',
      address: business.address ?? '',
      phone: business.phone ?? '',
      timezone: business.timezone,
      reminder_enabled: business.reminder_enabled,
      reminder_hours_before: business.reminder_hours_before,
      reminder_email_from: business.reminder_email_from ?? '',
      cancellation_hours_notice: business.cancellation_hours_notice,
    },
  })

  async function onSubmit(values: UpdateBusinessSettingsInput) {
    const result = await updateBusinessSettings(values)
    if ('error' in result) {
      toast(result.error, 'error')
      return
    }
    toast('Settings saved.', 'success')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Business Profile */}
      <div className={cn('space-y-4', tab !== 'profile' && 'hidden')}>
        <div className="space-y-2">
          <Label htmlFor="name">Business name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register('description')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" {...register('address')} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register('phone')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select id="timezone" {...register('timezone')}>
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className={cn('space-y-4', tab !== 'notifications' && 'hidden')}>
        <div className="flex items-center gap-3 rounded-md border border-border p-3">
          <input
            id="reminder_enabled"
            type="checkbox"
            className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            {...register('reminder_enabled')}
          />
          <Label htmlFor="reminder_enabled" className="cursor-pointer">
            Send automated appointment reminders
          </Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reminder_hours_before">
            Send reminders (hours before appointment)
          </Label>
          <Select
            id="reminder_hours_before"
            {...register('reminder_hours_before')}
          >
            {REMINDER_HOURS_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {h} hours
              </option>
            ))}
          </Select>
          {errors.reminder_hours_before && (
            <p className="text-sm text-red-600">
              {errors.reminder_hours_before.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reminder_email_from">Sender email (from address)</Label>
          <Input
            id="reminder_email_from"
            type="email"
            {...register('reminder_email_from')}
            placeholder="Nelsobral@gmail.com"
          />
          {errors.reminder_email_from && (
            <p className="text-sm text-red-600">
              {errors.reminder_email_from.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            This is the address reminder &amp; notification emails are sent from.
            Leave blank to use the platform default.
          </p>
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className={cn('space-y-4', tab !== 'cancellation' && 'hidden')}>
        <div className="space-y-2">
          <Label htmlFor="cancellation_hours_notice">
            Required cancellation notice (hours)
          </Label>
          <Input
            id="cancellation_hours_notice"
            type="number"
            {...register('cancellation_hours_notice')}
          />
          {errors.cancellation_hours_notice && (
            <p className="text-sm text-red-600">
              {errors.cancellation_hours_notice.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Clients must cancel at least this many hours before their
            appointment.
          </p>
        </div>
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </form>
  )
}
