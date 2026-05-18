import { getDB } from './index'
import type { Settings } from '@/types/settings'

const DEFAULTS: Settings = {
  claudeApiKey: undefined,
  theme: 'dark',
  focusDuration: 25,
  breakDuration: 5,
  streak: 0,
  lastActiveDate: '',
  supabaseUserId: undefined,
  lastSyncedAt: undefined,
  notificationsEnabled: false,
  lastBriefingDate: '',
  lastBriefingText: '',
  displayName: '',
  city: '',
  state: '',
}

export async function getSetting<K extends keyof Settings>(key: K): Promise<Settings[K]> {
  const db = await getDB()
  const record = await db.get('settings', key as string)
  return record !== undefined ? (record.value as Settings[K]) : DEFAULTS[key]
}

export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
  const db = await getDB()
  await db.put('settings', { key: key as string, value })
}
