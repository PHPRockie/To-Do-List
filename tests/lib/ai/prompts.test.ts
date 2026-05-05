import { buildParseSystemPrompt, buildBreakdownSystemPrompt } from '@/lib/ai/prompts'

describe('buildParseSystemPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = buildParseSystemPrompt()
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(50)
  })

  it('includes today date for context', () => {
    const today = new Date().toISOString().split('T')[0]
    const prompt = buildParseSystemPrompt()
    expect(prompt).toContain(today)
  })

  it('specifies JSON-only output', () => {
    const prompt = buildParseSystemPrompt()
    expect(prompt.toLowerCase()).toContain('json')
  })
})

describe('buildBreakdownSystemPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = buildBreakdownSystemPrompt()
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(50)
  })

  it('mentions the expected output format', () => {
    const prompt = buildBreakdownSystemPrompt()
    expect(prompt.toLowerCase()).toContain('json')
    expect(prompt.toLowerCase()).toContain('array')
  })
})
