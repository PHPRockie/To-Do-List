import {
  buildParseSystemPrompt,
  buildBreakdownSystemPrompt,
  buildScheduleSystemPrompt,
  buildPrioritizeSystemPrompt,
  buildWeeklySummarySystemPrompt,
} from '@/lib/ai/prompts'

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

describe('buildScheduleSystemPrompt', () => {
  it('returns a non-empty string', () => {
    const p = buildScheduleSystemPrompt()
    expect(p.length).toBeGreaterThan(50)
  })
  it('instructs JSON array output', () => {
    expect(buildScheduleSystemPrompt().toLowerCase()).toContain('json')
    expect(buildScheduleSystemPrompt().toLowerCase()).toContain('array')
  })
  it('mentions time slots', () => {
    expect(buildScheduleSystemPrompt().toLowerCase()).toContain('time')
  })
})

describe('buildPrioritizeSystemPrompt', () => {
  it('returns a non-empty string', () => {
    expect(buildPrioritizeSystemPrompt().length).toBeGreaterThan(50)
  })
  it('instructs JSON object with insight field', () => {
    expect(buildPrioritizeSystemPrompt().toLowerCase()).toContain('insight')
  })
})

describe('buildWeeklySummarySystemPrompt', () => {
  it('returns a non-empty string', () => {
    expect(buildWeeklySummarySystemPrompt().length).toBeGreaterThan(50)
  })
  it('instructs JSON object with summary field', () => {
    expect(buildWeeklySummarySystemPrompt().toLowerCase()).toContain('summary')
  })
})
