'use client'

import { useAuth, SyncStatus as SyncStatusType } from '@/context/AuthContext'

const dotColors: Record<SyncStatusType, string> = {
  idle: 'bg-white/20',
  syncing: 'bg-yellow-400 animate-pulse',
  synced: 'bg-green-400',
  error: 'bg-red-400',
}

const titles: Record<SyncStatusType, string> = {
  idle: 'Not signed in',
  syncing: 'Syncing...',
  synced: 'Synced',
  error: 'Sync failed',
}

export default function SyncStatus() {
  const { user, syncStatus } = useAuth()
  const status = user ? syncStatus : 'idle'

  return (
    <div
      className={`w-2 h-2 rounded-full ${dotColors[status]} absolute top-1 right-1`}
      title={titles[status]}
    />
  )
}
