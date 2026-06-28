import { useState } from 'react'
import { SettingsProvider, useSettings } from './state/settings'
import { Home } from './pages/Home'
import { Timeline } from './pages/Timeline'
import { Trends } from './pages/Trends'
import { Settings } from './pages/Settings'

type Tab = 'home' | 'timeline' | 'trends' | 'settings'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'home', label: 'Home', emoji: '🏠' },
  { id: 'timeline', label: 'Timeline', emoji: '📜' },
  { id: 'trends', label: 'Trends', emoji: '📈' },
  { id: 'settings', label: 'Settings', emoji: '⚙️' },
]

function Shell() {
  const [tab, setTab] = useState<Tab>('home')
  const { ready } = useSettings()

  if (!ready) {
    return <div className="flex h-full items-center justify-center text-slate-400">Loading…</div>
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <main className="safe-top flex-1 pb-24">
        {tab === 'home' && <Home onOpenTimeline={() => setTab('timeline')} />}
        {tab === 'timeline' && <Timeline />}
        {tab === 'trends' && <Trends />}
        {tab === 'settings' && <Settings />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-slate-200 bg-white/95 backdrop-blur safe-bottom">
        <div className="grid grid-cols-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
                tab === t.id ? 'text-brand-600' : 'text-slate-400'
              }`}
            >
              <span className="text-xl">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <Shell />
    </SettingsProvider>
  )
}
