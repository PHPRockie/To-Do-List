import { getSetting, setSetting } from './settings'

export async function getStreakData(): Promise<{ streak: number; lastActiveDate: string }> {
  const streak = await getSetting('streak')
  const lastActiveDate = await getSetting('lastActiveDate')
  return { streak, lastActiveDate }
}

export async function updateStreak(): Promise<number> {
  const today = new Date().toISOString().split('T')[0]
  const streak = await getSetting('streak')
  const lastActiveDate = await getSetting('lastActiveDate')

  if (lastActiveDate === today) return streak

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const newStreak = lastActiveDate === yesterdayStr ? streak + 1 : 1

  await setSetting('streak', newStreak)
  await setSetting('lastActiveDate', today)
  return newStreak
}
