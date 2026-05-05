import { getDB } from './index'
import type { WeeklySummary } from '@/types/stats'

export async function getWeeklySummary(weekKey: string): Promise<WeeklySummary | null> {
  const db = await getDB()
  const result = await db.get('weekly_summary', weekKey)
  return result ?? null
}

export async function saveWeeklySummary(summary: WeeklySummary): Promise<void> {
  const db = await getDB()
  await db.put('weekly_summary', summary)
}
