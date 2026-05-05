export interface FocusSession {
  id: string
  startedAt: string
  durationMinutes: number
  completedAt?: string
}

export interface WeeklySummary {
  weekKey: string
  generatedAt: string
  summary: string
  tasksCompleted: number
  completionRate: number
}

export interface ScheduleItem {
  taskId: string
  taskTitle: string
  suggestedTime: string
  reason: string
}

export interface WeeklySummaryInput {
  completedTasks: Array<{ title: string; completedAt: string }>
  tasksCompleted: number
  completionRate: number
  weekKey: string
}
