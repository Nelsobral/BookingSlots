import { getBusinessBySlug } from '@/lib/actions/availability';
import { BookingWizard } from '@/components/booking/booking-wizard';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicBookingPage({ params }: PageProps) {
  const { slug } = await params;
  const { business, services, staff, error } = await getBusinessBySlug(slug);

  if (error || !business) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
            <p className="text-gray-600 mt-1">{business.description}</p>
            {business.address && (
              <p className="text-sm text-gray-500 mt-2">
                📍 {business.address}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <BookingWizard
            business={business}
            services={services}
            staff={staff}
          />
        </div>
      </main>
    </div>
  );
}
