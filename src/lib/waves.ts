export type Wave = {
  direction: number
  steepness: number
  wavelength: number
  amplitude: number
  label: string
}

export type MarineSnapshot = {
  time: string
  waveHeight: number
  waveDirection: number
  wavePeriod: number
  swellHeight: number
  swellDirection: number
  swellPeriod: number
  windWaveHeight: number
  windWaveDirection: number
  windWavePeriod: number
}

const GRAVITY = 9.80665
const TAU = Math.PI * 2
const MAX_STEEPNESS = 0.78

const finite = (value: number | null | undefined, fallback: number) =>
  Number.isFinite(value) ? Number(value) : fallback

export function waveFromMarine(label: string, height: number | null | undefined, directionFrom: number | null | undefined, period: number | null | undefined): Wave {
  const safePeriod = Math.max(finite(period, 5), 1)
  const wavelength = (GRAVITY * safePeriod ** 2) / TAU
  const amplitude = Math.max(finite(height, 0.1) / 2, 0.02)
  const steepness = Math.min(amplitude * TAU / wavelength, MAX_STEEPNESS)

  return {
    label,
    // Open-Meteo reports where waves come from; the simulation needs travel direction.
    direction: (finite(directionFrom, 0) + 180) % 360,
    steepness,
    wavelength,
    amplitude,
  }
}

export function wavesFromMarine(snapshot: MarineSnapshot): Wave[] {
  return [
    waveFromMarine('Primary swell', snapshot.swellHeight || snapshot.waveHeight, snapshot.swellDirection || snapshot.waveDirection, snapshot.swellPeriod || snapshot.wavePeriod),
    waveFromMarine('Wind sea', snapshot.windWaveHeight, snapshot.windWaveDirection, snapshot.windWavePeriod),
    waveFromMarine('Secondary energy', snapshot.waveHeight * 0.18, snapshot.waveDirection + 24, snapshot.wavePeriod * 0.62),
  ]
}

export const defaultWaves: Wave[] = [
  { label: 'Primary swell', direction: 180, steepness: 0.15, wavelength: 100, amplitude: 2.39 },
  { label: 'Wind sea', direction: 210, steepness: 0.15, wavelength: 50, amplitude: 1.19 },
  { label: 'Secondary energy', direction: 240, steepness: 0.15, wavelength: 25, amplitude: 0.6 },
]

export function sampleGerstnerWaves(x: number, z: number, time: number, waves: Wave[]) {
  let px = x
  let py = 0
  let pz = z
  for (const wave of waves) {
    const angle = (wave.direction * Math.PI) / 180
    const dx = Math.cos(angle)
    const dz = Math.sin(angle)
    const k = TAU / Math.max(wave.wavelength, 0.01)
    const speed = Math.sqrt(GRAVITY / k)
    const phase = k * (dx * x + dz * z - speed * time)
    const amplitude = wave.steepness / k
    px += dx * amplitude * Math.cos(phase)
    py += amplitude * Math.sin(phase)
    pz += dz * amplitude * Math.cos(phase)
  }
  return { x: px, y: py, z: pz }
}
