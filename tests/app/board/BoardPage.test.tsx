import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BoardPage from '@/app/board/page'
import { getAllTasks } from '@/lib/db/tasks'
import type { Task } from '@/types/task'

vi.mock('@/lib/db/tasks', () => ({ getAllTasks: vi.fn() }))
vi.mock('@/components/board/KanbanBoard', () => ({
  default: ({ tasks }: { tasks: Task[] }) => (
    <div data-testid="kanban-board">
      {tasks.map(t => (
        <div key={t.id} data-testid="task-title">{t.title}</div>
      ))}
    </div>
  ),
}))
vi.mock('@/components/board/QuickAddBar', () => ({
  default: () => <div data-testid="quick-add-bar" />,
}))
vi.mock('@/components/board/ApiKeyBanner', () => ({
  default: () => null,
}))

const makeMockTask = (id: string, title: string): Task => ({
  id,
  title,
  status: 'todo',
  priority: 'medium',
  tags: [],
  subtasks: [],
  createdAt: '2026-05-06T00:00:00Z',
  updatedAt: '2026-05-06T00:00:00Z',
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getAllTasks).mockResolvedValue([
    makeMockTask('1', 'Buy groceries'),
    makeMockTask('2', 'Call dentist'),
    makeMockTask('3', 'Buy flowers'),
  ])
})

describe('BoardPage search', () => {
  it('shows all tasks when search is empty', async () => {
    render(<BoardPage />)
    await waitFor(() => expect(screen.getAllByTestId('task-title')).toHaveLength(3))
  })

  it('filters tasks by title substring (case-insensitive)', async () => {
    render(<BoardPage />)
    await waitFor(() => screen.getAllByTestId('task-title'))
    fireEvent.change(screen.getByPlaceholderText('Search tasks...'), {
      target: { value: 'buy' },
    })
    expect(screen.getAllByTestId('task-title')).toHaveLength(2)
    expect(screen.getByText('Buy groceries')).toBeInTheDocument()
    expect(screen.getByText('Buy flowers')).toBeInTheDocument()
    expect(screen.queryByText('Call dentist')).not.toBeInTheDocument()
  })

  it('shows result count when a query is active', async () => {
    render(<BoardPage />)
    await waitFor(() => screen.getAllByTestId('task-title'))
    fireEvent.change(screen.getByPlaceholderText('Search tasks...'), {
      target: { value: 'buy' },
    })
    expect(screen.getByText('2 of 3 tasks')).toBeInTheDocument()
  })

  it('clear button resets search and shows all tasks', async () => {
    render(<BoardPage />)
    await waitFor(() => screen.getAllByTestId('task-title'))
    fireEvent.change(screen.getByPlaceholderText('Search tasks...'), {
      target: { value: 'buy' },
    })
    fireEvent.click(screen.getByRole('button', { name: /clear search/i }))
    expect(screen.getAllByTestId('task-title')).toHaveLength(3)
  })
})
