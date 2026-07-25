'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Mail, Phone, Clock } from 'lucide-react'
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
import { StaffForm } from '@/components/forms/staff-form'
import type { StaffMember } from '@/types'

export function StaffManager({ staff }: { staff: StaffMember[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<StaffMember | undefined>()

  function openCreate() {
    setEditing(undefined)
    setOpen(true)
  }

  function openEdit(member: StaffMember) {
    setEditing(member)
    setOpen(true)
  }

  function onSuccess() {
    setOpen(false)
    setEditing(undefined)
    router.refresh()
  }

  return (
    <>
      <Header
        title="Staff"
        description="Manage your team members and their availability buffers."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Staff
          </Button>
        }
      />
      <main className="flex-1 space-y-6 p-6">
        {staff.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No staff members yet. Click &ldquo;Add Staff&rdquo; to add your
              first team member.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {staff.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {member.name}
                      </h3>
                      {member.role && (
                        <p className="text-sm text-muted-foreground">
                          {member.role}
                        </p>
                      )}
                    </div>
                    {member.is_active ? (
                      <Badge variant="green">Active</Badge>
                    ) : (
                      <Badge variant="gray">Inactive</Badge>
                    )}
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {member.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{member.buffer_minutes_after} min buffer after</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(member)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
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
            {editing ? 'Edit staff member' : 'Add staff member'}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? 'Update this team member’s details.'
              : 'Add a new team member to your business.'}
          </DialogDescription>
        </DialogHeader>
        <StaffForm
          key={editing?.id ?? 'new'}
          staff={editing}
          onSuccess={onSuccess}
        />
      </Dialog>
    </>
  )
}
