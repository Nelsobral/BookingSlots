import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, User, LogOut } from 'lucide-react';

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {profile?.full_name || 'Client'}
              </p>
            </div>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-6">
            <Link
              href="/client/bookings"
              className="flex items-center gap-2 px-3 py-4 text-sm font-medium text-gray-700 hover:text-rose-600 hover:border-b-2 hover:border-rose-600 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              My Bookings
            </Link>
            <Link
              href="/client/profile"
              className="flex items-center gap-2 px-3 py-4 text-sm font-medium text-gray-700 hover:text-rose-600 hover:border-b-2 hover:border-rose-600 transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
