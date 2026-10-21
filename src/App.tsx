import { useCallback, useState } from 'react'
import OceanMap from './components/OceanMap'
import OceanScene from './components/OceanScene'
import { fetchMarineForecast } from './lib/marine'
import { defaultWaves, wavesFromMarine, type Wave } from './lib/waves'

type Coordinates = { latitude: number; longitude: number }

const decimal = (value: number, digits = 2) => value.toFixed(digits)

function updateWaveValue(wave: Wave, field: 'direction' | 'steepness' | 'wavelength', value: number): Wave {
  const next = { ...wave, [field]: value }
  return { ...next, amplitude: (next.steepness * next.wavelength) / (Math.PI * 2) }
}

function WaveControls({ waves, onChange }: { waves: Wave[]; onChange: (index: number, field: 'direction' | 'steepness' | 'wavelength', value: number) => void }) {
  return (
    <div className="wave-controls">
      {waves.map((wave, index) => (
        <fieldset key={wave.label}>
          <legend><span>{String.fromCharCode(65 + index)}</span>{wave.label}</legend>
          <label>Travel direction <output>{Math.round(wave.direction)}°</output><input aria-label={`${wave.label} travel direction`} type="range" min="0" max="359" step="1" value={wave.direction} onChange={(event) => onChange(index, 'direction', Number(event.target.value))} /></label>
          <label>Steepness <output>{decimal(wave.steepness, 3)}</output><input aria-label={`${wave.label} steepness`} type="range" min="0.01" max="0.78" step="0.01" value={wave.steepness} onChange={(event) => onChange(index, 'steepness', Number(event.target.value))} /></label>
          <label>Wavelength <output>{decimal(wave.wavelength, 1)} m</output><input aria-label={`${wave.label} wavelength`} type="range" min="4" max="240" step="1" value={wave.wavelength} onChange={(event) => onChange(index, 'wavelength', Number(event.target.value))} /></label>
          <p>Derived amplitude <strong>{decimal(wave.amplitude)} m</strong></p>
        </fieldset>
      ))}
    </div>
  )
}

export default function App() {
  const [waves, setWaves] = useState<Wave[]>(defaultWaves)
  const [forecastWaves, setForecastWaves] = useState<Wave[] | null>(null)
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  const loadForecast = useCallback(async (point: Coordinates) => {
    setState('loading')
    setError('')
    try {
      const forecast = await fetchMarineForecast(point.latitude, point.longitude)
      const translated = wavesFromMarine(forecast.snapshot)
      setCoordinates({ latitude: forecast.latitude, longitude: forecast.longitude })
      setForecastWaves(translated)
      setWaves(translated)
      setState('idle')
    } catch (reason) {
      setState('error')
      setError(reason instanceof Error ? reason.message : 'The marine forecast could not be loaded.')
    }
  }, [])

  const editWave = (index: number, field: 'direction' | 'steepness' | 'wavelength', value: number) => {
    setWaves((current) => current.map((wave, waveIndex) => waveIndex === index ? updateWaveValue(wave, field, value) : wave))
  }

  return (
    <main className="app-shell">
      <section className="scene-panel">
        <OceanScene waves={waves} />
        <header className="scene-copy">
          <p>Gerstner Sea Lab</p>
          <h1>Forecast-driven<br />ocean surface.</h1>
          <span>Pick open water, then tune the sea by hand.</span>
        </header>
      </section>
      <aside className="control-panel">
        <OceanMap coordinates={coordinates} onOceanPick={loadForecast} disabled={state === 'loading'} />

        {state === 'error' && <p className="error-message" role="alert">{error}</p>}

        <details className="debugger-card" open>
          <summary className="section-heading"><span>02 · Wave debugger</span><span>3 live overrides</span></summary>
          <div className="debugger-body">
            <div className="debugger-tools">
              <p>Forecast values are applied on selection; every control remains editable.</p>
              {forecastWaves && <button className="restore" onClick={() => setWaves(forecastWaves)}>Restore forecast</button>}
            </div>
            <WaveControls waves={waves} onChange={editWave} />
          </div>
        </details>
        <footer>Marine forecast data by <a href="https://open-meteo.com/en/docs/marine-weather-api" target="_blank" rel="noreferrer">Open-Meteo</a> · map by OpenFreeMap · <a href="https://sketchfab.com/3d-models/cargo-ship-c95d341642c949bd85a03c97a15f81c3" target="_blank" rel="noreferrer">cargo ship model</a> (Sketchfab)</footer>
      </aside>
    </main>
  )
}
