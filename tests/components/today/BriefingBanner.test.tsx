import { render, screen, fireEvent } from '@testing-library/react'
import BriefingBanner from '@/components/today/BriefingBanner'

describe('BriefingBanner', () => {
  it('renders the briefing text', () => {
    render(<BriefingBanner text="You have 2 tasks due today." />)
    expect(screen.getByText('You have 2 tasks due today.')).toBeInTheDocument()
  })

  it('hides the banner after clicking the dismiss button', () => {
    render(<BriefingBanner text="You have 2 tasks due today." />)
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(screen.queryByText('You have 2 tasks due today.')).not.toBeInTheDocument()
  })

  it('renders nothing when text is an empty string', () => {
    const { container } = render(<BriefingBanner text="" />)
    expect(container.firstChild).toBeNull()
  })
})
