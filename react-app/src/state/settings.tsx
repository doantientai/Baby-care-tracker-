import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_SETTINGS, loadSettings, saveSettings } from '../db/db'
import type { AppSettings } from '../db/types'

interface SettingsContextValue {
  settings: AppSettings
  ready: boolean
  update: (patch: Partial<AppSettings>) => Promise<void>
  setCaregiver: (name: string) => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadSettings().then(() => setReady(true))
  }, [])

  const live = useLiveQuery(() => db.settings.toCollection().first(), [])
  const settings: AppSettings = live ?? { ...DEFAULT_SETTINGS }

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      ready: ready && !!live,
      update: (patch) => saveSettings(patch),
      setCaregiver: (name) => saveSettings({ currentCaregiver: name }),
    }),
    [settings, ready, live],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
