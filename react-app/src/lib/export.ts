import { db } from '../db/db'
import type { CareEvent } from '../db/types'
import { format } from 'date-fns'

// CSV export for sharing with the other parent or handing to the pediatrician,
// plus a JSON backup/restore for moving data between devices.

function csvCell(v: unknown): string {
  if (v == null) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function flattenData(e: CareEvent): string {
  return Object.entries(e.data ?? {})
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}

export async function exportCsv(): Promise<string> {
  const events = await db.events.orderBy('at').toArray()
  const header = ['date', 'time', 'type', 'caregiver', 'details', 'note']
  const rows = events.map((e) => [
    format(e.at, 'yyyy-MM-dd'),
    format(e.at, 'HH:mm'),
    e.type,
    e.caregiver,
    flattenSafe(e),
    e.note ?? '',
  ])
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')
}

function flattenSafe(e: CareEvent): string {
  let extra = ''
  if (e.endAt) extra = ` (ended ${format(e.endAt, 'HH:mm')})`
  return flattenData(e) + extra
}

export interface Backup {
  app: 'baby-care-tracker'
  version: 1
  exportedAt: number
  events: CareEvent[]
}

export async function exportJson(): Promise<Backup> {
  const events = await db.events.orderBy('at').toArray()
  return { app: 'baby-care-tracker', version: 1, exportedAt: Date.now(), events }
}

/** Import a JSON backup. Returns the number of events added. Skips duplicates by (type, at, caregiver). */
export async function importJson(backup: Backup): Promise<number> {
  if (backup.app !== 'baby-care-tracker' || !Array.isArray(backup.events)) {
    throw new Error('Not a valid Baby Care Tracker backup file.')
  }
  const existing = await db.events.toArray()
  const seen = new Set(existing.map((e) => `${e.type}|${e.at}|${e.caregiver}`))
  let added = 0
  for (const ev of backup.events) {
    const key = `${ev.type}|${ev.at}|${ev.caregiver}`
    if (seen.has(key)) continue
    seen.add(key)
    const { id, ...rest } = ev
    void id
    await db.events.add(rest as CareEvent)
    added++
  }
  return added
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
