import type { CareEvent, DiaperData } from '../db/types'
import { EVENT_META, summarize } from '../lib/eventMeta'
import { clockTime } from '../lib/time'
import { isStoolColorConcerning, assessTemperature } from '../lib/clinical'
import type { TemperatureData } from '../db/types'

export function EventCard({
  event,
  babyDob,
  tempUnit,
  onClick,
}: {
  event: CareEvent
  babyDob: number | null
  tempUnit: 'C' | 'F'
  onClick?: () => void
}) {
  const meta = EVENT_META[event.type]
  const warn = isEventConcerning(event, babyDob)

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 rounded-xl px-3 py-2.5 transition active:scale-[0.99] hover:bg-slate-50 ${
        warn ? 'bg-red-50' : ''
      }`}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
        style={{ backgroundColor: meta.color + '22' }}
      >
        {meta.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{meta.label}</span>
          {warn && <span className="text-xs font-bold text-red-600">⚠ check</span>}
        </div>
        <div className="truncate text-sm text-slate-500">
          {summarize(event, tempUnit)}
          {event.note ? ` — ${event.note}` : ''}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-medium tabular-nums">{clockTime(event.at)}</div>
        <div className="text-[11px] text-slate-400">{event.caregiver}</div>
      </div>
    </button>
  )
}

function isEventConcerning(event: CareEvent, babyDob: number | null): boolean {
  if (event.type === 'diaper') {
    const d = event.data as DiaperData
    return !!d.color && isStoolColorConcerning(d.color, babyDob)
  }
  if (event.type === 'temperature') {
    const d = event.data as TemperatureData
    const a = assessTemperature(d.celsius, d.method, babyDob)
    return a.level === 'fever' || a.level === 'emergency' || a.level === 'low'
  }
  return false
}
