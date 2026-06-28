import type {
  CareEvent,
  DiaperData,
  BreastfeedData,
  BottleData,
  TemperatureData,
  CryData,
  PumpData,
  MedicationData,
  GrowthData,
  EventType,
} from '../db/types'
import { STOOL_COLORS } from './clinical'
import { formatDuration } from './time'

export const EVENT_META: Record<EventType, { label: string; emoji: string; color: string }> = {
  diaper: { label: 'Diaper', emoji: '🧷', color: '#f59e0b' },
  breastfeed: { label: 'Breastfeed', emoji: '🤱', color: '#ec4899' },
  bottle: { label: 'Bottle', emoji: '🍼', color: '#3b82f6' },
  temperature: { label: 'Temperature', emoji: '🌡️', color: '#ef4444' },
  sleep: { label: 'Sleep', emoji: '😴', color: '#6366f1' },
  cry: { label: 'Cry', emoji: '😢', color: '#8b5cf6' },
  pump: { label: 'Pump', emoji: '🥛', color: '#14b8a6' },
  medication: { label: 'Medication', emoji: '💊', color: '#10b981' },
  growth: { label: 'Growth', emoji: '📏', color: '#0ea5e9' },
  note: { label: 'Note', emoji: '📝', color: '#64748b' },
}

export function summarize(e: CareEvent, tempUnit: 'C' | 'F' = 'C'): string {
  switch (e.type) {
    case 'diaper': {
      const d = e.data as DiaperData
      const parts: string[] = []
      parts.push(d.kind === 'both' ? 'pee + poop' : d.kind)
      if (d.amount) parts.push(d.amount)
      if (d.color) parts.push(STOOL_COLORS[d.color]?.label.toLowerCase() ?? d.color)
      if (d.texture) parts.push(d.texture)
      return parts.join(' · ')
    }
    case 'breastfeed': {
      const d = e.data as BreastfeedData
      const hasSides = (d.leftSec ?? 0) > 0 || (d.rightSec ?? 0) > 0
      const core = hasSides
        ? `L ${formatDuration(d.leftSec)} · R ${formatDuration(d.rightSec)}`
        : `${d.side === 'left' ? 'Left' : 'Right'} · ${formatDuration(d.durationSec)}`
      return d.position ? `${core} · ${d.position}` : core
    }
    case 'bottle': {
      const d = e.data as BottleData
      return `${d.volumeMl} ml · ${d.content}`
    }
    case 'temperature': {
      const d = e.data as TemperatureData
      const v = tempUnit === 'F' ? `${((d.celsius * 9) / 5 + 32).toFixed(1)}°F` : `${d.celsius.toFixed(1)}°C`
      return `${v} · ${d.method}`
    }
    case 'sleep':
      return formatDuration((e.data as { durationSec?: number }).durationSec)
    case 'cry': {
      const d = e.data as CryData
      return `${d.intensity}${d.durationSec ? ` · ${formatDuration(d.durationSec)}` : ''}`
    }
    case 'pump': {
      const d = e.data as PumpData
      return `${d.volumeMl} ml · ${d.side}`
    }
    case 'medication': {
      const d = e.data as MedicationData
      return `${d.name}${d.dose ? ` · ${d.dose}` : ''}`
    }
    case 'growth': {
      const d = e.data as GrowthData
      const parts: string[] = []
      if (d.weightKg != null) parts.push(`${d.weightKg} kg`)
      if (d.heightCm != null) parts.push(`${d.heightCm} cm`)
      if (d.headCircumferenceCm != null) parts.push(`head ${d.headCircumferenceCm} cm`)
      return parts.join(' · ') || 'measurement'
    }
    default:
      return e.note ?? ''
  }
}
