import { render, screen } from '@testing-library/react'
import KanbanColumn from '@/components/board/KanbanColumn'
import type { Task } from '@/types/task'

// KanbanColumn renders TaskCards — mock both hooks to avoid DndContext requirement
vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}))

const makeMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Test task',
  status: 'todo',
  priority: 'medium',
  tags: [],
  subtasks: [],
  createdAt: '2026-05-04T00:00:00.000Z',
  updatedAt: '2026-05-04T00:00:00.000Z',
  ...overrides,
})

describe('KanbanColumn', () => {
  it('renders the column title', () => {
    render(
      <KanbanColumn
        id="col-todo"
        title="To Do"
        status="todo"
        tasks={[]}
        onTaskClick={vi.fn()}
      />
    )
    expect(screen.getByText('To Do')).toBeInTheDocument()
  })

  it('renders task count', () => {
    render(
      <KanbanColumn
        id="col-todo"
        title="To Do"
        status="todo"
        tasks={[makeMockTask(), makeMockTask({ id: 'task-2' })]}
        onTaskClick={vi.fn()}
      />
    )
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders task titles', () => {
    render(
      <KanbanColumn
        id="col-todo"
        title="To Do"
        status="todo"
        tasks={[makeMockTask({ title: 'Write unit tests' })]}
        onTaskClick={vi.fn()}
      />
    )
    expect(screen.getByText('Write unit tests')).toBeInTheDocument()
  })
})
