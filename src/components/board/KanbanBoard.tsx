'use client'

import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { Task, TaskStatus } from '@/types/task'
import { updateTask } from '@/lib/db/tasks'
import KanbanColumn from './KanbanColumn'

const COLUMNS: { id: string; title: string; status: TaskStatus }[] = [
  { id: 'col-todo', title: 'To Do', status: 'todo' },
  { id: 'col-inprogress', title: 'In Progress', status: 'inprogress' },
  { id: 'col-done', title: 'Done', status: 'done' },
]

const STATUS_MAP: Record<string, TaskStatus> = {
  'col-todo': 'todo',
  'col-inprogress': 'inprogress',
  'col-done': 'done',
}

interface KanbanBoardProps {
  tasks: Task[]
  onTasksChange: () => void
  onTaskClick: (task: Task) => void
}

export default function KanbanBoard({ tasks, onTasksChange, onTaskClick }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string
    const newStatus = STATUS_MAP[overId]
    if (!newStatus) return

    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    await updateTask(taskId, { status: newStatus })
    onTasksChange()
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            status={col.status}
            tasks={tasks.filter(t => t.status === col.status)}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </DndContext>
  )
}
