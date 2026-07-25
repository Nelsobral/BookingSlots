'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Header } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ServiceForm } from '@/components/forms/service-form'
import { useToast } from '@/components/ui/toast'
import { deleteService } from '@/lib/actions/services'
import { formatCurrency } from '@/lib/utils'
import type { ServiceWithStaff, StaffMember } from '@/types'

interface ServicesManagerProps {
  services: ServiceWithStaff[]
  staff: Pick<StaffMember, 'id' | 'name'>[]
}

export function ServicesManager({ services, staff }: ServicesManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceWithStaff | undefined>()
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const staffName = (id: string) => staff.find((s) => s.id === id)?.name ?? ''

  function openCreate() {
    setEditing(undefined)
    setOpen(true)
  }

  function openEdit(service: ServiceWithStaff) {
    setEditing(service)
    setOpen(true)
  }

  function onSuccess() {
    setOpen(false)
    setEditing(undefined)
    router.refresh()
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      const result = await deleteService(id)
      if ('error' in result) {
        toast(result.error, 'error')
      } else {
        toast('Service archived.', 'success')
        router.refresh()
      }
      setDeletingId(null)
    })
  }

  return (
    <>
      <Header
        title="Services"
        description="Manage the services your business offers."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        }
      />
      <main className="flex-1 space-y-6 p-6">
        {services.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No services yet. Click &ldquo;Add Service&rdquo; to create your
              first one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: service.color ?? '#e11d48' }}
                      />
                      <h3 className="font-semibold text-foreground">
                        {service.name}
                      </h3>
                    </div>
                    {!service.is_active && (
                      <Badge variant="gray">Inactive</Badge>
                    )}
                  </div>

                  {service.category && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {service.category}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="font-medium text-foreground">
                      {formatCurrency(service.price)}
                    </span>
                    <span className="text-muted-foreground">
                      {service.duration_minutes} min
                    </span>
                  </div>

                  {service.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {service.description}
                    </p>
                  )}

                  {service.service_staff?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {service.service_staff.map((ss) => (
                        <Badge key={ss.staff_member_id} variant="secondary">
                          {staffName(ss.staff_member_id)}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(service)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(service.id)}
                      disabled={isPending && deletingId === service.id}
                    >
                      {isPending && deletingId === service.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit service' : 'Add service'}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? 'Update the details for this service.'
              : 'Create a new bookable service.'}
          </DialogDescription>
        </DialogHeader>
        <ServiceForm
          key={editing?.id ?? 'new'}
          staff={staff}
          service={editing}
          onSuccess={onSuccess}
        />
      </Dialog>
    </>
  )
}
