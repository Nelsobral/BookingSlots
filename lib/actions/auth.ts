'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signInSchema, signUpSchema } from '@/lib/validations/auth'
import type { ActionResult } from '@/types'

/**
 * Create a new account. Creates the auth user (a profile row is created
 * automatically by the `on_auth_user_created` trigger).
 */
export async function signUp(formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

/**
 * Sign in with email + password. On success redirects the user to their
 * dashboard, or to onboarding if they have not created a business yet.
 */
export async function signIn(formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('profile_id', data.user.id)
    .eq('is_active', true)
    .maybeSingle()

  revalidatePath('/', 'layout')

  if (!membership) {
    redirect('/onboarding')
  }

  redirect('/app/dashboard')
}

/** Sign out the current user and return to the landing page. */
export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
