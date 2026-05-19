import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

import {
  buildParseSystemPrompt,
  buildBreakdownSystemPrompt,
  buildScheduleSystemPrompt,
  buildPrioritizeSystemPrompt,
  buildWeeklySummarySystemPrompt,
  buildBriefingSystemPrompt,
} from '@/lib/ai/prompts'
import type { AIRequest } from '@/types/ai'

export async function POST(req: NextRequest) {
  let body: AIRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { action, input, apiKey: bodyApiKey } = body

  if (!input || typeof input !== 'string') {
    return NextResponse.json({ error: 'Input required' }, { status: 400 })
  }

  const apiKey = bodyApiKey ?? process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Server API key not configured' }, { status: 500 })
  }

  const client = new Anthropic({ apiKey })

  try {
    if (action === 'parse') {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: buildParseSystemPrompt(),
        messages: [{ role: 'user', content: input }],
      })
      const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
      const result = JSON.parse(text)
      return NextResponse.json({ action, result })
    }

    if (action === 'breakdown') {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: buildBreakdownSystemPrompt(),
        messages: [{ role: 'user', content: input }],
      })
      const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
      const result = JSON.parse(text)
      return NextResponse.json({ action, result })
    }

    if (action === 'schedule') {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: buildScheduleSystemPrompt(),
        messages: [{ role: 'user', content: input }],
      })
      const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
      const result = JSON.parse(text)
      return NextResponse.json({ action, result })
    }

    if (action === 'prioritize') {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: buildPrioritizeSystemPrompt(),
        messages: [{ role: 'user', content: input }],
      })
      const text = message.content[0].type === 'text' ? message.content[0].text : '{"insight":""}'
      const result = JSON.parse(text)
      return NextResponse.json({ action, result })
    }

    if (action === 'weekly_summary') {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: buildWeeklySummarySystemPrompt(),
        messages: [{ role: 'user', content: input }],
      })
      const text = message.content[0].type === 'text' ? message.content[0].text : '{"summary":""}'
      const result = JSON.parse(text)
      return NextResponse.json({ action, result })
    }

    if (action === 'briefing') {
      const parsed = JSON.parse(input) as {
        todayTasks: string[]
        recentDone: string[]
        profile?: { displayName?: string; city?: string; state?: string }
      }
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: buildBriefingSystemPrompt(parsed.profile ?? {}),
        messages: [{ role: 'user', content: JSON.stringify({ todayTasks: parsed.todayTasks, recentDone: parsed.recentDone }) }],
      })
      const result = message.content[0].type === 'text' ? message.content[0].text : ''
      return NextResponse.json({ action, result })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 502 })
    }
    const message = err instanceof Error ? err.message : 'AI call failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
