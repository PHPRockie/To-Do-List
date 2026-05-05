import { createSession, getTodaysCompletedSessions } from '@/lib/db/sessions'
import { resetDB } from '@/lib/db'
import type { FocusSession } from '@/types/stats'

beforeEach(() => {
  resetDB()
})

const today = new Date().toISOString().split('T')[0]

const completedSession: FocusSession = {
  id: 'session-1',
  startedAt: `${today}T09:00:00.000Z`,
  durationMinutes: 25,
  completedAt: `${today}T09:25:00.000Z`,
}

const incompleteSession: FocusSession = {
  id: 'session-2',
  startedAt: `${today}T10:00:00.000Z`,
  durationMinutes: 25,
}

describe('createSession / getTodaysCompletedSessions', () => {
  it('returns empty array when no sessions', async () => {
    const result = await getTodaysCompletedSessions()
    expect(result).toEqual([])
  })

  it('returns only completed sessions from today', async () => {
    await createSession(completedSession)
    await createSession(incompleteSession)
    const result = await getTodaysCompletedSessions()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('session-1')
  })

  it('excludes sessions from other days', async () => {
    const oldSession: FocusSession = {
      id: 'session-old',
      startedAt: '2020-01-01T09:00:00.000Z',
      durationMinutes: 25,
      completedAt: '2020-01-01T09:25:00.000Z',
    }
    await createSession(oldSession)
    const result = await getTodaysCompletedSessions()
    expect(result).toHaveLength(0)
  })
})
