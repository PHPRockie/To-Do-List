import { supabase } from './client'
import { getAllTasks, createTask } from '@/lib/db/tasks'
import { setSetting } from '@/lib/db/settings'
import type { Task } from '@/types/task'

export interface SyncResult {
  conflicts: number
  pulled: number
  pushed: number
}

export async function syncTasks(userId: string): Promise<Omit<SyncResult, 'pushed'>> {
  const { data: remoteRows, error } = await supabase
    .from('tasks')
    .select('id, data, updated_at')
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  const localTasks = await getAllTasks()
  const localMap = new Map(localTasks.map(t => [t.id, t]))

  let conflicts = 0
  let pulled = 0

  for (const row of remoteRows ?? []) {
    const remote = row.data as Task
    const local = localMap.get(row.id)
    if (!local) {
      await createTask(remote)
      pulled++
    } else if (new Date(row.updated_at) > new Date(local.updatedAt)) {
      conflicts++
    }
  }

  const allLocal = await getAllTasks()
  if (allLocal.length > 0) {
    const { error: upsertError } = await supabase.from('tasks').upsert(
      allLocal.map(t => ({ id: t.id, user_id: userId, data: t, updated_at: t.updatedAt }))
    )
    if (upsertError) throw new Error(upsertError.message)
  }

  return { conflicts, pulled }
}

export async function syncSettings(userId: string): Promise<void> {
  const { getSetting } = await import('@/lib/db/settings')
  const settingsToSync = {
    theme: await getSetting('theme'),
    focusDuration: await getSetting('focusDuration'),
    breakDuration: await getSetting('breakDuration'),
    streak: await getSetting('streak'),
    lastActiveDate: await getSetting('lastActiveDate'),
  }
  const { error } = await supabase.from('user_settings').upsert({
    user_id: userId,
    data: settingsToSync,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
}

export async function syncAll(userId: string): Promise<SyncResult> {
  const taskResult = await syncTasks(userId)
  await syncSettings(userId)
  const allLocal = await getAllTasks()
  await setSetting('lastSyncedAt', new Date().toISOString())
  return { ...taskResult, pushed: allLocal.length }
}
