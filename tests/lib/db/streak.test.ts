import { updateStreak, getStreakData } from '@/lib/db/streak'
import { setSetting } from '@/lib/db/settings'
import { resetDB } from '@/lib/db'

beforeEach(() => {
  resetDB()
})

describe('updateStreak', () => {
  it('starts streak at 1 on first call', async () => {
    const streak = await updateStreak()
    expect(streak).toBe(1)
  })

  it('does not increment if called again on the same day', async () => {
    await updateStreak()
    const streak = await updateStreak()
    expect(streak).toBe(1)
  })

  it('increments streak when last active was yesterday', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    await setSetting('streak', 5)
    await setSetting('lastActiveDate', yesterday.toISOString().split('T')[0])
    const streak = await updateStreak()
    expect(streak).toBe(6)
  })

  it('resets streak to 1 when last active was 2+ days ago', async () => {
    await setSetting('streak', 10)
    await setSetting('lastActiveDate', '2020-01-01')
    const streak = await updateStreak()
    expect(streak).toBe(1)
  })
})

describe('getStreakData', () => {
  it('returns streak and lastActiveDate from settings', async () => {
    await setSetting('streak', 7)
    await setSetting('lastActiveDate', '2026-05-01')
    const data = await getStreakData()
    expect(data.streak).toBe(7)
    expect(data.lastActiveDate).toBe('2026-05-01')
  })
})
