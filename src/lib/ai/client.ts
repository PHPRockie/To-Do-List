import { getSetting } from '@/lib/db/settings'
import type { ParseResult } from '@/types/ai'

export async function hasApiKey(): Promise<boolean> {
  const key = await getSetting('claudeApiKey')
  return Boolean(key)
}

export async function callParseAI(input: string): Promise<ParseResult> {
  const apiKey = await getSetting('claudeApiKey')
  if (!apiKey) throw new Error('NO_API_KEY')

  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'parse', apiKey, input }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'AI call failed')
  }

  const data = await res.json()
  return data.result as ParseResult
}

export async function callBreakdownAI(taskTitle: string): Promise<string[]> {
  const apiKey = await getSetting('claudeApiKey')
  if (!apiKey) throw new Error('NO_API_KEY')

  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'breakdown', apiKey, input: taskTitle }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'AI call failed')
  }

  const data = await res.json()
  return data.result as string[]
}

export async function callScheduleAI(tasks: Array<{ id: string; title: string; dueDate?: string; priority: string }>): Promise<import('@/types/stats').ScheduleItem[]> {
  const apiKey = await getSetting('claudeApiKey')
  if (!apiKey) throw new Error('NO_API_KEY')
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'schedule', apiKey, input: JSON.stringify({ tasks, currentTime }) }),
  })
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'AI call failed') }
  return (await res.json()).result
}

export async function callPrioritizeAI(tasks: Array<{ id: string; title: string; dueDate?: string; priority: string }>): Promise<{ insight: string }> {
  const apiKey = await getSetting('claudeApiKey')
  if (!apiKey) throw new Error('NO_API_KEY')
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'prioritize', apiKey, input: JSON.stringify({ tasks, currentTime }) }),
  })
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'AI call failed') }
  return (await res.json()).result
}

export async function callWeeklySummaryAI(input: import('@/types/stats').WeeklySummaryInput): Promise<{ summary: string }> {
  const apiKey = await getSetting('claudeApiKey')
  if (!apiKey) throw new Error('NO_API_KEY')
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'weekly_summary', apiKey, input: JSON.stringify(input) }),
  })
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'AI call failed') }
  return (await res.json()).result
}

export async function callBriefingAI(
  todayTasks: string[],
  recentDone: string[]
): Promise<string> {
  const apiKey = await getSetting('claudeApiKey')
  if (!apiKey) throw new Error('NO_API_KEY')

  const input = JSON.stringify({ todayTasks, recentDone })
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'briefing', apiKey, input }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'AI call failed')
  }

  const data = await res.json()
  return data.result as string
}
