'use client'

import { useState } from 'react'
import GlassCard from '@/components/ui/GlassCard'

interface BriefingBannerProps {
  text: string
}

export default function BriefingBanner({ text }: BriefingBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (!text || dismissed) return null

  return (
    <GlassCard className="p-4 mb-5 flex items-start gap-3">
      <span className="text-lg" aria-hidden>✨</span>
      <p className="flex-1 text-sm text-white/70 leading-relaxed">{text}</p>
      <button
        onClick={() => setDismissed(true)}
        className="text-white/30 hover:text-white/60 text-lg leading-none mt-0.5"
        aria-label="Dismiss"
      >
        ×
      </button>
    </GlassCard>
  )
}
