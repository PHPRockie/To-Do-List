import { makeTask } from '@/lib/utils/task'

describe('makeTask', () => {
  it('creates a task with required defaults', () => {
    const task = makeTask({ title: 'Buy milk' })
    expect(task.title).toBe('Buy milk')
    expect(task.status).toBe('todo')
    expect(task.priority).toBe('medium')
    expect(task.tags).toEqual([])
    expect(task.subtasks).toEqual([])
    expect(task.id).toBeTruthy()
    expect(task.createdAt).toBeTruthy()
    expect(task.updatedAt).toBeTruthy()
  })

  it('applies overrides', () => {
    const task = makeTask({ title: 'Urgent task', priority: 'high', status: 'inprogress' })
    expect(task.priority).toBe('high')
    expect(task.status).toBe('inprogress')
  })

  it('generates unique ids', () => {
    const a = makeTask({ title: 'A' })
    const b = makeTask({ title: 'B' })
    expect(a.id).not.toBe(b.id)
  })
})
