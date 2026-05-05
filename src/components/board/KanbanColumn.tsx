'use client'

import { useDroppable } from '@dnd-kit/core'
import type { Task, TaskStatus } from '@/types/task'
import TaskCard from './TaskCard'

interface KanbanColumnProps {
  id: string
  title: string
  status: TaskStatus
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

const columnColors: Record<TaskStatus, string> = {
  todo: 'border-t-white/20',
  inprogress: 'border-t-accent-purple',
  done: 'border-t-accent-green',
}

export default function KanbanColumn({ id, title, status, tasks, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-3 min-h-[400px] p-4 rounded-xl glass border-t-2 ${columnColors[status]} transition-colors ${
        isOver ? 'bg-white/10' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">{title}</h3>
        <span className="text-xs text-white/40 glass px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
      ))}
    </div>
  )
}
