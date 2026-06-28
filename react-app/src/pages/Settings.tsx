import { useRef, useState } from 'react'
import { useSettings } from '../state/settings'
import { Field } from '../components/ui'
import { toLocalInput, fromLocalInput } from '../lib/time'
import { exportCsv, exportJson, importJson, downloadFile, type Backup } from '../lib/export'
import { format } from 'date-fns'

export function Settings() {
  const { settings, update } = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [newCaregiver, setNewCaregiver] = useState('')

  async function handleImport(file: File) {
    try {
      const backup = JSON.parse(await file.text()) as Backup
      const n = await importJson(backup)
      setMsg(`Imported ${n} new entr${n === 1 ? 'y' : 'ies'}.`)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Import failed.')
    }
  }

  function addCaregiver() {
    const name = newCaregiver.trim()
    if (!name || settings.caregivers.includes(name)) return
    update({ caregivers: [...settings.caregivers, name] })
    setNewCaregiver('')
  }

  function removeCaregiver(name: string) {
    if (settings.caregivers.length <= 1) return
    const caregivers = settings.caregivers.filter((c) => c !== name)
    update({ caregivers, currentCaregiver: caregivers.includes(settings.currentCaregiver) ? settings.currentCaregiver : caregivers[0] })
  }

  return (
    <div className="space-y-5 p-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Baby</h2>
        <Field label="Name">
          <input className="input" value={settings.babyName} onChange={(e) => update({ babyName: e.target.value })} />
        </Field>
        <Field label="Date of birth">
          <input
            type="datetime-local"
            className="input"
            value={settings.babyDob ? toLocalInput(settings.babyDob) : ''}
            onChange={(e) => update({ babyDob: e.target.value ? fromLocalInput(e.target.value) : null })}
          />
          <p className="mt-1 text-xs text-slate-400">Used for age-based fever alerts and diaper targets.</p>
        </Field>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Caregivers</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {settings.caregivers.map((c) => (
            <span key={c} className="chip chip-off">
              {c}
              {settings.caregivers.length > 1 && (
                <button onClick={() => removeCaregiver(c)} className="ml-1 text-slate-400 hover:text-red-500">
                  ✕
                </button>
              )}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Add caregiver…"
            value={newCaregiver}
            onChange={(e) => setNewCaregiver(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCaregiver()}
          />
          <button className="btn-ghost" onClick={addCaregiver}>
            Add
          </button>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Location & units</h2>
        <Field label="Location label">
          <input
            className="input"
            value={settings.locationLabel}
            onChange={(e) => update({ locationLabel: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude">
            <input
              type="number"
              step="0.0001"
              className="input"
              value={settings.lat}
              onChange={(e) => update({ lat: Number(e.target.value) })}
            />
          </Field>
          <Field label="Longitude">
            <input
              type="number"
              step="0.0001"
              className="input"
              value={settings.lon}
              onChange={(e) => update({ lon: Number(e.target.value) })}
            />
          </Field>
        </div>
        <Field label="Temperature unit">
          <div className="flex gap-2">
            {(['C', 'F'] as const).map((u) => (
              <button
                key={u}
                onClick={() => update({ tempUnit: u })}
                className={`chip ${settings.tempUnit === u ? 'chip-on' : 'chip-off'}`}
              >
                °{u}
              </button>
            ))}
          </div>
        </Field>
      </section>

      <section className="card p-4">
        <h2 className="mb-1 font-semibold">Backup & share</h2>
        <p className="mb-3 text-xs text-slate-400">
          Export a CSV for your pediatrician, or a JSON backup to move data to the other parent's phone.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-ghost"
            onClick={async () => downloadFile(`baby-care-${format(Date.now(), 'yyyy-MM-dd')}.csv`, await exportCsv(), 'text/csv')}
          >
            ⬇ Export CSV
          </button>
          <button
            className="btn-ghost"
            onClick={async () =>
              downloadFile(
                `baby-care-backup-${format(Date.now(), 'yyyy-MM-dd')}.json`,
                JSON.stringify(await exportJson(), null, 2),
                'application/json',
              )
            }
          >
            ⬇ Export backup (JSON)
          </button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            ⬆ Import backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImport(f)
              e.target.value = ''
            }}
          />
        </div>
        {msg && <p className="mt-3 text-sm text-brand-600">{msg}</p>}
      </section>

      <p className="px-2 text-center text-xs text-slate-400">
        Baby Care Tracker · stored privately on this device. Guidance is general and not a substitute for medical advice.
      </p>
    </div>
  )
}
