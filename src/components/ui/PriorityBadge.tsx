import type { TaskPriority } from '@/types/task'

const styles: Record<TaskPriority, string> = {
  high: 'bg-red-500/20 text-red-400 border border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border border-green-500/30',
}

const labels: Record<TaskPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export default function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[priority]}`}>
      {labels[priority]}
    </span>
  )
}
