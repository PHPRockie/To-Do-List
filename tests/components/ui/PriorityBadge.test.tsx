import { render, screen } from '@testing-library/react'
import PriorityBadge from '@/components/ui/PriorityBadge'

describe('PriorityBadge', () => {
  it('renders "High" label for high priority', () => {
    render(<PriorityBadge priority="high" />)
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('renders "Medium" label for medium priority', () => {
    render(<PriorityBadge priority="medium" />)
    expect(screen.getByText('Medium')).toBeInTheDocument()
  })

  it('renders "Low" label for low priority', () => {
    render(<PriorityBadge priority="low" />)
    expect(screen.getByText('Low')).toBeInTheDocument()
  })
})
