'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import GlassCard from '@/components/ui/GlassCard'

type Tab = 'signin' | 'signup'

interface AuthModalProps {
  onClose: () => void
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth()
  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    setError(null)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      if (tab === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <GlassCard className="p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="w-10 h-10 rounded-xl gradient-bg mx-auto mb-3" />
          <h2 className="text-base font-semibold text-white/90">Sign in to FlowTask</h2>
          <p className="text-xs text-white/40 mt-1">Sync your tasks across devices</p>
        </div>

        <div className="flex glass rounded-lg p-1 mb-5">
          <div
            role="tab"
            tabIndex={0}
            onClick={() => { setTab('signin'); setError(null) }}
            onKeyDown={e => e.key === 'Enter' && (setTab('signin'), setError(null))}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all text-center cursor-pointer ${
              tab === 'signin' ? 'gradient-bg text-white' : 'text-white/40'
            }`}
          >
            Sign In
          </div>
          <div
            role="tab"
            tabIndex={0}
            onClick={() => { setTab('signup'); setError(null) }}
            onKeyDown={e => e.key === 'Enter' && (setTab('signup'), setError(null))}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all text-center cursor-pointer ${
              tab === 'signup' ? 'gradient-bg text-white' : 'text-white/40'
            }`}
          >
            Sign Up
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            disabled={loading}
            className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            disabled={loading}
            className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none"
          />
          {error && <p className="text-xs text-red-400/80">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-bg py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
          >
            {loading ? 'Please wait...' : tab === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
          <p className="text-xs text-white/25 text-center">Your tasks sync securely to your account</p>
        </form>
      </GlassCard>
    </div>
  )
}
