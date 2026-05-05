'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@/types/task'
import PriorityBadge from '@/components/ui/PriorityBadge'
import TagChip from '@/components/ui/TagChip'
import GlassCard from '@/components/ui/GlassCard'

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

interface TaskCardProps {
  task: Task
  onClick: () => void
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  const doneSubtasks = task.subtasks.filter(s => s.done).length

  return (
    <GlassCard
      ref={setNodeRef}
      style={style}
      className={`p-3 cursor-pointer glass-hover transition-all duration-150 select-none ${
        isDragging ? 'opacity-50 shadow-2xl rotate-2 z-50' : ''
      }`}
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
      <p className="text-sm font-medium text-white/90 mb-2 leading-snug">{task.title}</p>
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <PriorityBadge priority={task.priority} />
        {task.tags.map(tag => <TagChip key={tag} tag={tag} />)}
      </div>
      <div className="flex items-center justify-between text-xs text-white/30">
        {task.dueDate && <span>{formatDate(task.dueDate)}</span>}
        {task.subtasks.length > 0 && (
          <span className="ml-auto">{doneSubtasks}/{task.subtasks.length}</span>
        )}
      </div>
    </GlassCard>
  )
}
