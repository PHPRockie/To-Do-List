import type { ScheduleItem } from '@/types/stats'
import GlassCard from '@/components/ui/GlassCard'

interface SchedulePanelProps {
  items: ScheduleItem[] | null | undefined
  loading: boolean
  error: string | null
  onRegenerate: () => void
}

export default function SchedulePanel({ items, loading, error, onRegenerate }: SchedulePanelProps) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">✨ Today's Schedule</p>
        {items && (
          <button onClick={onRegenerate} className="text-xs text-white/40 hover:text-white/70 transition-colors">
            ↺ Regenerate
          </button>
        )}
      </div>
      {loading && <p className="text-sm text-white/40">Loading schedule...</p>}
      {error && <p className="text-sm text-red-400/80">{error}</p>}
      {items === undefined && !loading && !error && (
        <p className="text-sm text-white/40">Set up your Claude API key to enable AI scheduling.</p>
      )}
      {items && items.length === 0 && (
        <p className="text-sm text-white/40">No open tasks to schedule — great work!</p>
      )}
      {items && items.length > 0 && (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.taskId} className="flex items-start gap-3">
              <span className="text-xs text-purple-400 font-mono mt-0.5 shrink-0">{item.suggestedTime}</span>
              <span className="text-sm text-white/80">{item.taskTitle}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  )
}
