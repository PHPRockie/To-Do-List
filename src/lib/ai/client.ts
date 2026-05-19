import { requireUserKey } from '@/lib/config'
import { getSetting } from '@/lib/db/settings'
import type { ParseResult } from '@/types/ai'

export async function hasApiKey(): Promise<boolean> {
  if (!requireUserKey) return true
  const key = await getSetting('claudeApiKey')
  return Boolean(key)
}

// Returns undefined in web mode — JSON.stringify omits undefined fields, so no apiKey reaches the server
async function getApiKey(): Promise<string | undefined> {
  if (!requireUserKey) return undefined
  const key = await getSetting('claudeApiKey')
  return key || undefined
}

export async function callParseAI(input: string): Promise<ParseResult> {
  const apiKey = await getApiKey()
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'parse', input, apiKey }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'AI call failed')
  }
  const data = await res.json()
  return data.result as ParseResult
}

export async function callBreakdownAI(taskTitle: string): Promise<string[]> {
  const apiKey = await getApiKey()
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'breakdown', input: taskTitle, apiKey }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'AI call failed')
  }
  const data = await res.json()
  return data.result as string[]
}

export async function callScheduleAI(tasks: Array<{ id: string; title: string; dueDate?: string; priority: string }>): Promise<import('@/types/stats').ScheduleItem[]> {
  const apiKey = await getApiKey()
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'schedule', input: JSON.stringify({ tasks, currentTime }), apiKey }),
  })
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'AI call failed') }
  return (await res.json()).result
}

export async function callPrioritizeAI(tasks: Array<{ id: string; title: string; dueDate?: string; priority: string }>): Promise<{ insight: string }> {
  const apiKey = await getApiKey()
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'prioritize', input: JSON.stringify({ tasks, currentTime }), apiKey }),
  })
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'AI call failed') }
  return (await res.json()).result
}

export async function callWeeklySummaryAI(input: import('@/types/stats').WeeklySummaryInput): Promise<{ summary: string }> {
  const apiKey = await getApiKey()
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'weekly_summary', input: JSON.stringify(input), apiKey }),
  })
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'AI call failed') }
  return (await res.json()).result
}

export async function callBriefingAI(
  todayTasks: string[],
  recentDone: string[],
  profile: { displayName?: string; city?: string; state?: string } = {}
): Promise<string> {
  const apiKey = await getApiKey()
  const input = JSON.stringify({ todayTasks, recentDone, profile })
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'briefing', input, apiKey }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'AI call failed')
  }
  const data = await res.json()
  return data.result as string
}
