import { useEffect, useState } from 'react'
import { Sheet, Field, ChipGroup } from './ui'
import type {
  CareEvent,
  EventType,
  DiaperData,
  BreastfeedData,
  BottleData,
  TemperatureData,
  CryData,
  PumpData,
  MedicationData,
  GrowthData,
  StoolColor,
  TempMethod,
  BreastfeedPosition,
} from '../db/types'
import { addEvent, updateEvent, deleteEvent } from '../db/events'
import { EVENT_META } from '../lib/eventMeta'
import { toLocalInput, fromLocalInput, formatDuration } from '../lib/time'
import { STOOL_COLORS, assessTemperature, isStoolColorConcerning } from '../lib/clinical'
import { useSettings } from '../state/settings'

export interface LogInitial {
  at?: number
  endAt?: number
  data?: Partial<Record<string, unknown>>
  note?: string
}

export function LogSheet({
  type,
  editing,
  initial,
  onClose,
}: {
  type: EventType | null
  editing?: CareEvent | null
  initial?: LogInitial
  onClose: () => void
}) {
  const { settings } = useSettings()
  const open = !!type || !!editing
  const activeType = (editing?.type ?? type) as EventType | null

  const [at, setAt] = useState<number>(Date.now())
  const [endAt, setEndAt] = useState<number | undefined>(undefined)
  const [caregiver, setCaregiver] = useState(settings.currentCaregiver)
  const [note, setNote] = useState('')
  const [data, setData] = useState<Record<string, unknown>>({})

  // Reset form whenever it opens for a new type/edit target.
  useEffect(() => {
    if (!open) return
    if (editing) {
      setAt(editing.at)
      setEndAt(editing.endAt)
      setCaregiver(editing.caregiver)
      setNote(editing.note ?? '')
      setData({ ...(editing.data as Record<string, unknown>) })
    } else {
      setAt(initial?.at ?? Date.now())
      setEndAt(initial?.endAt)
      setCaregiver(settings.currentCaregiver)
      setNote(initial?.note ?? '')
      setData({ ...defaultData(activeType), ...(initial?.data ?? {}) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?.id, type])

  if (!activeType) return null
  const meta = EVENT_META[activeType]
  const patch = (p: Record<string, unknown>) => setData((d) => ({ ...d, ...p }))

  async function save() {
    if (!activeType) return
    const durationSec = endAt && endAt > at ? Math.round((endAt - at) / 1000) : undefined
    const payload = withDuration(activeType, data, durationSec)
    if (editing?.id != null) {
      await updateEvent(editing.id, { at, endAt, caregiver, note: note || undefined, data: payload as never })
    } else {
      await addEvent({ type: activeType, at, endAt, caregiver, note: note || undefined, data: payload as never })
    }
    onClose()
  }

  async function remove() {
    if (editing?.id != null && confirm('Delete this entry?')) {
      await deleteEvent(editing.id)
      onClose()
    }
  }

  return (
    <Sheet open={open} title={`${meta.emoji} ${editing ? 'Edit' : 'Log'} ${meta.label.toLowerCase()}`} onClose={onClose}>
      <div className="space-y-1">
        {activeType === 'diaper' && <DiaperFields data={data as unknown as DiaperData} patch={patch} dob={settings.babyDob} />}
        {activeType === 'breastfeed' && <BreastfeedFields data={data as unknown as BreastfeedData} patch={patch} />}
        {activeType === 'bottle' && <BottleFields data={data as unknown as BottleData} patch={patch} />}
        {activeType === 'temperature' && (
          <TemperatureFields data={data as unknown as TemperatureData} patch={patch} dob={settings.babyDob} />
        )}
        {activeType === 'cry' && <CryFields data={data as unknown as CryData} patch={patch} />}
        {activeType === 'pump' && <PumpFields data={data as unknown as PumpData} patch={patch} />}
        {activeType === 'medication' && <MedicationFields data={data as unknown as MedicationData} patch={patch} />}
        {activeType === 'growth' && <GrowthFields data={data as unknown as GrowthData} patch={patch} />}

        {/* Time fields */}
        <Field label={hasRange(activeType) ? 'Start' : 'Time'}>
          <input
            type="datetime-local"
            className="input"
            value={toLocalInput(at)}
            onChange={(e) => setAt(fromLocalInput(e.target.value))}
          />
        </Field>
        {hasRange(activeType) && (
          <Field label="End (optional)">
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                className="input"
                value={endAt ? toLocalInput(endAt) : ''}
                onChange={(e) => setEndAt(e.target.value ? fromLocalInput(e.target.value) : undefined)}
              />
              {endAt && endAt > at && (
                <span className="shrink-0 text-sm text-slate-500">{formatDuration((endAt - at) / 1000)}</span>
              )}
            </div>
          </Field>
        )}

        <Field label="Logged by">
          <ChipGroup
            options={settings.caregivers.map((c) => ({ value: c, label: c }))}
            value={caregiver}
            onChange={setCaregiver}
          />
        </Field>

        <Field label="Note">
          <textarea
            className="input min-h-[60px]"
            placeholder="Anything to remember…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>

        <div className="flex gap-2 pt-2">
          {editing && (
            <button className="btn-ghost text-red-600" onClick={remove} type="button">
              Delete
            </button>
          )}
          <button className="btn-primary flex-1" onClick={save} type="button">
            {editing ? 'Save changes' : 'Save'}
          </button>
        </div>
      </div>
    </Sheet>
  )
}

function hasRange(t: EventType): boolean {
  return t === 'breastfeed' || t === 'sleep' || t === 'pump' || t === 'cry'
}

function defaultData(t: EventType | null): Record<string, unknown> {
  switch (t) {
    case 'diaper':
      return { kind: 'pee' }
    case 'breastfeed':
      return { side: 'left', leftSec: 0, rightSec: 0 }
    case 'bottle':
      return { content: 'formula', volumeMl: 60 }
    case 'temperature':
      return { celsius: 37.0, method: 'axillary' }
    case 'cry':
      return { intensity: 'crying' }
    case 'pump':
      return { side: 'both', volumeMl: 0 }
    case 'medication':
      return { name: '' }
    case 'growth':
      return {}
    default:
      return {}
  }
}

function withDuration(t: EventType, data: Record<string, unknown>, durationSec?: number) {
  if (t === 'breastfeed') {
    const left = Number(data.leftSec ?? 0)
    const right = Number(data.rightSec ?? 0)
    const total = left + right
    return { ...data, durationSec: total > 0 ? total : durationSec }
  }
  if ((t === 'sleep' || t === 'cry' || t === 'pump') && durationSec != null) {
    return { ...data, durationSec }
  }
  return data
}

/* ----------------------------- per-type fields ---------------------------- */

function DiaperFields({
  data,
  patch,
  dob,
}: {
  data: DiaperData
  patch: (p: Record<string, unknown>) => void
  dob: number | null
}) {
  const showStool = data.kind === 'poop' || data.kind === 'both'
  const concerning = data.color ? isStoolColorConcerning(data.color, dob) : false
  return (
    <>
      <Field label="What's in the diaper?">
        <ChipGroup
          options={[
            { value: 'pee', label: 'Pee', emoji: '💧' },
            { value: 'poop', label: 'Poop', emoji: '💩' },
            { value: 'both', label: 'Both', emoji: '💧💩' },
          ]}
          value={data.kind}
          onChange={(v) => patch({ kind: v })}
        />
      </Field>
      <Field label="Amount">
        <ChipGroup
          options={[
            { value: 'little', label: 'Little' },
            { value: 'average', label: 'Average' },
            { value: 'full', label: 'Full' },
          ]}
          value={data.amount}
          onChange={(v) => patch({ amount: v })}
        />
      </Field>
      {showStool && (
        <>
          <Field label="Stool color">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STOOL_COLORS) as StoolColor[]).map((c) => {
                const info = STOOL_COLORS[c]
                const on = data.color === c
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => patch({ color: c })}
                    className={`chip ${on ? 'chip-on' : 'chip-off'}`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-black/10"
                      style={{ backgroundColor: info.swatch }}
                    />
                    {info.label}
                  </button>
                )
              })}
            </div>
          </Field>
          {data.color && (
            <div
              className={`mb-4 rounded-xl px-3 py-2 text-sm ${
                concerning ? 'bg-red-50 text-red-700 font-medium' : 'bg-slate-50 text-slate-500'
              }`}
            >
              {concerning && '⚠ '}
              {STOOL_COLORS[data.color].note}
            </div>
          )}
          <Field label="Texture">
            <ChipGroup
              options={[
                { value: 'liquid', label: 'Liquid' },
                { value: 'seedy', label: 'Seedy' },
                { value: 'soft', label: 'Soft' },
                { value: 'formed', label: 'Formed' },
                { value: 'hard', label: 'Hard' },
                { value: 'mucousy', label: 'Mucousy' },
              ]}
              value={data.texture}
              onChange={(v) => patch({ texture: v })}
            />
          </Field>
        </>
      )}
    </>
  )
}

const BREASTFEED_POSITIONS: { value: BreastfeedPosition; label: string }[] = [
  { value: 'cradle', label: 'Cradle' },
  { value: 'cross-cradle', label: 'Cross-cradle' },
  { value: 'football', label: 'Football / rugby' },
  { value: 'laid-back', label: 'Laid-back' },
  { value: 'side-lying', label: 'Side-lying' },
]

function BreastfeedFields({ data, patch }: { data: BreastfeedData; patch: (p: Record<string, unknown>) => void }) {
  const toMin = (sec?: number) => (sec ? Math.round(sec / 60) : '')
  const total = (data.leftSec ?? 0) + (data.rightSec ?? 0)
  return (
    <>
      <Field label="Started on">
        <ChipGroup
          options={[
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
          ]}
          value={data.side}
          onChange={(v) => patch({ side: v })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Left (min)">
          <input
            type="number"
            inputMode="numeric"
            className="input"
            placeholder="0"
            value={toMin(data.leftSec)}
            onChange={(e) => patch({ leftSec: e.target.value === '' ? 0 : Number(e.target.value) * 60 })}
          />
        </Field>
        <Field label="Right (min)">
          <input
            type="number"
            inputMode="numeric"
            className="input"
            placeholder="0"
            value={toMin(data.rightSec)}
            onChange={(e) => patch({ rightSec: e.target.value === '' ? 0 : Number(e.target.value) * 60 })}
          />
        </Field>
      </div>
      {total > 0 && (
        <div className="mb-4 -mt-1 text-sm text-slate-500">
          Total {formatDuration(total)} · L {formatDuration(data.leftSec)} / R {formatDuration(data.rightSec)}
        </div>
      )}
      <Field label="Position">
        <ChipGroup options={BREASTFEED_POSITIONS} value={data.position} onChange={(v) => patch({ position: v })} />
      </Field>
    </>
  )
}

function BottleFields({ data, patch }: { data: BottleData; patch: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <Field label="Content">
        <ChipGroup
          options={[
            { value: 'formula', label: 'Formula' },
            { value: 'expressed', label: 'Expressed milk' },
            { value: 'mixed', label: 'Mixed' },
          ]}
          value={data.content}
          onChange={(v) => patch({ content: v })}
        />
      </Field>
      <Field label="Volume (ml)">
        <input
          type="number"
          inputMode="numeric"
          className="input"
          value={data.volumeMl}
          onChange={(e) => patch({ volumeMl: Number(e.target.value) })}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {[30, 60, 90, 120, 150, 180].map((v) => (
            <button key={v} type="button" className="chip chip-off" onClick={() => patch({ volumeMl: v })}>
              {v}
            </button>
          ))}
        </div>
      </Field>
    </>
  )
}

function TemperatureFields({
  data,
  patch,
  dob,
}: {
  data: TemperatureData
  patch: (p: Record<string, unknown>) => void
  dob: number | null
}) {
  const a = assessTemperature(data.celsius, data.method, dob)
  const tone =
    a.level === 'emergency' || a.level === 'fever' || a.level === 'low'
      ? 'bg-red-50 text-red-700'
      : a.level === 'elevated'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-emerald-50 text-emerald-700'
  return (
    <>
      <Field label="Temperature (°C)">
        <input
          type="number"
          step="0.1"
          inputMode="decimal"
          className="input text-2xl font-bold"
          value={data.celsius}
          onChange={(e) => patch({ celsius: Number(e.target.value) })}
        />
      </Field>
      <Field label="Method">
        <ChipGroup
          options={[
            { value: 'axillary', label: 'Armpit' },
            { value: 'rectal', label: 'Rectal' },
            { value: 'ear', label: 'Ear' },
            { value: 'forehead', label: 'Forehead' },
            { value: 'oral', label: 'Oral' },
          ]}
          value={data.method}
          onChange={(v) => patch({ method: v as TempMethod })}
        />
      </Field>
      <div className={`mb-4 rounded-xl px-3 py-2.5 text-sm font-medium ${tone}`}>
        {a.urgent && '🚨 '}
        {a.message}
      </div>
    </>
  )
}

function CryFields({ data, patch }: { data: CryData; patch: (p: Record<string, unknown>) => void }) {
  return (
    <Field label="Intensity">
      <ChipGroup
        options={[
          { value: 'fussy', label: 'Fussy' },
          { value: 'crying', label: 'Crying' },
          { value: 'inconsolable', label: 'Inconsolable' },
        ]}
        value={data.intensity}
        onChange={(v) => patch({ intensity: v })}
      />
    </Field>
  )
}

function PumpFields({ data, patch }: { data: PumpData; patch: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <Field label="Side">
        <ChipGroup
          options={[
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
            { value: 'both', label: 'Both' },
          ]}
          value={data.side}
          onChange={(v) => patch({ side: v })}
        />
      </Field>
      <Field label="Volume (ml)">
        <input
          type="number"
          inputMode="numeric"
          className="input"
          value={data.volumeMl}
          onChange={(e) => patch({ volumeMl: Number(e.target.value) })}
        />
      </Field>
    </>
  )
}

function MedicationFields({ data, patch }: { data: MedicationData; patch: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <Field label="Medication / supplement">
        <input
          className="input"
          placeholder="e.g. Vitamin D"
          value={data.name}
          onChange={(e) => patch({ name: e.target.value })}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {['Vitamin D', 'Paracetamol', 'Probiotics'].map((n) => (
            <button key={n} type="button" className="chip chip-off" onClick={() => patch({ name: n })}>
              {n}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Dose (optional)">
        <input
          className="input"
          placeholder="e.g. 400 IU"
          value={data.dose ?? ''}
          onChange={(e) => patch({ dose: e.target.value })}
        />
      </Field>
    </>
  )
}

function GrowthFields({ data, patch }: { data: GrowthData; patch: (p: Record<string, unknown>) => void }) {
  const numOr = (v: string) => (v === '' ? undefined : Number(v))
  return (
    <>
      <Field label="Weight (kg)">
        <input
          type="number"
          step="0.01"
          inputMode="decimal"
          className="input"
          value={data.weightKg ?? ''}
          onChange={(e) => patch({ weightKg: numOr(e.target.value) })}
        />
      </Field>
      <Field label="Height (cm)">
        <input
          type="number"
          step="0.1"
          inputMode="decimal"
          className="input"
          value={data.heightCm ?? ''}
          onChange={(e) => patch({ heightCm: numOr(e.target.value) })}
        />
      </Field>
      <Field label="Head circumference (cm)">
        <input
          type="number"
          step="0.1"
          inputMode="decimal"
          className="input"
          value={data.headCircumferenceCm ?? ''}
          onChange={(e) => patch({ headCircumferenceCm: numOr(e.target.value) })}
        />
      </Field>
    </>
  )
}
