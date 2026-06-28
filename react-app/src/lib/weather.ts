// Weather via Open-Meteo — free, no API key required.
// Used for the local outdoor temperature widget (Saint-Cyr-l'École by default).

export interface CurrentWeather {
  temperatureC: number
  apparentC: number
  humidity: number
  weatherCode: number
  isDay: boolean
  time: string
}

const WMO: Record<number, { label: string; emoji: string }> = {
  0: { label: 'Clear sky', emoji: '☀️' },
  1: { label: 'Mainly clear', emoji: '🌤️' },
  2: { label: 'Partly cloudy', emoji: '⛅' },
  3: { label: 'Overcast', emoji: '☁️' },
  45: { label: 'Fog', emoji: '🌫️' },
  48: { label: 'Rime fog', emoji: '🌫️' },
  51: { label: 'Light drizzle', emoji: '🌦️' },
  53: { label: 'Drizzle', emoji: '🌦️' },
  55: { label: 'Heavy drizzle', emoji: '🌧️' },
  61: { label: 'Light rain', emoji: '🌦️' },
  63: { label: 'Rain', emoji: '🌧️' },
  65: { label: 'Heavy rain', emoji: '🌧️' },
  71: { label: 'Light snow', emoji: '🌨️' },
  73: { label: 'Snow', emoji: '🌨️' },
  75: { label: 'Heavy snow', emoji: '❄️' },
  80: { label: 'Rain showers', emoji: '🌦️' },
  81: { label: 'Rain showers', emoji: '🌧️' },
  82: { label: 'Violent showers', emoji: '⛈️' },
  95: { label: 'Thunderstorm', emoji: '⛈️' },
  96: { label: 'Thunderstorm', emoji: '⛈️' },
  99: { label: 'Thunderstorm', emoji: '⛈️' },
}

export function describeWeather(code: number): { label: string; emoji: string } {
  return WMO[code] ?? { label: 'Unknown', emoji: '🌡️' }
}

export async function fetchCurrentWeather(lat: number, lon: number): Promise<CurrentWeather> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code` +
    `&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Weather request failed: ${res.status}`)
  const json = await res.json()
  const c = json.current
  return {
    temperatureC: c.temperature_2m,
    apparentC: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    weatherCode: c.weather_code,
    isDay: c.is_day === 1,
    time: c.time,
  }
}
