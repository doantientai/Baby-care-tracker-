import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
  startOfDay,
  endOfDay,
} from 'date-fns'

export function clockTime(ts: number): string {
  return format(ts, 'HH:mm')
}

export function dayLabel(ts: number): string {
  if (isToday(ts)) return 'Today'
  if (isYesterday(ts)) return 'Yesterday'
  return format(ts, 'EEE d MMM')
}

export function dateKey(ts: number): string {
  return format(ts, 'yyyy-MM-dd')
}

export function relativeTime(ts: number): string {
  return formatDistanceToNowStrict(ts, { addSuffix: true })
}

export function dayBounds(ts: number): { from: number; to: number } {
  return { from: startOfDay(ts).getTime(), to: endOfDay(ts).getTime() }
}

export function formatDuration(sec?: number): string {
  if (!sec || sec < 0) return '—'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  if (m < 60) return s > 0 && m < 10 ? `${m}m ${s}s` : `${m}m`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}

/** datetime-local string (local timezone) <-> epoch ms helpers for form inputs */
export function toLocalInput(ts: number): string {
  const d = new Date(ts)
  const off = d.getTimezoneOffset()
  return new Date(ts - off * 60_000).toISOString().slice(0, 16)
}

export function fromLocalInput(value: string): number {
  return new Date(value).getTime()
}
