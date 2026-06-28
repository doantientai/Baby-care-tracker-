import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { CareEvent, EventType, DiaperData, BreastfeedData } from '../db/types'
import { useSettings } from '../state/settings'
import { useTimers, useNow } from '../state/timers'
import { dayBounds, formatDuration, relativeTime } from '../lib/time'
import { ageInDays, nextBreastSide, expectedWetDiapers } from '../lib/clinical'
import { EVENT_META } from '../lib/eventMeta'
import { WeatherCard } from '../components/WeatherCard'
import { StatCard } from '../components/ui'
import { EventCard } from '../components/EventCard'
import { LogSheet, type LogInitial } from '../components/LogSheet'

const QUICK: EventType[] = ['diaper', 'breastfeed', 'bottle', 'temperature', 'sleep', 'cry', 'pump', 'medication', 'growth']

export function Home({ onOpenTimeline }: { onOpenTimeline: () => void }) {
  const { settings } = useSettings()
  const { start, startBreastfeed, switchBreast, stop, get } = useTimers()
  const now = useNow()

  const [sheetType, setSheetType] = useState<EventType | null>(null)
  const [sheetInitial, setSheetInitial] = useState<LogInitial | undefined>()
  const [editing, setEditing] = useState<CareEvent | null>(null)

  const { from, to } = dayBounds(now)
  const todays = useLiveQuery(() => db.events.where('at').between(from, to, true, true).toArray(), [from, to]) ?? []
  const lastFeed = useLiveQuery(
    () => db.events.where('type').equals('breastfeed').reverse().sortBy('at').then((a) => a[0]),
    [],
  )

  const days = ageInDays(settings.babyDob)
  const summary = summarizeDay(todays)
  const lastSide = (lastFeed?.data as BreastfeedData | undefined)?.side ?? null
  const suggestedSide = nextBreastSide(lastSide)

  const bfTimer = get('breastfeed')
  const sleepTimer = get('sleep')

  function openSheet(type: EventType, initial?: LogInitial) {
    setEditing(null)
    setSheetInitial(initial)
    setSheetType(type)
  }

  function stopBreast() {
    const t = stop('breastfeed')
    if (t)
      openSheet('breastfeed', {
        at: t.startedAt,
        endAt: Date.now(),
        data: { side: t.startSide ?? 'left', leftSec: t.leftSec ?? 0, rightSec: t.rightSec ?? 0 },
      })
  }
  function toggleSleep() {
    if (sleepTimer) {
      const t = stop('sleep')
      if (t) openSheet('sleep', { at: t.startedAt, endAt: Date.now() })
    } else {
      start({ kind: 'sleep', startedAt: Date.now() })
    }
  }

  return (
    <div className="space-y-4 p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{settings.babyName}</h1>
          <p className="text-sm text-slate-500">
            {days != null ? `${days} day${days === 1 ? '' : 's'} old` : 'Set date of birth in Settings'}
          </p>
        </div>
        <div className="text-right text-sm text-slate-500">
          {new Date(now).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
        </div>
      </header>

      <WeatherCard />

      {/* Active timers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Breastfeeding</div>
          {bfTimer ? (
            (() => {
              const liveL =
                (bfTimer.leftSec ?? 0) +
                (bfTimer.currentSide === 'left' ? (now - (bfTimer.lastSwitchAt ?? now)) / 1000 : 0)
              const liveR =
                (bfTimer.rightSec ?? 0) +
                (bfTimer.currentSide === 'right' ? (now - (bfTimer.lastSwitchAt ?? now)) / 1000 : 0)
              return (
                <div className="mt-2">
                  <div className="grid grid-cols-2 gap-1 text-center">
                    <div className={`rounded-lg py-1 ${bfTimer.currentSide === 'left' ? 'bg-pink-500 text-white' : 'bg-pink-50 text-pink-700'}`}>
                      <div className="text-[10px] uppercase opacity-80">Left{bfTimer.currentSide === 'left' ? ' ●' : ''}</div>
                      <div className="text-sm font-bold tabular-nums">{formatDuration(liveL)}</div>
                    </div>
                    <div className={`rounded-lg py-1 ${bfTimer.currentSide === 'right' ? 'bg-pink-500 text-white' : 'bg-pink-50 text-pink-700'}`}>
                      <div className="text-[10px] uppercase opacity-80">Right{bfTimer.currentSide === 'right' ? ' ●' : ''}</div>
                      <div className="text-sm font-bold tabular-nums">{formatDuration(liveR)}</div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button onClick={switchBreast} className="rounded-xl bg-pink-100 px-2 py-2 text-sm font-semibold text-pink-700">
                      ⇄ Switch
                    </button>
                    <button onClick={stopBreast} className="rounded-xl bg-pink-600 px-2 py-2 text-sm font-semibold text-white">
                      ■ Stop
                    </button>
                  </div>
                </div>
              )
            })()
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => startBreastfeed('left')}
                className={`rounded-xl px-2 py-3 text-sm font-semibold ${suggestedSide === 'left' ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-700'}`}
              >
                Start L{suggestedSide === 'left' ? ' ✦' : ''}
              </button>
              <button
                onClick={() => startBreastfeed('right')}
                className={`rounded-xl px-2 py-3 text-sm font-semibold ${suggestedSide === 'right' ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-700'}`}
              >
                Start R{suggestedSide === 'right' ? ' ✦' : ''}
              </button>
            </div>
          )}
        </div>
        <div className="card p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sleep</div>
          <button
            onClick={toggleSleep}
            className={`mt-2 w-full rounded-xl px-3 py-3 ${sleepTimer ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-700'}`}
          >
            {sleepTimer ? (
              <>
                <div className="text-lg font-bold tabular-nums">{formatDuration((now - sleepTimer.startedAt) / 1000)}</div>
                <div className="text-xs opacity-90">tap to stop</div>
              </>
            ) : (
              <div className="py-1 font-semibold">😴 Start sleep</div>
            )}
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">Quick log</h2>
        <div className="grid grid-cols-3 gap-3">
          {QUICK.map((t) => (
            <button
              key={t}
              onClick={() => openSheet(t)}
              className="card flex flex-col items-center gap-1 py-4 active:scale-95"
            >
              <span className="text-2xl">{EVENT_META[t].emoji}</span>
              <span className="text-xs font-medium text-slate-600">{EVENT_META[t].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Today summary */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">Today</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Wet diapers"
            value={summary.wet}
            sub={`target ≥ ${expectedWetDiapers(settings.babyDob)}/day`}
            tone={summary.wet >= expectedWetDiapers(settings.babyDob) ? 'good' : 'default'}
          />
          <StatCard label="Dirty diapers" value={summary.dirty} />
          <StatCard
            label="Feeds"
            value={summary.feeds}
            sub={lastFeed ? `last ${relativeTime(lastFeed.at)}` : undefined}
          />
          <StatCard label="Sleep" value={formatDuration(summary.sleepSec)} />
        </div>
        {lastFeed && (
          <div className="mt-3 rounded-xl bg-pink-50 px-3 py-2 text-sm text-pink-700">
            🤱 Next feed: start on the <strong>{suggestedSide}</strong> (last was {lastSide}).
          </div>
        )}
      </div>

      {/* Recent */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500">Recent</h2>
          <button onClick={onOpenTimeline} className="text-sm font-medium text-brand-600">
            See all →
          </button>
        </div>
        <div className="card divide-y divide-slate-100 p-1">
          {todays.length === 0 && <div className="p-4 text-center text-sm text-slate-400">No entries yet today.</div>}
          {[...todays]
            .sort((a, b) => b.at - a.at)
            .slice(0, 5)
            .map((e) => (
              <EventCard
                key={e.id}
                event={e}
                babyDob={settings.babyDob}
                tempUnit={settings.tempUnit}
                onClick={() => {
                  setSheetType(null)
                  setEditing(e)
                }}
              />
            ))}
        </div>
      </div>

      <LogSheet
        type={sheetType}
        editing={editing}
        initial={sheetInitial}
        onClose={() => {
          setSheetType(null)
          setEditing(null)
          setSheetInitial(undefined)
        }}
      />
    </div>
  )
}

interface DaySummary {
  wet: number
  dirty: number
  feeds: number
  sleepSec: number
}

function summarizeDay(events: CareEvent[]): DaySummary {
  let wet = 0
  let dirty = 0
  let feeds = 0
  let sleepSec = 0
  for (const e of events) {
    if (e.type === 'diaper') {
      const d = e.data as DiaperData
      if (d.kind === 'pee' || d.kind === 'both') wet++
      if (d.kind === 'poop' || d.kind === 'both') dirty++
    } else if (e.type === 'breastfeed' || e.type === 'bottle') {
      feeds++
    } else if (e.type === 'sleep') {
      const dur = (e.data as { durationSec?: number }).durationSec
      sleepSec += dur ?? (e.endAt ? (e.endAt - e.at) / 1000 : 0)
    }
  }
  return { wet, dirty, feeds, sleepSec }
}
