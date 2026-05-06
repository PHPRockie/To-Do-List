# FlowTask Phase 2 — AI + Focus Design Spec
**Date:** 2026-05-04
**Status:** Approved

---

## Overview

Phase 2 adds three fully functional views to FlowTask: a flexible focus timer, an AI scheduling assistant, and a productivity stats page. It also tracks task completion timestamps for streak calculation and weekly summaries. All features build on the existing AI infrastructure (`/api/ai`, `client.ts`, `prompts.ts`) and IndexedDB layer.

---

## New Features

### 1. Focus Mode (`/focus`)
A flexible Pomodoro-style timer the user controls entirely. No task linking — the timer is a standalone focus tool.

- Duration options: **15 / 25 / 45 / 60 minutes** (tap to select)
- Controls: Start, Pause, Reset
- Circular progress ring with gradient stroke (purple → pink)
- Dot indicators showing sessions completed today (from `sessions` store)
- Session saved to IndexedDB only when timer completes naturally (not on cancel/reset)
- No AI involved — purely client-side `setInterval`

### 2. AI Assistant (`/ai`)
Shows two AI-powered panels generated on page load, cached for the session (no re-fetch on navigation).

**Today's Schedule panel** — Claude (`schedule` action) receives today's open tasks sorted by `dueDate` ascending and returns time slot suggestions:
```
9:00am — Fix login bug
11:00am — Review PRs
2:00pm — Write blog post
```
A "Regenerate" button re-calls the API.

**Priority Insight panel** — Claude (`prioritize` action) receives today's open tasks and returns a single sentence of reasoning ("3 tasks due today — tackle the login bug first while your focus is sharpest").

Both panels degrade gracefully: if no API key is set, show a "Set up Claude API key in settings to enable AI" nudge.

### 3. Stats (`/stats`)
Always-visible stats page with four sections:

- **Streak counter** — days in a row with at least one task completed (big gradient number)
- **Weekly completion rate** — tasks completed this week ÷ tasks created this week (as %)
- **Bar chart** — tasks completed per day for the current week (Mon–Sun), built from `completedAt` field
- **Week in Review** — AI-generated 2-3 sentence narrative, regenerated once per week (Monday), stored in `weekly_summary` store

---

## Data Model Additions

### New field on `Task`
```ts
interface Task {
  // ... all existing fields ...
  completedAt?: string  // ISO timestamp — set when status changes to 'done'
}
```

### New IndexedDB object store: `sessions`
```ts
interface FocusSession {
  id: string
  startedAt: string
  durationMinutes: number
  completedAt?: string  // only set when timer completes naturally
}
```

### New IndexedDB object store: `weekly_summary`
```ts
interface WeeklySummary {
  weekKey: string       // "YYYY-WNN" — ISO week, e.g. "2026-W19"
  generatedAt: string
  summary: string       // AI-generated narrative
  tasksCompleted: number
  completionRate: number
}
```

### Streak logic (in `src/lib/db/streak.ts`)
On every task completion, call `updateStreak()`:
- If `lastActiveDate` === today → no change
- If `lastActiveDate` === yesterday → `streak += 1`, update `lastActiveDate`
- Otherwise → `streak = 1`, update `lastActiveDate`

`lastActiveDate` and `streak` already exist in the `Settings` type.

---

## AI Integration

### New actions in `/api/ai`

**`schedule`** — `claude-haiku-4-5-20251001`, `max_tokens: 512`
- Input: `{ tasks: [{id, title, dueDate, priority}], currentTime: string }`
- Output: `[{ taskId, taskTitle, suggestedTime, reason }]`
- System prompt: instructs JSON array, time slots between 8am–6pm, sorted by dueDate

**`prioritize`** — `claude-haiku-4-5-20251001`, `max_tokens: 256`
- Input: `{ tasks: [{id, title, dueDate, priority}], currentTime: string }`
- Output: `{ insight: string }` — one sentence, ≤ 120 chars
- System prompt: instructs single JSON object with `insight` field

**`weekly_summary`** — `claude-sonnet-4-6`, `max_tokens: 512`
- Input: `{ completedTasks: [{title, completedAt}], tasksCompleted: number, completionRate: number, weekKey: string }`
- Output: `{ summary: string }` — 2-3 sentences, encouraging tone
- System prompt: instructs single JSON object with `summary` field

### New client functions in `src/lib/ai/client.ts`
```ts
callScheduleAI(tasks: Task[]): Promise<ScheduleItem[]>
callPrioritizeAI(tasks: Task[]): Promise<{ insight: string }>
callWeeklySummaryAI(data: WeeklySummaryInput): Promise<{ summary: string }>
```

---

## New Files

```
src/
├── app/
│   ├── focus/page.tsx          # Replace stub — Pomodoro timer
│   ├── ai/page.tsx             # Replace stub — schedule + prioritize panels
│   └── stats/page.tsx          # Replace stub — streak, chart, summary
├── components/
│   ├── focus/
│   │   └── FocusTimer.tsx      # Timer ring, duration picker, controls
│   ├── ai/
│   │   ├── SchedulePanel.tsx   # Today's time slots from AI
│   │   └── InsightPanel.tsx    # One-line priority insight from AI
│   └── stats/
│       ├── StreakCard.tsx       # Streak + completion rate cards
│       ├── WeekChart.tsx        # Bar chart (Mon–Sun)
│       └── WeekSummary.tsx      # AI-generated narrative card
├── lib/
│   ├── db/
│   │   ├── sessions.ts         # FocusSession CRUD
│   │   ├── weekly-summary.ts   # WeeklySummary get/set
│   │   └── streak.ts           # updateStreak(), getStreakData()
│   └── ai/
│       └── prompts.ts          # Add buildScheduleSystemPrompt(), buildPrioritizeSystemPrompt(), buildWeeklySummarySystemPrompt()
└── types/
    └── stats.ts                # FocusSession, WeeklySummary, ScheduleItem, WeeklySummaryInput interfaces
```

---

## Modified Files

| File | Change |
|---|---|
| `src/types/task.ts` | Add `completedAt?: string` |
| `src/lib/db/index.ts` | Add `sessions` + `weekly_summary` object stores |
| `src/lib/db/tasks.ts` | `updateTask` sets `completedAt` when status → `done` |
| `src/app/api/ai/route.ts` | Add `schedule`, `prioritize`, `weekly_summary` actions |
| `src/lib/ai/client.ts` | Add `callScheduleAI`, `callPrioritizeAI`, `callWeeklySummaryAI` |
| `src/lib/ai/prompts.ts` | Add 3 new system prompt builders |

---

## Error Handling

- **No API key:** AI panels show a nudge card ("Set up your Claude API key to enable AI scheduling") — no error, no crash
- **AI call fails:** Show inline error message inside the panel, keep a "Retry" button visible
- **Weekly summary stale:** If `generatedAt` is from a prior week, regenerate on Stats page load; if regeneration fails, show last summary with a "Last week's summary" label
- **Focus timer interrupted:** If user navigates away mid-session, the session is discarded (not saved) — only completed sessions count

---

## Testing

- **Unit:** `updateStreak()` logic (all 3 cases), `sessions` CRUD, `weekly_summary` get/set, new AI prompt builders
- **Component:** `FocusTimer` (start/pause/reset state), `StreakCard` (correct number rendered), `WeekChart` (correct bars per day)
- **AI mocked in all tests** — no live API calls in CI
