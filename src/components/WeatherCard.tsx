import { useEffect, useState } from 'react'
import { fetchCurrentWeather, describeWeather, type CurrentWeather } from '../lib/weather'
import { ROOM_TEMP_RANGE } from '../lib/clinical'
import { useSettings } from '../state/settings'

export function WeatherCard() {
  const { settings } = useSettings()
  const [w, setW] = useState<CurrentWeather | null>(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    let cancelled = false
    setErr(false)
    fetchCurrentWeather(settings.lat, settings.lon)
      .then((data) => !cancelled && setW(data))
      .catch(() => !cancelled && setErr(true))
    return () => {
      cancelled = true
    }
  }, [settings.lat, settings.lon])

  const desc = w ? describeWeather(w.weatherCode) : null

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Outside</div>
          <div className="text-sm text-slate-500">{settings.locationLabel}</div>
        </div>
        {w && desc ? (
          <div className="text-right">
            <div className="text-3xl font-bold leading-none">
              {desc.emoji} {Math.round(w.temperatureC)}°
            </div>
            <div className="text-xs text-slate-500">
              {desc.label} · feels {Math.round(w.apparentC)}° · {w.humidity}% hum.
            </div>
          </div>
        ) : err ? (
          <div className="text-sm text-slate-400">Weather unavailable</div>
        ) : (
          <div className="text-sm text-slate-400">Loading…</div>
        )}
      </div>
      <div className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">
        🛏️ Keep the nursery at <strong>{ROOM_TEMP_RANGE.min}–{ROOM_TEMP_RANGE.max}°C</strong> for safe sleep
        (ideal ~{ROOM_TEMP_RANGE.ideal}°C).
      </div>
    </div>
  )
}
