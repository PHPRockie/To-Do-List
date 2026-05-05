import { render, screen, fireEvent, act } from '@testing-library/react'
import FocusTimer from '@/components/focus/FocusTimer'

vi.mock('@/lib/db/sessions', () => ({
  createSession: vi.fn().mockResolvedValue(undefined),
  getTodaysCompletedSessions: vi.fn().mockResolvedValue([]),
}))

describe('FocusTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders 25:00 as default', () => {
    render(<FocusTimer />)
    expect(screen.getByText('25:00')).toBeInTheDocument()
  })

  it('shows Start button initially', () => {
    render(<FocusTimer />)
    expect(screen.getByText('Start')).toBeInTheDocument()
  })

  it('changes to 15:00 when 15m is selected', () => {
    render(<FocusTimer />)
    fireEvent.click(screen.getByText('15m'))
    expect(screen.getByText('15:00')).toBeInTheDocument()
  })

  it('shows Pause after Start is clicked', () => {
    render(<FocusTimer />)
    fireEvent.click(screen.getByText('Start'))
    expect(screen.getByText('Pause')).toBeInTheDocument()
  })

  it('counts down after starting', () => {
    render(<FocusTimer />)
    fireEvent.click(screen.getByText('Start'))
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.getByText('24:59')).toBeInTheDocument()
  })

  it('resets to full duration on Reset', () => {
    render(<FocusTimer />)
    fireEvent.click(screen.getByText('Start'))
    act(() => { vi.advanceTimersByTime(5000) })
    fireEvent.click(screen.getByText('Reset'))
    expect(screen.getByText('25:00')).toBeInTheDocument()
    expect(screen.getByText('Start')).toBeInTheDocument()
  })
})
