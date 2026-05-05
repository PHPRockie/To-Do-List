'use client'

import { useState } from 'react'
import { createTask } from '@/lib/db/tasks'
import { makeTask } from '@/lib/utils/task'

interface QuickAddBarProps {
  onTaskCreated: () => void
}

export default function QuickAddBar({ onTaskCreated }: QuickAddBarProps) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = value.trim()
    if (!text) return

    setLoading(true)
    try {
      const task = makeTask({ title: text })
      await createTask(task)
      setValue('')
      onTaskCreated()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Add a task... (AI-powered when you add your API key)"
        disabled={loading}
        className="flex-1 glass rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:bg-white/10 transition-all"
      />
      <button
        type="submit"
        disabled={!value.trim() || loading}
        className="gradient-bg px-4 py-3 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-opacity"
      >
        {loading ? '...' : 'Add'}
      </button>
    </form>
  )
}
