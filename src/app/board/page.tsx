'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAllTasks } from '@/lib/db/tasks'
import KanbanBoard from '@/components/board/KanbanBoard'
import QuickAddBar from '@/components/board/QuickAddBar'
import type { Task } from '@/types/task'

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const refresh = useCallback(async () => {
    const updated = await getAllTasks()
    setTasks(updated)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <div className="flex flex-col h-full gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white/80">Board</h1>
      </div>
      <QuickAddBar onTaskCreated={refresh} />
      <KanbanBoard tasks={tasks} onTasksChange={refresh} onTaskClick={setSelectedTask} />
      {selectedTask && (
        <div className="text-white/40 text-sm p-2">
          Selected: {selectedTask.title} (TaskDetail coming in Task 16)
        </div>
      )}
    </div>
  )
}
