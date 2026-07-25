'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ServiceSelector } from './service-selector';
import { StaffSelector } from './staff-selector';
import { DatePicker } from './date-picker';
import { TimeSlotPicker } from './time-slot-picker';
import { ClientInfoForm } from './client-info-form';
import { createPublicBooking } from '@/lib/actions/public-booking';
import { CheckCircle2 } from 'lucide-react';

interface BookingWizardProps {
  business: any;
  services: any[];
  staff: any[];
}

export function BookingWizard({ business, services, staff }: BookingWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleStaffSelect = (staffMember: any) => {
    setSelectedStaff(staffMember);
    setStep(3);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setStep(4);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(5);
  };

  const handleClientInfoSubmit = async (info: typeof clientInfo) => {
    setClientInfo(info);
    setIsSubmitting(true);
    setError(null);

    const result = await createPublicBooking({
      businessSlug: business.slug,
      serviceId: selectedService.id,
      staffMemberId: selectedStaff.id,
      date: selectedDate,
      time: selectedTime,
      clientName: info.name,
      clientEmail: info.email,
      clientPhone: info.phone,
      notes: info.notes,
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      setBookingComplete(true);
    }
  };

  if (bookingComplete) {
    return (
      <Card className="shadow-xl">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-6">
            Your appointment has been successfully booked for{' '}
            <span className="font-semibold">{selectedDate}</span> at{' '}
            <span className="font-semibold">{selectedTime}</span>.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-1">
              <strong>Service:</strong> {selectedService.name}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Staff:</strong> {selectedStaff.name}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Duration:</strong> {selectedService.duration_minutes} minutes
            </p>
            <p className="text-sm text-gray-600">
              <strong>Price:</strong> ${selectedService.price}
            </p>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            A confirmation email has been sent to <strong>{clientInfo.email}</strong>.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Book Another Appointment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Service', 'Staff', 'Date', 'Time', 'Details'].map((label, index) => {
            const stepNum = index + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;

            return (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      isCompleted
                        ? 'bg-rose-600 text-white'
                        : isActive
                        ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {stepNum}
                  </div>
                  <span className="text-xs text-gray-600 mt-1">{label}</span>
                </div>
                {index < 4 && (
                  <div
                    className={`h-1 w-12 mx-2 transition-colors ${
                      isCompleted ? 'bg-rose-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Step 1: Service Selection */}
      {step === 1 && (
        <ServiceSelector services={services} onSelect={handleServiceSelect} />
      )}

      {/* Step 2: Staff Selection */}
      {step === 2 && selectedService && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setStep(1)} className="mb-4">
            ← Back
          </Button>
          <StaffSelector
            service={selectedService}
            staff={staff}
            onSelect={handleStaffSelect}
          />
        </div>
      )}

      {/* Step 3: Date Selection */}
      {step === 3 && selectedService && selectedStaff && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setStep(2)} className="mb-4">
            ← Back
          </Button>
          <DatePicker onSelect={handleDateSelect} />
        </div>
      )}

      {/* Step 4: Time Selection */}
      {step === 4 && selectedService && selectedStaff && selectedDate && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setStep(3)} className="mb-4">
            ← Back
          </Button>
          <TimeSlotPicker
            businessSlug={business.slug}
            serviceId={selectedService.id}
            staffMemberId={selectedStaff.id}
            date={selectedDate}
            onSelect={handleTimeSelect}
          />
        </div>
      )}

      {/* Step 5: Client Info */}
      {step === 5 && selectedService && selectedStaff && selectedDate && selectedTime && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setStep(4)} className="mb-4">
            ← Back
          </Button>
          <ClientInfoForm
            onSubmit={handleClientInfoSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  );
}
