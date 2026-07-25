import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * OAuth / email-confirmation callback. Exchanges the `code` for a session,
 * then routes the user to onboarding or the dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: membership } = await supabase
          .from('business_members')
          .select('business_id')
          .eq('profile_id', user.id)
          .eq('is_active', true)
          .maybeSingle()

        const destination = redirectTo
          ? redirectTo
          : membership
            ? '/app/dashboard'
            : '/onboarding'

        return NextResponse.redirect(`${origin}${destination}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
