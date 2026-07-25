import { redirect } from 'next/navigation'
import { getCurrentContext } from '@/lib/actions/business'
import { Sidebar } from '@/components/dashboard/sidebar'

export const dynamic = 'force-dynamic'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, email, business } = await getCurrentContext()

  if (!userId) {
    redirect('/login')
  }
  if (!business) {
    redirect('/onboarding')
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar businessName={business.name} email={email ?? ''} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
