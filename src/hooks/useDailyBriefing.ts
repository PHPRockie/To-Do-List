'use client'

import { useEffect, useState } from 'react'
import { getAllTasks } from '@/lib/db/tasks'
import { getSetting, setSetting } from '@/lib/db/settings'
import { callBriefingAI } from '@/lib/ai/client'

export function useDailyBriefing(): string | null {
  const [briefing, setBriefing] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const apiKey = await getSetting('claudeApiKey')
      if (!apiKey) return

      const today = new Date().toISOString().split('T')[0]
      const lastDate = await getSetting('lastBriefingDate')
      const lastText = await getSetting('lastBriefingText')

      if (lastDate === today && lastText) {
        setBriefing(lastText)
        return
      }

      try {
        const tasks = await getAllTasks()
        const todayTasks = tasks
          .filter(t => t.status !== 'done' && t.dueDate?.startsWith(today))
          .map(t => t.title)
        const cutoff = new Date(Date.now() - 86_400_000).toISOString()
        const recentDone = tasks
          .filter(t => t.completedAt && t.completedAt > cutoff)
          .map(t => t.title)

        const text = await callBriefingAI(todayTasks, recentDone)
        if (!text) return

        await setSetting('lastBriefingDate', today)
        await setSetting('lastBriefingText', text)
        setBriefing(text)
      } catch {
        // AI failed — show nothing
      }
    }

    load()
  }, [])

  return briefing
}
