'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAllTasks } from '@/lib/db/tasks'
import { getStreakData } from '@/lib/db/streak'
import { getWeekBounds } from '@/lib/utils/date'
import StreakCard from '@/components/stats/StreakCard'
import WeekChart from '@/components/stats/WeekChart'
import WeekSummary from '@/components/stats/WeekSummary'
import type { Task } from '@/types/task'

function buildWeekData(tasks: Task[]): number[] {
  const { start } = getWeekBounds()
  const data = [0, 0, 0, 0, 0, 0, 0]
  tasks.forEach(task => {
    if (!task.completedAt) return
    const completedDate = new Date(task.completedAt)
    const dayIndex = Math.floor((completedDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (dayIndex >= 0 && dayIndex < 7) data[dayIndex]++
  })
  return data
}

export default function StatsPage() {
  const [streak, setStreak] = useState(0)
  const [weekData, setWeekData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
  const [completionRate, setCompletionRate] = useState(0)
  const [completedTasks, setCompletedTasks] = useState<Array<{ title: string; completedAt: string }>>([])
  const [tasksCompleted, setTasksCompleted] = useState(0)

  const load = useCallback(async () => {
    const [tasks, streakData] = await Promise.all([getAllTasks(), getStreakData()])
    const { start, end } = getWeekBounds()

    const thisWeekTasks = tasks.filter(t => {
      const date = new Date(t.createdAt)
      return date >= start && date <= end
    })
    const thisWeekCompleted = tasks.filter(t => {
      if (!t.completedAt) return false
      const date = new Date(t.completedAt)
      return date >= start && date <= end
    })

    const rate = thisWeekTasks.length > 0
      ? Math.round((thisWeekCompleted.length / thisWeekTasks.length) * 100)
      : 0

    setStreak(streakData.streak)
    setWeekData(buildWeekData(tasks))
    setCompletionRate(rate)
    setTasksCompleted(thisWeekCompleted.length)
    setCompletedTasks(
      thisWeekCompleted
        .filter(t => t.completedAt)
        .map(t => ({ title: t.title, completedAt: t.completedAt! }))
    )
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="p-6 max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-white/80">Stats</h1>
      <StreakCard streak={streak} completionRate={completionRate} />
      <WeekChart data={weekData} />
      <WeekSummary
        tasksCompleted={tasksCompleted}
        completionRate={completionRate}
        completedTasks={completedTasks}
      />
    </div>
  )
}
