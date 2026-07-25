import { unstable_noStore as noStore } from 'next/cache'
import { getCurrentContext } from '@/lib/actions/business'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent } from '@/components/ui/card'
import { SettingsForm } from '@/components/forms/settings-form'

export default async function SettingsPage() {
  noStore()

  const { business } = await getCurrentContext()
  if (!business) return null

  return (
    <>
      <Header
        title="Settings"
        description="Manage your business profile, notifications and policies."
      />
      <main className="flex-1 p-6">
        <Card className="max-w-3xl">
          <CardContent className="p-6">
            <SettingsForm business={business} />
          </CardContent>
        </Card>
      </main>
    </>
  )
}
