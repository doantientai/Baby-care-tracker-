// Pediatric-advisor layer: encodes standard newborn-care reference values.
// These are general guidance derived from common pediatric standards (AAP / NHS
// style) and are NOT a substitute for medical advice.

import type { StoolColor, TempMethod } from '../db/types'

export function ageInDays(dob: number | null, ref = Date.now()): number | null {
  if (dob == null) return null
  return Math.floor((ref - dob) / 86_400_000)
}

export function ageInMonths(dob: number | null, ref = Date.now()): number | null {
  if (dob == null) return null
  return (ref - dob) / (86_400_000 * 30.4375)
}

/**
 * Fever threshold (°C) by measurement method. Fever in an infant <3 months is a
 * medical emergency — handled separately by `assessTemperature`.
 */
const FEVER_C: Record<TempMethod, number> = {
  rectal: 38.0,
  ear: 38.0,
  forehead: 38.0,
  oral: 37.8,
  axillary: 37.5,
}

const LOW_TEMP_C = 36.0 // hypothermia warning

export type TempLevel = 'low' | 'normal' | 'elevated' | 'fever' | 'emergency'

export interface TempAssessment {
  level: TempLevel
  message: string
  /** true when the parent should seek medical care now */
  urgent: boolean
}

export function assessTemperature(
  celsius: number,
  method: TempMethod,
  babyDob: number | null,
): TempAssessment {
  const threshold = FEVER_C[method]
  const months = ageInMonths(babyDob)
  const isFever = celsius >= threshold

  if (celsius < LOW_TEMP_C) {
    return {
      level: 'low',
      urgent: celsius < 35.5,
      message:
        celsius < 35.5
          ? 'Low temperature. Warm the baby and contact a doctor.'
          : 'Slightly low — warm the baby and recheck shortly.',
    }
  }

  if (isFever && months != null && months < 3) {
    return {
      level: 'emergency',
      urgent: true,
      message: 'Fever in a baby under 3 months is an emergency — call your doctor or emergency services now.',
    }
  }

  if (isFever) {
    return {
      level: 'fever',
      urgent: celsius >= 39,
      message:
        celsius >= 39
          ? 'High fever — contact your doctor.'
          : 'Fever detected — monitor closely and consider contacting your doctor.',
    }
  }

  if (celsius >= threshold - 0.4) {
    return { level: 'elevated', urgent: false, message: 'Slightly elevated — keep an eye on it.' }
  }

  return { level: 'normal', urgent: false, message: 'Temperature in the normal range.' }
}

export interface StoolColorInfo {
  label: string
  swatch: string // tailwind/hex color for the UI
  danger: boolean
  note?: string
}

export const STOOL_COLORS: Record<StoolColor, StoolColorInfo> = {
  yellow: { label: 'Yellow', swatch: '#f5c542', danger: false, note: 'Typical for breastfed babies.' },
  green: { label: 'Green', swatch: '#5a8f3c', danger: false, note: 'Usually normal.' },
  brown: { label: 'Brown', swatch: '#8a5a2b', danger: false, note: 'Normal, common with formula.' },
  orange: { label: 'Orange', swatch: '#e07b2e', danger: false, note: 'Usually normal.' },
  black: {
    label: 'Black',
    swatch: '#1f2937',
    danger: true,
    note: 'Normal as meconium in the first days. After that, black can mean blood — call a doctor.',
  },
  red: {
    label: 'Red',
    swatch: '#c0392b',
    danger: true,
    note: 'Red may indicate blood — contact your doctor.',
  },
  white: {
    label: 'White / clay',
    swatch: '#e5e7eb',
    danger: true,
    note: 'Pale/white stool can signal a liver problem — contact your doctor.',
  },
}

/**
 * Whether a black stool is concerning. Meconium (black, tarry) is expected in
 * roughly the first 3 days of life, so we only flag black after that.
 */
export function isStoolColorConcerning(color: StoolColor, babyDob: number | null): boolean {
  if (color === 'black') {
    const days = ageInDays(babyDob)
    return days == null ? true : days > 3
  }
  return STOOL_COLORS[color]?.danger ?? false
}

/** Minimum expected wet diapers per day, by age in days (rough hydration guide). */
export function expectedWetDiapers(babyDob: number | null): number {
  const days = ageInDays(babyDob)
  if (days == null) return 6
  if (days <= 0) return 1
  if (days <= 5) return Math.min(days + 1, 6) // ramps up in the first week
  return 6
}

/** Recommended nursery room temperature range for safe sleep (°C). */
export const ROOM_TEMP_RANGE = { min: 16, max: 20, ideal: 18 }

/** Suggested next breastfeeding side given the last side used. */
export function nextBreastSide(lastSide: 'left' | 'right' | null): 'left' | 'right' {
  if (lastSide === 'left') return 'right'
  if (lastSide === 'right') return 'left'
  return 'left'
}

export function formatTemp(celsius: number, unit: 'C' | 'F'): string {
  if (unit === 'F') return `${((celsius * 9) / 5 + 32).toFixed(1)}°F`
  return `${celsius.toFixed(1)}°C`
}
