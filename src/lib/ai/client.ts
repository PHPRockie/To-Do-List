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
