# FlowTask — AI-Powered To Do List App — Design Spec
**Date:** 2026-05-04  
**Status:** Approved

---

## Overview

A personal productivity web app (PWA) that combines an AI brain, a kanban board, and focus tools into one visually distinctive experience. The differentiator: it's not just a list — it understands what you write, helps you prioritize, and guides your focus.

**Target user:** Individuals — students, freelancers, general users managing personal tasks.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack in one project, great PWA support |
| Styling | Tailwind CSS + Framer Motion | Fast styling + fluid animations |
| Drag & Drop | dnd-kit | Accessible, performant kanban DnD |
| PWA | next-pwa | Installable, offline-capable |
| AI | Anthropic Claude API | Best-in-class natural language understanding |
| Local storage | IndexedDB via `idb` | Fast, structured, offline-first |
| Cloud sync (optional) | Supabase | Auth + real-time sync, zero backend to manage |

---

## Visual Design

- **Theme:** Dark navy base (`#0f0f0f` → `#1a1a2e` → `#16213e`)
- **Cards:** Glassmorphism — `rgba(255,255,255,0.07)` background, `1px solid rgba(255,255,255,0.1)` border, `backdrop-filter: blur`
- **Accents:** Purple-to-pink gradient (`#7c3aed` → `#ec4899`) for AI elements; green (`#34d399`) for streaks/completions
- **Typography:** System font stack, clean hierarchy
- **Motion:** Framer Motion for card transitions, column drops, AI panel reveals

---

## Layout

### Sidebar (icon strip, collapsible)
Five navigation destinations, icon-only by default, label on hover:

| Icon | View | Purpose |
|---|---|---|
| 🏠 | Today | Daily dashboard — tasks with `dueDate === today` + AI prioritization suggestion |
| 📋 | Board | Full kanban — main workspace |
| ⏱ | Focus | Pomodoro timer + active task |
| ✨ | AI Assistant | Chat-style AI for breakdown, scheduling |
| 📊 | Stats | Streak, completion rate, weekly summary |

### Main Area — Kanban Board (default view on first open)
Three columns: **To Do** / **In Progress** / **Done**

- Tasks rendered as glassmorphism cards with title, priority badge, due date, tag chips
- Drag cards across columns with dnd-kit
- Quick-add bar at the top: natural language input powered by Claude
- Column task counts shown in header

---

## Data Model

### Task
```ts
interface Task {
  id: string                          // uuid
  title: string
  description?: string
  status: 'todo' | 'inprogress' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string                    // ISO date string
  tags: string[]
  subtasks: Subtask[]                 // embedded, not separate records
  estimatedMinutes?: number
  createdAt: string
  updatedAt: string
}

interface Subtask {
  id: string
  title: string
  done: boolean
}
```

### Settings (stored in `settings` object store)
```ts
interface Settings {
  claudeApiKey?: string               // user-provided, stored locally
  theme: 'dark'                       // dark only for v1
  focusDuration: number               // default 25 minutes
  breakDuration: number               // default 5 minutes
  streak: number
  lastActiveDate: string
}
```

### IndexedDB Structure
- Database: `flowtask-db`
- Object store 1: `tasks` — keyed by `id`
- Object store 2: `settings` — keyed by setting name

---

## AI Integration

All AI features route through a single Next.js API route: `POST /api/ai`

### Actions

**`parse`** — Natural language → structured task  
Input: raw string like `"dentist Friday 3pm remind me 2 hours before"`  
Output: `{ title, dueDate, priority, tags, reminderOffset }` — `reminderOffset` is captured in Phase 1 but push notifications that act on it ship in Phase 3

**`breakdown`** — Goal → subtasks  
Input: vague task title like `"launch my app"`  
Output: array of 3–7 concrete subtask titles

**`prioritize`** — Smart daily ranking  
Input: all open tasks + current datetime  
Output: ordered task IDs with reasoning note per task

**`schedule`** — Time slot suggestions  
Input: open tasks with estimates + current time  
Output: `[{ taskId, suggestedTime, reason }]`

### API Call Design
- Claude model: `claude-haiku-4-5-20251001` for `parse` (fast, cheap) — `claude-sonnet-4-6` for `breakdown`, `prioritize`, `schedule`
- Max ~500 tokens per call — only relevant task data sent, never full history
- User provides their own Claude API key (stored in IndexedDB `settings`, never sent to any server other than Anthropic)
- Prompt caching enabled on system prompts to reduce cost on repeated calls

---

## Feature Phases

### Phase 1 — MVP
- Kanban board with drag & drop (To Do / In Progress / Done)
- Icon sidebar with view navigation
- Dark glassmorphism UI
- Natural language task input (AI `parse`)
- Task breakdown (AI `breakdown`)
- Local-first storage via IndexedDB
- PWA manifest + service worker (installable, offline)

### Phase 2 — AI + Focus
- Smart scheduling suggestions (AI `schedule`)
- Daily auto-prioritization (AI `prioritize`)
- Focus mode with Pomodoro timer
- Productivity stats, streak counter
- Weekly AI summary review

### Phase 3 — Sync & Polish
- Optional Supabase account creation
- Cross-device sync via Supabase Realtime
- Push notifications for due dates
- AI daily briefing notification

---

## Offline & Error Handling

- All reads/writes go to IndexedDB first — UI never waits on network
- AI features degrade gracefully: if no API key is set, the quick-add bar works as plain text input; AI buttons show "Set up AI" nudge
- If a Claude API call fails, the error is shown inline (not a full-page error) — the task is still created with whatever fields the user typed
- Supabase sync failures are queued and retried silently on next app open

---

## Testing Approach

- **Unit tests:** Task data helpers, AI prompt builders, IndexedDB read/write — with Vitest
- **Component tests:** Kanban card, column, sidebar — with React Testing Library
- **E2E tests (Phase 2):** Core flows (add task, drag to done, AI breakdown) — with Playwright
- AI responses are mocked in tests — no live API calls in CI
