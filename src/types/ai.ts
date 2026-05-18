export type AIAction = 'parse' | 'breakdown' | 'schedule' | 'prioritize' | 'weekly_summary' | 'briefing'

export interface ParseResult {
  title: string
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
  tags?: string[]
  reminderOffset?: number
}

export interface AIRequest {
  action: AIAction
  input: string
}

export interface AIResponse {
  action: AIAction
  result: ParseResult | string[] | string
}
