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
    claudeApiKey: 'sk-ant-test',
    lastBriefingDate: '',
    lastBriefingText: '',
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

  it('returns null when no API key is set', async () => {
    mockSettings({ claudeApiKey: undefined, lastBriefingDate: '' })

    const { result } = renderHook(() => useDailyBriefing())

    // wait for effect to run
    await new Promise(r => setTimeout(r, 50))

    expect(callBriefingAI).not.toHaveBeenCalled()
    expect(result.current).toBeNull()
  })

  it('returns null when AI call throws', async () => {
    mockSettings({ lastBriefingDate: '' })
    vi.mocked(callBriefingAI).mockRejectedValue(new Error('AI error'))

    const { result } = renderHook(() => useDailyBriefing())

    await new Promise(r => setTimeout(r, 50))

    expect(result.current).toBeNull()
  })
})
