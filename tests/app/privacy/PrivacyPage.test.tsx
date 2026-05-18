import { render, screen } from '@testing-library/react'
import PrivacyPage from '@/app/privacy/page'

describe('PrivacyPage', () => {
  it('renders the Privacy Policy heading', () => {
    render(<PrivacyPage />)
    expect(screen.getByRole('heading', { name: /privacy policy/i })).toBeInTheDocument()
  })

  it('mentions local IndexedDB storage', () => {
    render(<PrivacyPage />)
    expect(screen.getByText(/IndexedDB/)).toBeInTheDocument()
  })

  it('mentions AI is powered by Anthropic', () => {
    render(<PrivacyPage />)
    expect(screen.getByText(/Anthropic/)).toBeInTheDocument()
  })

  it('states no analytics or tracking', () => {
    render(<PrivacyPage />)
    expect(screen.getByText(/does not collect analytics/)).toBeInTheDocument()
  })

  it('shows a contact email link', () => {
    render(<PrivacyPage />)
    expect(screen.getByRole('link', { name: /pppp112089@gmail\.com/ })).toBeInTheDocument()
  })
})
