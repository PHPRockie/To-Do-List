import { signIn, signUp, signOut, getSession } from '@/lib/auth'

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

import { supabase } from '@/lib/supabase/client'

describe('signIn', () => {
  it('returns user on success', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' }, session: {} as never },
      error: null,
    } as never)
    const user = await signIn('test@test.com', 'password123')
    expect(user.id).toBe('user-1')
    expect(user.email).toBe('test@test.com')
  })

  it('throws on auth error', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' } as never,
    } as never)
    await expect(signIn('bad@test.com', 'wrong')).rejects.toThrow('Invalid login credentials')
  })
})

describe('signOut', () => {
  it('calls supabase.auth.signOut', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })
    await signOut()
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})

describe('getSession', () => {
  it('returns null when no session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never)
    const result = await getSession()
    expect(result).toBeNull()
  })

  it('returns user when session exists', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: { user: { id: 'user-1', email: 'test@test.com' } },
      },
      error: null,
    } as never)
    const result = await getSession()
    expect(result?.id).toBe('user-1')
  })
})
