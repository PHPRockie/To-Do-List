import { getWeekKey, getWeekBounds } from '@/lib/utils/date'

describe('getWeekKey', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const key = getWeekKey()
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns a Monday date', () => {
    const key = getWeekKey()
    const day = new Date(key + 'T12:00:00').getDay()
    expect(day).toBe(1) // 1 = Monday
  })
})

describe('getWeekBounds', () => {
  it('returns start on Monday midnight', () => {
    const { start } = getWeekBounds()
    expect(start.getDay()).toBe(1)
    expect(start.getHours()).toBe(0)
  })

  it('returns end on Sunday 23:59:59', () => {
    const { end } = getWeekBounds()
    expect(end.getDay()).toBe(0)
    expect(end.getHours()).toBe(23)
  })

  it('span is exactly 7 days', () => {
    const { start, end } = getWeekBounds()
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    expect(Math.round(diffDays)).toBe(7)
  })
})
