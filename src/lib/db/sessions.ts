import { getDB } from './index'
import type { FocusSession } from '@/types/stats'

export async function createSession(session: FocusSession): Promise<void> {
  const db = await getDB()
  await db.put('sessions', session)
}

export async function getTodaysCompletedSessions(): Promise<FocusSession[]> {
  const db = await getDB()
  const today = new Date().toISOString().split('T')[0]
  const all = await db.getAll('sessions')
  return all.filter(s => s.completedAt && s.completedAt.startsWith(today))
}
