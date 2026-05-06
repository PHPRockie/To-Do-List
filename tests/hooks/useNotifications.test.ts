import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { getAllTasks } from '@/lib/db/tasks'
import { setSetting } from '@/lib/db/settings'
import type { Task } from '@/types/task'

vi.mock('@/lib/db/tasks', () => ({ getAllTasks: vi.fn() }))
vi.mock('@/lib/db/settings', () => ({
  getSetting: vi.fn(),
  setSetting: vi.fn().mockResolvedValue(undefined),
}))

const MockNotification = vi.fn()

function mockGranted() {
  Object.defineProperty(globalThis, 'Notification', {
    writable: true,
    configurable: true,
    value: Object.assign(MockNotification, {
      permission: 'granted',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    }),
  })
}

function mockDenied() {
  const DeniedNotification = vi.fn()
  Object.defineProperty(globalThis, 'Notification', {
    writable: true,
    configurable: true,
    value: Object.assign(DeniedNotification, {
      permission: 'denied',
      requestPermission: vi.fn().mockResolvedValue('denied'),
    }),
  })
}

const makeTask = (id: string, dueDate: string): Task => ({
  id,
  title: `Task ${id}`,
  dueDate,
  status: 'todo',
  priority: 'medium',
  tags: [],
  subtasks: [],
  createdAt: '',
  updatedAt: '',
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  mockGranted()
  vi.mocked(getAllTasks).mockResolvedValue([])
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useNotifications', () => {
  it('fires notification for a task due in the current minute', async () => {
    const now = Date.now()
    vi.setSystemTime(now)
    vi.mocked(getAllTasks).mockResolvedValue([makeTask('t1', new Date(now + 30_000).toISOString())])

    renderHook(() => useNotifications())
    await act(async () => {})

    expect(MockNotification).toHaveBeenCalledWith('Task t1', {
      body: 'Due now',
      icon: '/icons/icon-192.png',
    })
  })

  it('does not fire for a task due in the past', async () => {
    const now = Date.now()
    vi.setSystemTime(now)
    vi.mocked(getAllTasks).mockResolvedValue([makeTask('t1', new Date(now - 5_000).toISOString())])

    renderHook(() => useNotifications())
    await act(async () => {})

    expect(MockNotification).not.toHaveBeenCalled()
  })

  it('does not fire for a task due more than 60s from now', async () => {
    const now = Date.now()
    vi.setSystemTime(now)
    vi.mocked(getAllTasks).mockResolvedValue([makeTask('t1', new Date(now + 90_000).toISOString())])

    renderHook(() => useNotifications())
    await act(async () => {})

    expect(MockNotification).not.toHaveBeenCalled()
  })

  it('does not fire twice for the same task', async () => {
    const now = Date.now()
    vi.setSystemTime(now)
    vi.mocked(getAllTasks).mockResolvedValue([makeTask('t1', new Date(now + 30_000).toISOString())])

    renderHook(() => useNotifications())
    await act(async () => {})
    await vi.advanceTimersByTimeAsync(60_000)

    expect(MockNotification).toHaveBeenCalledTimes(1)
  })

  it('skips all notifications when permission is denied', async () => {
    mockDenied()
    const now = Date.now()
    vi.setSystemTime(now)
    vi.mocked(getAllTasks).mockResolvedValue([makeTask('t1', new Date(now + 30_000).toISOString())])

    renderHook(() => useNotifications())
    await act(async () => {})

    expect(MockNotification).not.toHaveBeenCalled()
  })
})
