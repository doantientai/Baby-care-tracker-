import Dexie, { type Table } from 'dexie'
import type { CareEvent, AppSettings } from './types'

// Local-first storage. The whole app reads/writes through this single module,
// which keeps the door open for adding a cloud-sync adapter later without
// touching the UI.
export class BabyCareDB extends Dexie {
  events!: Table<CareEvent, number>
  settings!: Table<AppSettings, number>

  constructor() {
    super('baby-care-tracker')
    this.version(1).stores({
      // indexes: by time (for timeline), by type, and compound [type+at]
      events: '++id, type, at, caregiver, [type+at]',
      settings: '++id',
    })
  }
}

export const db = new BabyCareDB()

export const DEFAULT_SETTINGS: Omit<AppSettings, 'id'> = {
  babyName: 'Baby',
  babyDob: null,
  caregivers: ['Papa', 'Maman'],
  currentCaregiver: 'Papa',
  // Saint-Cyr-l'École, 78210
  lat: 48.7996,
  lon: 2.0667,
  locationLabel: "Saint-Cyr-l'École (78210)",
  tempUnit: 'C',
}

/** Load settings, creating the default row on first run. */
export async function loadSettings(): Promise<AppSettings> {
  const existing = await db.settings.toCollection().first()
  if (existing) return existing
  const id = await db.settings.add({ ...DEFAULT_SETTINGS })
  return { ...DEFAULT_SETTINGS, id }
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<void> {
  const existing = await db.settings.toCollection().first()
  if (existing?.id != null) {
    await db.settings.update(existing.id, patch)
  } else {
    await db.settings.add({ ...DEFAULT_SETTINGS, ...patch })
  }
}
