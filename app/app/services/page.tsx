import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentContext } from '@/lib/actions/business'
import { ServicesManager } from './services-manager'
import type { ServiceWithStaff, StaffMember } from '@/types'

export default async function ServicesPage() {
  noStore()

  const { business } = await getCurrentContext()
  if (!business) return null

  const supabase = await createClient()

  const { data: services } = await supabase
    .from('services')
    .select('*, service_staff ( staff_member_id )')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  const { data: staff } = await supabase
    .from('staff_members')
    .select('id, name')
    .eq('business_id', business.id)
    .eq('is_active', true)
    .order('name', { ascending: true })

  return (
    <ServicesManager
      services={(services ?? []) as unknown as ServiceWithStaff[]}
      staff={(staff ?? []) as Pick<StaffMember, 'id' | 'name'>[]}
    />
  )
}
