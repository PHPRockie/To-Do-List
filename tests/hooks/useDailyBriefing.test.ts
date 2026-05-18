import { renderHook, waitFor } from '@testing-library/react'
import { useDailyBriefing } from '@/hooks/useDailyBriefing'
import { getSetting, setSetting } from '@/lib/db/settings'
import { getAllTasks } from '@/lib/db/tasks'

vi.mock('@/lib/db/settings', () => ({
  getSetting: vi.fn(),
  setSetting: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/db/tasks', () => ({ getAllTasks: vi.fn() }))

vi.mock('@/lib/ai/client', () => ({
  callBriefingAI: vi.fn(),
}))

import { callBriefingAI } from '@/lib/ai/client'

const TODAY = new Date().toISOString().split('T')[0]

function mockSettings(overrides: Record<string, unknown> = {}) {
  const defaults: Record<string, unknown> = {
    lastBriefingDate: '',
    lastBriefingText: '',
    displayName: '',
    city: '',
    state: '',
    ...overrides,
  }
  vi.mocked(getSetting).mockImplementation((key) => Promise.resolve(defaults[key] as never))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getAllTasks).mockResolvedValue([])
  vi.mocked(callBriefingAI).mockResolvedValue('You have 2 tasks today. Keep it up!')
})

describe('useDailyBriefing', () => {
  it('calls AI on first open of the day and returns briefing text', async () => {
    mockSettings({ lastBriefingDate: '' })

    const { result } = renderHook(() => useDailyBriefing())

    await waitFor(() => expect(result.current).not.toBeNull())

    expect(callBriefingAI).toHaveBeenCalledTimes(1)
    expect(result.current).toBe('You have 2 tasks today. Keep it up!')
    expect(setSetting).toHaveBeenCalledWith('lastBriefingDate', TODAY)
    expect(setSetting).toHaveBeenCalledWith('lastBriefingText', 'You have 2 tasks today. Keep it up!')
  })

  it('passes profile fields to callBriefingAI when set', async () => {
    mockSettings({
      lastBriefingDate: '',
      displayName: 'José',
      city: 'Austin',
      state: 'TX',
    })

    const { result } = renderHook(() => useDailyBriefing())

    await waitFor(() => expect(result.current).not.toBeNull())

    expect(callBriefingAI).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Array),
      { displayName: 'José', city: 'Austin', state: 'TX' }
    )
  })

  it('returns cached text without calling AI if lastBriefingDate is today', async () => {
    mockSettings({
      lastBriefingDate: TODAY,
      lastBriefingText: 'Cached briefing from earlier',
    })

    const { result } = renderHook(() => useDailyBriefing())

    await waitFor(() => expect(result.current).not.toBeNull())

    expect(callBriefingAI).not.toHaveBeenCalled()
    expect(result.current).toBe('Cached briefing from earlier')
  })

  it('returns null when AI call throws', async () => {
    mockSettings({ lastBriefingDate: '' })
    vi.mocked(callBriefingAI).mockRejectedValue(new Error('AI error'))

    const { result } = renderHook(() => useDailyBriefing())

    await waitFor(() => expect(callBriefingAI).toHaveBeenCalled())

    expect(result.current).toBeNull()
  })
})
