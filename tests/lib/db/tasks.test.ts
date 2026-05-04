import {
  getAllTasks, getTask, createTask, updateTask, deleteTask,
  getTasksByStatus, getTodaysTasks,
} from '@/lib/db/tasks'
import { resetDB } from '@/lib/db'
import type { Task } from '@/types/task'

beforeEach(() => {
  resetDB()
})

const sample: Task = {
  id: 'task-1',
  title: 'Write tests',
  status: 'todo',
  priority: 'high',
  tags: ['dev'],
  subtasks: [],
  createdAt: '2026-05-04T10:00:00.000Z',
  updatedAt: '2026-05-04T10:00:00.000Z',
}

describe('createTask / getTask', () => {
  it('stores and retrieves a task by id', async () => {
    await createTask(sample)
    const result = await getTask('task-1')
    expect(result).toEqual(sample)
  })

  it('returns undefined for unknown id', async () => {
    const result = await getTask('nope')
    expect(result).toBeUndefined()
  })
})

describe('getAllTasks', () => {
  it('returns empty array when no tasks', async () => {
    const tasks = await getAllTasks()
    expect(tasks).toEqual([])
  })

  it('returns all stored tasks', async () => {
    await createTask(sample)
    await createTask({ ...sample, id: 'task-2', title: 'Another task' })
    const tasks = await getAllTasks()
    expect(tasks).toHaveLength(2)
  })
})

describe('updateTask', () => {
  it('updates specified fields and bumps updatedAt', async () => {
    await createTask(sample)
    await updateTask('task-1', { status: 'done', priority: 'low' })
    const updated = await getTask('task-1')
    expect(updated?.status).toBe('done')
    expect(updated?.priority).toBe('low')
    expect(updated?.title).toBe('Write tests')
    expect(updated?.updatedAt).not.toBe(sample.updatedAt)
  })

  it('throws if task does not exist', async () => {
    await expect(updateTask('ghost', { status: 'done' })).rejects.toThrow()
  })
})

describe('deleteTask', () => {
  it('removes the task', async () => {
    await createTask(sample)
    await deleteTask('task-1')
    const result = await getTask('task-1')
    expect(result).toBeUndefined()
  })
})

describe('getTasksByStatus', () => {
  it('returns only tasks with matching status', async () => {
    await createTask(sample)
    await createTask({ ...sample, id: 'task-2', status: 'done' })
    const todoTasks = await getTasksByStatus('todo')
    expect(todoTasks).toHaveLength(1)
    expect(todoTasks[0].id).toBe('task-1')
  })
})

describe('getTodaysTasks', () => {
  it('returns tasks due today that are not done', async () => {
    const today = new Date().toISOString().split('T')[0]
    await createTask({ ...sample, id: 'due-today', dueDate: today })
    await createTask({ ...sample, id: 'done-today', dueDate: today, status: 'done' })
    await createTask({ ...sample, id: 'future', dueDate: '2099-01-01' })
    const result = await getTodaysTasks()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('due-today')
  })
})
