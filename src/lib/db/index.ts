import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Task } from '@/types/task'

interface FlowTaskDB extends DBSchema {
  tasks: {
    key: string
    value: Task
  }
  settings: {
    key: string
    value: { key: string; value: unknown }
  }
}

let dbInstance: IDBPDatabase<FlowTaskDB> | null = null

export async function getDB(): Promise<IDBPDatabase<FlowTaskDB>> {
  if (dbInstance) return dbInstance
  dbInstance = await openDB<FlowTaskDB>('flowtask-db', 1, {
    upgrade(db) {
      db.createObjectStore('tasks', { keyPath: 'id' })
      db.createObjectStore('settings', { keyPath: 'key' })
    },
  })
  return dbInstance
}

export function resetDB(): void {
  dbInstance = null
}
