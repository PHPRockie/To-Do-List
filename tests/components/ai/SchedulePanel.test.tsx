import { render, screen } from '@testing-library/react'
import SchedulePanel from '@/components/ai/SchedulePanel'
import type { ScheduleItem } from '@/types/stats'

const items: ScheduleItem[] = [
  { taskId: '1', taskTitle: 'Fix login bug', suggestedTime: '9:00am', reason: 'Due today, high priority' },
  { taskId: '2', taskTitle: 'Write blog post', suggestedTime: '2:00pm', reason: 'Due tomorrow' },
]

describe('SchedulePanel', () => {
  it('renders loading state', () => {
    render(<SchedulePanel items={null} loading={true} error={null} onRegenerate={() => {}} />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders schedule items when loaded', () => {
    render(<SchedulePanel items={items} loading={false} error={null} onRegenerate={() => {}} />)
    expect(screen.getByText('Fix login bug')).toBeInTheDocument()
    expect(screen.getByText('9:00am')).toBeInTheDocument()
    expect(screen.getByText('Write blog post')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(<SchedulePanel items={null} loading={false} error="AI call failed" onRegenerate={() => {}} />)
    expect(screen.getByText('AI call failed')).toBeInTheDocument()
  })

  it('renders placeholder when items is undefined', () => {
    render(<SchedulePanel items={undefined} loading={false} error={null} onRegenerate={() => {}} />)
    expect(screen.getByText(/AI schedule will appear here/i)).toBeInTheDocument()
  })
})
