import { getSetting, setSetting } from '@/lib/db/settings'
import { resetDB } from '@/lib/db'

beforeEach(() => {
  resetDB()
})

describe('settings', () => {
  it('returns default focusDuration of 25', async () => {
    const val = await getSetting('focusDuration')
    expect(val).toBe(25)
  })

  it('returns default breakDuration of 5', async () => {
    const val = await getSetting('breakDuration')
    expect(val).toBe(5)
  })

  it('persists a setting and reads it back', async () => {
    await setSetting('displayName', 'José')
    const val = await getSetting('displayName')
    expect(val).toBe('José')
  })

  it('overwrites an existing setting', async () => {
    await setSetting('streak', 5)
    await setSetting('streak', 10)
    const val = await getSetting('streak')
    expect(val).toBe(10)
  })
})
