import { render } from '@testing-library/react'
import SyncStatus from '@/components/auth/SyncStatus'
import { useAuth } from '@/context/AuthContext'

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

describe('SyncStatus', () => {
  it('renders a grey dot when not signed in', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null, syncStatus: 'idle', loading: false, lastSyncedAt: null,
      conflictCount: 0, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), syncNow: vi.fn(),
    })
    const { container } = render(<SyncStatus />)
    expect(container.firstChild).toBeTruthy()
    expect((container.firstChild as HTMLElement)?.className).toContain('white')
  })

  it('renders a green dot when synced', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'test@test.com' }, syncStatus: 'synced', loading: false,
      lastSyncedAt: null, conflictCount: 0, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), syncNow: vi.fn(),
    })
    const { container } = render(<SyncStatus />)
    expect((container.firstChild as HTMLElement)?.className).toContain('green')
  })

  it('renders a red dot on error', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'test@test.com' }, syncStatus: 'error', loading: false,
      lastSyncedAt: null, conflictCount: 0, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), syncNow: vi.fn(),
    })
    const { container } = render(<SyncStatus />)
    expect((container.firstChild as HTMLElement)?.className).toContain('red')
  })
})
