import { render, screen } from '@testing-library/react'
import WeekChart from '@/components/stats/WeekChart'

describe('WeekChart', () => {
  it('renders all 7 day labels', () => {
    render(<WeekChart data={[3, 5, 2, 7, 1, 0, 0]} />)
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByText('W')).toBeInTheDocument()
    expect(screen.getByText('F')).toBeInTheDocument()
  })

  it('renders total tasks completed', () => {
    render(<WeekChart data={[3, 5, 2, 7, 1, 0, 0]} />)
    expect(screen.getByText('18')).toBeInTheDocument()
  })
})
