# FlowTask Phase 1 — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working kanban PWA todo app with AI-powered natural language input and task breakdown, local-first IndexedDB storage, and a dark glassmorphism UI.

**Architecture:** Next.js 15 App Router serves both the React frontend and the `/api/ai` server route. All task data lives in IndexedDB via the `idb` library — no network needed for core features. AI features call Anthropic's Claude API server-side using the user's own API key, which is stored in IndexedDB and sent with each request. The user must supply their own key; without it the app degrades gracefully to plain text input.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v3, Framer Motion, `@dnd-kit/core`, `idb`, `@ducanh2912/next-pwa`, `@anthropic-ai/sdk`, Vitest, React Testing Library, `fake-indexeddb`

---

## File Map

```
flowtask/
├── src/
│   ├── app/
│   │   ├── globals.css               # CSS vars + glassmorphism base classes
│   │   ├── layout.tsx                # Root layout wrapping AppShell
│   │   ├── page.tsx                  # Redirects to /board
│   │   ├── board/page.tsx            # Kanban board view (client)
│   │   ├── today/page.tsx            # Today's tasks (client)
│   │   ├── focus/page.tsx            # Stub — Phase 2
│   │   ├── ai/page.tsx               # Stub — Phase 2
│   │   ├── stats/page.tsx            # Stub — Phase 2
│   │   └── api/ai/route.ts           # AI API endpoint (server)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx          # Sidebar + main content wrapper
│   │   │   └── Sidebar.tsx           # Icon nav strip (client)
│   │   ├── board/
│   │   │   ├── KanbanBoard.tsx       # DndContext + 3 columns (client)
│   │   │   ├── KanbanColumn.tsx      # useDroppable column (client)
│   │   │   ├── TaskCard.tsx          # useDraggable card (client)
│   │   │   └── QuickAddBar.tsx       # Natural language input (client)
│   │   ├── task/
│   │   │   ├── TaskDetail.tsx        # Slide-over edit panel (client)
│   │   │   └── SubtaskList.tsx       # Subtask checklist (client)
│   │   └── ui/
│   │       ├── GlassCard.tsx         # Reusable glass container
│   │       ├── PriorityBadge.tsx     # low/medium/high badge
│   │       └── TagChip.tsx           # Tag pill
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts              # openDB, getDB, resetDB
│   │   │   ├── tasks.ts              # Task CRUD
│   │   │   └── settings.ts           # Settings get/set
│   │   ├── ai/
│   │   │   ├── client.ts             # callAI() — client-side fetch wrapper
│   │   │   └── prompts.ts            # System prompt builders
│   │   └── utils/
│   │       └── task.ts               # makeTask() factory
│   └── types/
│       ├── task.ts                   # Task, Subtask, TaskStatus, TaskPriority
│       ├── settings.ts               # Settings interface
│       └── ai.ts                     # AIAction, ParseResult, AIRequest
├── tests/
│   ├── setup.ts                      # jest-dom + fake-indexeddb reset
│   ├── lib/
│   │   ├── db/tasks.test.ts
│   │   ├── db/settings.test.ts
│   │   └── ai/prompts.test.ts
│   └── components/
│       ├── ui/PriorityBadge.test.tsx
│       ├── board/TaskCard.test.tsx
│       └── board/KanbanColumn.test.tsx
├── public/
│   ├── manifest.json
│   └── icons/                        # icon-192.png, icon-512.png
├── next.config.ts
├── tailwind.config.ts
└── vitest.config.ts
```

---

## Task 1: Project Bootstrap

**Files:**
- Create: `flowtask/` (project root via create-next-app)
- Create: `package.json` (modified by installs)

- [ ] **Step 1: Scaffold Next.js 15 project**

Run inside `/Users/josecarlosgarciasaenz/Projects/To Do List/`:

```bash
npx create-next-app@latest flowtask \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git
cd flowtask
```

Expected: project created, `src/app/` directory present.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install \
  idb \
  @anthropic-ai/sdk \
  framer-motion \
  @dnd-kit/core \
  @dnd-kit/utilities \
  @ducanh2912/next-pwa
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D \
  vitest \
  @vitejs/plugin-react \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  fake-indexeddb \
  jsdom
```

- [ ] **Step 4: Add test script to package.json**

Open `package.json` and add to the `"scripts"` section:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 5: Remove boilerplate**

Delete the contents of `src/app/page.tsx` and `src/app/globals.css` (keep the files, clear their content — they'll be rewritten in later tasks).

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js 15 project with dependencies"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/types/task.ts`
- Create: `src/types/settings.ts`
- Create: `src/types/ai.ts`

- [ ] **Step 1: Write task types**

Create `src/types/task.ts`:
```typescript
export type TaskStatus = 'todo' | 'inprogress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  tags: string[]
  subtasks: Subtask[]
  estimatedMinutes?: number
  reminderOffset?: number
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 2: Write settings types**

Create `src/types/settings.ts`:
```typescript
export interface Settings {
  claudeApiKey?: string
  theme: 'dark'
  focusDuration: number
  breakDuration: number
  streak: number
  lastActiveDate: string
}
```

- [ ] **Step 3: Write AI types**

Create `src/types/ai.ts`:
```typescript
export type AIAction = 'parse' | 'breakdown'

export interface ParseResult {
  title: string
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
  tags?: string[]
  reminderOffset?: number
}

export interface AIRequest {
  action: AIAction
  apiKey: string
  input: string
}

export interface AIResponse {
  action: AIAction
  result: ParseResult | string[]
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript types for Task, Settings, and AI"
```

---

## Task 3: Test Infrastructure

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

- [ ] **Step 1: Write vitest config**

Create `vitest.config.ts` at the project root:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 2: Write test setup file**

Create `tests/setup.ts`:
```typescript
import '@testing-library/jest-dom'
import { IDBFactory } from 'fake-indexeddb'

beforeEach(() => {
  global.indexedDB = new IDBFactory()
})
```

- [ ] **Step 3: Write a smoke test to verify the setup works**

Create `tests/smoke.test.ts`:
```typescript
describe('test infrastructure', () => {
  it('indexedDB is available', () => {
    expect(global.indexedDB).toBeDefined()
  })
})
```

- [ ] **Step 4: Run the smoke test**

```bash
npm run test:run
```

Expected: `1 passed`.

- [ ] **Step 5: Delete the smoke test**

```bash
rm tests/smoke.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts tests/setup.ts
git commit -m "chore: add Vitest + RTL + fake-indexeddb test infrastructure"
```

---

## Task 4: Database Init + Settings CRUD

**Files:**
- Create: `src/lib/db/index.ts`
- Create: `src/lib/db/settings.ts`
- Create: `tests/lib/db/settings.test.ts`

- [ ] **Step 1: Write failing tests for settings**

Create `tests/lib/db/settings.test.ts`:
```typescript
import { getSetting, setSetting } from '@/lib/db/settings'
import { resetDB } from '@/lib/db'

beforeEach(() => {
  resetDB()
})

describe('settings', () => {
  it('returns default focusDuration of 25', async () => {
    const val = await getSetting('focusDuration')
    expect(val).toBe(25)
  })

  it('returns default breakDuration of 5', async () => {
    const val = await getSetting('breakDuration')
    expect(val).toBe(5)
  })

  it('persists a setting and reads it back', async () => {
    await setSetting('claudeApiKey', 'sk-test-123')
    const val = await getSetting('claudeApiKey')
    expect(val).toBe('sk-test-123')
  })

  it('overwrites an existing setting', async () => {
    await setSetting('streak', 5)
    await setSetting('streak', 10)
    const val = await getSetting('streak')
    expect(val).toBe(10)
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:run tests/lib/db/settings.test.ts
```

Expected: FAIL — cannot find module `@/lib/db/settings`.

- [ ] **Step 3: Write the DB init module**

Create `src/lib/db/index.ts`:
```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Task } from '@/types/task'

interface FlowTaskDB extends DBSchema {
  tasks: {
    key: string
    value: Task
  }
  settings: {
    key: string
    value: { key: string; value: unknown }
  }
}

let dbInstance: IDBPDatabase<FlowTaskDB> | null = null

export async function getDB(): Promise<IDBPDatabase<FlowTaskDB>> {
  if (dbInstance) return dbInstance
  dbInstance = await openDB<FlowTaskDB>('flowtask-db', 1, {
    upgrade(db) {
      db.createObjectStore('tasks', { keyPath: 'id' })
      db.createObjectStore('settings', { keyPath: 'key' })
    },
  })
  return dbInstance
}

export function resetDB(): void {
  dbInstance = null
}
```

- [ ] **Step 4: Write the settings module**

Create `src/lib/db/settings.ts`:
```typescript
import { getDB } from './index'
import type { Settings } from '@/types/settings'

const DEFAULTS: Settings = {
  theme: 'dark',
  focusDuration: 25,
  breakDuration: 5,
  streak: 0,
  lastActiveDate: '',
}

export async function getSetting<K extends keyof Settings>(key: K): Promise<Settings[K]> {
  const db = await getDB()
  const record = await db.get('settings', key as string)
  return record !== undefined ? (record.value as Settings[K]) : DEFAULTS[key]
}

export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
  const db = await getDB()
  await db.put('settings', { key: key as string, value })
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm run test:run tests/lib/db/settings.test.ts
```

Expected: `4 passed`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/ tests/lib/db/settings.test.ts
git commit -m "feat: add IndexedDB init and settings CRUD"
```

---

## Task 5: Database Tasks CRUD

**Files:**
- Create: `src/lib/db/tasks.ts`
- Create: `tests/lib/db/tasks.test.ts`

- [ ] **Step 1: Write failing tests for task CRUD**

Create `tests/lib/db/tasks.test.ts`:
```typescript
import {
  getAllTasks, getTask, createTask, updateTask, deleteTask,
  getTasksByStatus, getTodaysTasks,
} from '@/lib/db/tasks'
import { resetDB } from '@/lib/db'
import type { Task } from '@/types/task'

beforeEach(() => {
  resetDB()
})

const sample: Task = {
  id: 'task-1',
  title: 'Write tests',
  status: 'todo',
  priority: 'high',
  tags: ['dev'],
  subtasks: [],
  createdAt: '2026-05-04T10:00:00.000Z',
  updatedAt: '2026-05-04T10:00:00.000Z',
}

describe('createTask / getTask', () => {
  it('stores and retrieves a task by id', async () => {
    await createTask(sample)
    const result = await getTask('task-1')
    expect(result).toEqual(sample)
  })

  it('returns undefined for unknown id', async () => {
    const result = await getTask('nope')
    expect(result).toBeUndefined()
  })
})

describe('getAllTasks', () => {
  it('returns empty array when no tasks', async () => {
    const tasks = await getAllTasks()
    expect(tasks).toEqual([])
  })

  it('returns all stored tasks', async () => {
    await createTask(sample)
    await createTask({ ...sample, id: 'task-2', title: 'Another task' })
    const tasks = await getAllTasks()
    expect(tasks).toHaveLength(2)
  })
})

describe('updateTask', () => {
  it('updates specified fields and bumps updatedAt', async () => {
    await createTask(sample)
    await updateTask('task-1', { status: 'done', priority: 'low' })
    const updated = await getTask('task-1')
    expect(updated?.status).toBe('done')
    expect(updated?.priority).toBe('low')
    expect(updated?.title).toBe('Write tests')
    expect(updated?.updatedAt).not.toBe(sample.updatedAt)
  })

  it('throws if task does not exist', async () => {
    await expect(updateTask('ghost', { status: 'done' })).rejects.toThrow()
  })
})

describe('deleteTask', () => {
  it('removes the task', async () => {
    await createTask(sample)
    await deleteTask('task-1')
    const result = await getTask('task-1')
    expect(result).toBeUndefined()
  })
})

describe('getTasksByStatus', () => {
  it('returns only tasks with matching status', async () => {
    await createTask(sample)
    await createTask({ ...sample, id: 'task-2', status: 'done' })
    const todoTasks = await getTasksByStatus('todo')
    expect(todoTasks).toHaveLength(1)
    expect(todoTasks[0].id).toBe('task-1')
  })
})

describe('getTodaysTasks', () => {
  it('returns tasks due today that are not done', async () => {
    const today = new Date().toISOString().split('T')[0]
    await createTask({ ...sample, id: 'due-today', dueDate: today })
    await createTask({ ...sample, id: 'done-today', dueDate: today, status: 'done' })
    await createTask({ ...sample, id: 'future', dueDate: '2099-01-01' })
    const result = await getTodaysTasks()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('due-today')
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:run tests/lib/db/tasks.test.ts
```

Expected: FAIL — cannot find module `@/lib/db/tasks`.

- [ ] **Step 3: Write the tasks CRUD module**

Create `src/lib/db/tasks.ts`:
```typescript
import { getDB } from './index'
import type { Task, TaskStatus } from '@/types/task'

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDB()
  return db.getAll('tasks')
}

export async function getTask(id: string): Promise<Task | undefined> {
  const db = await getDB()
  return db.get('tasks', id)
}

export async function createTask(task: Task): Promise<void> {
  const db = await getDB()
  await db.put('tasks', task)
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('tasks', id)
  if (!existing) throw new Error(`Task ${id} not found`)
  await db.put('tasks', { ...existing, ...updates, updatedAt: new Date().toISOString() })
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('tasks', id)
}

export async function getTasksByStatus(status: TaskStatus): Promise<Task[]> {
  const tasks = await getAllTasks()
  return tasks.filter(t => t.status === status)
}

export async function getTodaysTasks(): Promise<Task[]> {
  const today = new Date().toISOString().split('T')[0]
  const tasks = await getAllTasks()
  return tasks.filter(t => t.dueDate === today && t.status !== 'done')
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run tests/lib/db/tasks.test.ts
```

Expected: `10 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/tasks.ts tests/lib/db/tasks.test.ts
git commit -m "feat: add task CRUD operations with full test coverage"
```

---

## Task 6: Task Factory Utility

**Files:**
- Create: `src/lib/utils/task.ts`
- Create: `tests/lib/utils/task.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/utils/task.test.ts`:
```typescript
import { makeTask } from '@/lib/utils/task'

describe('makeTask', () => {
  it('creates a task with required defaults', () => {
    const task = makeTask({ title: 'Buy milk' })
    expect(task.title).toBe('Buy milk')
    expect(task.status).toBe('todo')
    expect(task.priority).toBe('medium')
    expect(task.tags).toEqual([])
    expect(task.subtasks).toEqual([])
    expect(task.id).toBeTruthy()
    expect(task.createdAt).toBeTruthy()
    expect(task.updatedAt).toBeTruthy()
  })

  it('applies overrides', () => {
    const task = makeTask({ title: 'Urgent task', priority: 'high', status: 'inprogress' })
    expect(task.priority).toBe('high')
    expect(task.status).toBe('inprogress')
  })

  it('generates unique ids', () => {
    const a = makeTask({ title: 'A' })
    const b = makeTask({ title: 'B' })
    expect(a.id).not.toBe(b.id)
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:run tests/lib/utils/task.test.ts
```

Expected: FAIL — cannot find module `@/lib/utils/task`.

- [ ] **Step 3: Write the factory**

Create `src/lib/utils/task.ts`:
```typescript
import type { Task } from '@/types/task'

export function makeTask(overrides: Partial<Task> & { title: string }): Task {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: overrides.title,
    description: overrides.description,
    status: overrides.status ?? 'todo',
    priority: overrides.priority ?? 'medium',
    dueDate: overrides.dueDate,
    tags: overrides.tags ?? [],
    subtasks: overrides.subtasks ?? [],
    estimatedMinutes: overrides.estimatedMinutes,
    reminderOffset: overrides.reminderOffset,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run tests/lib/utils/task.test.ts
```

Expected: `3 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/task.ts tests/lib/utils/task.test.ts
git commit -m "feat: add makeTask factory utility"
```

---

## Task 7: Global Styles

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Write global CSS**

Replace the contents of `src/app/globals.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-primary: #0f0f0f;
  --bg-secondary: #1a1a2e;
  --bg-tertiary: #16213e;
  --accent-purple: #7c3aed;
  --accent-pink: #ec4899;
  --accent-green: #34d399;
  --text-primary: #f0f0f0;
  --text-secondary: rgba(255, 255, 255, 0.6);
  --text-muted: rgba(255, 255, 255, 0.3);
}

* {
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-tertiary) 100%);
  background-attachment: fixed;
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-height: 100vh;
}

.glass {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.glass-hover:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
}

.gradient-text {
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.gradient-bg {
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink));
}

::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}
```

- [ ] **Step 2: Update tailwind.config.ts to extend with theme colors**

Replace the contents of `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'navy-primary': '#0f0f0f',
        'navy-secondary': '#1a1a2e',
        'navy-tertiary': '#16213e',
        'accent-purple': '#7c3aed',
        'accent-pink': '#ec4899',
        'accent-green': '#34d399',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 3: Verify app starts without errors**

```bash
npm run dev
```

Open `http://localhost:3000` — should show a dark background (the default page is empty). Stop the server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css tailwind.config.ts
git commit -m "feat: add dark glassmorphism global styles and theme config"
```

---

## Task 8: UI Primitives

**Files:**
- Create: `src/components/ui/GlassCard.tsx`
- Create: `src/components/ui/PriorityBadge.tsx`
- Create: `src/components/ui/TagChip.tsx`
- Create: `tests/components/ui/PriorityBadge.test.tsx`

- [ ] **Step 1: Write failing test for PriorityBadge**

Create `tests/components/ui/PriorityBadge.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import PriorityBadge from '@/components/ui/PriorityBadge'

describe('PriorityBadge', () => {
  it('renders "High" label for high priority', () => {
    render(<PriorityBadge priority="high" />)
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('renders "Medium" label for medium priority', () => {
    render(<PriorityBadge priority="medium" />)
    expect(screen.getByText('Medium')).toBeInTheDocument()
  })

  it('renders "Low" label for low priority', () => {
    render(<PriorityBadge priority="low" />)
    expect(screen.getByText('Low')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm run test:run tests/components/ui/PriorityBadge.test.tsx
```

Expected: FAIL — cannot find module `@/components/ui/PriorityBadge`.

- [ ] **Step 3: Write GlassCard**

Create `src/components/ui/GlassCard.tsx`:
```tsx
import { HTMLAttributes } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export default function GlassCard({ children, className = '', ...props }: GlassCardProps) {
  return (
    <div className={`glass rounded-xl ${className}`} {...props}>
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Write PriorityBadge**

Create `src/components/ui/PriorityBadge.tsx`:
```tsx
import type { TaskPriority } from '@/types/task'

const styles: Record<TaskPriority, string> = {
  high: 'bg-red-500/20 text-red-400 border border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border border-green-500/30',
}

const labels: Record<TaskPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export default function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[priority]}`}>
      {labels[priority]}
    </span>
  )
}
```

- [ ] **Step 5: Write TagChip**

Create `src/components/ui/TagChip.tsx`:
```tsx
export default function TagChip({ tag }: { tag: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 border border-white/10">
      {tag}
    </span>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm run test:run tests/components/ui/PriorityBadge.test.tsx
```

Expected: `3 passed`.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/ tests/components/ui/
git commit -m "feat: add GlassCard, PriorityBadge, and TagChip UI primitives"
```

---

## Task 9: App Shell + Sidebar

**Files:**
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Write Sidebar**

Create `src/components/layout/Sidebar.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/today', icon: '🏠', label: 'Today' },
  { href: '/board', icon: '📋', label: 'Board' },
  { href: '/focus', icon: '⏱', label: 'Focus' },
  { href: '/ai', icon: '✨', label: 'AI Assistant' },
  { href: '/stats', icon: '📊', label: 'Stats' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col items-center gap-2 py-4 px-2 glass border-r border-white/10 min-h-screen w-16">
      <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-content mb-4" />
      {navItems.map(({ href, icon, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-150 ${
              active
                ? 'gradient-bg shadow-lg shadow-purple-500/20'
                : 'glass-hover text-white/50 hover:text-white'
            }`}
          >
            {icon}
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Write AppShell**

Create `src/components/layout/AppShell.tsx`:
```tsx
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add AppShell and Sidebar navigation components"
```

---

## Task 10: Route Pages

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/board/page.tsx` (stub)
- Create: `src/app/today/page.tsx` (stub)
- Create: `src/app/focus/page.tsx` (stub)
- Create: `src/app/ai/page.tsx` (stub)
- Create: `src/app/stats/page.tsx` (stub)

- [ ] **Step 1: Update root layout to use AppShell**

Replace the contents of `src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import './globals.css'
import AppShell from '@/components/layout/AppShell'

export const metadata: Metadata = {
  title: 'FlowTask',
  description: 'AI-powered personal task manager',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Update root page to redirect to /board**

Replace the contents of `src/app/page.tsx`:
```tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/board')
}
```

- [ ] **Step 3: Create board page stub**

Create `src/app/board/page.tsx`:
```tsx
export default function BoardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white/80">Board</h1>
      <p className="text-white/40 mt-2">Kanban board coming in Task 13.</p>
    </div>
  )
}
```

- [ ] **Step 4: Create today page stub**

Create `src/app/today/page.tsx`:
```tsx
export default function TodayPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white/80">Today</h1>
      <p className="text-white/40 mt-2">Today's tasks coming in Task 17.</p>
    </div>
  )
}
```

- [ ] **Step 5: Create Phase 2 stubs**

Create `src/app/focus/page.tsx`:
```tsx
export default function FocusPage() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-6xl mb-4">⏱</div>
      <h1 className="text-2xl font-bold text-white/80">Focus Mode</h1>
      <p className="text-white/40 mt-2">Pomodoro timer — coming in Phase 2.</p>
    </div>
  )
}
```

Create `src/app/ai/page.tsx`:
```tsx
export default function AIPage() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-6xl mb-4">✨</div>
      <h1 className="text-2xl font-bold text-white/80">AI Assistant</h1>
      <p className="text-white/40 mt-2">Smart scheduling & prioritization — coming in Phase 2.</p>
    </div>
  )
}
```

Create `src/app/stats/page.tsx`:
```tsx
export default function StatsPage() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-6xl mb-4">📊</div>
      <h1 className="text-2xl font-bold text-white/80">Stats</h1>
      <p className="text-white/40 mt-2">Productivity insights — coming in Phase 2.</p>
    </div>
  )
}
```

- [ ] **Step 6: Verify the app runs and sidebar navigation works**

```bash
npm run dev
```

Open `http://localhost:3000` — should redirect to `/board`, show the dark background with sidebar icons. Click each icon to verify navigation. Stop the server with Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add src/app/
git commit -m "feat: add root layout with AppShell and all route stubs"
```

---

## Task 11: KanbanColumn Component

**Files:**
- Create: `src/components/board/KanbanColumn.tsx`
- Create: `tests/components/board/KanbanColumn.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/components/board/KanbanColumn.test.tsx`:
```typescript
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
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:run tests/components/board/KanbanColumn.test.tsx
```

Expected: FAIL — cannot find module `@/components/board/KanbanColumn`.

- [ ] **Step 3: Write KanbanColumn**

Create `src/components/board/KanbanColumn.tsx`:
```tsx
'use client'

import { useDroppable } from '@dnd-kit/core'
import type { Task, TaskStatus } from '@/types/task'
import TaskCard from './TaskCard'

interface KanbanColumnProps {
  id: string
  title: string
  status: TaskStatus
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

const columnColors: Record<TaskStatus, string> = {
  todo: 'border-t-white/20',
  inprogress: 'border-t-accent-purple',
  done: 'border-t-accent-green',
}

export default function KanbanColumn({ id, title, status, tasks, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-3 min-h-[400px] p-4 rounded-xl glass border-t-2 ${columnColors[status]} transition-colors ${
        isOver ? 'bg-white/10' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">{title}</h3>
        <span className="text-xs text-white/40 glass px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run tests/components/board/KanbanColumn.test.tsx
```

Expected: `3 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/components/board/KanbanColumn.tsx tests/components/board/KanbanColumn.test.tsx
git commit -m "feat: add KanbanColumn component with droppable support"
```

---

## Task 12: TaskCard Component

**Files:**
- Create: `src/components/board/TaskCard.tsx`
- Create: `tests/components/board/TaskCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/components/board/TaskCard.test.tsx`:
```typescript
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
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:run tests/components/board/TaskCard.test.tsx
```

Expected: FAIL — cannot find module `@/components/board/TaskCard`.

- [ ] **Step 3: Write TaskCard**

Create `src/components/board/TaskCard.tsx`:
```tsx
'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@/types/task'
import PriorityBadge from '@/components/ui/PriorityBadge'
import TagChip from '@/components/ui/TagChip'
import GlassCard from '@/components/ui/GlassCard'

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

interface TaskCardProps {
  task: Task
  onClick: () => void
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  const doneSubtasks = task.subtasks.filter(s => s.done).length

  return (
    <GlassCard
      ref={setNodeRef}
      style={style}
      className={`p-3 cursor-pointer glass-hover transition-all duration-150 select-none ${
        isDragging ? 'opacity-50 shadow-2xl shadow-purple-500/30 rotate-2 z-50' : ''
      }`}
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
      <p className="text-sm font-medium text-white/90 mb-2 leading-snug">{task.title}</p>
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <PriorityBadge priority={task.priority} />
        {task.tags.map(tag => <TagChip key={tag} tag={tag} />)}
      </div>
      <div className="flex items-center justify-between text-xs text-white/30">
        {task.dueDate && <span>{formatDate(task.dueDate)}</span>}
        {task.subtasks.length > 0 && (
          <span className="ml-auto">{doneSubtasks}/{task.subtasks.length}</span>
        )}
      </div>
    </GlassCard>
  )
}
```

- [ ] **Step 4: Update GlassCard to forward the ref**

Replace the contents of `src/components/ui/GlassCard.tsx`:
```tsx
import { forwardRef, HTMLAttributes } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div ref={ref} className={`glass rounded-xl ${className}`} {...props}>
        {children}
      </div>
    )
  }
)

GlassCard.displayName = 'GlassCard'

export default GlassCard
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm run test:run tests/components/board/TaskCard.test.tsx
```

Expected: `6 passed`.

- [ ] **Step 6: Commit**

```bash
git add src/components/board/TaskCard.tsx src/components/ui/GlassCard.tsx tests/components/board/TaskCard.test.tsx
git commit -m "feat: add TaskCard with draggable support and all task fields"
```

---

## Task 13: KanbanBoard with Drag & Drop

**Files:**
- Create: `src/components/board/KanbanBoard.tsx`

- [ ] **Step 1: Write KanbanBoard**

Create `src/components/board/KanbanBoard.tsx`:
```tsx
'use client'

import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { Task, TaskStatus } from '@/types/task'
import { updateTask } from '@/lib/db/tasks'
import KanbanColumn from './KanbanColumn'

const COLUMNS: { id: string; title: string; status: TaskStatus }[] = [
  { id: 'col-todo', title: 'To Do', status: 'todo' },
  { id: 'col-inprogress', title: 'In Progress', status: 'inprogress' },
  { id: 'col-done', title: 'Done', status: 'done' },
]

const STATUS_MAP: Record<string, TaskStatus> = {
  'col-todo': 'todo',
  'col-inprogress': 'inprogress',
  'col-done': 'done',
}

interface KanbanBoardProps {
  tasks: Task[]
  onTasksChange: () => void
  onTaskClick: (task: Task) => void
}

export default function KanbanBoard({ tasks, onTasksChange, onTaskClick }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string
    const newStatus = STATUS_MAP[overId]
    if (!newStatus) return

    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    await updateTask(taskId, { status: newStatus })
    onTasksChange()
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            status={col.status}
            tasks={tasks.filter(t => t.status === col.status)}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </DndContext>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/board/KanbanBoard.tsx
git commit -m "feat: add KanbanBoard with dnd-kit drag-and-drop between columns"
```

---

## Task 14: QuickAddBar (Plain Text)

**Files:**
- Create: `src/components/board/QuickAddBar.tsx`

- [ ] **Step 1: Write QuickAddBar without AI**

Create `src/components/board/QuickAddBar.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { createTask } from '@/lib/db/tasks'
import { makeTask } from '@/lib/utils/task'

interface QuickAddBarProps {
  onTaskCreated: () => void
}

export default function QuickAddBar({ onTaskCreated }: QuickAddBarProps) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = value.trim()
    if (!text) return

    setLoading(true)
    try {
      const task = makeTask({ title: text })
      await createTask(task)
      setValue('')
      onTaskCreated()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Add a task... (AI-powered when you add your API key)"
        disabled={loading}
        className="flex-1 glass rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-accent-purple/50 focus:bg-white/10 transition-all"
      />
      <button
        type="submit"
        disabled={!value.trim() || loading}
        className="gradient-bg px-4 py-3 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-opacity"
      >
        {loading ? '...' : 'Add'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/board/QuickAddBar.tsx
git commit -m "feat: add QuickAddBar for plain-text task creation"
```

---

## Task 15: Board Page Integration

**Files:**
- Modify: `src/app/board/page.tsx`

- [ ] **Step 1: Replace the board stub with a real page**

Replace the contents of `src/app/board/page.tsx`:
```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAllTasks } from '@/lib/db/tasks'
import KanbanBoard from '@/components/board/KanbanBoard'
import QuickAddBar from '@/components/board/QuickAddBar'
import TaskDetail from '@/components/task/TaskDetail'
import type { Task } from '@/types/task'

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const refresh = useCallback(async () => {
    const updated = await getAllTasks()
    setTasks(updated)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <div className="flex flex-col h-full gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white/80">Board</h1>
      </div>
      <QuickAddBar onTaskCreated={refresh} />
      <KanbanBoard tasks={tasks} onTasksChange={refresh} onTaskClick={setSelectedTask} />
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={async () => {
            await refresh()
            setSelectedTask(null)
          }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify the board page renders in the browser**

```bash
npm run dev
```

Open `http://localhost:3000/board`. Add a few tasks via the quick-add bar. Verify they appear in the "To Do" column. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add src/app/board/page.tsx
git commit -m "feat: wire up board page with tasks, quick-add, and task detail"
```

---

## Task 16: TaskDetail + SubtaskList

**Files:**
- Create: `src/components/task/SubtaskList.tsx`
- Create: `src/components/task/TaskDetail.tsx`

- [ ] **Step 1: Write SubtaskList**

Create `src/components/task/SubtaskList.tsx`:
```tsx
'use client'

import type { Subtask } from '@/types/task'

interface SubtaskListProps {
  subtasks: Subtask[]
  onToggle: (id: string) => void
}

export default function SubtaskList({ subtasks, onToggle }: SubtaskListProps) {
  if (subtasks.length === 0) return null

  return (
    <div className="space-y-2">
      {subtasks.map(subtask => (
        <label key={subtask.id} className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={subtask.done}
            onChange={() => onToggle(subtask.id)}
            className="w-4 h-4 rounded accent-violet-500"
          />
          <span className={`text-sm ${subtask.done ? 'line-through text-white/30' : 'text-white/70'}`}>
            {subtask.title}
          </span>
        </label>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Write TaskDetail**

Create `src/components/task/TaskDetail.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Task, TaskPriority } from '@/types/task'
import { updateTask, deleteTask } from '@/lib/db/tasks'
import GlassCard from '@/components/ui/GlassCard'
import SubtaskList from './SubtaskList'

interface TaskDetailProps {
  task: Task
  onClose: () => void
  onUpdated: () => void
}

export default function TaskDetail({ task, onClose, onUpdated }: TaskDetailProps) {
  const [title, setTitle] = useState(task.title)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [dueDate, setDueDate] = useState(task.dueDate ?? '')
  const [subtasks, setSubtasks] = useState(task.subtasks)
  const [saving, setSaving] = useState(false)

  function toggleSubtask(id: string) {
    setSubtasks(prev =>
      prev.map(s => (s.id === id ? { ...s, done: !s.done } : s))
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateTask(task.id, {
        title,
        priority,
        dueDate: dueDate || undefined,
        subtasks,
      })
      onUpdated()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this task?')) return
    await deleteTask(task.id)
    onUpdated()
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg"
        >
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-base font-semibold text-white/80">Edit Task</h2>
              <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg leading-none">✕</button>
            </div>

            <div className="space-y-3">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full glass rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent-purple/50"
              />

              <div className="flex gap-3">
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as TaskPriority)}
                  className="glass rounded-lg px-3 py-2 text-sm text-white/70 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="flex-1 glass rounded-lg px-3 py-2 text-sm text-white/70 outline-none"
                />
              </div>
            </div>

            {subtasks.length > 0 && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Subtasks</p>
                <SubtaskList subtasks={subtasks} onToggle={toggleSubtask} />
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                onClick={handleDelete}
                className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
              >
                Delete task
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="glass px-3 py-1.5 rounded-lg text-xs text-white/50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="gradient-bg px-3 py-1.5 rounded-lg text-xs text-white disabled:opacity-40"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
```

- [ ] **Step 3: Verify TaskDetail works in the browser**

```bash
npm run dev
```

Add a task, click on it — verify the detail panel slides up, you can edit title/priority/due date and save. Verify delete removes it from the board. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add src/components/task/
git commit -m "feat: add TaskDetail slide-over panel with edit, subtasks, and delete"
```

---

## Task 17: Today View

**Files:**
- Modify: `src/app/today/page.tsx`

- [ ] **Step 1: Replace the today stub with a real page**

Replace the contents of `src/app/today/page.tsx`:
```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTodaysTasks } from '@/lib/db/tasks'
import TaskCard from '@/components/board/TaskCard'
import TaskDetail from '@/components/task/TaskDetail'
import type { Task } from '@/types/task'

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const refresh = useCallback(async () => {
    const t = await getTodaysTasks()
    setTasks(t)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white/90">Good day ☀️</h1>
        <p className="text-sm text-white/40 mt-1">{today}</p>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-white/30">No tasks due today — enjoy your day!</p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-wider">{tasks.length} task{tasks.length !== 1 ? 's' : ''} due today</p>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
          ))}
        </div>
      )}

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={async () => {
            await refresh()
            setSelectedTask(null)
          }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Add a task with today's date in the board. Navigate to Today (`/today`) — verify it appears. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add src/app/today/page.tsx
git commit -m "feat: add Today view showing tasks due today"
```

---

## Task 18: AI Prompts

**Files:**
- Create: `src/lib/ai/prompts.ts`
- Create: `tests/lib/ai/prompts.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/ai/prompts.test.ts`:
```typescript
import { buildParseSystemPrompt, buildBreakdownSystemPrompt } from '@/lib/ai/prompts'

describe('buildParseSystemPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = buildParseSystemPrompt()
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(50)
  })

  it('includes today date for context', () => {
    const today = new Date().toISOString().split('T')[0]
    const prompt = buildParseSystemPrompt()
    expect(prompt).toContain(today)
  })

  it('specifies JSON-only output', () => {
    const prompt = buildParseSystemPrompt()
    expect(prompt.toLowerCase()).toContain('json')
  })
})

describe('buildBreakdownSystemPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = buildBreakdownSystemPrompt()
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(50)
  })

  it('mentions the expected output format', () => {
    const prompt = buildBreakdownSystemPrompt()
    expect(prompt.toLowerCase()).toContain('json')
    expect(prompt.toLowerCase()).toContain('array')
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:run tests/lib/ai/prompts.test.ts
```

Expected: FAIL — cannot find module `@/lib/ai/prompts`.

- [ ] **Step 3: Write the prompts module**

Create `src/lib/ai/prompts.ts`:
```typescript
export function buildParseSystemPrompt(): string {
  const today = new Date().toISOString().split('T')[0]
  return `You are a task parser. Extract structured data from natural language task descriptions.
Always respond with valid JSON only — no prose, no markdown, no code fences.
Today's date is ${today}.

Output format:
{
  "title": "string (required, concise task title, max 80 chars)",
  "dueDate": "YYYY-MM-DD or null",
  "priority": "low | medium | high or null",
  "tags": ["string"] or [],
  "reminderOffset": number (minutes before due date) or null
}

Rules:
- "today" means ${today}
- "tomorrow" means the next calendar day
- "urgent" or "asap" maps to priority high
- Infer tags from context (e.g. "gym" → ["health"], "meeting" → ["work"])
- If dueDate cannot be determined, use null
- Never include extra fields

Example:
Input: "dentist appointment Friday 3pm remind me 2 hours before"
Output: {"title":"Dentist appointment","dueDate":"${getNextWeekday(5, today)}","priority":null,"tags":["health"],"reminderOffset":120}`
}

export function buildBreakdownSystemPrompt(): string {
  return `You are a task breakdown assistant. Split a vague goal into 3–7 concrete, actionable subtasks.
Always respond with a valid JSON array only — no prose, no markdown, no code fences.

Output format: ["subtask 1", "subtask 2", ...]

Rules:
- Each subtask must be a specific, completable action
- Start each with an action verb (Write, Create, Test, Review, Set up, etc.)
- 3 subtasks minimum, 7 maximum
- Keep each under 60 characters
- Order them logically (earlier steps first)

Example:
Input: "launch my app"
Output: ["Set up production environment","Write launch announcement","Create landing page","Submit to Product Hunt","Monitor error logs post-launch"]`
}

function getNextWeekday(targetDay: number, fromDate: string): string {
  const date = new Date(fromDate + 'T12:00:00')
  const currentDay = date.getDay()
  const daysUntil = (targetDay - currentDay + 7) % 7 || 7
  date.setDate(date.getDate() + daysUntil)
  return date.toISOString().split('T')[0]
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run tests/lib/ai/prompts.test.ts
```

Expected: `5 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/prompts.ts tests/lib/ai/prompts.test.ts
git commit -m "feat: add AI system prompt builders for parse and breakdown"
```

---

## Task 19: AI API Route

**Files:**
- Create: `src/app/api/ai/route.ts`

- [ ] **Step 1: Write the AI API route**

Create `src/app/api/ai/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildParseSystemPrompt, buildBreakdownSystemPrompt } from '@/lib/ai/prompts'
import type { AIRequest } from '@/types/ai'

export async function POST(req: NextRequest) {
  let body: AIRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { action, apiKey, input } = body

  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json({ error: 'API key required' }, { status: 400 })
  }

  if (!input || typeof input !== 'string') {
    return NextResponse.json({ error: 'Input required' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey })

  try {
    if (action === 'parse') {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: buildParseSystemPrompt(),
        messages: [{ role: 'user', content: input }],
      })
      const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
      const result = JSON.parse(text)
      return NextResponse.json({ action, result })
    }

    if (action === 'breakdown') {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: buildBreakdownSystemPrompt(),
        messages: [{ role: 'user', content: input }],
      })
      const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
      const result = JSON.parse(text)
      return NextResponse.json({ action, result })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 502 })
    }
    const message = err instanceof Error ? err.message : 'AI call failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/ai/route.ts
git commit -m "feat: add /api/ai endpoint for parse and breakdown actions"
```

---

## Task 20: AI Client Wrapper

**Files:**
- Create: `src/lib/ai/client.ts`

- [ ] **Step 1: Write the client wrapper**

Create `src/lib/ai/client.ts`:
```typescript
import { getSetting } from '@/lib/db/settings'
import type { ParseResult } from '@/types/ai'

export async function hasApiKey(): Promise<boolean> {
  const key = await getSetting('claudeApiKey')
  return Boolean(key)
}

export async function callParseAI(input: string): Promise<ParseResult> {
  const apiKey = await getSetting('claudeApiKey')
  if (!apiKey) throw new Error('NO_API_KEY')

  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'parse', apiKey, input }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'AI call failed')
  }

  const data = await res.json()
  return data.result as ParseResult
}

export async function callBreakdownAI(taskTitle: string): Promise<string[]> {
  const apiKey = await getSetting('claudeApiKey')
  if (!apiKey) throw new Error('NO_API_KEY')

  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'breakdown', apiKey, input: taskTitle }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'AI call failed')
  }

  const data = await res.json()
  return data.result as string[]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/client.ts
git commit -m "feat: add AI client wrapper with callParseAI and callBreakdownAI"
```

---

## Task 21: QuickAddBar + AI Parse Integration

**Files:**
- Modify: `src/components/board/QuickAddBar.tsx`

- [ ] **Step 1: Update QuickAddBar to use AI when key is set**

Replace the contents of `src/components/board/QuickAddBar.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { createTask } from '@/lib/db/tasks'
import { makeTask } from '@/lib/utils/task'
import { callParseAI, hasApiKey } from '@/lib/ai/client'

interface QuickAddBarProps {
  onTaskCreated: () => void
}

export default function QuickAddBar({ onTaskCreated }: QuickAddBarProps) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    hasApiKey().then(setAiEnabled)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = value.trim()
    if (!text) return

    setLoading(true)
    setAiError(null)

    try {
      let taskData: Parameters<typeof makeTask>[0] = { title: text }

      if (aiEnabled) {
        try {
          const parsed = await callParseAI(text)
          taskData = {
            title: parsed.title || text,
            dueDate: parsed.dueDate ?? undefined,
            priority: parsed.priority ?? 'medium',
            tags: parsed.tags ?? [],
            reminderOffset: parsed.reminderOffset ?? undefined,
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'AI failed'
          setAiError(msg === 'NO_API_KEY' ? null : 'AI parse failed — saved as plain text')
        }
      }

      const task = makeTask(taskData)
      await createTask(task)
      setValue('')
      onTaskCreated()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={
              aiEnabled
                ? '✨ Add a task in plain English...'
                : 'Add a task... (set Claude API key in settings to enable AI)'
            }
            disabled={loading}
            className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-accent-purple/50 focus:bg-white/10 transition-all"
          />
          {aiEnabled && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-accent-purple/60">AI</span>
          )}
        </div>
        <button
          type="submit"
          disabled={!value.trim() || loading}
          className="gradient-bg px-4 py-3 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-opacity"
        >
          {loading ? '...' : 'Add'}
        </button>
      </form>
      {aiError && <p className="text-xs text-yellow-400/60 px-1">{aiError}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Verify AI parse works end-to-end**

```bash
npm run dev
```

In the browser, go to `/board`. Type a natural language task like `"dentist appointment next Friday high priority"`. Verify it creates a task with the correct title, priority, and due date populated. If no API key is set, the task is created with the plain text as title.

To set an API key for testing: open browser DevTools → Application → IndexedDB → flowtask-db → settings. Or temporarily add a UI button (optional).

Stop the server with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add src/components/board/QuickAddBar.tsx
git commit -m "feat: connect QuickAddBar to AI parse with graceful fallback"
```

---

## Task 22: TaskDetail AI Breakdown

**Files:**
- Modify: `src/components/task/TaskDetail.tsx`

- [ ] **Step 1: Add "Break it down" button to TaskDetail**

In `src/components/task/TaskDetail.tsx`, add these imports at the top (after the existing imports):
```typescript
import { callBreakdownAI, hasApiKey } from '@/lib/ai/client'
```

Add state inside the component (after the existing state declarations):
```typescript
const [breakingDown, setBreakingDown] = useState(false)
const [aiEnabled, setAiEnabled] = useState(false)

useEffect(() => {
  hasApiKey().then(setAiEnabled)
}, [])
```

Add `useEffect` to the import from React (modify existing import):
```typescript
import { useState, useEffect } from 'react'
```

Add the breakdown handler inside the component (before `handleSave`):
```typescript
async function handleBreakdown() {
  setBreakingDown(true)
  try {
    const titles = await callBreakdownAI(task.title)
    const newSubtasks = titles.map(title => ({
      id: crypto.randomUUID(),
      title,
      done: false,
    }))
    setSubtasks(prev => [...prev, ...newSubtasks])
  } finally {
    setBreakingDown(false)
  }
}
```

Add the breakdown button inside the JSX, after the subtasks section and before the footer buttons div — find the `{subtasks.length > 0 && (` block and add this after it:
```tsx
{aiEnabled && (
  <button
    onClick={handleBreakdown}
    disabled={breakingDown}
    className="w-full glass glass-hover rounded-lg py-2 text-xs text-accent-purple/80 hover:text-accent-purple transition-colors disabled:opacity-40"
  >
    {breakingDown ? '✨ Breaking down...' : '✨ AI: Break into subtasks'}
  </button>
)}
```

- [ ] **Step 2: Verify AI breakdown works in browser**

```bash
npm run dev
```

Add a task like "Launch my app". Click the card to open TaskDetail. Click "AI: Break into subtasks". Verify 3–7 subtasks appear in the list. Save — verify subtasks persist on the card. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add src/components/task/TaskDetail.tsx
git commit -m "feat: add AI task breakdown button in TaskDetail"
```

---

## Task 23: PWA Setup

**Files:**
- Modify: `next.config.ts`
- Create: `public/manifest.json`
- Create: `public/icons/icon-192.png` (generate)
- Create: `public/icons/icon-512.png` (generate)

- [ ] **Step 1: Generate PWA icons**

Run this to generate simple placeholder icons (requires Node.js):
```bash
node -e "
const { createCanvas } = require('canvas');
const fs = require('fs');

// If canvas module is not available, skip and create SVG placeholders instead
try {
  [192, 512].forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#7c3aed');
    grad.addColorStop(1, '#ec4899');
    ctx.fillStyle = grad;
    ctx.roundRect(0, 0, size, size, size * 0.2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = \`bold \${size * 0.35}px sans-serif\`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('F', size/2, size/2);
    fs.writeFileSync(\`public/icons/icon-\${size}.png\`, canvas.toBuffer('image/png'));
    console.log('Generated icon-' + size + '.png');
  });
} catch {
  console.log('canvas not available — add real icons to public/icons/ manually');
}
"
```

If the `canvas` module is not available, create `public/icons/` and add two PNG files (`icon-192.png` and `icon-512.png`) manually — any square PNG works. You can download free icons from any icon generator.

- [ ] **Step 2: Write the web app manifest**

Create `public/manifest.json`:
```json
{
  "name": "FlowTask",
  "short_name": "FlowTask",
  "description": "AI-powered personal task manager",
  "start_url": "/board",
  "display": "standalone",
  "background_color": "#0f0f0f",
  "theme_color": "#7c3aed",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 3: Configure next-pwa**

Replace the contents of `next.config.ts`:
```typescript
import type { NextConfig } from 'next'
import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
}

export default withPWA(nextConfig)
```

- [ ] **Step 4: Add manifest link to the root layout**

In `src/app/layout.tsx`, update the `metadata` export to include the manifest and theme:
```typescript
export const metadata: Metadata = {
  title: 'FlowTask',
  description: 'AI-powered personal task manager',
  manifest: '/manifest.json',
  themeColor: '#7c3aed',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FlowTask',
  },
}
```

- [ ] **Step 5: Add .gitignore entries for PWA build artifacts**

Add to `.gitignore` (append these lines):
```
# PWA
public/sw.js
public/workbox-*.js
public/worker-*.js
public/sw.js.map
public/workbox-*.js.map

# Superpowers
.superpowers/
```

- [ ] **Step 6: Build and verify PWA**

```bash
npm run build
npm run start
```

Open `http://localhost:3000` in Chrome. Open DevTools → Application → Manifest — verify the manifest loads. Check "Service Workers" — verify one is registered. Look for the "Install" button in the address bar. Stop the server.

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "feat: add PWA support with manifest, service worker, and icons"
```

---

## Phase 1 Complete

At this point the app has:

- ✅ Kanban board (To Do / In Progress / Done) with drag & drop
- ✅ Icon sidebar navigating to Today, Board, Focus, AI, Stats
- ✅ Dark glassmorphism UI with gradient accents
- ✅ Natural language task input with AI parse (degrades gracefully without key)
- ✅ AI task breakdown in task detail panel
- ✅ Local-first storage via IndexedDB
- ✅ Installable PWA

**Run all tests before declaring done:**

```bash
npm run test:run
```

Expected: all tests pass.

**Next:** Phase 2 plan covers smart scheduling, daily AI prioritization, Pomodoro focus mode, and productivity stats.
