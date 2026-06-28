import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { CareEvent, EventType } from '../db/types'
import { useSettings } from '../state/settings'
import { dateKey, dayLabel } from '../lib/time'
import { EVENT_META } from '../lib/eventMeta'
import { EventCard } from '../components/EventCard'
import { LogSheet } from '../components/LogSheet'

const FILTERS: { value: EventType | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '🗂️' },
  { value: 'diaper', label: 'Diaper', emoji: '🧷' },
  { value: 'breastfeed', label: 'Feed', emoji: '🤱' },
  { value: 'bottle', label: 'Bottle', emoji: '🍼' },
  { value: 'sleep', label: 'Sleep', emoji: '😴' },
  { value: 'temperature', label: 'Temp', emoji: '🌡️' },
  { value: 'cry', label: 'Cry', emoji: '😢' },
]

export function Timeline() {
  const { settings } = useSettings()
  const [filter, setFilter] = useState<EventType | 'all'>('all')
  const [editing, setEditing] = useState<CareEvent | null>(null)

  const events = useLiveQuery(() => db.events.orderBy('at').reverse().toArray(), []) ?? []
  const filtered = filter === 'all' ? events : events.filter((e) => e.type === filter)

  const groups = useMemo(() => {
    const map = new Map<string, CareEvent[]>()
    for (const e of filtered) {
      const k = dateKey(e.at)
      const arr = map.get(k)
      if (arr) arr.push(e)
      else map.set(k, [e])
    }
    return [...map.entries()]
  }, [filtered])

  return (
    <div className="p-4">
      <h1 className="mb-3 text-2xl font-bold">Timeline</h1>

      <div className="mb-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`chip shrink-0 ${filter === f.value ? 'chip-on' : 'chip-off'}`}
          >
            <span>{f.emoji}</span>
            {f.label}
          </button>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="card p-8 text-center text-slate-400">
          {filter === 'all' ? 'No entries yet.' : `No ${EVENT_META[filter as EventType].label.toLowerCase()} entries.`}
        </div>
      )}

      <div className="space-y-5">
        {groups.map(([key, items]) => (
          <div key={key}>
            <div className="sticky top-0 z-10 -mx-1 mb-1 bg-slate-50/90 px-1 py-1 backdrop-blur">
              <h2 className="text-sm font-semibold text-slate-500">{dayLabel(items[0].at)}</h2>
            </div>
            <div className="card divide-y divide-slate-100 p-1">
              {items.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  babyDob={settings.babyDob}
                  tempUnit={settings.tempUnit}
                  onClick={() => setEditing(e)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <LogSheet type={null} editing={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
