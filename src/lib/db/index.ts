import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Task } from '@/types/task'
import type { FocusSession, WeeklySummary } from '@/types/stats'

interface FlowTaskDB extends DBSchema {
  tasks: {
    key: string
    value: Task
  }
  settings: {
    key: string
    value: { key: string; value: unknown }
  }
  sessions: {
    key: string
    value: FocusSession
  }
  weekly_summary: {
    key: string
    value: WeeklySummary
  }
}

let dbInstance: IDBPDatabase<FlowTaskDB> | null = null

export async function getDB(): Promise<IDBPDatabase<FlowTaskDB>> {
  if (dbInstance) return dbInstance
  dbInstance = await openDB<FlowTaskDB>('flowtask-db', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('tasks', { keyPath: 'id' })
        db.createObjectStore('settings', { keyPath: 'key' })
      }
      if (oldVersion < 2) {
        db.createObjectStore('sessions', { keyPath: 'id' })
        db.createObjectStore('weekly_summary', { keyPath: 'weekKey' })
      }
    },
  })
  return dbInstance
}

export function resetDB(): void {
  dbInstance = null
}
