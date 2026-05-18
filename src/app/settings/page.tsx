'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getSetting, setSetting } from '@/lib/db/settings'
import AuthModal from '@/components/auth/AuthModal'
import GlassCard from '@/components/ui/GlassCard'

function formatLastSync(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`
  return new Date(iso).toLocaleTimeString()
}

export default function SettingsPage() {
  const { user, signOut, syncNow, syncStatus, lastSyncedAt, conflictCount } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    getSetting('displayName').then(v => setDisplayName(v))
    getSetting('city').then(v => setCity(v))
    getSetting('state').then(v => setState(v))
  }, [])

  async function handleSaveProfile() {
    await Promise.all([
      setSetting('displayName', displayName),
      setSetting('city', city),
      setSetting('state', state),
    ])
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  const syncDotColor = {
    idle: 'bg-white/30',
    syncing: 'bg-yellow-400 animate-pulse',
    synced: 'bg-green-400',
    error: 'bg-red-400',
  }[syncStatus]

  return (
    <div className="p-6 max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-white/80">Settings</h1>

      {conflictCount > 0 && (
        <div className="glass rounded-xl p-3 border border-yellow-400/20">
          <p className="text-xs text-yellow-400/80">
            {conflictCount} task{conflictCount !== 1 ? 's' : ''} were newer on another device — kept your local version
          </p>
        </div>
      )}

      <GlassCard className="p-5">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Profile</p>
        <div className="space-y-2">
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            onBlur={handleSaveProfile}
            placeholder="Your name"
            className="w-full glass rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              onBlur={handleSaveProfile}
              placeholder="City"
              className="flex-1 glass rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none"
            />
            <input
              type="text"
              value={state}
              onChange={e => setState(e.target.value)}
              onBlur={handleSaveProfile}
              placeholder="State"
              className="w-24 glass rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none"
            />
          </div>
          {profileSaved && <p className="text-xs text-green-400/70">✓ Saved</p>}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Account</p>
        {user ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">{user.email}</p>
              <p className="text-xs text-white/40 mt-0.5">Signed in</p>
            </div>
            <button
              onClick={() => signOut()}
              className="glass glass-hover px-3 py-1.5 rounded-lg text-xs text-white/50"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/40">Not signed in</p>
            <button
              onClick={() => setShowAuth(true)}
              className="gradient-bg px-3 py-1.5 rounded-lg text-xs text-white font-medium"
            >
              Sign in to sync
            </button>
          </div>
        )}
      </GlassCard>

      {user && (
        <GlassCard className="p-5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Sync</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${syncDotColor}`} />
              <p className="text-sm text-white/60">{formatLastSync(lastSyncedAt)}</p>
            </div>
            <button
              onClick={syncNow}
              disabled={syncStatus === 'syncing'}
              className="gradient-bg px-3 py-1.5 rounded-lg text-xs text-white font-medium disabled:opacity-40"
            >
              {syncStatus === 'syncing' ? 'Syncing...' : 'Sync now'}
            </button>
          </div>
        </GlassCard>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
