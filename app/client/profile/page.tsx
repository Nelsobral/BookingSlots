import { getClientProfile } from '@/lib/actions/client-bookings';
import { ProfileForm } from '@/components/client/profile-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ClientProfilePage() {
  const { profile, clients } = await getClientProfile();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      {clients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Businesses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clients.map((client: any) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {client.businesses?.name}
                    </p>
                    <p className="text-sm text-gray-500">{client.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
