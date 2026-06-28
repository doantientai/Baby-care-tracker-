import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { db } from '../db/db'
import type { CareEvent, DiaperData, GrowthData } from '../db/types'
import { format, subDays, startOfDay } from 'date-fns'

export function Trends() {
  const events = useLiveQuery(() => db.events.orderBy('at').toArray(), []) ?? []

  const daily = useMemo(() => buildDaily(events, 14), [events])
  const growth = useMemo(() => buildGrowth(events), [events])

  return (
    <div className="space-y-5 p-4">
      <h1 className="text-2xl font-bold">Trends</h1>

      <ChartCard title="Diapers per day" subtitle="Wet vs dirty — last 14 days">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={daily} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="wet" name="Wet" stackId="d" fill="#0ea5e9" radius={[0, 0, 0, 0]} />
            <Bar dataKey="dirty" name="Dirty" stackId="d" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Feeds per day" subtitle="Breast + bottle — last 14 days">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={daily} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="feeds" name="Feeds" fill="#ec4899" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Sleep per day" subtitle="Total hours — last 14 days">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={daily} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => `${v} h`} />
            <Bar dataKey="sleepH" name="Sleep (h)" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Weight" subtitle="kg over time">
        {growth.length >= 2 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={growth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip />
              <Line type="monotone" dataKey="weightKg" name="Weight (kg)" stroke="#0ea5e9" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">Log at least two weight measurements to see a curve.</p>
        )}
      </ChartCard>
    </div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="mb-2">
        <h2 className="font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

interface DailyRow {
  label: string
  wet: number
  dirty: number
  feeds: number
  sleepH: number
}

function buildDaily(events: CareEvent[], days: number): DailyRow[] {
  const today = startOfDay(Date.now())
  const rows: DailyRow[] = []
  const index = new Map<string, DailyRow>()
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(today, i)
    const key = format(d, 'yyyy-MM-dd')
    const row: DailyRow = { label: format(d, 'd/M'), wet: 0, dirty: 0, feeds: 0, sleepH: 0 }
    index.set(key, row)
    rows.push(row)
  }
  const sleepSec = new Map<string, number>()
  for (const e of events) {
    const key = format(e.at, 'yyyy-MM-dd')
    const row = index.get(key)
    if (!row) continue
    if (e.type === 'diaper') {
      const d = e.data as DiaperData
      if (d.kind === 'pee' || d.kind === 'both') row.wet++
      if (d.kind === 'poop' || d.kind === 'both') row.dirty++
    } else if (e.type === 'breastfeed' || e.type === 'bottle') {
      row.feeds++
    } else if (e.type === 'sleep') {
      const dur = (e.data as { durationSec?: number }).durationSec ?? (e.endAt ? (e.endAt - e.at) / 1000 : 0)
      sleepSec.set(key, (sleepSec.get(key) ?? 0) + dur)
    }
  }
  for (const [key, sec] of sleepSec) {
    const row = index.get(key)
    if (row) row.sleepH = Math.round((sec / 3600) * 10) / 10
  }
  return rows
}

interface GrowthRow {
  label: string
  weightKg?: number
}

function buildGrowth(events: CareEvent[]): GrowthRow[] {
  return events
    .filter((e) => e.type === 'growth' && (e.data as GrowthData).weightKg != null)
    .map((e) => ({ label: format(e.at, 'd/M'), weightKg: (e.data as GrowthData).weightKg }))
}
