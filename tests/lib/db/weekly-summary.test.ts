import { getWeeklySummary, saveWeeklySummary } from '@/lib/db/weekly-summary'
import { resetDB } from '@/lib/db'
import type { WeeklySummary } from '@/types/stats'

beforeEach(() => {
  resetDB()
})

const sample: WeeklySummary = {
  weekKey: '2026-05-04',
  generatedAt: '2026-05-04T10:00:00.000Z',
  summary: 'Great week! You completed 10 tasks.',
  tasksCompleted: 10,
  completionRate: 85,
}

describe('saveWeeklySummary / getWeeklySummary', () => {
  it('returns null when no summary exists for a week', async () => {
    const result = await getWeeklySummary('2026-05-04')
    expect(result).toBeNull()
  })

  it('stores and retrieves a summary by weekKey', async () => {
    await saveWeeklySummary(sample)
    const result = await getWeeklySummary('2026-05-04')
    expect(result).toEqual(sample)
  })

  it('overwrites existing summary for same weekKey', async () => {
    await saveWeeklySummary(sample)
    const updated = { ...sample, summary: 'Updated summary.' }
    await saveWeeklySummary(updated)
    const result = await getWeeklySummary('2026-05-04')
    expect(result?.summary).toBe('Updated summary.')
  })
})
