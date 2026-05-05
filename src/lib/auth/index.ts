import { supabase } from '@/lib/supabase/client'

export interface AuthUser {
  id: string
  email: string
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return { id: data.user.id, email: data.user.email! }
}

export async function signUp(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Sign up failed — please check your email to confirm')
  return { id: data.user.id, email: data.user.email! }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function getSession(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession()
  if (!data.session?.user) return null
  return { id: data.session.user.id, email: data.session.user.email! }
}

export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(
      session?.user ? { id: session.user.id, email: session.user.email! } : null
    )
  })
  return () => data.subscription.unsubscribe()
}
