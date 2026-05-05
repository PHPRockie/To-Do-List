import { render, screen } from '@testing-library/react'
import WeekSummary from '@/components/stats/WeekSummary'

vi.mock('@/lib/ai/client', () => ({
  callWeeklySummaryAI: vi.fn().mockResolvedValue({ summary: 'You crushed 10 tasks this week!' }),
  hasApiKey: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/db/weekly-summary', () => ({
  getWeeklySummary: vi.fn().mockResolvedValue(null),
  saveWeeklySummary: vi.fn().mockResolvedValue(undefined),
}))

describe('WeekSummary', () => {
  it('shows loading initially', () => {
    render(<WeekSummary tasksCompleted={10} completionRate={80} completedTasks={[]} />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows AI summary after generation', async () => {
    render(<WeekSummary tasksCompleted={10} completionRate={80} completedTasks={[]} />)
    expect(await screen.findByText('You crushed 10 tasks this week!')).toBeInTheDocument()
  })
})
