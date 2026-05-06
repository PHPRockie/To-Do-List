'use client'

import {
  createContext, useContext, useEffect, useState, useCallback, ReactNode,
} from 'react'
import { signIn as authSignIn, signUp as authSignUp, signOut as authSignOut, getSession, onAuthChange } from '@/lib/auth'
import { syncAll } from '@/lib/supabase/sync'
import { getSetting, setSetting } from '@/lib/db/settings'
import type { AuthUser } from '@/lib/auth'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  syncStatus: SyncStatus
  lastSyncedAt: string | null
  conflictCount: number
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  syncNow: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [conflictCount, setConflictCount] = useState(0)

  const performSync = useCallback(async (userId: string) => {
    setSyncStatus('syncing')
    try {
      const result = await syncAll(userId)
      setLastSyncedAt(new Date().toISOString())
      setSyncStatus('synced')
      setConflictCount(result.conflicts)
    } catch {
      setSyncStatus('error')
    }
  }, [])

  useEffect(() => {
    getSession().then(user => {
      setUser(user)
      setLoading(false)
      if (user) performSync(user.id)
    })
    getSetting('lastSyncedAt').then(v => { if (v) setLastSyncedAt(v) })
    const unsubscribe = onAuthChange(user => {
      setUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [performSync])

  const handleSignIn = async (email: string, password: string) => {
    const user = await authSignIn(email, password)
    await setSetting('supabaseUserId', user.id)
    setUser(user)
    await performSync(user.id)
  }

  const handleSignUp = async (email: string, password: string) => {
    const user = await authSignUp(email, password)
    await setSetting('supabaseUserId', user.id)
    setUser(user)
  }

  const handleSignOut = async () => {
    await authSignOut()
    await setSetting('supabaseUserId', undefined)
    setUser(null)
    setSyncStatus('idle')
    setLastSyncedAt(null)
    setConflictCount(0)
  }

  const syncNow = useCallback(async () => {
    if (user) await performSync(user.id)
  }, [user, performSync])

  return (
    <AuthContext.Provider value={{
      user, loading, syncStatus, lastSyncedAt, conflictCount,
      signIn: handleSignIn,
      signUp: handleSignUp,
      signOut: handleSignOut,
      syncNow,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
