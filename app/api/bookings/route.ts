import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Bookings API — placeholder for Phase 2 (public booking widget + integrations).
 *
 * Phase 2 will expose authenticated JSON endpoints for creating and querying
 * bookings from the public booking page (/book/[businessSlug]) and external
 * calendar integrations. For now these return a 501 to make the contract clear.
 */

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  void request
  return NextResponse.json(
    { message: 'Bookings API is coming in Phase 2.' },
    { status: 501 }
  )
}

export async function POST(request: NextRequest) {
  void request
  return NextResponse.json(
    { message: 'Bookings API is coming in Phase 2.' },
    { status: 501 }
  )
}
