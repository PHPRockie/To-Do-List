import { render, screen } from '@testing-library/react'
import StreakCard from '@/components/stats/StreakCard'

describe('StreakCard', () => {
  it('renders the streak count', () => {
    render(<StreakCard streak={12} completionRate={87} />)
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('renders the completion rate', () => {
    render(<StreakCard streak={12} completionRate={87} />)
    expect(screen.getByText('87%')).toBeInTheDocument()
  })

  it('renders streak label', () => {
    render(<StreakCard streak={1} completionRate={50} />)
    expect(screen.getByText(/streak/i)).toBeInTheDocument()
  })
})
