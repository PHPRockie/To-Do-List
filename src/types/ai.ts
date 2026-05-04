export type AIAction = 'parse' | 'breakdown'

export interface ParseResult {
  title: string
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
  tags?: string[]
  reminderOffset?: number
}

export interface AIRequest {
  action: AIAction
  apiKey: string
  input: string
}

export interface AIResponse {
  action: AIAction
  result: ParseResult | string[]
}
