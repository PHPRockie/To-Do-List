import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ApiKeyBanner from '@/components/board/ApiKeyBanner'

vi.mock('@/lib/ai/client', () => ({
  hasApiKey: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

import { hasApiKey } from '@/lib/ai/client'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ApiKeyBanner', () => {
  it('shows the banner when no API key is set', async () => {
    vi.mocked(hasApiKey).mockResolvedValue(false)
    render(<ApiKeyBanner />)
    await waitFor(() =>
      expect(screen.getByText(/AI features need a Claude API key/)).toBeInTheDocument()
    )
  })

  it('does not show when API key is set', async () => {
    vi.mocked(hasApiKey).mockResolvedValue(true)
    render(<ApiKeyBanner />)
    await waitFor(() => expect(hasApiKey).toHaveBeenCalled())
    expect(screen.queryByText(/AI features need a Claude API key/)).not.toBeInTheDocument()
  })

  it('hides the banner when dismissed', async () => {
    vi.mocked(hasApiKey).mockResolvedValue(false)
    render(<ApiKeyBanner />)
    await waitFor(() => screen.getByText(/AI features need a Claude API key/))
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(screen.queryByText(/AI features need a Claude API key/)).not.toBeInTheDocument()
  })

  it('settings link points to /settings', async () => {
    vi.mocked(hasApiKey).mockResolvedValue(false)
    render(<ApiKeyBanner />)
    await waitFor(() => screen.getByRole('link', { name: /go to settings/i }))
    expect(screen.getByRole('link', { name: /go to settings/i })).toHaveAttribute('href', '/settings')
  })
})
