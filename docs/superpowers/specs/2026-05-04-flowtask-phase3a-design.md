# FlowTask Phase 3a — Supabase Auth + Sync Design Spec
**Date:** 2026-05-04
**Status:** Approved

---

## Overview

Phase 3a adds optional cloud sync to FlowTask via Supabase. The app remains fully functional offline — IndexedDB stays the source of truth. Supabase is a backup layer: users who sign in get their tasks and settings synced across devices. Users who don't sign in see no change.

---

## Features

### Authentication
- Email + password sign-in and sign-up
- `AuthModal` component with Sign In / Sign Up tab toggle
- Session stored in localStorage via Supabase Auth SDK
- Sign-out available from the Settings page

### Cloud Sync
- **Triggered:** automatically on app open (if signed in) + manually via "Sync now" button
- **Data synced:** all tasks + all settings **except** `claudeApiKey` (stays local-only forever)
- **Conflict resolution:** local always wins — if a remote task has a newer `updated_at` than local, keep local and surface a conflict count in a toast notification
- **New remote records** (task exists on Supabase but not locally) are pulled in
- `lastSyncedAt` saved to local settings after each successful sync

### Settings Page (`/settings`) — new page
Three sections:
1. **Account** — email display, Sign out button; or "Sign in to sync" prompt if not signed in
2. **Sync** — sync status dot + last synced timestamp, "Sync now" button
3. **Claude API Key** — input to set/update key (replaces the dev-tools-only setup), with note "Stored locally only — never uploaded"

### Sidebar update
- Add ⚙️ Settings icon to the bottom of the sidebar
- Sync status dot overlaid on the ⚙️ icon: green (synced), grey (not signed in), spinning (syncing), red (error)

---

## Supabase Schema

```sql
-- Enable RLS on both tables
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users access own tasks" ON tasks
  USING (user_id = auth.uid());

CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users access own settings" ON user_settings
  USING (user_id = auth.uid());
```

Both tables store full objects as JSONB — no schema migration needed when the Task or Settings types evolve.

---

## Sync Algorithm

```
syncAll(userId):
  1. Pull all task rows from Supabase WHERE user_id = userId
  2. Pull all tasks from IndexedDB
  3. For each remote task:
     a. Not in local → write to local (new from another device)
     b. In local AND remote.updated_at > local.updatedAt → conflict → keep local, conflictCount++
     c. In local AND remote.updated_at <= local.updatedAt → skip
  4. Upsert ALL local tasks to Supabase (local always wins)
  5. Repeat steps 1–4 for user_settings (single record, keyed by user_id) — strip `claudeApiKey` before pushing to Supabase, never write it remotely
  6. If conflictCount > 0 → show toast: "{n} task(s) were newer on another device — kept your local version"
  7. Save lastSyncedAt = now() to local settings
```

---

## Data Model Additions

### `src/types/settings.ts` — add one field
```typescript
export interface Settings {
  // ... existing fields ...
  supabaseUserId?: string   // set after successful sign-in, cleared on sign-out
}
```

### Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```
Stored in `.env.local` (gitignored). Supabase anon key is safe to expose client-side (RLS enforces access).

---

## New Files

```
src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # createClient singleton (reads env vars)
│   │   └── sync.ts         # syncAll(), syncTasks(), syncSettings()
│   └── auth/
│       └── index.ts        # signIn(), signUp(), signOut(), getSession(), onAuthChange()
├── components/
│   └── auth/
│       ├── AuthModal.tsx   # sign-in/sign-up form with tab toggle
│       └── SyncStatus.tsx  # sync dot (green/grey/spinning/red)
└── app/
    └── settings/
        └── page.tsx        # account + sync + API key sections
```

## Modified Files

| File | Change |
|---|---|
| `src/types/settings.ts` | Add `supabaseUserId?: string` |
| `src/app/layout.tsx` | Add `AuthProvider` context wrapper |
| `src/components/layout/Sidebar.tsx` | Add ⚙️ Settings link + SyncStatus dot |
| `src/lib/db/settings.ts` | Add default for `supabaseUserId: undefined` in DEFAULTS |

---

## AuthProvider

A React context that:
- Calls `getSession()` on mount to restore session from localStorage
- Subscribes to `onAuthChange()` to react to sign-in/sign-out
- Triggers `syncAll()` when user signs in or app opens with active session
- Exposes `{ user, loading, signIn, signUp, signOut, syncNow, syncStatus, lastSyncedAt }`

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Not signed in | Sync features hidden; app works as normal |
| Supabase unreachable | Sync fails silently; red dot on ⚙️; last sync time shown; app keeps working |
| Wrong password | Inline error under password field: "Invalid email or password" |
| Weak password (<8 chars) | Client-side error before API call: "Password must be at least 8 characters" |
| Invalid email format | Client-side error: "Please enter a valid email address" |
| Sync conflict detected | Toast: "{n} task(s) were newer on another device — kept your local version" |
| Network lost mid-sync | Error caught, red dot, no partial writes committed |

---

## Testing

- **`src/lib/supabase/sync.ts`** — unit tested with mocked Supabase client:
  - New remote task is pulled to local
  - Remote task with older `updated_at` than local is skipped
  - Remote task with newer `updated_at` than local triggers conflict count
  - All local tasks are upserted to Supabase
  - `lastSyncedAt` is set after successful sync
- **`src/lib/auth/index.ts`** — unit tested with mocked Supabase client:
  - `signIn` calls `supabase.auth.signInWithPassword`
  - `signOut` calls `supabase.auth.signOut`
  - `getSession` returns null when no session
- **`AuthModal`** — RTL component tests:
  - Shows Sign In tab by default
  - Switches to Sign Up tab on click
  - Shows inline error on invalid email format
  - Shows inline error on password < 8 chars
- **`SyncStatus`** — RTL test for each dot color/state
- No live Supabase calls in CI — all Supabase interactions mocked via `vi.mock('@/lib/supabase/client')`
