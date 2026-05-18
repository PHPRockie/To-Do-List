'use client'

import { useEffect, useRef } from 'react'
import { getAllTasks } from '@/lib/db/tasks'
import { setSetting } from '@/lib/db/settings'

export function useNotifications() {
  const notifiedIds = useRef(new Set<string>())

  useEffect(() => {
    if (typeof Notification === 'undefined') return

    async function requestPermission() {
      const permission = await Notification.requestPermission()
      // persisted for a future settings UI toggle (not yet read by tick)
      await setSetting('notificationsEnabled', permission === 'granted')
    }

    async function tick() {
      if (Notification.permission !== 'granted') return

      const now = Date.now()
      let tasks: Awaited<ReturnType<typeof getAllTasks>>
      try {
        tasks = await getAllTasks()
      } catch {
        return
      }

      for (const task of tasks) {
        if (!task.dueDate || notifiedIds.current.has(task.id)) continue
        try {
          const due = new Date(task.dueDate).getTime()
          const offset = Math.max(0, task.reminderOffset ?? 0)
          const fireTime = due - offset * 60_000
          if (fireTime >= now && fireTime < now + 60_000) {
            const body = offset > 0 ? `Due in ${offset} minutes` : 'Due now'
            new Notification(task.title, { body, icon: '/icons/icon-192.png' })
            notifiedIds.current.add(task.id)
          }
        } catch {
          // malformed dueDate — skip
        }
      }
    }

    requestPermission()
    tick()
    const intervalId = setInterval(tick, 60_000)
    return () => clearInterval(intervalId)
  }, [])
}
