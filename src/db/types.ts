// Domain model for baby care events.
// Every event shares a common envelope; type-specific data lives in `data`.

export type EventType =
  | 'diaper'
  | 'breastfeed'
  | 'bottle'
  | 'temperature'
  | 'sleep'
  | 'cry'
  | 'pump'
  | 'medication'
  | 'growth'
  | 'note'

export type Caregiver = string // free-form, e.g. "Papa", "Maman"

export interface BaseEvent {
  id?: number
  type: EventType
  /** Primary timestamp (epoch ms). For ranged events this is the start. */
  at: number
  /** Optional end timestamp (epoch ms) for ranged events (sleep, breastfeed). */
  endAt?: number
  caregiver: Caregiver
  note?: string
  createdAt: number
  updatedAt: number
}

export type DiaperKind = 'pee' | 'poop' | 'both'
export type DiaperAmount = 'little' | 'average' | 'full'
/** Stool colors. `danger: true` colors should prompt the parent to call a doctor. */
export type StoolColor =
  | 'yellow'
  | 'green'
  | 'brown'
  | 'orange'
  | 'black'
  | 'red'
  | 'white'
export type StoolTexture = 'liquid' | 'seedy' | 'soft' | 'formed' | 'hard' | 'mucousy'

export interface DiaperData {
  kind: DiaperKind
  amount?: DiaperAmount
  color?: StoolColor
  texture?: StoolTexture
}

export type Breast = 'left' | 'right'
export type BreastfeedPosition =
  | 'cradle'
  | 'cross-cradle'
  | 'football'
  | 'laid-back'
  | 'side-lying'
export interface BreastfeedData {
  /** the breast the feed started on — used to suggest which side to start next */
  side: Breast
  /** seconds spent on the left breast in this session */
  leftSec?: number
  /** seconds spent on the right breast in this session */
  rightSec?: number
  position?: BreastfeedPosition
  /** total duration in seconds (leftSec + rightSec) */
  durationSec?: number
}

export type BottleContent = 'formula' | 'expressed' | 'mixed'
export interface BottleData {
  content: BottleContent
  /** volume in millilitres */
  volumeMl: number
}

export type TempMethod = 'axillary' | 'rectal' | 'ear' | 'forehead' | 'oral'
export interface TemperatureData {
  /** temperature in Celsius */
  celsius: number
  method: TempMethod
}

export interface SleepData {
  /** duration in seconds */
  durationSec?: number
}

export type CryIntensity = 'fussy' | 'crying' | 'inconsolable'
export interface CryData {
  intensity: CryIntensity
  durationSec?: number
}

export interface PumpData {
  side: Breast | 'both'
  volumeMl: number
  durationSec?: number
}

export interface MedicationData {
  name: string
  /** e.g. "400 IU", "2.5 ml" */
  dose?: string
}

export interface GrowthData {
  weightKg?: number
  heightCm?: number
  headCircumferenceCm?: number
}

export type EventData =
  | DiaperData
  | BreastfeedData
  | BottleData
  | TemperatureData
  | SleepData
  | CryData
  | PumpData
  | MedicationData
  | GrowthData
  | Record<string, never>

export interface CareEvent extends BaseEvent {
  data: EventData
}

export interface BabyProfile {
  id?: number
  name: string
  /** date of birth (epoch ms) */
  dob: number
  sex?: 'male' | 'female' | 'unspecified'
}

export interface AppSettings {
  id?: number
  babyName: string
  babyDob: number | null
  caregivers: string[]
  currentCaregiver: string
  /** latitude/longitude for the weather widget (default: Saint-Cyr-l'École 78210) */
  lat: number
  lon: number
  locationLabel: string
  tempUnit: 'C' | 'F'
}
