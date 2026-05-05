'use client'

import type { Subtask } from '@/types/task'

interface SubtaskListProps {
  subtasks: Subtask[]
  onToggle: (id: string) => void
}

export default function SubtaskList({ subtasks, onToggle }: SubtaskListProps) {
  if (subtasks.length === 0) return null

  return (
    <div className="space-y-2">
      {subtasks.map(subtask => (
        <label key={subtask.id} className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={subtask.done}
            onChange={() => onToggle(subtask.id)}
            className="w-4 h-4 rounded accent-violet-500"
          />
          <span className={`text-sm ${subtask.done ? 'line-through text-white/30' : 'text-white/70'}`}>
            {subtask.title}
          </span>
        </label>
      ))}
    </div>
  )
}
