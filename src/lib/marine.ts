import type { MarineSnapshot } from './waves'

type MarineResponse = {
  latitude: number
  longitude: number
  current?: Record<string, number | string | null>
  hourly?: Record<string, Array<number | string | null>>
}

export type MarineForecast = { latitude: number; longitude: number; snapshot: MarineSnapshot }

const variables = ['wave_height', 'wave_direction', 'wave_period', 'swell_wave_height', 'swell_wave_direction', 'swell_wave_period', 'wind_wave_height', 'wind_wave_direction', 'wind_wave_period'].join(',')

const numberAt = (response: MarineResponse, key: string) => {
  const currentValue = response.current?.[key]
  if (typeof currentValue === 'number') return currentValue
  const hourlyValue = response.hourly?.[key]?.[0]
  return typeof hourlyValue === 'number' ? hourlyValue : 0
}

export async function fetchMarineForecast(latitude: number, longitude: number): Promise<MarineForecast> {
  const params = new URLSearchParams({ latitude: latitude.toFixed(5), longitude: longitude.toFixed(5), current: variables, hourly: variables, forecast_hours: '1', cell_selection: 'sea' })
  const response = await fetch(`https://marine-api.open-meteo.com/v1/marine?${params}`)
  if (!response.ok) throw new Error(`Marine forecast request failed (${response.status})`)
  const data = (await response.json()) as MarineResponse
  if (!data.current && !data.hourly) throw new Error('No marine forecast is available for this point.')
  return {
    latitude: data.latitude,
    longitude: data.longitude,
    snapshot: {
      time: String(data.current?.time ?? data.hourly?.time?.[0] ?? ''),
      waveHeight: numberAt(data, 'wave_height'), waveDirection: numberAt(data, 'wave_direction'), wavePeriod: numberAt(data, 'wave_period'),
      swellHeight: numberAt(data, 'swell_wave_height'), swellDirection: numberAt(data, 'swell_wave_direction'), swellPeriod: numberAt(data, 'swell_wave_period'),
      windWaveHeight: numberAt(data, 'wind_wave_height'), windWaveDirection: numberAt(data, 'wind_wave_direction'), windWavePeriod: numberAt(data, 'wind_wave_period'),
    },
  }
}
