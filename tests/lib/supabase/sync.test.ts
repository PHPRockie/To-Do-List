import { syncTasks, syncAll } from '@/lib/supabase/sync'
import { getAllTasks, createTask } from '@/lib/db/tasks'
import { getSetting } from '@/lib/db/settings'
import { resetDB } from '@/lib/db'
import type { Task } from '@/types/task'

const { mockUpsert, mockEq, mockSelect, mockFrom } = vi.hoisted(() => ({
  mockUpsert: vi.fn().mockResolvedValue({ error: null }),
  mockEq: vi.fn(),
  mockSelect: vi.fn(),
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: mockFrom },
}))

const localTask: Task = {
  id: 'task-local',
  title: 'Local task',
  status: 'todo',
  priority: 'medium',
  tags: [],
  subtasks: [],
  createdAt: '2026-05-04T10:00:00.000Z',
  updatedAt: '2026-05-04T10:00:00.000Z',
}

beforeEach(() => {
  resetDB()
  vi.clearAllMocks()
  mockEq.mockResolvedValue({ data: [], error: null })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ select: mockSelect, upsert: mockUpsert })
})

describe('syncTasks', () => {
  it('pulls new remote task to local', async () => {
    const remoteTask: Task = {
      id: 'task-remote', title: 'Remote task', status: 'todo', priority: 'medium',
      tags: [], subtasks: [], createdAt: '2026-05-04T09:00:00.000Z', updatedAt: '2026-05-04T09:00:00.000Z',
    }
    mockEq.mockResolvedValue({
      data: [{ id: 'task-remote', data: remoteTask, updated_at: '2026-05-04T09:00:00.000Z' }],
      error: null,
    })
    const result = await syncTasks('user-1')
    expect(result.pulled).toBe(1)
    const tasks = await getAllTasks()
    expect(tasks.find(t => t.id === 'task-remote')).toBeTruthy()
  })

  it('skips remote task when local is same age or newer', async () => {
    await createTask(localTask)
    mockEq.mockResolvedValue({
      data: [{ id: 'task-local', data: localTask, updated_at: '2026-05-03T10:00:00.000Z' }],
      error: null,
    })
    const result = await syncTasks('user-1')
    expect(result.conflicts).toBe(0)
    expect(result.pulled).toBe(0)
  })

  it('counts conflict when remote is newer than local', async () => {
    await createTask(localTask)
    mockEq.mockResolvedValue({
      data: [{ id: 'task-local', data: { ...localTask, title: 'Modified remotely' }, updated_at: '2026-05-05T10:00:00.000Z' }],
      error: null,
    })
    const result = await syncTasks('user-1')
    expect(result.conflicts).toBe(1)
    const tasks = await getAllTasks()
    expect(tasks.find(t => t.id === 'task-local')?.title).toBe('Local task')
  })

  it('upserts all local tasks to Supabase', async () => {
    await createTask(localTask)
    await syncTasks('user-1')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'task-local', user_id: 'user-1' })])
    )
  })
})

describe('syncAll', () => {
  it('sets lastSyncedAt after successful sync', async () => {
    await syncAll('user-1')
    const lastSyncedAt = await getSetting('lastSyncedAt')
    expect(lastSyncedAt).toBeTruthy()
  })
})
