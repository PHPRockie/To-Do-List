'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTodaysTasks } from '@/lib/db/tasks'
import TaskCard from '@/components/board/TaskCard'
import TaskDetail from '@/components/task/TaskDetail'
import BriefingBanner from '@/components/today/BriefingBanner'
import { useDailyBriefing } from '@/hooks/useDailyBriefing'
import type { Task } from '@/types/task'

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const briefing = useDailyBriefing()

  const refresh = useCallback(async () => {
    const t = await getTodaysTasks()
    setTasks(t)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white/90">Good day ☀️</h1>
        <p className="text-sm text-white/40 mt-1">{today}</p>
      </div>

      {briefing && <BriefingBanner text={briefing} />}

      {tasks.length === 0 ? (
        <p className="text-sm text-white/30">No tasks due today — enjoy your day!</p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-wider">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} due today
          </p>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
          ))}
        </div>
      )}

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
