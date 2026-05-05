'use client'

import { useState, useEffect } from 'react'
import { callWeeklySummaryAI, hasApiKey } from '@/lib/ai/client'
import { getWeeklySummary, saveWeeklySummary } from '@/lib/db/weekly-summary'
import { getWeekKey } from '@/lib/utils/date'
import GlassCard from '@/components/ui/GlassCard'

interface WeekSummaryProps {
  tasksCompleted: number
  completionRate: number
  completedTasks: Array<{ title: string; completedAt: string }>
}

export default function WeekSummary({ tasksCompleted, completionRate, completedTasks }: WeekSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [stale, setStale] = useState(false)

  useEffect(() => {
    async function load() {
      const weekKey = getWeekKey()
      const stored = await getWeeklySummary(weekKey)

      if (stored) {
        setSummary(stored.summary)
        setLoading(false)
        return
      }

      const hasKey = await hasApiKey()
      if (!hasKey) {
        setSummary(null)
        setLoading(false)
        return
      }

      try {
        const res = await callWeeklySummaryAI({ completedTasks, tasksCompleted, completionRate, weekKey })
        await saveWeeklySummary({
          weekKey,
          generatedAt: new Date().toISOString(),
          summary: res.summary,
          tasksCompleted,
          completionRate,
        })
        setSummary(res.summary)
      } catch {
        const prev = await getWeeklySummary(weekKey)
        if (prev) { setSummary(prev.summary); setStale(true) }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tasksCompleted, completionRate, completedTasks])

  return (
    <GlassCard className="p-5" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.12))', borderColor: 'rgba(167,139,250,0.2)' }}>
      <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">
        ✨ Week in Review {stale && <span className="text-white/30 normal-case">(last week)</span>}
      </p>
      {loading && <p className="text-sm text-white/40">Loading summary...</p>}
      {!loading && !summary && (
        <p className="text-sm text-white/40">Set up your Claude API key to generate weekly summaries.</p>
      )}
      {summary && <p className="text-sm text-white/75 leading-relaxed">{summary}</p>}
    </GlassCard>
  )
}
