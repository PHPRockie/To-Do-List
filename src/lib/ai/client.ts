import type { ParseResult } from '@/types/ai'

export async function hasApiKey(): Promise<boolean> {
  return true
}

export async function callParseAI(input: string): Promise<ParseResult> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'parse', input }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'AI call failed')
  }
  const data = await res.json()
  return data.result as ParseResult
}

export async function callBreakdownAI(taskTitle: string): Promise<string[]> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'breakdown', input: taskTitle }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'AI call failed')
  }
  const data = await res.json()
  return data.result as string[]
}

export async function callScheduleAI(tasks: Array<{ id: string; title: string; dueDate?: string; priority: string }>): Promise<import('@/types/stats').ScheduleItem[]> {
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'schedule', input: JSON.stringify({ tasks, currentTime }) }),
  })
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'AI call failed') }
  return (await res.json()).result
}

export async function callPrioritizeAI(tasks: Array<{ id: string; title: string; dueDate?: string; priority: string }>): Promise<{ insight: string }> {
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'prioritize', input: JSON.stringify({ tasks, currentTime }) }),
  })
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'AI call failed') }
  return (await res.json()).result
}

export async function callWeeklySummaryAI(input: import('@/types/stats').WeeklySummaryInput): Promise<{ summary: string }> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'weekly_summary', input: JSON.stringify(input) }),
  })
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'AI call failed') }
  return (await res.json()).result
}

export async function callBriefingAI(
  todayTasks: string[],
  recentDone: string[],
  profile: { displayName?: string; city?: string; state?: string } = {}
): Promise<string> {
  const input = JSON.stringify({ todayTasks, recentDone, profile })
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'briefing', input }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'AI call failed')
  }
  const data = await res.json()
  return data.result as string
}
