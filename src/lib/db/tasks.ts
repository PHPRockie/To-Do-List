import { getDB } from './index'
import type { Task, TaskStatus } from '@/types/task'

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDB()
  return db.getAll('tasks')
}

export async function getTask(id: string): Promise<Task | undefined> {
  const db = await getDB()
  return db.get('tasks', id)
}

export async function createTask(task: Task): Promise<void> {
  const db = await getDB()
  await db.put('tasks', task)
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('tasks', id)
  if (!existing) throw new Error(`Task ${id} not found`)
  await db.put('tasks', { ...existing, ...updates, updatedAt: new Date().toISOString() })
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('tasks', id)
}

export async function getTasksByStatus(status: TaskStatus): Promise<Task[]> {
  const tasks = await getAllTasks()
  return tasks.filter(t => t.status === status)
}

export async function getTodaysTasks(): Promise<Task[]> {
  const today = new Date().toISOString().split('T')[0]
  const tasks = await getAllTasks()
  return tasks.filter(t => t.dueDate === today && t.status !== 'done')
}
