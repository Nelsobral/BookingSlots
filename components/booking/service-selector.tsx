'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, DollarSign } from 'lucide-react';

interface ServiceSelectorProps {
  services: any[];
  onSelect: (service: any) => void;
}

export function ServiceSelector({ services, onSelect }: ServiceSelectorProps) {
  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500">No services available at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Select a Service</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => (
          <Card
            key={service.id}
            className="cursor-pointer hover:shadow-lg transition-shadow hover:border-rose-300"
            onClick={() => onSelect(service)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  {service.category && (
                    <p className="text-sm text-gray-500 mt-1">{service.category}</p>
                  )}
                </div>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: service.color || '#e11d48' }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{service.description}</p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  {service.duration_minutes} min
                </div>
                <div className="flex items-center font-semibold text-gray-900">
                  <DollarSign className="w-4 h-4" />
                  {parseFloat(service.price).toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
