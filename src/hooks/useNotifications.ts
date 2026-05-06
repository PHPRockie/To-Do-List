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
          if (due >= now && due < now + 60_000) {
            new Notification(task.title, { body: 'Due now', icon: '/icons/icon-192.png' })
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
