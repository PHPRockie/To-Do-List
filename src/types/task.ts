export type TaskStatus = 'todo' | 'inprogress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  tags: string[]
  subtasks: Subtask[]
  estimatedMinutes?: number
  reminderOffset?: number
  completedAt?: string
  createdAt: string
  updatedAt: string
}
