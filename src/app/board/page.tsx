'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getAllTasks } from '@/lib/db/tasks'
import KanbanBoard from '@/components/board/KanbanBoard'
import QuickAddBar from '@/components/board/QuickAddBar'
import TaskDetail from '@/components/task/TaskDetail'
import ApiKeyBanner from '@/components/board/ApiKeyBanner'
import type { Task } from '@/types/task'

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [query, setQuery] = useState('')

  const refresh = useCallback(async () => {
    const updated = await getAllTasks()
    setTasks(updated)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const filteredTasks = useMemo(() => {
    if (!query.trim()) return tasks
    const lower = query.toLowerCase()
    return tasks.filter(t => t.title.toLowerCase().includes(lower))
  }, [tasks, query])

  return (
    <div className="flex flex-col h-full gap-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-white/80">Board</h1>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-white/30 text-sm pointer-events-none">🔍</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks..."
            className="glass rounded-lg pl-8 pr-8 py-1.5 text-sm text-white placeholder-white/30 outline-none w-44"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 text-white/30 hover:text-white/60 text-base leading-none"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>
      {query.trim() && (
        <p className="text-xs text-white/30 -mt-2">
          {filteredTasks.length} of {tasks.length} tasks
        </p>
      )}
      <ApiKeyBanner />
      <QuickAddBar onTaskCreated={refresh} />
      <KanbanBoard tasks={filteredTasks} onTasksChange={refresh} onTaskClick={setSelectedTask} />
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={async () => {
            await refresh()
            setSelectedTask(null)
          }}
        />
      )}
    </div>
  )
}
