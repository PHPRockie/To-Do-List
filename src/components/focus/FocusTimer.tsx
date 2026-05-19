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
  const [customInput, setCustomInput] = useState('')

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

  function handleCustomApply() {
    const mins = parseInt(customInput, 10)
    setCustomInput('')
    if (!isNaN(mins) && mins >= 1 && mins <= 180) {
      handleDurationChange(mins)
    }
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

      {/* Custom time input */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={180}
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onBlur={handleCustomApply}
          onKeyDown={e => e.key === 'Enter' && handleCustomApply()}
          placeholder="Custom"
          disabled={running}
          className="w-28 glass rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 outline-none text-center disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-sm text-white/40">min</span>
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
