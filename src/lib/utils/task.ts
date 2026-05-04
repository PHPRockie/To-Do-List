import type { Task } from '@/types/task'

export function makeTask(overrides: Partial<Task> & { title: string }): Task {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: overrides.title,
    description: overrides.description,
    status: overrides.status ?? 'todo',
    priority: overrides.priority ?? 'medium',
    dueDate: overrides.dueDate,
    tags: overrides.tags ?? [],
    subtasks: overrides.subtasks ?? [],
    estimatedMinutes: overrides.estimatedMinutes,
    reminderOffset: overrides.reminderOffset,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  }
}
