'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import GlassCard from '@/components/ui/GlassCard'
import { hasApiKey } from '@/lib/ai/client'

export default function ApiKeyBanner() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    hasApiKey().then(has => setShow(!has))
  }, [])

  if (!show || dismissed) return null

  return (
    <GlassCard className="p-3 flex items-center gap-3">
      <span className="text-base" aria-hidden>✨</span>
      <p className="flex-1 text-sm text-white/60">
        AI features need a Claude API key to work.{' '}
        <Link href="/settings" className="text-purple-400 hover:text-purple-300 underline">
          Go to Settings →
        </Link>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-white/30 hover:text-white/60 text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </GlassCard>
  )
}
