import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentContext } from '@/lib/actions/business'
import { StaffManager } from './staff-manager'
import type { StaffMember } from '@/types'

export default async function StaffPage() {
  noStore()

  const { business } = await getCurrentContext()
  if (!business) return null

  const supabase = await createClient()

  const { data: staff } = await supabase
    .from('staff_members')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  return <StaffManager staff={(staff ?? []) as StaffMember[]} />
}
