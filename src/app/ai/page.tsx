'use client'

import { useState, useEffect } from 'react'
import { getAllTasks } from '@/lib/db/tasks'
import { callScheduleAI, callPrioritizeAI, hasApiKey } from '@/lib/ai/client'
import SchedulePanel from '@/components/ai/SchedulePanel'
import InsightPanel from '@/components/ai/InsightPanel'
import type { ScheduleItem } from '@/types/stats'
import type { Task } from '@/types/task'

function toScheduleInput(tasks: Task[]) {
  return tasks
    .filter(t => t.status !== 'done')
    .sort((a, b) => (a.dueDate ?? '9999') < (b.dueDate ?? '9999') ? -1 : 1)
    .map(t => ({ id: t.id, title: t.title, dueDate: t.dueDate, priority: t.priority }))
}

export default function AIPage() {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[] | null | undefined>(undefined)
  const [insight, setInsight] = useState<string | null | undefined>(undefined)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [insightLoading, setInsightLoading] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [insightError, setInsightError] = useState<string | null>(null)

  async function loadAI() {
    const hasKey = await hasApiKey()
    if (!hasKey) return

    const tasks = await getAllTasks()
    const input = toScheduleInput(tasks)

    if (input.length === 0) {
      setScheduleItems([])
      setInsight(null)
      return
    }

    setScheduleLoading(true)
    setInsightLoading(true)

    callScheduleAI(input)
      .then(items => { setScheduleItems(items); setScheduleLoading(false) })
      .catch(err => { setScheduleError(err.message); setScheduleLoading(false) })

    callPrioritizeAI(input)
      .then(res => { setInsight(res.insight); setInsightLoading(false) })
      .catch(err => { setInsightError(err.message); setInsightLoading(false) })
  }

  useEffect(() => {
    loadAI()
  }, [])

  return (
    <div className="p-6 max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-white/80">AI Assistant</h1>
      <p className="text-sm text-white/40">Smart scheduling and priority insights for today.</p>
      <SchedulePanel
        items={scheduleItems}
        loading={scheduleLoading}
        error={scheduleError}
        onRegenerate={loadAI}
      />
      <InsightPanel
        insight={insight}
        loading={insightLoading}
        error={insightError}
      />
    </div>
  )
}
