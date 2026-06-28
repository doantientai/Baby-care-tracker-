import { useCallback, useEffect, useState } from 'react'

// Running timers (breastfeeding / sleep) persisted to localStorage so they
// survive a phone lock or app reload mid-session.

export type TimerKind = 'breastfeed' | 'sleep'

export interface RunningTimer {
  kind: TimerKind
  startedAt: number
  // --- breastfeed two-sided session accounting ---
  /** breast currently being timed */
  currentSide?: 'left' | 'right'
  /** breast the session started on */
  startSide?: 'left' | 'right'
  /** seconds already banked on each side (excludes the live current segment) */
  leftSec?: number
  rightSec?: number
  /** when the current segment started (epoch ms) */
  lastSwitchAt?: number
}

const KEY = 'bct.timers'

function read(): RunningTimer[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as RunningTimer[]) : []
  } catch {
    return []
  }
}

function write(timers: RunningTimer[]) {
  localStorage.setItem(KEY, JSON.stringify(timers))
  window.dispatchEvent(new Event('bct-timers'))
}

/** Bank the elapsed time of the current segment onto the active side. */
function bank(t: RunningTimer, atMs: number): RunningTimer {
  if (!t.currentSide || t.lastSwitchAt == null) return t
  const elapsed = Math.max(0, Math.round((atMs - t.lastSwitchAt) / 1000))
  return {
    ...t,
    leftSec: (t.leftSec ?? 0) + (t.currentSide === 'left' ? elapsed : 0),
    rightSec: (t.rightSec ?? 0) + (t.currentSide === 'right' ? elapsed : 0),
    lastSwitchAt: atMs,
  }
}

export function useTimers() {
  const [timers, setTimers] = useState<RunningTimer[]>(read)

  useEffect(() => {
    const sync = () => setTimers(read())
    window.addEventListener('bct-timers', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('bct-timers', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const start = useCallback((t: RunningTimer) => {
    const next = [...read().filter((x) => x.kind !== t.kind), t]
    write(next)
  }, [])

  /** Start a breastfeeding session on the given side. */
  const startBreastfeed = useCallback((side: 'left' | 'right') => {
    const now = Date.now()
    start({
      kind: 'breastfeed',
      startedAt: now,
      startSide: side,
      currentSide: side,
      leftSec: 0,
      rightSec: 0,
      lastSwitchAt: now,
    })
  }, [start])

  /** Switch the active breast, banking time on the previous one. */
  const switchBreast = useCallback(() => {
    const all = read()
    const t = all.find((x) => x.kind === 'breastfeed')
    if (!t) return
    const banked = bank(t, Date.now())
    banked.currentSide = banked.currentSide === 'left' ? 'right' : 'left'
    write([...all.filter((x) => x.kind !== 'breastfeed'), banked])
  }, [])

  const stop = useCallback((kind: TimerKind): RunningTimer | undefined => {
    const all = read()
    const found = all.find((x) => x.kind === kind)
    write(all.filter((x) => x.kind !== kind))
    if (!found) return undefined
    return kind === 'breastfeed' ? bank(found, Date.now()) : found
  }, [])

  const get = useCallback((kind: TimerKind) => timers.find((x) => x.kind === kind), [timers])

  return { timers, start, startBreastfeed, switchBreast, stop, get }
}

/** A ticking "now" for live duration displays. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
