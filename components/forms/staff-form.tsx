'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { staffSchema, type StaffInput } from '@/lib/validations/staff'
import { createStaff, updateStaff } from '@/lib/actions/staff'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import type { StaffMember } from '@/types'

interface StaffFormProps {
  staff?: StaffMember
  onSuccess: () => void
}

export function StaffForm({ staff, onSuccess }: StaffFormProps) {
  const { toast } = useToast()
  const isEdit = Boolean(staff)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StaffInput>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: staff?.name ?? '',
      email: staff?.email ?? '',
      phone: staff?.phone ?? '',
      role: staff?.role ?? '',
      buffer_minutes_after: staff?.buffer_minutes_after ?? 0,
      is_active: staff?.is_active ?? true,
    },
  })

  async function onSubmit(values: StaffInput) {
    const result = staff
      ? await updateStaff(staff.id, values)
      : await createStaff(values)

    if ('error' in result) {
      toast(result.error, 'error')
      return
    }
    toast(isEdit ? 'Staff member updated.' : 'Staff member added.', 'success')
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} placeholder="Sophie Laurent" />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="sophie@studio.com"
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register('phone')} placeholder="+1 555 000 0000" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role / title</Label>
          <Input id="role" {...register('role')} placeholder="Senior Stylist" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="buffer_minutes_after">Buffer after (min)</Label>
          <Input
            id="buffer_minutes_after"
            type="number"
            {...register('buffer_minutes_after')}
          />
          {errors.buffer_minutes_after && (
            <p className="text-sm text-red-600">
              {errors.buffer_minutes_after.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-md border border-border p-3">
        <input
          id="is_active"
          type="checkbox"
          className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
          {...register('is_active')}
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Active
        </Label>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Add staff'}
        </Button>
      </DialogFooter>
    </form>
  )
}
