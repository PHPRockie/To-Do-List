import { render, screen, fireEvent } from '@testing-library/react'
import AuthModal from '@/components/auth/AuthModal'

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
    user: null,
    loading: false,
    syncStatus: 'idle' as const,
    lastSyncedAt: null,
    conflictCount: 0,
    signOut: vi.fn(),
    syncNow: vi.fn(),
  }),
}))

describe('AuthModal', () => {
  it('shows Sign In heading by default', () => {
    render(<AuthModal onClose={vi.fn()} />)
    expect(screen.getByText('Sign in to FlowTask')).toBeInTheDocument()
  })

  it('switches to Sign Up tab on click', () => {
    render(<AuthModal onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Sign Up'))
    const submitBtn = screen.getByRole('button', { name: /sign up/i })
    expect(submitBtn).toBeInTheDocument()
  })

  it('shows error for invalid email format', async () => {
    render(<AuthModal onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'notanemail' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } })
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!)
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument()
  })

  it('shows error for password shorter than 8 chars', async () => {
    render(<AuthModal onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'short' } })
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!)
    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument()
  })
})
