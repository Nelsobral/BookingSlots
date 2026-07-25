'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sparkles, Loader2, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import {
  createBusinessSchema,
  type CreateBusinessInput,
} from '@/lib/validations/business'
import { createBusiness } from '@/lib/actions/business'
import { slugify } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { COMMON_TIMEZONES } from '@/lib/constants'

const STEPS = ['Business basics', 'Contact info', 'Settings'] as const

export function OnboardingWizard() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [serverError, setServerError] = useState<string | null>(null)
  const [slugEdited, setSlugEdited] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateBusinessInput>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      name: '',
      slug: '',
      type: 'salon',
      timezone: 'America/New_York',
      email: '',
      phone: '',
      address: '',
      description: '',
      cancellation_hours_notice: 24,
      reminder_enabled: true,
      reminder_hours_before: 24,
      reminder_email_from: '',
    },
  })

  const nameValue = watch('name')

  function onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setValue('name', value)
    if (!slugEdited) {
      setValue('slug', slugify(value))
    }
  }

  async function next() {
    const fields: Record<number, (keyof CreateBusinessInput)[]> = {
      0: ['name', 'slug', 'type', 'timezone'],
      1: ['email', 'phone', 'address'],
    }
    const valid = await trigger(fields[step] ?? [])
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function onSubmit(values: CreateBusinessInput) {
    setServerError(null)
    const result = await createBusiness(values)
    if ('error' in result) {
      setServerError(result.error)
      toast(result.error, 'error')
      return
    }
    toast('Business created! Welcome aboard.', 'success')
    router.push('/app/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50 to-white px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold text-foreground">
              Booking Service
            </span>
          </span>
          <h1 className="mt-6 text-2xl font-bold text-foreground">
            Set up your business
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Just a few details to get your booking page ready.
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  i < step
                    ? 'bg-primary text-primary-foreground'
                    : i === step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-10 ${
                    i < step ? 'bg-primary' : 'bg-secondary'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <h2 className="text-lg font-semibold text-foreground">
              {STEPS[step]}
            </h2>

            {/* Step 1: Business basics */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Business name</Label>
                  <Input
                    id="name"
                    value={nameValue}
                    onChange={onNameChange}
                    placeholder="Luxe Beauty Studio"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Booking URL slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      /book/
                    </span>
                    <Input
                      id="slug"
                      {...register('slug')}
                      onChange={(e) => {
                        setSlugEdited(true)
                        setValue('slug', e.target.value)
                      }}
                      placeholder="luxe-beauty"
                    />
                  </div>
                  {errors.slug && (
                    <p className="text-sm text-red-600">{errors.slug.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Business type</Label>
                  <Select id="type" {...register('type')}>
                    <option value="salon">Salon</option>
                    <option value="esthetician">Esthetician</option>
                    <option value="massage_therapist">Massage therapist</option>
                    <option value="hairdresser">Hairdresser</option>
                    <option value="other">Other</option>
                  </Select>
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
            )}

            {/* Step 2: Contact info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Business email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="hello@luxebeauty.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="+1 555 000 0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    {...register('address')}
                    placeholder="123 Madison Ave, New York, NY"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Settings */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cancellation_hours_notice">
                    Cancellation notice (hours)
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
                </div>

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
                    Send reminders (hours before)
                  </Label>
                  <Input
                    id="reminder_hours_before"
                    type="number"
                    {...register('reminder_hours_before')}
                  />
                  {errors.reminder_hours_before && (
                    <p className="text-sm text-red-600">
                      {errors.reminder_hours_before.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminder_email_from">
                    Reminder sender email
                  </Label>
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
                    Leave blank to use the platform default. You can change this
                    later in Settings.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={back}
                disabled={step === 0}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={next}>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create business
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
