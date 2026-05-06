# FlowTask Phase 3a — Supabase Auth + Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional Supabase cloud sync and email/password auth to FlowTask without breaking any existing functionality.

**Architecture:** IndexedDB stays the source of truth. Supabase is a backup layer — sync is additive. An `AuthProvider` React context wraps the app, restores session on load, and triggers `syncAll()` on sign-in and app open. Local always wins on conflict. The Claude API key never leaves the device.

**Tech Stack:** `@supabase/supabase-js`, Next.js 16 App Router, React Context, Vitest + RTL (Supabase mocked in all tests)

---

## Supabase Project Setup (manual — do this before Task 1)

In your Supabase dashboard, run this SQL in the SQL editor:

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users access own tasks" ON tasks
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users access own settings" ON user_settings
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

Then copy your project URL and anon key — you'll need them in Task 1.

---

## File Map

```
flowtask/src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts              NEW — Supabase client singleton
│   │   └── sync.ts                NEW — syncAll, syncTasks, syncSettings
│   └── auth/
│       └── index.ts               NEW — signIn, signUp, signOut, getSession, onAuthChange
├── context/
│   └── AuthContext.tsx            NEW — AuthProvider + useAuth hook
├── components/
│   └── auth/
│       ├── AuthModal.tsx          NEW — sign-in/sign-up form
│       └── SyncStatus.tsx         NEW — sync status dot
└── app/
    └── settings/
        └── page.tsx               NEW — account + sync + API key page

flowtask/tests/
├── lib/
│   ├── supabase/
│   │   └── sync.test.ts           NEW
│   └── auth/
│       └── auth.test.ts           NEW
└── components/
    └── auth/
        ├── AuthModal.test.tsx     NEW
        └── SyncStatus.test.tsx    NEW
```

**Modified files:**
- `src/types/settings.ts` — add `supabaseUserId?: string` and `lastSyncedAt?: string`
- `src/lib/db/settings.ts` — add defaults for new fields
- `src/app/layout.tsx` — wrap with `AuthProvider`
- `src/components/layout/Sidebar.tsx` — add ⚙️ settings link + `SyncStatus` dot

---

## Task 1: Supabase Install + Client + Env

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `.env.local`

- [ ] **Step 1: Install Supabase client**

```bash
cd flowtask && npm install @supabase/supabase-js
```

Expected: installed without errors.

- [ ] **Step 2: Create `.env.local` with your Supabase credentials**

Create `.env.local` in the `flowtask/` root:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the placeholder values with your actual Supabase project URL and anon key.

- [ ] **Step 3: Verify `.env.local` is gitignored**

```bash
grep -n "\.env" .gitignore
```

Expected: `.env*.local` or `.env.local` appears in the output. If not, add `.env.local` to `.gitignore`.

- [ ] **Step 4: Create the Supabase client singleton**

Create `src/lib/supabase/client.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/client.ts
git commit -m "chore: add Supabase client and env setup"
```

(Do NOT commit `.env.local` — it must stay gitignored.)

---

## Task 2: Settings Type Update

**Files:**
- Modify: `src/types/settings.ts`
- Modify: `src/lib/db/settings.ts`

- [ ] **Step 1: Add two new fields to `src/types/settings.ts`**

Replace the full contents:
```typescript
export interface Settings {
  claudeApiKey?: string
  theme: 'dark'
  focusDuration: number
  breakDuration: number
  streak: number
  lastActiveDate: string
  supabaseUserId?: string
  lastSyncedAt?: string
}
```

- [ ] **Step 2: Add defaults for new fields in `src/lib/db/settings.ts`**

Replace the `DEFAULTS` constant:
```typescript
const DEFAULTS: Settings = {
  theme: 'dark',
  focusDuration: 25,
  breakDuration: 5,
  streak: 0,
  lastActiveDate: '',
  supabaseUserId: undefined,
  lastSyncedAt: undefined,
}
```

- [ ] **Step 3: Run full test suite to verify no regressions**

```bash
npm run test:run
```

Expected: all 78 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/types/settings.ts src/lib/db/settings.ts
git commit -m "feat: add supabaseUserId and lastSyncedAt to Settings type"
```

---

## Task 3: Auth Module

**Files:**
- Create: `src/lib/auth/index.ts`
- Create: `tests/lib/auth/auth.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/auth/auth.test.ts`:
```typescript
import { signIn, signUp, signOut, getSession } from '@/lib/auth'

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

import { supabase } from '@/lib/supabase/client'

describe('signIn', () => {
  it('returns user on success', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' }, session: {} as never },
      error: null,
    } as never)
    const user = await signIn('test@test.com', 'password123')
    expect(user.id).toBe('user-1')
    expect(user.email).toBe('test@test.com')
  })

  it('throws on auth error', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' } as never,
    } as never)
    await expect(signIn('bad@test.com', 'wrong')).rejects.toThrow('Invalid login credentials')
  })
})

describe('signOut', () => {
  it('calls supabase.auth.signOut', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })
    await signOut()
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})

describe('getSession', () => {
  it('returns null when no session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never)
    const result = await getSession()
    expect(result).toBeNull()
  })

  it('returns user when session exists', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: { user: { id: 'user-1', email: 'test@test.com' } },
      },
      error: null,
    } as never)
    const result = await getSession()
    expect(result?.id).toBe('user-1')
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:run tests/lib/auth/auth.test.ts
```

Expected: FAIL — cannot find module `@/lib/auth`.

- [ ] **Step 3: Write the auth module**

Create `src/lib/auth/index.ts`:
```typescript
import { supabase } from '@/lib/supabase/client'

export interface AuthUser {
  id: string
  email: string
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return { id: data.user.id, email: data.user.email! }
}

export async function signUp(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Sign up failed — please check your email to confirm')
  return { id: data.user.id, email: data.user.email! }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function getSession(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession()
  if (!data.session?.user) return null
  return { id: data.session.user.id, email: data.session.user.email! }
}

export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(
      session?.user ? { id: session.user.id, email: session.user.email! } : null
    )
  })
  return () => data.subscription.unsubscribe()
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run tests/lib/auth/auth.test.ts
```

Expected: `5 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/index.ts tests/lib/auth/auth.test.ts
git commit -m "feat: add auth module with signIn, signUp, signOut, getSession"
```

---

## Task 4: Sync Module

**Files:**
- Create: `src/lib/supabase/sync.ts`
- Create: `tests/lib/supabase/sync.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/supabase/sync.test.ts`:
```typescript
import { syncTasks, syncAll } from '@/lib/supabase/sync'
import { getAllTasks, createTask } from '@/lib/db/tasks'
import { getSetting } from '@/lib/db/settings'
import { resetDB } from '@/lib/db'
import type { Task } from '@/types/task'

const mockFrom = vi.fn()
const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: mockFrom },
}))

const localTask: Task = {
  id: 'task-local',
  title: 'Local task',
  status: 'todo',
  priority: 'medium',
  tags: [],
  subtasks: [],
  createdAt: '2026-05-04T10:00:00.000Z',
  updatedAt: '2026-05-04T10:00:00.000Z',
}

beforeEach(() => {
  resetDB()
  vi.clearAllMocks()

  mockEq.mockResolvedValue({ data: [], error: null })
  mockSingle.mockResolvedValue({ data: null, error: null })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ select: mockSelect, upsert: mockUpsert })
})

describe('syncTasks', () => {
  it('pulls new remote task to local', async () => {
    const remoteTask: Task = {
      id: 'task-remote',
      title: 'Remote task',
      status: 'todo',
      priority: 'medium',
      tags: [],
      subtasks: [],
      createdAt: '2026-05-04T09:00:00.000Z',
      updatedAt: '2026-05-04T09:00:00.000Z',
    }
    mockEq.mockResolvedValue({
      data: [{ id: 'task-remote', data: remoteTask, updated_at: '2026-05-04T09:00:00.000Z' }],
      error: null,
    })

    const result = await syncTasks('user-1')
    expect(result.pulled).toBe(1)
    const tasks = await getAllTasks()
    expect(tasks.find(t => t.id === 'task-remote')).toBeTruthy()
  })

  it('skips remote task when local is same age or newer', async () => {
    await createTask(localTask)
    mockEq.mockResolvedValue({
      data: [{ id: 'task-local', data: localTask, updated_at: '2026-05-03T10:00:00.000Z' }],
      error: null,
    })

    const result = await syncTasks('user-1')
    expect(result.conflicts).toBe(0)
    expect(result.pulled).toBe(0)
  })

  it('counts conflict when remote is newer than local', async () => {
    await createTask(localTask)
    mockEq.mockResolvedValue({
      data: [{
        id: 'task-local',
        data: { ...localTask, title: 'Modified remotely' },
        updated_at: '2026-05-05T10:00:00.000Z',
      }],
      error: null,
    })

    const result = await syncTasks('user-1')
    expect(result.conflicts).toBe(1)
    const tasks = await getAllTasks()
    expect(tasks.find(t => t.id === 'task-local')?.title).toBe('Local task')
  })

  it('upserts all local tasks to Supabase', async () => {
    await createTask(localTask)
    await syncTasks('user-1')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'task-local', user_id: 'user-1' }),
      ])
    )
  })
})

describe('syncAll', () => {
  it('sets lastSyncedAt after successful sync', async () => {
    await syncAll('user-1')
    const lastSyncedAt = await getSetting('lastSyncedAt')
    expect(lastSyncedAt).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:run tests/lib/supabase/sync.test.ts
```

Expected: FAIL — cannot find module `@/lib/supabase/sync`.

- [ ] **Step 3: Write the sync module**

Create `src/lib/supabase/sync.ts`:
```typescript
import { supabase } from './client'
import { getAllTasks, createTask } from '@/lib/db/tasks'
import { getSetting, setSetting } from '@/lib/db/settings'
import type { Task } from '@/types/task'

export interface SyncResult {
  conflicts: number
  pulled: number
  pushed: number
}

export async function syncTasks(userId: string): Promise<Omit<SyncResult, 'pushed'>> {
  const { data: remoteRows, error } = await supabase
    .from('tasks')
    .select('id, data, updated_at')
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  const localTasks = await getAllTasks()
  const localMap = new Map(localTasks.map(t => [t.id, t]))

  let conflicts = 0
  let pulled = 0

  for (const row of remoteRows ?? []) {
    const remote = row.data as Task
    const local = localMap.get(row.id)
    if (!local) {
      await createTask(remote)
      pulled++
    } else if (new Date(row.updated_at) > new Date(local.updatedAt)) {
      conflicts++
    }
  }

  const allLocal = await getAllTasks()
  if (allLocal.length > 0) {
    const { error: upsertError } = await supabase.from('tasks').upsert(
      allLocal.map(t => ({ id: t.id, user_id: userId, data: t, updated_at: t.updatedAt }))
    )
    if (upsertError) throw new Error(upsertError.message)
  }

  return { conflicts, pulled }
}

export async function syncSettings(userId: string): Promise<void> {
  const settingsToSync = {
    theme: await getSetting('theme'),
    focusDuration: await getSetting('focusDuration'),
    breakDuration: await getSetting('breakDuration'),
    streak: await getSetting('streak'),
    lastActiveDate: await getSetting('lastActiveDate'),
  }

  const { error } = await supabase.from('user_settings').upsert({
    user_id: userId,
    data: settingsToSync,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
}

export async function syncAll(userId: string): Promise<SyncResult> {
  const taskResult = await syncTasks(userId)
  await syncSettings(userId)
  const allLocal = await getAllTasks()
  await setSetting('lastSyncedAt', new Date().toISOString())
  return { ...taskResult, pushed: allLocal.length }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run tests/lib/supabase/sync.test.ts
```

Expected: `5 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/sync.ts tests/lib/supabase/sync.test.ts
git commit -m "feat: add sync module with syncTasks, syncSettings, syncAll"
```

---

## Task 5: AuthProvider Context

**Files:**
- Create: `src/context/AuthContext.tsx`

- [ ] **Step 1: Write AuthContext**

Create `src/context/AuthContext.tsx`:
```tsx
'use client'

import {
  createContext, useContext, useEffect, useState, useCallback, ReactNode,
} from 'react'
import { signIn as authSignIn, signUp as authSignUp, signOut as authSignOut, getSession, onAuthChange } from '@/lib/auth'
import { syncAll } from '@/lib/supabase/sync'
import { getSetting, setSetting } from '@/lib/db/settings'
import type { AuthUser } from '@/lib/auth'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  syncStatus: SyncStatus
  lastSyncedAt: string | null
  conflictCount: number
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  syncNow: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [conflictCount, setConflictCount] = useState(0)

  const performSync = useCallback(async (userId: string) => {
    setSyncStatus('syncing')
    try {
      const result = await syncAll(userId)
      setLastSyncedAt(new Date().toISOString())
      setSyncStatus('synced')
      setConflictCount(result.conflicts)
    } catch {
      setSyncStatus('error')
    }
  }, [])

  useEffect(() => {
    getSession().then(user => {
      setUser(user)
      setLoading(false)
      if (user) performSync(user.id)
    })
    getSetting('lastSyncedAt').then(v => { if (v) setLastSyncedAt(v) })

    const unsubscribe = onAuthChange(user => {
      setUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [performSync])

  const handleSignIn = async (email: string, password: string) => {
    const user = await authSignIn(email, password)
    await setSetting('supabaseUserId', user.id)
    setUser(user)
    await performSync(user.id)
  }

  const handleSignUp = async (email: string, password: string) => {
    const user = await authSignUp(email, password)
    await setSetting('supabaseUserId', user.id)
    setUser(user)
  }

  const handleSignOut = async () => {
    await authSignOut()
    await setSetting('supabaseUserId', undefined)
    setUser(null)
    setSyncStatus('idle')
    setLastSyncedAt(null)
    setConflictCount(0)
  }

  const syncNow = useCallback(async () => {
    if (user) await performSync(user.id)
  }, [user, performSync])

  return (
    <AuthContext.Provider value={{
      user, loading, syncStatus, lastSyncedAt, conflictCount,
      signIn: handleSignIn,
      signUp: handleSignUp,
      signOut: handleSignOut,
      syncNow,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Commit**

```bash
git add src/context/AuthContext.tsx
git commit -m "feat: add AuthProvider context with sync lifecycle"
```

---

## Task 6: AuthModal Component

**Files:**
- Create: `src/components/auth/AuthModal.tsx`
- Create: `tests/components/auth/AuthModal.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/components/auth/AuthModal.test.tsx`:
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import AuthModal from '@/components/auth/AuthModal'

const mockSignIn = vi.fn()
const mockSignUp = vi.fn()

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    user: null,
    loading: false,
    syncStatus: 'idle',
    lastSyncedAt: null,
    conflictCount: 0,
    signOut: vi.fn(),
    syncNow: vi.fn(),
  }),
}))

describe('AuthModal', () => {
  it('shows Sign In tab by default', () => {
    render(<AuthModal onClose={vi.fn()} />)
    expect(screen.getByText('Sign in to FlowTask')).toBeInTheDocument()
  })

  it('switches to Sign Up tab on click', () => {
    render(<AuthModal onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Sign Up'))
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
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
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:run tests/components/auth/AuthModal.test.tsx
```

Expected: FAIL — cannot find module `@/components/auth/AuthModal`.

- [ ] **Step 3: Write AuthModal**

Create `src/components/auth/AuthModal.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import GlassCard from '@/components/ui/GlassCard'

type Tab = 'signin' | 'signup'

interface AuthModalProps {
  onClose: () => void
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth()
  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      if (tab === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <GlassCard className="p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="w-10 h-10 rounded-xl gradient-bg mx-auto mb-3" />
          <h2 className="text-base font-semibold text-white/90">Sign in to FlowTask</h2>
          <p className="text-xs text-white/40 mt-1">Sync your tasks across devices</p>
        </div>

        <div className="flex glass rounded-lg p-1 mb-5">
          <button
            type="button"
            onClick={() => { setTab('signin'); setError(null) }}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === 'signin' ? 'gradient-bg text-white' : 'text-white/40'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(null) }}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === 'signup' ? 'gradient-bg text-white' : 'text-white/40'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            disabled={loading}
            className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            disabled={loading}
            className="w-full glass rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none"
          />
          {error && <p className="text-xs text-red-400/80">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-bg py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
          >
            {loading ? 'Please wait...' : tab === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
          <p className="text-xs text-white/25 text-center">Your API key stays on this device only</p>
        </form>
      </GlassCard>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run tests/components/auth/AuthModal.test.tsx
```

Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/AuthModal.tsx tests/components/auth/AuthModal.test.tsx
git commit -m "feat: add AuthModal with email/password sign-in and sign-up"
```

---

## Task 7: SyncStatus Component

**Files:**
- Create: `src/components/auth/SyncStatus.tsx`
- Create: `tests/components/auth/SyncStatus.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/components/auth/SyncStatus.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import SyncStatus from '@/components/auth/SyncStatus'

function renderWithAuth(syncStatus: string, user: object | null) {
  vi.mock('@/context/AuthContext', () => ({
    useAuth: () => ({ syncStatus, user, loading: false, lastSyncedAt: null, conflictCount: 0, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), syncNow: vi.fn() }),
  }))
  return render(<SyncStatus />)
}

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '@/context/AuthContext'

describe('SyncStatus', () => {
  it('renders nothing visible when not signed in', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, syncStatus: 'idle', loading: false, lastSyncedAt: null, conflictCount: 0, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), syncNow: vi.fn() })
    const { container } = render(<SyncStatus />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders a green dot when synced', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: '1', email: 'test@test.com' }, syncStatus: 'synced', loading: false, lastSyncedAt: null, conflictCount: 0, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), syncNow: vi.fn() })
    const { container } = render(<SyncStatus />)
    const dot = container.firstChild as HTMLElement
    expect(dot?.className).toContain('green')
  })

  it('renders a red dot on error', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: '1', email: 'test@test.com' }, syncStatus: 'error', loading: false, lastSyncedAt: null, conflictCount: 0, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), syncNow: vi.fn() })
    const { container } = render(<SyncStatus />)
    const dot = container.firstChild as HTMLElement
    expect(dot?.className).toContain('red')
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm run test:run tests/components/auth/SyncStatus.test.tsx
```

Expected: FAIL — cannot find module `@/components/auth/SyncStatus`.

- [ ] **Step 3: Write SyncStatus**

Create `src/components/auth/SyncStatus.tsx`:
```tsx
'use client'

import { useAuth, SyncStatus as SyncStatusType } from '@/context/AuthContext'

const dotColors: Record<SyncStatusType, string> = {
  idle: 'bg-white/20',
  syncing: 'bg-yellow-400 animate-pulse',
  synced: 'bg-green-400',
  error: 'bg-red-400',
}

const titles: Record<SyncStatusType, string> = {
  idle: 'Not signed in',
  syncing: 'Syncing...',
  synced: 'Synced',
  error: 'Sync failed — tap to retry',
}

export default function SyncStatus() {
  const { user, syncStatus } = useAuth()
  const status = user ? syncStatus : 'idle'

  return (
    <div
      className={`w-2 h-2 rounded-full ${dotColors[status]} absolute top-1 right-1`}
      title={titles[status]}
    />
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run tests/components/auth/SyncStatus.test.tsx
```

Expected: `3 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/SyncStatus.tsx tests/components/auth/SyncStatus.test.tsx
git commit -m "feat: add SyncStatus dot component"
```

---

## Task 8: Settings Page

**Files:**
- Create: `src/app/settings/page.tsx`

- [ ] **Step 1: Write the Settings page**

Create `src/app/settings/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getSetting, setSetting } from '@/lib/db/settings'
import AuthModal from '@/components/auth/AuthModal'
import GlassCard from '@/components/ui/GlassCard'

function formatLastSync(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`
  return new Date(iso).toLocaleTimeString()
}

export default function SettingsPage() {
  const { user, signOut, syncNow, syncStatus, lastSyncedAt, conflictCount } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [keySaved, setKeySaved] = useState(false)

  useEffect(() => {
    getSetting('claudeApiKey').then(k => setApiKey(k ?? ''))
  }, [])

  async function handleSaveKey() {
    await setSetting('claudeApiKey', apiKey || undefined)
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
  }

  const syncDotColor = {
    idle: 'bg-white/30',
    syncing: 'bg-yellow-400 animate-pulse',
    synced: 'bg-green-400',
    error: 'bg-red-400',
  }[syncStatus]

  return (
    <div className="p-6 max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-white/80">Settings</h1>

      {conflictCount > 0 && (
        <div className="glass rounded-xl p-3 border border-yellow-400/20">
          <p className="text-xs text-yellow-400/80">
            {conflictCount} task{conflictCount !== 1 ? 's' : ''} were newer on another device — kept your local version
          </p>
        </div>
      )}

      <GlassCard className="p-5">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Account</p>
        {user ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">{user.email}</p>
              <p className="text-xs text-white/40 mt-0.5">Signed in</p>
            </div>
            <button
              onClick={() => signOut()}
              className="glass glass-hover px-3 py-1.5 rounded-lg text-xs text-white/50"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/40">Not signed in</p>
            <button
              onClick={() => setShowAuth(true)}
              className="gradient-bg px-3 py-1.5 rounded-lg text-xs text-white font-medium"
            >
              Sign in to sync
            </button>
          </div>
        )}
      </GlassCard>

      {user && (
        <GlassCard className="p-5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Sync</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${syncDotColor}`} />
              <p className="text-sm text-white/60">{formatLastSync(lastSyncedAt)}</p>
            </div>
            <button
              onClick={syncNow}
              disabled={syncStatus === 'syncing'}
              className="gradient-bg px-3 py-1.5 rounded-lg text-xs text-white font-medium disabled:opacity-40"
            >
              {syncStatus === 'syncing' ? 'Syncing...' : 'Sync now'}
            </button>
          </div>
        </GlassCard>
      )}

      <GlassCard className="p-5">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Claude API Key</p>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="flex-1 glass rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none"
          />
          <button
            onClick={handleSaveKey}
            className="glass glass-hover px-3 py-2 rounded-lg text-xs text-white/60"
          >
            {keySaved ? '✓ Saved' : 'Save'}
          </button>
        </div>
        <p className="text-xs text-white/25 mt-2">Stored locally only — never uploaded</p>
      </GlassCard>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -10
```

Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat: add Settings page with account, sync, and API key sections"
```

---

## Task 9: Sidebar + Layout Wiring

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Wrap layout with AuthProvider**

Replace the full contents of `src/app/layout.tsx`:
```tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import AppShell from '@/components/layout/AppShell'
import { AuthProvider } from '@/context/AuthContext'

export const metadata: Metadata = {
  title: 'FlowTask',
  description: 'AI-powered personal task manager',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#7c3aed',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Update Sidebar to add ⚙️ settings link + SyncStatus dot**

Replace the full contents of `src/components/layout/Sidebar.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SyncStatus from '@/components/auth/SyncStatus'

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
      <div className="w-8 h-8 rounded-lg gradient-bg mb-4" />

      {navItems.map(({ href, icon, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-150 ${
              active
                ? 'gradient-bg shadow-lg'
                : 'glass-hover text-white/50 hover:text-white'
            }`}
          >
            {icon}
          </Link>
        )
      })}

      <div className="mt-auto">
        <Link
          href="/settings"
          title="Settings"
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-150 ${
            pathname === '/settings'
              ? 'gradient-bg shadow-lg'
              : 'glass-hover text-white/50 hover:text-white'
          }`}
        >
          ⚙️
          <SyncStatus />
        </Link>
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Final build check**

```bash
npm run build 2>&1 | tail -10
```

Expected: success, all routes compiled.

- [ ] **Step 4: Run full test suite**

```bash
npm run test:run
```

Expected: 78 existing + 5 auth + 5 sync + 4 AuthModal + 3 SyncStatus = ~95 tests, all passing.

- [ ] **Step 5: Final commit**

```bash
git add src/app/layout.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: wire AuthProvider and Settings nav into app shell"
```

---

## Phase 3a Complete

At this point the app has:

- ✅ Email/password sign-in and sign-up via Supabase Auth
- ✅ Auto-sync on app open when signed in
- ✅ Manual "Sync now" button in Settings
- ✅ Local always wins on conflict — safe, simple, no data loss
- ✅ Sync status dot on ⚙️ sidebar icon (green/yellow/red/grey)
- ✅ Settings page with account, sync status, and API key management
- ✅ Claude API key never synced to cloud

**Run all tests before declaring done:**

```bash
npm run test:run
```

**Next:** Phase 3b — push notifications for due dates + AI daily briefing.
