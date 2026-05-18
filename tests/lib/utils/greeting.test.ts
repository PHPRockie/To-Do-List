import { getGreeting } from '@/lib/utils/greeting'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('getGreeting', () => {
  it('returns "Good morning, José" at 9am with a name', () => {
    vi.setSystemTime(new Date('2026-05-06T09:00:00.000'))
    expect(getGreeting('José')).toBe('Good morning, José')
  })

  it('returns "Good afternoon" at 2pm without a name', () => {
    vi.setSystemTime(new Date('2026-05-06T14:00:00.000'))
    expect(getGreeting()).toBe('Good afternoon')
  })

  it('returns "Good evening, María" at 7pm with a name', () => {
    vi.setSystemTime(new Date('2026-05-06T19:00:00.000'))
    expect(getGreeting('María')).toBe('Good evening, María')
  })

  it('morning starts at 5:00', () => {
    vi.setSystemTime(new Date('2026-05-06T05:00:00.000'))
    expect(getGreeting()).toBe('Good morning')
  })

  it('evening at midnight (hour 0)', () => {
    vi.setSystemTime(new Date('2026-05-06T00:00:00.000'))
    expect(getGreeting()).toBe('Good evening')
  })
})
