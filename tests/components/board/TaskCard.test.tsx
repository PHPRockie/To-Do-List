import { render, screen, fireEvent } from '@testing-library/react'
import TaskCard from '@/components/board/TaskCard'
import type { Task } from '@/types/task'

vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}))

const task: Task = {
  id: 'task-1',
  title: 'Build kanban board',
  status: 'todo',
  priority: 'high',
  tags: ['dev', 'ui'],
  subtasks: [
    { id: 's1', title: 'Design columns', done: true },
    { id: 's2', title: 'Add drag and drop', done: false },
  ],
  dueDate: '2026-05-10',
  createdAt: '2026-05-04T00:00:00.000Z',
  updatedAt: '2026-05-04T00:00:00.000Z',
}

describe('TaskCard', () => {
  it('renders the task title', () => {
    render(<TaskCard task={task} onClick={vi.fn()} />)
    expect(screen.getByText('Build kanban board')).toBeInTheDocument()
  })

  it('renders priority badge', () => {
    render(<TaskCard task={task} onClick={vi.fn()} />)
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('renders tags', () => {
    render(<TaskCard task={task} onClick={vi.fn()} />)
    expect(screen.getByText('dev')).toBeInTheDocument()
    expect(screen.getByText('ui')).toBeInTheDocument()
  })

  it('renders due date', () => {
    render(<TaskCard task={task} onClick={vi.fn()} />)
    expect(screen.getByText('May 10')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<TaskCard task={task} onClick={onClick} />)
    fireEvent.click(screen.getByText('Build kanban board'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders subtask progress when subtasks exist', () => {
    render(<TaskCard task={task} onClick={vi.fn()} />)
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })
})
