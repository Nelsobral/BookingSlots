import { redirect } from 'next/navigation'
import { getCurrentContext } from '@/lib/actions/business'
import { OnboardingWizard } from './wizard'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const { userId, business } = await getCurrentContext()

  if (!userId) {
    redirect('/login')
  }

  // Already has a business — go straight to the dashboard.
  if (business) {
    redirect('/app/dashboard')
  }

  return <OnboardingWizard />
}
