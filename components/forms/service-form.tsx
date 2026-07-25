'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { serviceSchema, type ServiceInput } from '@/lib/validations/service'
import { createService, updateService } from '@/lib/actions/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import type { ServiceWithStaff, StaffMember } from '@/types'

interface ServiceFormProps {
  staff: Pick<StaffMember, 'id' | 'name'>[]
  service?: ServiceWithStaff
  onSuccess: () => void
}

export function ServiceForm({ staff, service, onSuccess }: ServiceFormProps) {
  const { toast } = useToast()
  const isEdit = Boolean(service)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service?.name ?? '',
      category: service?.category ?? '',
      duration_minutes: service?.duration_minutes ?? 60,
      price: service?.price ?? 0,
      description: service?.description ?? '',
      color: service?.color ?? '#e11d48',
      is_active: service?.is_active ?? true,
      staff_ids: service?.service_staff?.map((s) => s.staff_member_id) ?? [],
    },
  })

  const selectedStaff = watch('staff_ids')
  const colorValue = watch('color')

  function toggleStaff(id: string) {
    const current = selectedStaff ?? []
    if (current.includes(id)) {
      setValue(
        'staff_ids',
        current.filter((s) => s !== id)
      )
    } else {
      setValue('staff_ids', [...current, id])
    }
  }

  async function onSubmit(values: ServiceInput) {
    const result = service
      ? await updateService(service.id, values)
      : await createService(values)

    if ('error' in result) {
      toast(result.error, 'error')
      return
    }
    toast(isEdit ? 'Service updated.' : 'Service created.', 'success')
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} placeholder="Haircut & Style" />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" {...register('category')} placeholder="Hair" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duration (min)</Label>
          <Input
            id="duration_minutes"
            type="number"
            {...register('duration_minutes')}
          />
          {errors.duration_minutes && (
            <p className="text-sm text-red-600">
              {errors.duration_minutes.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price ($)</Label>
          <Input id="price" type="number" step="0.01" {...register('price')} />
          {errors.price && (
            <p className="text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colorValue || '#e11d48'}
              onChange={(e) => setValue('color', e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-md border border-input"
              aria-label="Service color"
            />
            <Input {...register('color')} placeholder="#e11d48" />
          </div>
          {errors.color && (
            <p className="text-sm text-red-600">{errors.color.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Short description of the service"
        />
      </div>

      <div className="space-y-2">
        <Label>Assigned staff</Label>
        {staff.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No staff yet — add staff members first.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {staff.map((member) => {
              const active = (selectedStaff ?? []).includes(member.id)
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleStaff(member.id)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {member.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-md border border-border p-3">
        <input
          id="is_active"
          type="checkbox"
          className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
          {...register('is_active')}
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Active (visible &amp; bookable)
        </Label>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Create service'}
        </Button>
      </DialogFooter>
    </form>
  )
}
