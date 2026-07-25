import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

type CookieToSet = { name: string; value: string; options: CookieOptions }

const AUTH_PATHS = ['/login', '/signup']

/**
 * Refreshes the Supabase auth session on every request and enforces
 * route protection. Called from the root middleware.ts.
 */
export async function updateSession(
  request: NextRequest
): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protected app routes and onboarding require an authenticated user.
  const requiresAuth =
    pathname.startsWith('/app') || pathname.startsWith('/onboarding')

  if (requiresAuth && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Authenticated users should not see the auth pages.
  if (user && AUTH_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/app/dashboard'
    return NextResponse.redirect(url)
  }

  // Enforce that /app users have a business; otherwise send to onboarding.
  if (user && pathname.startsWith('/app')) {
    const { data: membership } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!membership) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
