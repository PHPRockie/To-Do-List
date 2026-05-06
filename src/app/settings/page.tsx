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
  const [apiKey, setApiKey] = useState('')
  const [keySaved, setKeySaved] = useState(false)

  useEffect(() => {
    getSetting('claudeApiKey').then(k => setApiKey(k ?? ''))
  }, [])

  async function handleSaveKey() {
    await setSetting('claudeApiKey', apiKey || undefined)
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
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

      <GlassCard className="p-5">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Claude API Key</p>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="flex-1 glass rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none"
          />
          <button
            onClick={handleSaveKey}
            className="glass glass-hover px-3 py-2 rounded-lg text-xs text-white/60"
          >
            {keySaved ? '✓ Saved' : 'Save'}
          </button>
        </div>
        <p className="text-xs text-white/25 mt-2">Stored locally only — never uploaded</p>
      </GlassCard>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
