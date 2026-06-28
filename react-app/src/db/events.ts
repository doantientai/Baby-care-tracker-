import { db } from './db'
import type { CareEvent, EventData, EventType } from './types'

function now() {
  return Date.now()
}

export interface NewEventInput {
  type: EventType
  at: number
  endAt?: number
  caregiver: string
  note?: string
  data: EventData
}

export async function addEvent(input: NewEventInput): Promise<number> {
  const ts = now()
  return db.events.add({
    ...input,
    createdAt: ts,
    updatedAt: ts,
  })
}

export async function updateEvent(id: number, patch: Partial<CareEvent>): Promise<void> {
  await db.events.update(id, { ...patch, updatedAt: now() })
}

export async function deleteEvent(id: number): Promise<void> {
  await db.events.delete(id)
}

/** Events within [from, to) ordered ascending by time. */
export async function eventsBetween(from: number, to: number): Promise<CareEvent[]> {
  return db.events.where('at').between(from, to, true, false).sortBy('at')
}

export async function lastEventOfType(type: EventType): Promise<CareEvent | undefined> {
  return db.events.where('[type+at]').between([type, Dexie_minKey], [type, Dexie_maxKey]).last()
}

// Dexie key bounds for compound-index range queries.
const Dexie_minKey = -Infinity
const Dexie_maxKey = Infinity
