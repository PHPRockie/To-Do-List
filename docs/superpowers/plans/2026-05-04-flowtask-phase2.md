# FlowTask Phase 2 — AI + Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a flexible Pomodoro focus timer, AI scheduling and prioritization assistant, streak tracking, and an AI-generated weekly summary stats page to FlowTask.

**Architecture:** Three stub pages (`/focus`, `/ai`, `/stats`) are replaced with full implementations. The existing `/api/ai` route and `client.ts` are extended with three new actions (`schedule`, `prioritize`, `weekly_summary`). Two new IndexedDB stores (`sessions`, `weekly_summary`) are added by bumping the DB schema to version 2. Streak data lives in the existing `Settings` store.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, Framer Motion, Vitest, React Testing Library, fake-indexeddb, Anthropic SDK (already installed)

---

## File Map

```
flowtask/src/
├── types/
│   └── stats.ts                          NEW — FocusSession, WeeklySummary, ScheduleItem, WeeklySummaryInput
├── lib/
│   ├── db/
│   │   ├── index.ts                      MODIFY — bump to version 2, add sessions + weekly_summary stores
│   │   ├── tasks.ts                      MODIFY — set completedAt when status → 'done'
│   │   ├── sessions.ts                   NEW — FocusSession CRUD
│   │   ├── weekly-summary.ts             NEW — WeeklySummary get/set
│   │   └── streak.ts                     NEW — updateStreak(), getStreakData()
│   ├── ai/
│   │   ├── prompts.ts                    MODIFY — add 3 new prompt builders
│   │   └── client.ts                     MODIFY — add callScheduleAI, callPrioritizeAI, callWeeklySummaryAI
│   └── utils/
│       └── date.ts                       NEW — getWeekKey(), getWeekBounds()
├── app/
│   ├── api/ai/route.ts                   MODIFY — add schedule, prioritize, weekly_summary actions
│   ├── focus/page.tsx                    MODIFY — replace stub
│   ├── ai/page.tsx                       MODIFY — replace stub
│   └── stats/page.tsx                    MODIFY — replace stub
├── components/
│   ├── focus/
│   │   └── FocusTimer.tsx               NEW — circular ring, duration picker, start/pause/reset
│   ├── ai/
│   │   ├── SchedulePanel.tsx            NEW — time slot suggestions from AI
│   │   └── InsightPanel.tsx             NEW — one-line priority insight from AI
│   └── stats/
│       ├── StreakCard.tsx               NEW — streak count + completion rate
│       ├── WeekChart.tsx               NEW — bar chart Mon–Sun
│       └── WeekSummary.tsx             NEW — AI-generated weekly narrative
flowtask/tests/
├── lib/
│   ├── db/
│   │   ├── sessions.test.ts            NEW
│   │   ├── weekly-summary.test.ts      NEW
│   │   ├── streak.test.ts              NEW
│   │   └── tasks.test.ts               MODIFY — add completedAt tests
│   ├── ai/
│   │   └── prompts.test.ts             MODIFY — add 3 new prompt tests
│   └── utils/
│       └── date.test.ts                NEW
└── components/
    ├── focus/FocusTimer.test.tsx       NEW
    ├── stats/
    │   ├── StreakCard.test.tsx         NEW
    │   ├── WeekChart.test.tsx          NEW
    │   └── WeekSummary.test.tsx        NEW
    └── ai/
        ├── SchedulePanel.test.tsx      NEW
        └── InsightPanel.test.tsx       NEW
```

---

## Task 1: Stats Types + Date Utilities

**Files:**
- Create: `src/types/stats.ts`
- Create: `src/lib/utils/date.ts`
- Create: `tests/lib/utils/date.test.ts`
- Modify: `src/types/task.ts`

- [ ] **Step 1: Add `completedAt` to Task type**

In `src/types/task.ts`, add one field to the `Task` interface after `reminderOffset`:
```typescript
  reminderOffset?: number
  completedAt?: string       // ISO timestamp — set when status changes to 'done'
  createdAt: string
```

- [ ] **Step 2: Create stats types**

Create `src/types/stats.ts`:
```typescript
export interface FocusSession {
  id: string
  startedAt: string
  durationMinutes: number
  completedAt?: string
}

export interface WeeklySummary {
  weekKey: string
  generatedAt: string
  summary: string
  tasksCompleted: number
  completionRate: number
}

export interface ScheduleItem {
  taskId: string
  taskTitle: string
  suggestedTime: string
  reason: string
}

export interface WeeklySummaryInput {
  completedTasks: Array<{ title: string; completedAt: string }>
  tasksCompleted: number
  completionRate: number
  weekKey: string
}
```

- [ ] **Step 3: Write failing tests for date utilities**

Create `tests/lib/utils/date.test.ts`:
```typescript
import { getWeekKey, getWeekBounds } from '@/lib/utils/date'

describe('getWeekKey', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const key = getWeekKey()
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns a Monday date', () => {
    const key = getWeekKey()
    const day = new Date(key + 'T12:00:00').getDay()
    expect(day).toBe(1) // 1 = Monday
  })
})

describe('getWeekBounds', () => {
  it('returns start on Monday midnight', () => {
    const { start } = getWeekBounds()
    expect(start.getDay()).toBe(1)
    expect(start.getHours()).toBe(0)
  })

  it('returns end on Sunday 23:59:59', () => {
    const { end } = getWeekBounds()
    expect(end.getDay()).toBe(0)
    expect(end.getHours()).toBe(23)
  })

  it('span is exactly 7 days', () => {
    const { start, end } = getWeekBounds()
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    expect(Math.round(diffDays)).toBe(6)
  })
})
```

- [ ] **Step 4: Run to verify they fail**

```bash
cd flowtask && npm run test:run tests/lib/utils/date.test.ts
```
Expected: FAIL — cannot find module `@/lib/utils/date`.

- [ ] **Step 5: Write date utilities**

Create `src/lib/utils/date.ts`:
```typescript
export function getWeekKey(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

export function getWeekBounds(): { start: Date; end: Date } {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const start = new Date(now)
  start.setDate(now.getDate() + diff)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm run test:run tests/lib/utils/date.test.ts
```
Expected: `3 passed`.

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/types/stats.ts src/types/task.ts src/lib/utils/date.ts tests/lib/utils/date.test.ts
git commit -m "feat: add stats types, completedAt on Task, and date utilities"
```

---

## Task 2: DB Schema Upgrade (Version 2)

**Files:**
- Modify: `src/lib/db/index.ts`

- [ ] **Step 1: Replace `src/lib/db/index.ts` completely**

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Task } from '@/types/task'
import type { FocusSession, WeeklySummary } from '@/types/stats'

interface FlowTaskDB extends DBSchema {
  tasks: {
    key: string
    value: Task
  }
  settings: {
    key: string
    value: { key: string; value: unknown }
  }
  sessions: {
    key: string
    value: FocusSession
  }
  weekly_summary: {
    key: string
    value: WeeklySummary
  }
}

let dbInstance: IDBPDatabase<FlowTaskDB> | null = null

export async function getDB(): Promise<IDBPDatabase<FlowTaskDB>> {
  if (dbInstance) return dbInstance
  dbInstance = await openDB<FlowTaskDB>('flowtask-db', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('tasks', { keyPath: 'id' })
        db.createObjectStore('settings', { keyPath: 'key' })
      }
      if (oldVersion < 2) {
        db.createObjectStore('sessions', { keyPath: 'id' })
        db.createObjectStore('weekly_summary', { keyPath: 'weekKey' })
      }
    },
  })
  return dbInstance
}

export function resetDB(): void {
  dbInstance = null
}
```

- [ ] **Step 2: Run full test suite to verify no regressions**

```bash
npm run test:run
```
Expected: all existing tests pass (33+).

- [ ] **Step 3: Commit**

```bash
git add src/lib/db/index.ts
git commit -m "feat: upgrade DB schema to version 2 with sessions and weekly_summary stores"
```

---

## Task 3: FocusSession CRUD

**Files:**
- Create: `src/lib/db/sessions.ts`
- Create: `tests/lib/db/sessions.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/db/sessions.test.ts`:
```typescript
import { createSession, getTodaysCompletedSessions } from '@/lib/db/sessions'
import { resetDB } from '@/lib/db'
import type { FocusSession } from '@/types/stats'

beforeEach(() => {
  resetDB()
})

const today = new Date().toISOString().split('T')[0]

const completedSession: FocusSession = {
  id: 'session-1',
  startedAt: `${today}T09:00:00.000Z`,
  durationMinutes: 25,
  completedAt: `${today}T09:25:00.000Z`,
}

const incompleteSession: FocusSession = {
  id: 'session-2',
  startedAt: `${today}T10:00:00.000Z`,
  durationMinutes: 25,
}

describe('createSession / getTodaysCompletedSessions', () => {
  it('returns empty array when no sessions', async () => {
    const result = await getTodaysCompletedSessions()
    expect(result).toEqual([])
  })

  it('returns only completed sessions from today', async () => {
    await createSession(completedSession)
    await createSession(incompleteSession)
    const result = await getTodaysCompletedSessions()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('session-1')
  })

  it('excludes sessions from other days', async () => {
    const oldSession: FocusSession = {
      id: 'session-old',
      startedAt: '2020-01-01T09:00:00.000Z',
      durationMinutes: 25,
      completedAt: '2020-01-01T09:25:00.000Z',
    }
    await createSession(oldSession)
    const result = await getTodaysCompletedSessions()
    expect(result).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:run tests/lib/db/sessions.test.ts
```
Expected: FAIL — cannot find module `@/lib/db/sessions`.

- [ ] **Step 3: Write sessions module**

Create `src/lib/db/sessions.ts`:
```typescript
import { getDB } from './index'
import type { FocusSession } from '@/types/stats'

export async function createSession(session: FocusSession): Promise<void> {
  const db = await getDB()
  await db.put('sessions', session)
}

export async function getTodaysCompletedSessions(): Promise<FocusSession[]> {
  const db = await getDB()
  const today = new Date().toISOString().split('T')[0]
  const all = await db.getAll('sessions')
  return all.filter(
    s => s.completedAt && s.completedAt.startsWith(today)
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run tests/lib/db/sessions.test.ts
```
Expected: `3 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/sessions.ts tests/lib/db/sessions.test.ts
git commit -m "feat: add FocusSession CRUD"
```

---

## Task 4: WeeklySummary DB

**Files:**
- Create: `src/lib/db/weekly-summary.ts`
- Create: `tests/lib/db/weekly-summary.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/db/weekly-summary.test.ts`:
```typescript
import { getWeeklySummary, saveWeeklySummary } from '@/lib/db/weekly-summary'
import { resetDB } from '@/lib/db'
import type { WeeklySummary } from '@/types/stats'

beforeEach(() => {
  resetDB()
})

const sample: WeeklySummary = {
  weekKey: '2026-05-04',
  generatedAt: '2026-05-04T10:00:00.000Z',
  summary: 'Great week! You completed 10 tasks.',
  tasksCompleted: 10,
  completionRate: 85,
}

describe('saveWeeklySummary / getWeeklySummary', () => {
  it('returns null when no summary exists for a week', async () => {
    const result = await getWeeklySummary('2026-05-04')
    expect(result).toBeNull()
  })

  it('stores and retrieves a summary by weekKey', async () => {
    await saveWeeklySummary(sample)
    const result = await getWeeklySummary('2026-05-04')
    expect(result).toEqual(sample)
  })

  it('overwrites existing summary for same weekKey', async () => {
    await saveWeeklySummary(sample)
    const updated = { ...sample, summary: 'Updated summary.' }
    await saveWeeklySummary(updated)
    const result = await getWeeklySummary('2026-05-04')
    expect(result?.summary).toBe('Updated summary.')
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:run tests/lib/db/weekly-summary.test.ts
```
Expected: FAIL — cannot find module `@/lib/db/weekly-summary`.

- [ ] **Step 3: Write weekly-summary module**

Create `src/lib/db/weekly-summary.ts`:
```typescript
import { getDB } from './index'
import type { WeeklySummary } from '@/types/stats'

export async function getWeeklySummary(weekKey: string): Promise<WeeklySummary | null> {
  const db = await getDB()
  const result = await db.get('weekly_summary', weekKey)
  return result ?? null
}

export async function saveWeeklySummary(summary: WeeklySummary): Promise<void> {
  const db = await getDB()
  await db.put('weekly_summary', summary)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run tests/lib/db/weekly-summary.test.ts
```
Expected: `3 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/weekly-summary.ts tests/lib/db/weekly-summary.test.ts
git commit -m "feat: add WeeklySummary DB module"
```

---

## Task 5: Streak Logic

**Files:**
- Create: `src/lib/db/streak.ts`
- Create: `tests/lib/db/streak.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/db/streak.test.ts`:
```typescript
import { updateStreak, getStreakData } from '@/lib/db/streak'
import { setSetting } from '@/lib/db/settings'
import { resetDB } from '@/lib/db'

beforeEach(() => {
  resetDB()
})

describe('updateStreak', () => {
  it('starts streak at 1 on first call', async () => {
    const streak = await updateStreak()
    expect(streak).toBe(1)
  })

  it('does not increment if called again on the same day', async () => {
    await updateStreak()
    const streak = await updateStreak()
    expect(streak).toBe(1)
  })

  it('increments streak when last active was yesterday', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    await setSetting('streak', 5)
    await setSetting('lastActiveDate', yesterday.toISOString().split('T')[0])
    const streak = await updateStreak()
    expect(streak).toBe(6)
  })

  it('resets streak to 1 when last active was 2+ days ago', async () => {
    await setSetting('streak', 10)
    await setSetting('lastActiveDate', '2020-01-01')
    const streak = await updateStreak()
    expect(streak).toBe(1)
  })
})

describe('getStreakData', () => {
  it('returns streak and lastActiveDate from settings', async () => {
    await setSetting('streak', 7)
    await setSetting('lastActiveDate', '2026-05-01')
    const data = await getStreakData()
    expect(data.streak).toBe(7)
    expect(data.lastActiveDate).toBe('2026-05-01')
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:run tests/lib/db/streak.test.ts
```
Expected: FAIL — cannot find module `@/lib/db/streak`.

- [ ] **Step 3: Write streak module**

Create `src/lib/db/streak.ts`:
```typescript
import { getSetting, setSetting } from './settings'

export async function getStreakData(): Promise<{ streak: number; lastActiveDate: string }> {
  const streak = await getSetting('streak')
  const lastActiveDate = await getSetting('lastActiveDate')
  return { streak, lastActiveDate }
}

export async function updateStreak(): Promise<number> {
  const today = new Date().toISOString().split('T')[0]
  const streak = await getSetting('streak')
  const lastActiveDate = await getSetting('lastActiveDate')

  if (lastActiveDate === today) return streak

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const newStreak = lastActiveDate === yesterdayStr ? streak + 1 : 1

  await setSetting('streak', newStreak)
  await setSetting('lastActiveDate', today)
  return newStreak
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run tests/lib/db/streak.test.ts
```
Expected: `5 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/streak.ts tests/lib/db/streak.test.ts
git commit -m "feat: add streak logic with updateStreak and getStreakData"
```

---

## Task 6: Task completedAt on Completion

**Files:**
- Modify: `src/lib/db/tasks.ts`
- Modify: `tests/lib/db/tasks.test.ts`

- [ ] **Step 1: Add two failing tests to the existing test file**

In `tests/lib/db/tasks.test.ts`, add these two tests inside the existing `describe('updateTask', ...)` block:
```typescript
  it('sets completedAt when status changes to done', async () => {
    await createTask(sample)
    await updateTask('task-1', { status: 'done' })
    const updated = await getTask('task-1')
    expect(updated?.completedAt).toBeTruthy()
    expect(updated?.status).toBe('done')
  })

  it('does not set completedAt when status changes to inprogress', async () => {
    await createTask(sample)
    await updateTask('task-1', { status: 'inprogress' })
    const updated = await getTask('task-1')
    expect(updated?.completedAt).toBeUndefined()
  })
```

- [ ] **Step 2: Run to verify the new tests fail**

```bash
npm run test:run tests/lib/db/tasks.test.ts
```
Expected: 10 passed, 2 failed (the new tests).

- [ ] **Step 3: Update `updateTask` to set completedAt**

In `src/lib/db/tasks.ts`, replace the `updateTask` function:
```typescript
export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('tasks', id)
  if (!existing) throw new Error(`Task ${id} not found`)
  const completedAt =
    updates.status === 'done' && existing.status !== 'done'
      ? new Date().toISOString()
      : existing.completedAt
  await db.put('tasks', {
    ...existing,
    ...updates,
    completedAt,
    updatedAt: new Date().toISOString(),
  })
}
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
npm run test:run tests/lib/db/tasks.test.ts
```
Expected: `12 passed`.

- [ ] **Step 5: Also update tasks.ts to call updateStreak on completion**

At the top of `src/lib/db/tasks.ts`, add the import:
```typescript
import { updateStreak } from './streak'
```

Then in `updateTask`, after the `db.put` call:
```typescript
  await db.put('tasks', {
    ...existing,
    ...updates,
    completedAt,
    updatedAt: new Date().toISOString(),
  })
  if (updates.status === 'done' && existing.status !== 'done') {
    await updateStreak()
  }
```

- [ ] **Step 6: Run full test suite to verify no regressions**

```bash
npm run test:run
```
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/db/tasks.ts tests/lib/db/tasks.test.ts
git commit -m "feat: set completedAt and update streak when task is marked done"
```

---

## Task 7: AI Prompts for Phase 2

**Files:**
- Modify: `src/lib/ai/prompts.ts`
- Modify: `tests/lib/ai/prompts.test.ts`

- [ ] **Step 1: Add failing tests for the three new prompts**

Append to `tests/lib/ai/prompts.test.ts`:
```typescript
import {
  buildParseSystemPrompt,
  buildBreakdownSystemPrompt,
  buildScheduleSystemPrompt,
  buildPrioritizeSystemPrompt,
  buildWeeklySummarySystemPrompt,
} from '@/lib/ai/prompts'

describe('buildScheduleSystemPrompt', () => {
  it('returns a non-empty string', () => {
    const p = buildScheduleSystemPrompt()
    expect(p.length).toBeGreaterThan(50)
  })
  it('instructs JSON array output', () => {
    expect(buildScheduleSystemPrompt().toLowerCase()).toContain('json')
    expect(buildScheduleSystemPrompt().toLowerCase()).toContain('array')
  })
  it('mentions time slots', () => {
    expect(buildScheduleSystemPrompt().toLowerCase()).toContain('time')
  })
})

describe('buildPrioritizeSystemPrompt', () => {
  it('returns a non-empty string', () => {
    expect(buildPrioritizeSystemPrompt().length).toBeGreaterThan(50)
  })
  it('instructs JSON object with insight field', () => {
    expect(buildPrioritizeSystemPrompt().toLowerCase()).toContain('insight')
  })
})

describe('buildWeeklySummarySystemPrompt', () => {
  it('returns a non-empty string', () => {
    expect(buildWeeklySummarySystemPrompt().length).toBeGreaterThan(50)
  })
  it('instructs JSON object with summary field', () => {
    expect(buildWeeklySummarySystemPrompt().toLowerCase()).toContain('summary')
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:run tests/lib/ai/prompts.test.ts
```
Expected: existing 5 pass, 6 new ones fail.

- [ ] **Step 3: Add the three prompt builders to `src/lib/ai/prompts.ts`**

Append to the end of `src/lib/ai/prompts.ts`:
```typescript
export function buildScheduleSystemPrompt(): string {
  return `You are a productivity scheduler. Given a list of tasks with due dates and priorities, suggest the best time slot today for each task.
Always respond with a valid JSON array only — no prose, no markdown, no code fences.

Output format: [{"taskId":"string","taskTitle":"string","suggestedTime":"H:MMam","reason":"string"}]

Rules:
- Schedule between 8:00am and 6:00pm
- Earlier due dates get earlier slots
- High priority tasks get morning slots when possible
- Each task gets a unique time slot at least 1 hour apart
- Keep reason under 50 characters
- Sort output by suggestedTime ascending`
}

export function buildPrioritizeSystemPrompt(): string {
  return `You are a productivity coach. Given today's open tasks, write one short actionable insight.
Always respond with valid JSON only — no prose, no markdown, no code fences.

Output format: {"insight":"string"}

Rules:
- Maximum 120 characters
- Mention the most critical task by name
- Be specific and encouraging`
}

export function buildWeeklySummarySystemPrompt(): string {
  return `You are a productivity coach writing a weekly review summary.
Always respond with valid JSON only — no prose, no markdown, no code fences.

Output format: {"summary":"string"}

Rules:
- 2-3 sentences maximum
- Mention a specific achievement or stat
- If tasks remain open, encourage the user to tackle them next week
- Be warm and motivating`
}
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
npm run test:run tests/lib/ai/prompts.test.ts
```
Expected: `11 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/prompts.ts tests/lib/ai/prompts.test.ts
git commit -m "feat: add AI prompt builders for schedule, prioritize, and weekly_summary"
```

---

## Task 8: AI API Route + Client Extensions

**Files:**
- Modify: `src/app/api/ai/route.ts`
- Modify: `src/lib/ai/client.ts`

- [ ] **Step 1: Add three new actions to `src/app/api/ai/route.ts`**

After the existing `if (action === 'breakdown')` block (before the final `return NextResponse.json({ error: ...`), add:

```typescript
    if (action === 'schedule') {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: buildScheduleSystemPrompt(),
        messages: [{ role: 'user', content: input }],
      })
      const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
      const result = JSON.parse(text)
      return NextResponse.json({ action, result })
    }

    if (action === 'prioritize') {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: buildPrioritizeSystemPrompt(),
        messages: [{ role: 'user', content: input }],
      })
      const text = message.content[0].type === 'text' ? message.content[0].text : '{"insight":""}'
      const result = JSON.parse(text)
      return NextResponse.json({ action, result })
    }

    if (action === 'weekly_summary') {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: buildWeeklySummarySystemPrompt(),
        messages: [{ role: 'user', content: input }],
      })
      const text = message.content[0].type === 'text' ? message.content[0].text : '{"summary":""}'
      const result = JSON.parse(text)
      return NextResponse.json({ action, result })
    }
```

Also update the import at the top of the route file to include the new prompt builders:
```typescript
import {
  buildParseSystemPrompt,
  buildBreakdownSystemPrompt,
  buildScheduleSystemPrompt,
  buildPrioritizeSystemPrompt,
  buildWeeklySummarySystemPrompt,
} from '@/lib/ai/prompts'
```

And update the `AIAction` type in `src/types/ai.ts` to include the new actions:
```typescript
export type AIAction = 'parse' | 'breakdown' | 'schedule' | 'prioritize' | 'weekly_summary'
```

- [ ] **Step 2: Add three new client functions to `src/lib/ai/client.ts`**

Append to the end of `src/lib/ai/client.ts`:
```typescript
export async function callScheduleAI(tasks: Array<{ id: string; title: string; dueDate?: string; priority: string }>): Promise<import('@/types/stats').ScheduleItem[]> {
  const apiKey = await getSetting('claudeApiKey')
  if (!apiKey) throw new Error('NO_API_KEY')
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'schedule',
      apiKey,
      input: JSON.stringify({ tasks, currentTime }),
    }),
  })
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'AI call failed') }
  const data = await res.json()
  return data.result
}

export async function callPrioritizeAI(tasks: Array<{ id: string; title: string; dueDate?: string; priority: string }>): Promise<{ insight: string }> {
  const apiKey = await getSetting('claudeApiKey')
  if (!apiKey) throw new Error('NO_API_KEY')
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'prioritize',
      apiKey,
      input: JSON.stringify({ tasks, currentTime }),
    }),
  })
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'AI call failed') }
  const data = await res.json()
  return data.result
}

export async function callWeeklySummaryAI(input: import('@/types/stats').WeeklySummaryInput): Promise<{ summary: string }> {
  const apiKey = await getSetting('claudeApiKey')
  if (!apiKey) throw new Error('NO_API_KEY')
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'weekly_summary',
      apiKey,
      input: JSON.stringify(input),
    }),
  })
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'AI call failed') }
  const data = await res.json()
  return data.result
}
```

- [ ] **Step 3: Verify build is clean**

```bash
npm run build 2>&1 | tail -10
```
Expected: success, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/ai/route.ts src/lib/ai/client.ts src/types/ai.ts
git commit -m "feat: add schedule, prioritize, and weekly_summary AI actions"
```

---

## Task 9: FocusTimer Component

**Files:**
- Create: `src/components/focus/FocusTimer.tsx`
- Create: `tests/components/focus/FocusTimer.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/components/focus/FocusTimer.test.tsx`:
```typescript
import { render, screen, fireEvent, act } from '@testing-library/react'
import FocusTimer from '@/components/focus/FocusTimer'

vi.mock('@/lib/db/sessions', () => ({
  createSession: vi.fn().mockResolvedValue(undefined),
  getTodaysCompletedSessions: vi.fn().mockResolvedValue([]),
}))

describe('FocusTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders 25:00 as default', () => {
    render(<FocusTimer />)
    expect(screen.getByText('25:00')).toBeInTheDocument()
  })

  it('shows Start button initially', () => {
    render(<FocusTimer />)
    expect(screen.getByText('Start')).toBeInTheDocument()
  })

  it('changes to 15:00 when 15m is selected', () => {
    render(<FocusTimer />)
    fireEvent.click(screen.getByText('15m'))
    expect(screen.getByText('15:00')).toBeInTheDocument()
  })

  it('shows Pause after Start is clicked', () => {
    render(<FocusTimer />)
    fireEvent.click(screen.getByText('Start'))
    expect(screen.getByText('Pause')).toBeInTheDocument()
  })

  it('counts down after starting', () => {
    render(<FocusTimer />)
    fireEvent.click(screen.getByText('Start'))
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.getByText('24:59')).toBeInTheDocument()
  })

  it('resets to full duration on Reset', () => {
    render(<FocusTimer />)
    fireEvent.click(screen.getByText('Start'))
    act(() => { vi.advanceTimersByTime(5000) })
    fireEvent.click(screen.getByText('Reset'))
    expect(screen.getByText('25:00')).toBeInTheDocument()
    expect(screen.getByText('Start')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:run tests/components/focus/FocusTimer.test.tsx
```
Expected: FAIL — cannot find module `@/components/focus/FocusTimer`.

- [ ] **Step 3: Write FocusTimer**

Create `src/components/focus/FocusTimer.tsx`:
```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSession, getTodaysCompletedSessions } from '@/lib/db/sessions'
import type { FocusSession } from '@/types/stats'

const DURATION_OPTIONS = [15, 25, 45, 60]
const RADIUS = 60
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function FocusTimer() {
  const [duration, setDuration] = useState(25)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [todaySessions, setTodaySessions] = useState(0)

  const refreshSessions = useCallback(async () => {
    const sessions = await getTodaysCompletedSessions()
    setTodaySessions(sessions.length)
  }, [])

  useEffect(() => {
    refreshSessions()
  }, [refreshSessions])

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setRunning(false)
          if (startedAt) {
            const session: FocusSession = {
              id: crypto.randomUUID(),
              startedAt,
              durationMinutes: duration,
              completedAt: new Date().toISOString(),
            }
            createSession(session).then(refreshSessions)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [running, startedAt, duration, refreshSessions])

  function handleStart() {
    setStartedAt(new Date().toISOString())
    setRunning(true)
  }

  function handlePause() {
    setRunning(false)
  }

  function handleReset() {
    setRunning(false)
    setTimeLeft(duration * 60)
    setStartedAt(null)
  }

  function handleDurationChange(mins: number) {
    if (running) return
    setDuration(mins)
    setTimeLeft(mins * 60)
  }

  const progress = timeLeft / (duration * 60)
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Ring */}
      <div className="relative w-48 h-48">
        <svg width="192" height="192" viewBox="0 0 192 192">
          <circle cx="96" cy="96" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle
            cx="96" cy="96" r={RADIUS}
            fill="none"
            stroke="url(#timerGrad)"
            strokeWidth="10"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 96 96)"
          />
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white tracking-tight">{formatTime(timeLeft)}</span>
          <span className="text-xs text-white/40 mt-1">remaining</span>
        </div>
      </div>

      {/* Duration picker */}
      <div className="flex gap-2">
        {DURATION_OPTIONS.map(mins => (
          <button
            key={mins}
            onClick={() => handleDurationChange(mins)}
            disabled={running}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              duration === mins
                ? 'gradient-bg text-white font-semibold'
                : 'glass glass-hover text-white/50 disabled:opacity-40'
            }`}
          >
            {mins}m
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="glass glass-hover px-4 py-2 rounded-xl text-sm text-white/50"
        >
          Reset
        </button>
        <button
          onClick={running ? handlePause : handleStart}
          className="gradient-bg px-6 py-2 rounded-xl text-sm font-semibold text-white"
        >
          {running ? 'Pause' : 'Start'}
        </button>
      </div>

      {/* Session dots */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${i < todaySessions ? 'gradient-bg' : 'bg-white/10'}`}
            />
          ))}
        </div>
        <p className="text-xs text-white/30">{todaySessions} of 4 sessions today</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run tests/components/focus/FocusTimer.test.tsx
```
Expected: `6 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/components/focus/FocusTimer.tsx tests/components/focus/FocusTimer.test.tsx
git commit -m "feat: add FocusTimer component with circular ring and session tracking"
```

---

## Task 10: Focus Page

**Files:**
- Modify: `src/app/focus/page.tsx`

- [ ] **Step 1: Replace the stub**

Replace the full contents of `src/app/focus/page.tsx`:
```tsx
import FocusTimer from '@/components/focus/FocusTimer'

export default function FocusPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
      <h1 className="text-xl font-semibold text-white/80 mb-2">Focus</h1>
      <p className="text-sm text-white/40 mb-8">Set a duration and start your session.</p>
      <FocusTimer />
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -8
```
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/app/focus/page.tsx
git commit -m "feat: implement Focus page with FocusTimer"
```

---

## Task 11: SchedulePanel + InsightPanel Components

**Files:**
- Create: `src/components/ai/SchedulePanel.tsx`
- Create: `src/components/ai/InsightPanel.tsx`
- Create: `tests/components/ai/SchedulePanel.test.tsx`
- Create: `tests/components/ai/InsightPanel.test.tsx`

- [ ] **Step 1: Write failing test for SchedulePanel**

Create `tests/components/ai/SchedulePanel.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import SchedulePanel from '@/components/ai/SchedulePanel'
import type { ScheduleItem } from '@/types/stats'

const items: ScheduleItem[] = [
  { taskId: '1', taskTitle: 'Fix login bug', suggestedTime: '9:00am', reason: 'Due today, high priority' },
  { taskId: '2', taskTitle: 'Write blog post', suggestedTime: '2:00pm', reason: 'Due tomorrow' },
]

describe('SchedulePanel', () => {
  it('renders loading state', () => {
    render(<SchedulePanel items={null} loading={true} error={null} onRegenerate={() => {}} />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders schedule items when loaded', () => {
    render(<SchedulePanel items={items} loading={false} error={null} onRegenerate={() => {}} />)
    expect(screen.getByText('Fix login bug')).toBeInTheDocument()
    expect(screen.getByText('9:00am')).toBeInTheDocument()
    expect(screen.getByText('Write blog post')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(<SchedulePanel items={null} loading={false} error="AI call failed" onRegenerate={() => {}} />)
    expect(screen.getByText('AI call failed')).toBeInTheDocument()
  })

  it('renders no-key nudge when items is undefined', () => {
    render(<SchedulePanel items={undefined} loading={false} error={null} onRegenerate={() => {}} />)
    expect(screen.getByText(/API key/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Write failing test for InsightPanel**

Create `tests/components/ai/InsightPanel.test.tsx`:
```typescript
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

  it('renders no-key nudge when insight is undefined', () => {
    render(<InsightPanel insight={undefined} loading={false} error={null} />)
    expect(screen.getByText(/API key/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run to verify they fail**

```bash
npm run test:run tests/components/ai/
```
Expected: FAIL — cannot find modules.

- [ ] **Step 4: Write SchedulePanel**

Create `src/components/ai/SchedulePanel.tsx`:
```tsx
import type { ScheduleItem } from '@/types/stats'
import GlassCard from '@/components/ui/GlassCard'

interface SchedulePanelProps {
  items: ScheduleItem[] | null | undefined
  loading: boolean
  error: string | null
  onRegenerate: () => void
}

export default function SchedulePanel({ items, loading, error, onRegenerate }: SchedulePanelProps) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">✨ Today's Schedule</p>
        {items && (
          <button onClick={onRegenerate} className="text-xs text-white/40 hover:text-white/70 transition-colors">
            ↺ Regenerate
          </button>
        )}
      </div>

      {loading && <p className="text-sm text-white/40">Loading schedule...</p>}
      {error && <p className="text-sm text-red-400/80">{error}</p>}
      {items === undefined && !loading && !error && (
        <p className="text-sm text-white/40">Set up your Claude API key to enable AI scheduling.</p>
      )}
      {items && items.length === 0 && (
        <p className="text-sm text-white/40">No open tasks to schedule — great work!</p>
      )}
      {items && items.length > 0 && (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.taskId} className="flex items-start gap-3">
              <span className="text-xs text-purple-400 font-mono mt-0.5 shrink-0">{item.suggestedTime}</span>
              <span className="text-sm text-white/80">{item.taskTitle}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  )
}
```

- [ ] **Step 5: Write InsightPanel**

Create `src/components/ai/InsightPanel.tsx`:
```tsx
import GlassCard from '@/components/ui/GlassCard'

interface InsightPanelProps {
  insight: string | null | undefined
  loading: boolean
  error: string | null
}

export default function InsightPanel({ insight, loading, error }: InsightPanelProps) {
  return (
    <GlassCard className="p-5">
      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">💡 Priority Insight</p>
      {loading && <p className="text-sm text-white/40">Loading insight...</p>}
      {error && <p className="text-sm text-red-400/80">{error}</p>}
      {insight === undefined && !loading && !error && (
        <p className="text-sm text-white/40">Set up your Claude API key to enable AI insights.</p>
      )}
      {insight && (
        <p className="text-sm text-white/75 leading-relaxed">{insight}</p>
      )}
    </GlassCard>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm run test:run tests/components/ai/
```
Expected: `7 passed`.

- [ ] **Step 7: Commit**

```bash
git add src/components/ai/ tests/components/ai/
git commit -m "feat: add SchedulePanel and InsightPanel AI components"
```

---

## Task 12: AI Assistant Page

**Files:**
- Modify: `src/app/ai/page.tsx`

- [ ] **Step 1: Replace the stub**

Replace the full contents of `src/app/ai/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { getAllTasks } from '@/lib/db/tasks'
import { callScheduleAI, callPrioritizeAI, hasApiKey } from '@/lib/ai/client'
import SchedulePanel from '@/components/ai/SchedulePanel'
import InsightPanel from '@/components/ai/InsightPanel'
import type { ScheduleItem } from '@/types/stats'
import type { Task } from '@/types/task'

function toScheduleInput(tasks: Task[]) {
  return tasks
    .filter(t => t.status !== 'done')
    .sort((a, b) => (a.dueDate ?? '9999') < (b.dueDate ?? '9999') ? -1 : 1)
    .map(t => ({ id: t.id, title: t.title, dueDate: t.dueDate, priority: t.priority }))
}

export default function AIPage() {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[] | null | undefined>(undefined)
  const [insight, setInsight] = useState<string | null | undefined>(undefined)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [insightLoading, setInsightLoading] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [insightError, setInsightError] = useState<string | null>(null)

  async function loadAI() {
    const hasKey = await hasApiKey()
    if (!hasKey) return // leave as undefined — panels show nudge

    const tasks = await getAllTasks()
    const input = toScheduleInput(tasks)

    if (input.length === 0) {
      setScheduleItems([])
      setInsight(null)
      return
    }

    setScheduleLoading(true)
    setInsightLoading(true)

    callScheduleAI(input)
      .then(items => { setScheduleItems(items); setScheduleLoading(false) })
      .catch(err => { setScheduleError(err.message); setScheduleLoading(false) })

    callPrioritizeAI(input)
      .then(res => { setInsight(res.insight); setInsightLoading(false) })
      .catch(err => { setInsightError(err.message); setInsightLoading(false) })
  }

  useEffect(() => {
    loadAI()
  }, [])

  return (
    <div className="p-6 max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-white/80">AI Assistant</h1>
      <p className="text-sm text-white/40">Smart scheduling and priority insights for today.</p>
      <SchedulePanel
        items={scheduleItems}
        loading={scheduleLoading}
        error={scheduleError}
        onRegenerate={loadAI}
      />
      <InsightPanel
        insight={insight}
        loading={insightLoading}
        error={insightError}
      />
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -8
```
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/app/ai/page.tsx
git commit -m "feat: implement AI Assistant page with schedule and insight panels"
```

---

## Task 13: Stats Components

**Files:**
- Create: `src/components/stats/StreakCard.tsx`
- Create: `src/components/stats/WeekChart.tsx`
- Create: `src/components/stats/WeekSummary.tsx`
- Create: `tests/components/stats/StreakCard.test.tsx`
- Create: `tests/components/stats/WeekChart.test.tsx`
- Create: `tests/components/stats/WeekSummary.test.tsx`

- [ ] **Step 1: Write failing tests for StreakCard**

Create `tests/components/stats/StreakCard.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import StreakCard from '@/components/stats/StreakCard'

describe('StreakCard', () => {
  it('renders the streak count', () => {
    render(<StreakCard streak={12} completionRate={87} />)
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('renders the completion rate', () => {
    render(<StreakCard streak={12} completionRate={87} />)
    expect(screen.getByText('87%')).toBeInTheDocument()
  })

  it('renders streak label', () => {
    render(<StreakCard streak={1} completionRate={50} />)
    expect(screen.getByText(/streak/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Write failing tests for WeekChart**

Create `tests/components/stats/WeekChart.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import WeekChart from '@/components/stats/WeekChart'

describe('WeekChart', () => {
  it('renders all 7 day labels', () => {
    render(<WeekChart data={[3, 5, 2, 7, 1, 0, 0]} />)
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByText('W')).toBeInTheDocument()
    expect(screen.getByText('F')).toBeInTheDocument()
  })

  it('renders total tasks completed', () => {
    render(<WeekChart data={[3, 5, 2, 7, 1, 0, 0]} />)
    expect(screen.getByText('18')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Write failing tests for WeekSummary**

Create `tests/components/stats/WeekSummary.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import WeekSummary from '@/components/stats/WeekSummary'

vi.mock('@/lib/ai/client', () => ({
  callWeeklySummaryAI: vi.fn().mockResolvedValue({ summary: 'You crushed 10 tasks this week!' }),
  hasApiKey: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/db/weekly-summary', () => ({
  getWeeklySummary: vi.fn().mockResolvedValue(null),
  saveWeeklySummary: vi.fn().mockResolvedValue(undefined),
}))

describe('WeekSummary', () => {
  it('shows loading initially', () => {
    render(<WeekSummary tasksCompleted={10} completionRate={80} completedTasks={[]} />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows AI summary after generation', async () => {
    render(<WeekSummary tasksCompleted={10} completionRate={80} completedTasks={[]} />)
    expect(await screen.findByText('You crushed 10 tasks this week!')).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run to verify they fail**

```bash
npm run test:run tests/components/stats/
```
Expected: FAIL — cannot find modules.

- [ ] **Step 5: Write StreakCard**

Create `src/components/stats/StreakCard.tsx`:
```tsx
interface StreakCardProps {
  streak: number
  completionRate: number
}

export default function StreakCard({ streak, completionRate }: StreakCardProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="glass rounded-xl p-4 text-center">
        <p className="text-4xl font-bold gradient-text">🔥 {streak}</p>
        <p className="text-xs text-white/40 mt-1">Day streak</p>
      </div>
      <div className="glass rounded-xl p-4 text-center">
        <p className="text-4xl font-bold text-green-400">{completionRate}%</p>
        <p className="text-xs text-white/40 mt-1">This week</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Write WeekChart**

Create `src/components/stats/WeekChart.tsx`:
```tsx
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

interface WeekChartProps {
  data: number[] // 7 values, Mon–Sun
}

export default function WeekChart({ data }: WeekChartProps) {
  const max = Math.max(...data, 1)
  const total = data.reduce((a, b) => a + b, 0)

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-white/40 uppercase tracking-wider">Tasks completed</p>
        <p className="text-sm font-semibold text-white/70">{total}</p>
      </div>
      <div className="flex items-end gap-1.5 h-16">
        {data.map((count, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className="w-full rounded-sm gradient-bg"
              style={{
                height: `${(count / max) * 52}px`,
                opacity: count === 0 ? 0.15 : 1,
                background: count === 0 ? 'rgba(255,255,255,0.1)' : undefined,
                minHeight: '3px',
              }}
            />
            <span className="text-xs text-white/30">{DAY_LABELS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Write WeekSummary**

Create `src/components/stats/WeekSummary.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { callWeeklySummaryAI, hasApiKey } from '@/lib/ai/client'
import { getWeeklySummary, saveWeeklySummary } from '@/lib/db/weekly-summary'
import { getWeekKey } from '@/lib/utils/date'
import GlassCard from '@/components/ui/GlassCard'

interface WeekSummaryProps {
  tasksCompleted: number
  completionRate: number
  completedTasks: Array<{ title: string; completedAt: string }>
}

export default function WeekSummary({ tasksCompleted, completionRate, completedTasks }: WeekSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [stale, setStale] = useState(false)

  useEffect(() => {
    async function load() {
      const weekKey = getWeekKey()
      const stored = await getWeeklySummary(weekKey)

      if (stored) {
        setSummary(stored.summary)
        setLoading(false)
        return
      }

      const hasKey = await hasApiKey()
      if (!hasKey) {
        setSummary(null)
        setLoading(false)
        return
      }

      try {
        const res = await callWeeklySummaryAI({
          completedTasks,
          tasksCompleted,
          completionRate,
          weekKey,
        })
        await saveWeeklySummary({
          weekKey,
          generatedAt: new Date().toISOString(),
          summary: res.summary,
          tasksCompleted,
          completionRate,
        })
        setSummary(res.summary)
      } catch {
        const prev = await getWeeklySummary(weekKey)
        if (prev) { setSummary(prev.summary); setStale(true) }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tasksCompleted, completionRate, completedTasks])

  return (
    <GlassCard className="p-5" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.12))', borderColor: 'rgba(167,139,250,0.2)' }}>
      <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">
        ✨ Week in Review {stale && <span className="text-white/30 normal-case">(last week)</span>}
      </p>
      {loading && <p className="text-sm text-white/40">Loading summary...</p>}
      {!loading && !summary && (
        <p className="text-sm text-white/40">Set up your Claude API key to generate weekly summaries.</p>
      )}
      {summary && <p className="text-sm text-white/75 leading-relaxed">{summary}</p>}
    </GlassCard>
  )
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npm run test:run tests/components/stats/
```
Expected: `7 passed`.

- [ ] **Step 9: Commit**

```bash
git add src/components/stats/ tests/components/stats/
git commit -m "feat: add StreakCard, WeekChart, and WeekSummary stats components"
```

---

## Task 14: Stats Page

**Files:**
- Modify: `src/app/stats/page.tsx`

- [ ] **Step 1: Replace the stub**

Replace the full contents of `src/app/stats/page.tsx`:
```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAllTasks } from '@/lib/db/tasks'
import { getStreakData } from '@/lib/db/streak'
import { getWeekBounds } from '@/lib/utils/date'
import StreakCard from '@/components/stats/StreakCard'
import WeekChart from '@/components/stats/WeekChart'
import WeekSummary from '@/components/stats/WeekSummary'
import type { Task } from '@/types/task'

function buildWeekData(tasks: Task[]): number[] {
  const { start } = getWeekBounds()
  const data = [0, 0, 0, 0, 0, 0, 0]
  tasks.forEach(task => {
    if (!task.completedAt) return
    const completedDate = new Date(task.completedAt)
    const dayIndex = Math.floor((completedDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (dayIndex >= 0 && dayIndex < 7) data[dayIndex]++
  })
  return data
}

export default function StatsPage() {
  const [streak, setStreak] = useState(0)
  const [weekData, setWeekData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
  const [completionRate, setCompletionRate] = useState(0)
  const [completedTasks, setCompletedTasks] = useState<Array<{ title: string; completedAt: string }>>([])
  const [tasksCompleted, setTasksCompleted] = useState(0)

  const load = useCallback(async () => {
    const [tasks, streakData] = await Promise.all([getAllTasks(), getStreakData()])
    const { start, end } = getWeekBounds()

    const thisWeekTasks = tasks.filter(t => {
      const date = new Date(t.createdAt)
      return date >= start && date <= end
    })
    const thisWeekCompleted = tasks.filter(t => {
      if (!t.completedAt) return false
      const date = new Date(t.completedAt)
      return date >= start && date <= end
    })

    const rate = thisWeekTasks.length > 0
      ? Math.round((thisWeekCompleted.length / thisWeekTasks.length) * 100)
      : 0

    setStreak(streakData.streak)
    setWeekData(buildWeekData(tasks))
    setCompletionRate(rate)
    setTasksCompleted(thisWeekCompleted.length)
    setCompletedTasks(
      thisWeekCompleted
        .filter(t => t.completedAt)
        .map(t => ({ title: t.title, completedAt: t.completedAt! }))
    )
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="p-6 max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-white/80">Stats</h1>
      <StreakCard streak={streak} completionRate={completionRate} />
      <WeekChart data={weekData} />
      <WeekSummary
        tasksCompleted={tasksCompleted}
        completionRate={completionRate}
        completedTasks={completedTasks}
      />
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -8
```
Expected: success.

- [ ] **Step 3: Run full test suite**

```bash
npm run test:run
```
Expected: all tests pass (33 existing + new ones from Phase 2).

- [ ] **Step 4: Commit**

```bash
git add src/app/stats/page.tsx
git commit -m "feat: implement Stats page with streak, chart, and AI weekly summary"
```

---

## Phase 2 Complete

At this point the app has:

- ✅ Flexible Pomodoro timer (15/25/45/60 min) with session tracking
- ✅ AI Assistant page with schedule suggestions and priority insight
- ✅ Stats page with streak counter, completion rate, weekly bar chart, and AI weekly summary
- ✅ Task completion timestamps (`completedAt`) driving all stats
- ✅ Automatic streak updates on task completion
- ✅ All AI features degrade gracefully without an API key

**Run all tests before declaring done:**

```bash
npm run test:run
```

**Next:** Phase 3 — optional Supabase cloud sync, push notifications, AI daily briefing.
