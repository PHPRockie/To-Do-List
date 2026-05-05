import GlassCard from '@/components/ui/GlassCard'

interface InsightPanelProps {
  insight: string | null | undefined
  loading: boolean
  error: string | null
}

export default function InsightPanel({ insight, loading, error }: InsightPanelProps) {
  return (
    <GlassCard className="p-5">
      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">💡 Priority Insight</p>
      {loading && <p className="text-sm text-white/40">Loading insight...</p>}
      {error && <p className="text-sm text-red-400/80">{error}</p>}
      {insight === undefined && !loading && !error && (
        <p className="text-sm text-white/40">Set up your Claude API key to enable AI insights.</p>
      )}
      {insight && (
        <p className="text-sm text-white/75 leading-relaxed">{insight}</p>
      )}
    </GlassCard>
  )
}
