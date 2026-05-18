import { render, screen } from '@testing-library/react'
import InsightPanel from '@/components/ai/InsightPanel'

describe('InsightPanel', () => {
  it('renders the insight text', () => {
    render(<InsightPanel insight="Tackle the login bug first." loading={false} error={null} />)
    expect(screen.getByText('Tackle the login bug first.')).toBeInTheDocument()
  })

  it('renders loading state', () => {
    render(<InsightPanel insight={null} loading={true} error={null} />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders placeholder when insight is undefined', () => {
    render(<InsightPanel insight={undefined} loading={false} error={null} />)
    expect(screen.getByText(/AI insights will appear here/i)).toBeInTheDocument()
  })
})
