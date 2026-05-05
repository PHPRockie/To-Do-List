'use client'

import { useState, useEffect } from 'react'
import { createTask } from '@/lib/db/tasks'
import { makeTask } from '@/lib/utils/task'
import { callParseAI, hasApiKey } from '@/lib/ai/client'

interface QuickAddBarProps {
  onTaskCreated: () => void
}

export default function QuickAddBar({ onTaskCreated }: QuickAddBarProps) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    hasApiKey().then(setAiEnabled)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = value.trim()
    if (!text) return

    setLoading(true)
    setAiError(null)

    try {
      let taskData: Parameters<typeof makeTask>[0] = { title: text }

      if (aiEnabled) {
        try {
          const parsed = await callParseAI(text)
          taskData = {
            title: parsed.title || text,
            dueDate: parsed.dueDate ?? undefined,
            priority: parsed.priority ?? 'medium',
            tags: parsed.tags ?? [],
            reminderOffset: parsed.reminderOffset ?? undefined,
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'AI failed'
          if (msg !== 'NO_API_KEY') {
            setAiError('AI parse failed — saved as plain text')
          }
        }
      }

      const task = makeTask(taskData)
      await createTask(task)
      setValue('')
      onTaskCreated()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={
              aiEnabled
                ? '✨ Add a task in plain English...'
                : 'Add a task... (set Claude API key in settings to enable AI)'
            }
            disabled={loading}
            className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:bg-white/10 transition-all"
          />
          {aiEnabled && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-400/60">AI</span>
          )}
        </div>
        <button
          type="submit"
          disabled={!value.trim() || loading}
          className="gradient-bg px-4 py-3 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-opacity"
        >
          {loading ? '...' : 'Add'}
        </button>
      </form>
      {aiError && <p className="text-xs text-yellow-400/60 px-1">{aiError}</p>}
    </div>
  )
}
