'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

interface StaffSelectorProps {
  service: any;
  staff: any[];
  onSelect: (staff: any) => void;
}

export function StaffSelector({ service, staff, onSelect }: StaffSelectorProps) {
  // Filter staff who can perform this service
  const availableStaff = staff.filter((s) =>
    service.service_staff?.some((ss: any) => ss.staff_member_id === s.id)
  );

  if (availableStaff.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500">No staff available for this service.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Staff Member</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableStaff.map((member) => (
          <Card
            key={member.id}
            className="cursor-pointer hover:shadow-lg transition-shadow hover:border-rose-300"
            onClick={() => onSelect(member)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  {member.role && (
                    <p className="text-sm text-gray-500">{member.role}</p>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
