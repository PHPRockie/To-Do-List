'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Task, TaskPriority } from '@/types/task'
import { updateTask, deleteTask } from '@/lib/db/tasks'
import GlassCard from '@/components/ui/GlassCard'
import SubtaskList from './SubtaskList'
import { callBreakdownAI, hasApiKey } from '@/lib/ai/client'

interface TaskDetailProps {
  task: Task
  onClose: () => void
  onUpdated: () => void
}

export default function TaskDetail({ task, onClose, onUpdated }: TaskDetailProps) {
  const [title, setTitle] = useState(task.title)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [dueDate, setDueDate] = useState(task.dueDate ?? '')
  const [subtasks, setSubtasks] = useState(task.subtasks)
  const [saving, setSaving] = useState(false)
  const [breakingDown, setBreakingDown] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(false)

  useEffect(() => {
    hasApiKey().then(setAiEnabled)
  }, [])

  function toggleSubtask(id: string) {
    setSubtasks(prev =>
      prev.map(s => (s.id === id ? { ...s, done: !s.done } : s))
    )
  }

  async function handleBreakdown() {
    setBreakingDown(true)
    try {
      const titles = await callBreakdownAI(task.title)
      const newSubtasks = titles.map(title => ({
        id: crypto.randomUUID(),
        title,
        done: false,
      }))
      setSubtasks(prev => [...prev, ...newSubtasks])
    } finally {
      setBreakingDown(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateTask(task.id, {
        title,
        priority,
        dueDate: dueDate || undefined,
        subtasks,
      })
      onUpdated()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this task?')) return
    await deleteTask(task.id)
    onUpdated()
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg"
        >
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-base font-semibold text-white/80">Edit Task</h2>
              <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg leading-none">✕</button>
            </div>

            <div className="space-y-3">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full glass rounded-lg px-3 py-2 text-sm text-white outline-none"
              />

              <div className="flex gap-3">
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as TaskPriority)}
                  className="glass rounded-lg px-3 py-2 text-sm text-white/70 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="flex-1 glass rounded-lg px-3 py-2 text-sm text-white/70 outline-none"
                />
              </div>
            </div>

            {subtasks.length > 0 && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Subtasks</p>
                <SubtaskList subtasks={subtasks} onToggle={toggleSubtask} />
              </div>
            )}

            {aiEnabled && (
              <button
                onClick={handleBreakdown}
                disabled={breakingDown}
                className="w-full glass glass-hover rounded-lg py-2 text-xs text-purple-400/80 hover:text-purple-400 transition-colors disabled:opacity-40"
              >
                {breakingDown ? '✨ Breaking down...' : '✨ AI: Break into subtasks'}
              </button>
            )}

            <div className="flex justify-between pt-2">
              <button
                onClick={handleDelete}
                className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
              >
                Delete task
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="glass px-3 py-1.5 rounded-lg text-xs text-white/50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="gradient-bg px-3 py-1.5 rounded-lg text-xs text-white disabled:opacity-40"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
